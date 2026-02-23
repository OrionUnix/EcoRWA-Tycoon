import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';
import { getGameEngine } from '../../engine/GameEngine';

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
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 2,
        name: 'Bistrot Parisien',
        type: 'COMMERCIAL',
        desc: 'Commerce de proximité très fréquenté.',
        cost: 100,
        apy: '7.8%',
        image: '🥐',
        color: 'from-orange-500 to-red-500'
    },
    {
        id: 3,
        name: 'Eco-Tower',
        type: 'MIXED',
        desc: 'Tour mixte ultra-moderne et écologique.',
        cost: 250,
        apy: '6.5%',
        image: '🌱',
        color: 'from-emerald-500 to-green-600'
    }
];

interface GameOnboardingProps {
    onComplete: () => void;
}

export const GameOnboarding: React.FC<GameOnboardingProps> = ({ onComplete }) => {
    const { address, isConnected } = useAccount();
    const engine = getGameEngine();
    const [step, setStep] = useState(0); // 0: intro, 1: transaction
    const [selectedRWA, setSelectedRWA] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');

    const { writeContractAsync } = useWriteContract();

    const handleInvest = async (rwaId: number) => {
        if (!isConnected || !address) {
            alert('Veuillez connecter votre portefeuille Web3.');
            return;
        }

        setSelectedRWA(rwaId);
        setStep(1);

        try {
            // STEP 1: Faucet (Mint 10,000 USDC)
            setTxStatus('Demande de subvention (10 000 USDC)...');
            const mintAmount = BigInt(10000 * 1e6); // 10k USDC (6 decimals)
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });

            // Note: En mode production, on utiliserait useWaitForTransactionReceipt 
            // pour attendre la finalisation du bloc. Ici on enchaine pour la démo.
            setTxStatus('Subvention reçue ! Approbation du contrat...');

            // STEP 2: Approve Vault
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'approve',
                args: [VAULT_ADDRESS, mintAmount],
            });
            setTxStatus('Approbation confirmée ! Investissement RWA en cours...');

            // STEP 3: Deposit/Mint RWA in Vault
            await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'mintBuilding',
                args: [BigInt(rwaId), BigInt(1)],
            });
            setTxStatus('Transaction validée ! Bienvenue maire.');

            // STEP 4: Synchro Game Engine
            engine.map.resources.money = 10000;
            // Si vous avez un état Zustand pour la ville, vous l'appelleriez ici 
            // e.g., setPlayerMoney(10000); setActiveRWA(rwaId);

            console.log(`Revenus Web3 activés ! Vous avez acquis le RWA #${rwaId}. Vous pouvez construire.`);

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
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto backdrop-blur-xl bg-black/60"
            >
                <div className="max-w-4xl w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

                    {step === 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center text-center space-y-8"
                        >
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    Félicitations pour votre élection, Maire.
                                </h1>
                                <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
                                    Avant de bâtir, choisissez votre premier investissement RWA pour générer des revenus passifs pour la ville.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
                                {RWA_CHOICES.map((rwa) => (
                                    <motion.div
                                        key={rwa.id}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="relative p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700 hover:border-emerald-500/50 transition-all flex flex-col h-full"
                                    >
                                        <div className="text-6xl mb-4 text-center">{rwa.image}</div>
                                        <h3 className="text-2xl font-bold mb-2">{rwa.name}</h3>
                                        <p className="text-sm text-neutral-400 flex-grow mb-6">{rwa.desc}</p>

                                        <div className="flex justify-between items-center mb-6 p-3 bg-black/40 rounded-xl">
                                            <div>
                                                <div className="text-xs text-neutral-500">Coût RWA</div>
                                                <div className="font-bold text-emerald-400">{rwa.cost} USDC</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-neutral-500">Rendement</div>
                                                <div className="font-bold text-cyan-400">{rwa.apy} APY</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleInvest(rwa.id)}
                                            className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${rwa.color} hover:brightness-110 shadow-lg`}
                                        >
                                            Investir
                                        </button>
                                    </motion.div>
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
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                    {RWA_CHOICES.find(r => r.id === selectedRWA)?.image}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Intégration Web3 en cours...</h2>
                                <p className="text-emerald-400 animate-pulse">{txStatus}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
