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
import { FaucetButton } from '../ui/FaucetButton';
import { RWAPurchaseModal } from '../ui/RWAPurchaseModal';
import { BobCongratModal } from '../ui/BobCongratModal';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;

const MOCK_USDC_ABI = parseAbi(['function approve(address spender, uint256 amount) external returns (bool)']);
const VAULT_ABI = parseAbi(['function mintBuilding(uint256 buildingId, uint256 amount) external']);

const RWA_CHOICES = [
    { id: 1, key: 'loft', type: 'RESIDENTIAL', cost: 150, apy: '4.2%', imageName: 'loft', colorTheme: 'blue' as const, location: 'New York' as const },
    { id: 2, key: 'bistrot', type: 'COMMERCIAL', cost: 100, apy: '7.8%', imageName: 'bistro', colorTheme: 'orange' as const, location: 'Paris' as const },
    { id: 3, key: 'tower', type: 'MIXED', cost: 250, apy: '6.5%', imageName: 'eco', colorTheme: 'green' as const, location: 'Paris' as const }
];

interface GameOnboardingProps {
    onComplete: () => void;
    onClose: () => void;
}

export const GameOnboarding: React.FC<GameOnboardingProps> = ({ onComplete, onClose }) => {
    const { address, isConnected } = useAccount();
    const tJordan = useTranslations('jordan');

    const [step, setStep] = useState(0);
    const [selectedRWA, setSelectedRWA] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    const [showHelp, setShowHelp] = useState(false);
    const [purchasingRWA, setPurchasingRWA] = useState<any | null>(null);
    const [hasClaimedFaucet, setHasClaimedFaucet] = useState(false);
    const [typingKey, setTypingKey] = useState(Date.now());
    const [isTyping, setIsTyping] = useState(true);

    // Bob Congrat Modal — affiché une fois après le 1er achat RWA
    const [showBobModal, setShowBobModal] = useState(false);
    const [bobBuildingName, setBobBuildingName] = useState('');
    const [bobBuildingImage, setBobBuildingImage] = useState('');

    const { writeContractAsync } = useWriteContract();

    useEffect(() => {
        const claimed = localStorage.getItem('rwa_faucet_claimed') === 'true';
        setHasClaimedFaucet(claimed);
        setTypingKey(Date.now());
    }, []);

    // La VRAIE fonction d'achat avec l'intégration de l'inventaire
    const tInv = useTranslations('inventory');

    const executeWeb3Purchase = async (rwaId: number, amount: number) => {
        if (!isConnected || !address) return alert('Veuillez connecter votre portefeuille Web3.');

        if (!hasClaimedFaucet) return alert(tJordan('faucet_claim_first'));

        setPurchasingRWA(null);
        setSelectedRWA(rwaId);
        setStep(1);

        try {
            const selectedData = RWA_CHOICES.find(r => r.id === rwaId);
            if (!selectedData) return;

            const totalCost = BigInt(selectedData.cost * amount * 1e6);

            // 🔥 TRADUCTIONS UTILISÉES ICI 🔥
            setTxStatus(tInv('tx_approving'));

            // 🔥 1. ON CAPTURE LE VRAI TX HASH ICI 🔥
            const txHash = await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'mintBuilding',
                args: [BigInt(rwaId), BigInt(amount)],
            });

            setTxStatus(tInv('tx_success', { amount: amount }));

            // Sauvegarde inventaire
            const currentInventory = JSON.parse(localStorage.getItem('rwa_inventory') || '[]');
            const existingItem = currentInventory.find((item: any) => item.id === rwaId);
            if (existingItem) {
                existingItem.amount += amount;
                existingItem.txHash = txHash;
            } else {
                currentInventory.push({
                    id: rwaId,
                    amount: amount,
                    name: tJordan(`choices.${selectedData.key}.name`),
                    imageName: selectedData.imageName,
                    colorTheme: selectedData.colorTheme,
                    txHash: txHash
                });
            }
            localStorage.setItem('rwa_inventory', JSON.stringify(currentInventory));

            // 📡 CustomEvent enrichi → RWABuildingSpawner
            window.dispatchEvent(new CustomEvent('rwa_purchased', {
                detail: {
                    rwaId: rwaId,
                    imageName: selectedData.imageName,
                    buildingType: selectedData.type,
                }
            }));

            // 🎉 Bob Congrat Modal — afficher une seule fois (1ère expérience)
            const alreadyShown = localStorage.getItem('rwa_bob_shown') === 'true';
            if (!alreadyShown) {
                setBobBuildingName(tJordan(`choices.${selectedData.key}.name`));
                setBobBuildingImage(selectedData.imageName);
                setShowBobModal(true);
                localStorage.setItem('rwa_bob_shown', 'true');
                // Auto-fermeture après 12s
                setTimeout(() => setShowBobModal(false), 12000);
            }

            setTimeout(() => { onComplete(); }, 2500);

        } catch (error) {
            console.error('Erreur Investissement:', error);
            setTxStatus(tInv('tx_error'));
            setTimeout(() => setStep(0), 3000);
        }
    };
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

                    {/* ECRAN PRINCIPAL (BOUTIQUE) */}
                    {step === 0 && (
                        <div className="flex flex-col space-y-6">

                            {/* DIALOGUE DE JORDAN */}
                            <div className="flex flex-col md:flex-row items-start gap-6 bg-black/40 p-4 border-2 border-black relative">
                                <AnimatedAvatar character="jordan" isTalking={isTyping} />

                                <div className="flex-1 w-full flex flex-col min-h-[120px]">
                                    <div className="text-white text-lg font-bold mb-4">
                                        <h1 className="text-xl text-yellow-400 mb-2 font-black tracking-widest uppercase">Jordan - RWA Master</h1>
                                        <TypewriterText key={typingKey} text={currentJordanText} speed={25} onFinished={() => setIsTyping(false)} />
                                    </div>

                                    {!hasClaimedFaucet && !isTyping && (
                                        <div className="flex justify-end w-full mt-2 pr-4 pb-2">
                                            <FaucetButton
                                                buttonText={tJordan('faucet_button')}
                                                onStart={() => {
                                                    setTxStatus('Envoi des fonds par la banque (10 000 USDC)...');
                                                    setStep(2);
                                                }}
                                                onSuccess={() => {
                                                    setHasClaimedFaucet(true);
                                                    setStep(0);
                                                    setTypingKey(Date.now());
                                                    setIsTyping(true);
                                                }}
                                                onError={(error) => {
                                                    console.error('Erreur Faucet:', error);
                                                    setTxStatus('Erreur du Faucet. Réessayez.');
                                                    setTimeout(() => setStep(0), 3000);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ZONE FAQ */}
                            {showHelp && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border-4 border-dashed border-yellow-500 bg-black/80 font-bold mb-6">
                                    <h3 className="text-yellow-400 text-xl mb-4 text-center uppercase tracking-widest">{tJordan('help_title')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div><p className="text-emerald-400 mb-1">{tJordan('faq_1_q')}</p><p className="text-neutral-300 leading-tight">{tJordan('faq_1_a')}</p></div>
                                        <div><p className="text-emerald-400 mb-1">{tJordan('faq_2_q')}</p><p className="text-neutral-300 leading-tight">{tJordan('faq_2_a')}</p></div>
                                        <div><p className="text-emerald-400 mb-1">{tJordan('faq_3_q')}</p><p className="text-neutral-300 leading-tight">{tJordan('faq_3_a')}</p></div>
                                    </div>
                                </motion.div>
                            )}

                            {/* CARTES RWA */}
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
                                        // Ouvre le terminal de trading
                                        onInvest={() => setPurchasingRWA({
                                            id: rwa.id,
                                            name: tJordan(`choices.${rwa.key}.name`),
                                            desc: tJordan(`choices.${rwa.key}.desc`),
                                            cost: rwa.cost,
                                            apy: rwa.apy,
                                            imageName: rwa.imageName,
                                            location: rwa.location
                                        })}
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
                                {step === 2 ? '💸' : (
                                    selectedRWA && (
                                        <img src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${RWA_CHOICES.find(r => r.id === selectedRWA)?.imageName}.png`)} alt="Construction" className="h-32 w-auto object-contain pixelated drop-shadow-2xl" />
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

            {/* 🏛️ BOB CONGRAT MODAL — Post-achat RWA (1 seule fois) */}
            <BobCongratModal
                isOpen={showBobModal}
                buildingName={bobBuildingName}
                buildingImageName={bobBuildingImage}
                onClose={() => setShowBobModal(false)}
            />

            {/* MODAL DE TRADING */}
            <RWAPurchaseModal
                isOpen={!!purchasingRWA}
                rwa={purchasingRWA}
                onClose={() => setPurchasingRWA(null)}
                onConfirm={(amount) => executeWeb3Purchase(purchasingRWA.id, amount)}
            />
        </AnimatePresence>
    );
};