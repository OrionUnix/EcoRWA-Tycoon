import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SaveSystem } from '../../engine/systems/SaveSystem';

export const useFirebaseWeb3Auth = () => {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const loginAndLoadSave = async () => {
        if (!address) {
            alert("Veuillez d'abord connecter votre portefeuille MetaMak !");
            return null;
        }

        setIsAuthenticating(true);

        try {
            // 1. Le texte que le joueur va signer (100% Gratuit, hors-ligne)
            const message = `Bienvenue sur EcoRWA Tycoon !\n\nSignez ce message pour prouver que vous êtes le propriétaire du wallet et charger votre ville.\n\nWallet: ${address}`;

            // 2. On demande la signature via MetaMask/Wagmi
            console.log("📝 Web3Auth: Demande de signature MetaMask...");
            const signature = await signMessageAsync({ message });

            // 3. On envoie la preuve cryptographique à notre backend 
            console.log("🔐 Web3Auth: Vérification de la signature par le serveur...");
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, message, signature })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // 4. On utilise le token secret renvoyé par le backend pour se connecter à Firebase
            console.log("🔥 Web3Auth: Connexion sécurisée à Firebase...");
            await signInWithCustomToken(auth, data.customToken);
            console.log("✅ Web3Auth: Authentifié sur Firebase avec succès !");

            // 5. On télécharge la sauvegarde Cloud sécurisée de ce wallet
            console.log("☁️ Web3Auth: Recherche d'une sauvegarde Cloud...");
            const cloudSave = await SaveSystem.loadFromCloud(address);

            if (cloudSave) {
                console.log("🏙️ Web3Auth: Ville Cloud trouvée et chargée !");
                return cloudSave;
            } else {
                console.log("🌱 Web3Auth: Nouvelle ville, aucune sauvegarde Cloud trouvée.");
                return null; // Le joueur commence à zéro
            }
        } catch (error) {
            console.error("❌ Erreur lors de l'authentification Web3:", error);
            // S'il refuse la transaction (User rejected request), on catch l'erreur
            return null;
        } finally {
            setIsAuthenticating(false);
        }
    };

    return { loginAndLoadSave, isAuthenticating };
};
