import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';
import { getGameEngine } from '../../engine/GameEngine';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { TypewriterText } from '../TypewriterText';
import { RWACard } from '../ui/RWACard';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;

const MOCK_USDC_ABI = parseAbi([
    'function mint(address to, uint256 amount) external',
    'function approve(address spender, uint256 amount) external returns (bool)'
]);

const VAULT_ABI = parseAbi([
    'function mintBuilding(uint256 buildingId, uint256 amount) external'
]);

const RWA_CHOICES = [
    { id: 1, key: 'loft', type: 'RESIDENTIAL', cost: 150, apy: '4.2%', imageName: 'loft', colorTheme: 'blue' as const },
    { id: 2, key: 'bistrot', type: 'COMMERCIAL', cost: 100, apy: '7.8%', imageName: 'bistro', colorTheme: 'orange' as const },
    { id: 3, key: 'tower', type: 'MIXED', cost: 250, apy: '6.5%', imageName: 'eco', colorTheme: 'green' as const }
];

interface GameOnboardingProps {
    onComplete: () => void;
    onClose: () => void;
}

export const GameOnboarding: React.FC<GameOnboardingProps> = ({ onComplete, onClose }) => {
    const { address, isConnected } = useAccount();
    const engine = getGameEngine();
    const tJordan = useTranslations('jordan');

    const [step, setStep] = useState(0); // 0: dialogue, 1: transaction RWA, 2: transaction Faucet
    const [selectedRWA, setSelectedRWA] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    const [showHelp, setShowHelp] = useState(false);

    // MÉMOIRE DU JEU : Est-ce qu'on a déjà cliqué sur le Faucet ?
    const [hasClaimedFaucet, setHasClaimedFaucet] = useState(false);
    // On force le re-render du texte quand Jordan change de phrase
    const [typingKey, setTypingKey] = useState(Date.now());
    const [isTyping, setIsTyping] = useState(true);

    const { writeContractAsync } = useWriteContract();

    // Au chargement, on vérifie si le joueur a déjà pris le Faucet dans le passé
    useEffect(() => {
        const claimed = localStorage.getItem('rwa_faucet_claimed') === 'true';
        setHasClaimedFaucet(claimed);
        setTypingKey(Date.now()); // Relance l'animation de texte
    }, []);

    // LOGIQUE 1 : LE FAUCET (MINT USDC)
    const handleFaucet = async () => {
        if (!isConnected || !address) return alert('Veuillez connecter votre portefeuille Web3.');

        setStep(2);
        try {
            setTxStatus('Envoi des fonds par la banque (10 000 USDC)...');
            const mintAmount = BigInt(10000 * 1e6);
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });

            localStorage.setItem('rwa_faucet_claimed', 'true');
            setHasClaimedFaucet(true);
            engine.map.resources.money += 10000;

            setStep(0); // Retour à la boutique
            setTypingKey(Date.now()); // Jordan dit sa nouvelle phrase
            setIsTyping(true);
        } catch (error) {
            console.error('Erreur Faucet:', error);
            setTxStatus('Erreur du Faucet. Réessayez.');
            setTimeout(() => setStep(0), 3000);
        }
    };

    // LOGIQUE 2 : L'ACHAT DU RWA (APPROVE + MINT RWA)
    const handleInvest = async (rwaId: number) => {
        if (!isConnected || !address) return alert('Veuillez connecter votre portefeuille Web3.');
        if (!hasClaimedFaucet) return alert(tJordan('faucet_claim_first'));

        setSelectedRWA(rwaId);
        setStep(1);

        try {
            const cost = BigInt(1000 * 1e6); // Adapter le coût selon la carte si besoin
            setTxStatus('Signature du contrat immobilier...');
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'approve',
                args: [VAULT_ADDRESS, cost],
            });

            setTxStatus('Approbation confirmée ! Création du titre de propriété...');
            await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'mintBuilding',
                args: [BigInt(rwaId), BigInt(1)],
            });

            setTxStatus('Félicitations ! Booster RWA activé.');
            console.log(`RWA #${rwaId} acheté !`);

            setTimeout(() => {
                onComplete();
            }, 2500);

        } catch (error) {
            console.error('Erreur Investissement:', error);
            setTxStatus('Erreur de transaction. Vous avez annulé ou manquez de fonds.');
            setTimeout(() => setStep(0), 3000);
        }
    };

    // Détermine la phrase de Jordan selon si le Faucet a été pris
    const currentJordanText = hasClaimedFaucet ? tJordan('welcome_back') : tJordan('pitch');

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/70 backdrop-blur-sm">
                <div className="bg-[#1e293b] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-5xl w-full text-white relative">

                    {/* BOUTONS D'ACTION (HELP / CLOSE) */}
                    <div className="absolute top-4 right-4 flex gap-3 z-50">
                        <button onClick={() => setShowHelp(!showHelp)} className="hover:scale-110 active:translate-y-1 transition-all">
                            <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/help.png')} alt="Aide" className="w-10 h-10 pixelated shadow-[2px_2px_0_black]" />
                        </button>
                        <button onClick={onClose} className="hover:scale-110 active:translate-y-1 transition-all">
                            <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')} alt="Fermer" className="w-10 h-10 pixelated shadow-[2px_2px_0_black]" />
                        </button>
                    </div>

                    {step === 0 && (
                        <div className="flex flex-col space-y-6">
                            {/* DIALOGUE DE JORDAN */}
                            <div className="flex flex-col md:flex-row items-start gap-6 bg-black/40 p-4 border-2 border-black relative">
                                <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                <div className="flex-1 min-h-[120px] text-white text-lg font-bold">
                                    <h1 className="text-xl text-yellow-400 mb-2 font-black tracking-widest uppercase">Jordan - RWA Master</h1>
                                    <TypewriterText key={typingKey} text={currentJordanText} speed={25} onFinished={() => setIsTyping(false)} />
                                </div>

                                {/* BOUTON FAUCET DYNAMIQUE */}
                                {!hasClaimedFaucet && !isTyping && (
                                    <button onClick={handleFaucet} className="absolute bottom-4 right-4 relative group hover:scale-105 active:translate-y-1 transition-all">
                                        <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/faucet.png')} alt="Faucet" className="w-32 h-auto pixelated shadow-[2px_2px_0_black]" />
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-white drop-shadow-md">
                                            {tJordan('faucet_button')}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* ... (La suite du code : ZONE FAQ et CARTES RWA restent EXACTEMENT identiques à la version précédente) ... */}
                            {/* CARTES RWA FAÇON POKÉMON */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-4 opacity-100">
                                {RWA_CHOICES.map((rwa) => (
                                    <RWACard
                                        key={rwa.id}
                                        id={rwa.id}
                                        title={tJordan(`choices.${rwa.key}.name`)}
                                        description={tJordan(`choices.${rwa.key}.desc`)}
                                        cost={rwa.cost}
                                        apy={rwa.apy}
                                        imageName={rwa.imageName}
                                        colorTheme={rwa.colorTheme}
                                        onInvest={() => handleInvest(rwa.id)}
                                        investButtonText={tJordan('invest_button')}
                                        isDisabled={!hasClaimedFaucet}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ECRAN DE CHARGEMENT WEB3 */}
                    {(step === 1 || step === 2) && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-8">
                            <div className="text-8xl animate-bounce flex justify-center">
                                {/* 🔥 CORRECTION ICI : On utilise une vraie balise <img> avec imageName au lieu du vieil emoji */}
                                {step === 2 ? '💸' : (
                                    selectedRWA && (
                                        <img
                                            src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${RWA_CHOICES.find(r => r.id === selectedRWA)?.imageName}.png`)}
                                            alt="Construction"
                                            className="h-32 w-auto object-contain pixelated drop-shadow-2xl"
                                        />
                                    )
                                )}
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">Transaction en cours...</h2>
                                <p className="text-emerald-400 animate-pulse font-bold text-xl">{txStatus}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence >
    );
};