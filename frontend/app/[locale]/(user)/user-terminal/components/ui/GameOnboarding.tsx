import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';
import { getGameEngine } from '../../engine/GameEngine';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

// NOUVEAUX IMPORTS : Traduction et UI Rétro
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from '../AnimatedAvatar'; // Ajuste le chemin si besoin
import { TypewriterText } from '../TypewriterText'; // Ajuste le chemin si besoin

// Web3 ABIs & Addresses
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;

const MOCK_USDC_ABI = parseAbi([
    'function mint(address to, uint256 amount) external',
    'function approve(address spender, uint256 amount) external returns (bool)'
]);

const VAULT_ABI = parseAbi([
    'function mintBuilding(uint256 buildingId, uint256 amount) external'
]);

// RWA Starter Choices
const RWA_CHOICES = [
    {
        id: 1,
        name: 'Loft Industriel',
        type: 'RESIDENTIAL',
        desc: 'Logement moderne en centre-ville. Yield constant.',
        cost: 150,
        apy: '4.2%',
        image: '🏢',
        color: 'bg-blue-600' // Couleurs simplifiées pour le pixel art
    },
    {
        id: 2,
        name: 'Bistrot Parisien',
        type: 'COMMERCIAL',
        desc: 'Commerce de proximité très fréquenté.',
        cost: 100,
        apy: '7.8%',
        image: '🥐',
        color: 'bg-orange-500'
    },
    {
        id: 3,
        name: 'Eco-Tower',
        type: 'MIXED',
        desc: 'Tour mixte ultra-moderne et écologique.',
        cost: 250,
        apy: '6.5%',
        image: '🌱',
        color: 'bg-emerald-600'
    }
];

// AJOUT: onClose pour pouvoir fermer la modale
interface GameOnboardingProps {
    onComplete: () => void;
    onClose: () => void;
}

export const GameOnboarding: React.FC<GameOnboardingProps> = ({ onComplete, onClose }) => {
    const { address, isConnected } = useAccount();
    const engine = getGameEngine();

    // Initialisation des textes de Jordan
    const tJordan = useTranslations('jordan');

    const [step, setStep] = useState(0); // 0: intro, 1: transaction
    const [selectedRWA, setSelectedRWA] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');

    // NOUVEAUX ETATS UI
    const [showHelp, setShowHelp] = useState(false);
    const [isTyping, setIsTyping] = useState(true);

    const { writeContractAsync } = useWriteContract();

    const handleInvest = async (rwaId: number) => {
        if (!isConnected || !address) {
            alert('Veuillez connecter votre portefeuille Web3.');
            return;
        }

        setSelectedRWA(rwaId);
        setStep(1);

        try {
            setTxStatus('Demande de subvention (10 000 USDC)...');
            const mintAmount = BigInt(10000 * 1e6);
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });

            setTxStatus('Subvention reçue ! Approbation du contrat...');
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'approve',
                args: [VAULT_ADDRESS, mintAmount],
            });

            setTxStatus('Approbation confirmée ! Investissement RWA en cours...');
            await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'mintBuilding',
                args: [BigInt(rwaId), BigInt(1)],
            });

            setTxStatus('Transaction validée ! Bienvenue maire.');
            engine.map.resources.money = 10000;
            console.log(`Revenus Web3 activés ! RWA #${rwaId}.`);

            setTimeout(() => {
                onComplete();
            }, 2000);

        } catch (error) {
            console.error('Erreur Onboarding Web3:', error);
            setTxStatus('Erreur de transaction. Vous pouvez réessayer.');
            setTimeout(() => setStep(0), 3000);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/70 backdrop-blur-sm"
            >
                {/* CONTENEUR PIXEL ART */}
                <div className="bg-[#1e293b] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-5xl w-full text-white relative">

                    {/* BOUTONS D'ACTION EN HAUT A DROITE */}
                    <div className="absolute top-4 right-4 flex gap-3 z-50">
                        {/* Bouton Help */}
                        <button onClick={() => setShowHelp(!showHelp)} className="hover:scale-110 transition-transform">
                            <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/help.png')} alt="Aide" className="w-10 h-10 pixelated" />
                        </button>
                        {/* Bouton Close */}
                        <button onClick={onClose} className="hover:scale-110 transition-transform">
                            <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')} alt="Fermer" className="w-10 h-10 pixelated" />
                        </button>
                    </div>

                    {step === 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col space-y-6"
                        >
                            {/* ZONE DE DIALOGUE DE JORDAN */}
                            <div className="flex flex-col md:flex-row items-start gap-6 bg-black/40 p-4 border-2 border-black">
                                <div className="mt-2 flex-shrink-0">
                                    <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                </div>
                                <div className="flex-1 min-h-[120px] text-white text-lg font-bold leading-relaxed">
                                    <h1 className="text-xl text-yellow-400 mb-2 font-black tracking-widest uppercase">
                                        Jordan - Head of RWAs
                                    </h1>
                                    <TypewriterText
                                        text={tJordan('pitch')}
                                        speed={30}
                                        onFinished={() => setIsTyping(false)}
                                    />
                                </div>
                            </div>

                            {/* ZONE FAQ (Affichée uniquement si on clique sur Help) */}
                            {showHelp && (
                                <div className="p-4 border-4 border-dashed border-yellow-500 bg-black/60 font-bold">
                                    <h3 className="text-yellow-400 text-xl mb-4 text-center">{tJordan('help_title')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-emerald-400 mb-1">{tJordan('faq_1_q')}</p>
                                            <p className="text-neutral-300">{tJordan('faq_1_a')}</p>
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 mb-1">{tJordan('faq_2_q')}</p>
                                            <p className="text-neutral-300">{tJordan('faq_2_a')}</p>
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 mb-1">{tJordan('faq_3_q')}</p>
                                            <p className="text-neutral-300">{tJordan('faq_3_a')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CARTES RWA PIXEL ART */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-4">
                                {RWA_CHOICES.map((rwa) => (
                                    <div
                                        key={rwa.id}
                                        className="relative p-4 bg-neutral-800 border-4 border-black hover:-translate-y-2 transition-transform flex flex-col h-full shadow-[4px_4px_0_rgba(0,0,0,1)]"
                                    >
                                        <div className="text-6xl mb-4 text-center">{rwa.image}</div>
                                        <h3 className="text-xl font-bold mb-2 text-center text-white">{rwa.name}</h3>
                                        <p className="text-sm text-neutral-300 flex-grow mb-4 text-center font-bold">{rwa.desc}</p>

                                        <div className="flex justify-between items-center mb-4 p-2 bg-black border-2 border-neutral-700">
                                            <div className="text-left">
                                                <div className="text-xs text-neutral-400 font-bold">Coût</div>
                                                <div className="font-black text-emerald-400">{rwa.cost} USDC</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-neutral-400 font-bold">Rendement</div>
                                                <div className="font-black text-yellow-400">{rwa.apy}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleInvest(rwa.id)}
                                            className={`w-full py-3 ${rwa.color} border-2 border-black border-b-4 active:border-b-2 active:translate-y-[2px] font-black text-white tracking-widest uppercase transition-all`}
                                        >
                                            Investir
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-8"
                        >
                            <div className="text-8xl animate-bounce">
                                {RWA_CHOICES.find(r => r.id === selectedRWA)?.image}
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">Transaction en cours...</h2>
                                <p className="text-emerald-400 animate-pulse font-bold text-xl">{txStatus}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};