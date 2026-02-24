import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { TypewriterText } from '../TypewriterText';
import { useTranslations } from 'next-intl';

export const RWAInventory: React.FC = () => {
    const tInv = useTranslations('inventory');
    const tJordan = useTranslations('jordan');
    const tTrading = useTranslations('trading');

    const [inventory, setInventory] = useState<any[]>([]);

    const [showGovernance, setShowGovernance] = useState(false);
    const [isTypingGov, setIsTypingGov] = useState(true);
    const [voteSuccess, setVoteSuccess] = useState(false);

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [liveYield, setLiveYield] = useState<number>(0);
    const [claimStatus, setClaimStatus] = useState<string>('');
    const [isTypingImpact, setIsTypingImpact] = useState(true);

    const VAULT_CONTRACT_ADDRESS = "0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A";

    const loadInventory = () => {
        const stored = JSON.parse(localStorage.getItem('rwa_inventory') || '[]');
        const cleanInventory = stored.map((item: any, idx: number) => ({ ...item, uniqueKey: `${item.id}-${idx}` }));
        setInventory(cleanInventory);
    };

    useEffect(() => {
        loadInventory();
        window.addEventListener('rwa_purchased', loadInventory);
        return () => window.removeEventListener('rwa_purchased', loadInventory);
    }, []);

    useEffect(() => {
        if (inventory.length > 0 && !localStorage.getItem('governance_done')) {
            const timer = setTimeout(() => {
                setShowGovernance(true);
                setIsTypingGov(true);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [inventory]);

    useEffect(() => {
        if (selectedItem) setIsTypingImpact(true);
    }, [selectedItem?.id]);

    useEffect(() => {
        if (!selectedItem) {
            setLiveYield(0);
            setClaimStatus('');
            return;
        }
        const initialYield = 2.3456 * selectedItem.amount;
        setLiveYield(initialYield);
        const interval = setInterval(() => {
            setLiveYield(prev => prev + (0.0011 * selectedItem.amount));
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedItem]);

    const handleVote = (choice: string) => {
        console.log(`A voté : ${choice}`);
        localStorage.setItem('governance_done', 'true');
        setVoteSuccess(true);
        setIsTypingGov(true);
        setTimeout(() => setShowGovernance(false), 4000);
    };

    const handleClaim = () => {
        if (liveYield > 0) {
            setClaimStatus(tInv('claim_success'));
            setLiveYield(0);
            setTimeout(() => setClaimStatus(''), 4000);
        }
    };

    const borderColors: Record<string, string> = {
        blue: 'border-[#4682B4]',
        orange: 'border-[#E66C2C]',
        green: 'border-[#4E9258]'
    };

    const getAssetDetails = (id: number) => {
        switch (id) {
            case 1: return { key: 'loft', apy: '4.2%', totalShares: 10000, loc: 'New York', price: '$14 230', vac: '1.5%', pop: '8.3M', cost: 150 };
            case 2: return { key: 'bistrot', apy: '7.8%', totalShares: 5000, loc: 'Paris', price: '10 580 €', vac: '2.8%', pop: '2.1M', cost: 100 };
            case 3: return { key: 'tower', apy: '6.5%', totalShares: 20000, loc: 'Paris', price: '11 200 €', vac: '1.2%', pop: '2.1M', cost: 250 };
            default: return { key: 'loft', apy: '0.0%', totalShares: 1000, loc: 'Unknown', price: '-', vac: '-', pop: '-', cost: 100 };
        }
    };

    const getDynamicPrice = (id: number) => {
        const basePrice = getAssetDetails(id).cost;
        const hasGov = localStorage.getItem('governance_done') === 'true';
        if (hasGov) {
            if (id === 2) return basePrice * 0.92;
            return basePrice * 1.08;
        }
        return basePrice;
    };

    // 🔥 Générateur de Hash propre (64 caractères hexadécimaux)
    const generateRandomTxID = () => {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
        return hash;
    };

    // 🔥 GESTION ACHAT/REVENTE OTC ET ENREGISTREMENT TXID 🔥
    const handleTrade = (type: 'buy' | 'sell') => {
        if (!selectedItem) return;

        const price = getDynamicPrice(selectedItem.id);
        const newTxHash = generateRandomTxID(); // Génère une fausse TxID
        const shortTx = `${newTxHash.slice(0, 6)}...${newTxHash.slice(-4)}`;

        let currentInventory = JSON.parse(localStorage.getItem('rwa_inventory') || '[]');
        let itemIndex = currentInventory.findIndex((i: any) => i.id === selectedItem.id);

        if (type === 'sell') {
            if (currentInventory[itemIndex].amount > 1) {
                currentInventory[itemIndex].amount -= 1;
                currentInventory[itemIndex].otcTxHash = newTxHash; // Sauvegarde la transaction OTC
                setSelectedItem({ ...selectedItem, amount: selectedItem.amount - 1, otcTxHash: newTxHash });
                setClaimStatus(tInv('sell_success', { price: price.toFixed(2), tx: shortTx }));
            } else {
                currentInventory.splice(itemIndex, 1);
                setSelectedItem(null);
            }
        } else if (type === 'buy') {
            currentInventory[itemIndex].amount += 1;
            currentInventory[itemIndex].otcTxHash = newTxHash; // Sauvegarde la transaction OTC
            setSelectedItem({ ...selectedItem, amount: selectedItem.amount + 1, otcTxHash: newTxHash });
            setClaimStatus(tInv('buy_success', { price: price.toFixed(2), tx: shortTx }));
        }

        localStorage.setItem('rwa_inventory', JSON.stringify(currentInventory));
        window.dispatchEvent(new Event('rwa_purchased'));
        setTimeout(() => setClaimStatus(''), 5000);
    };

    return (
        <>
            <div className="fixed bottom-20 right-8 z-[100] flex items-end gap-2 pointer-events-auto">
                <AnimatePresence>
                    {inventory.map((item) => (
                        <motion.div
                            key={item.uniqueKey}
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0 }}
                            className={`relative w-16 h-20 bg-[#1e293b] border-4 ${borderColors[item.colorTheme] || 'border-gray-500'} rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center group cursor-pointer hover:-translate-y-2 transition-transform`}
                            onClick={() => setSelectedItem(item)}
                        >
                            <img src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${item.imageName}.png`)} alt="Icon" className="w-12 h-12 object-contain pixelated drop-shadow-md" />
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black z-10">
                                x{item.amount}
                            </div>
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black/90 text-white text-[10px] font-bold p-2 rounded text-center border border-gray-600 z-20">
                                {tJordan(`choices.${getAssetDetails(item.id).key}.name`)} <br />
                                <span className="text-emerald-400">{tInv('active_yield')}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className={`bg-[#1e293b] border-2 w-full max-w-5xl rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] text-white overflow-hidden flex flex-col ${borderColors[selectedItem.colorTheme] || 'border-gray-500'}`}
                        >
                            <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex justify-center items-center border border-gray-600 shadow-inner shrink-0">
                                        <img src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${selectedItem.imageName}.png`)} alt="Asset" className="h-12 object-contain pixelated" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black uppercase tracking-widest text-white">
                                                {tJordan(`choices.${getAssetDetails(selectedItem.id).key}.name`)}
                                            </h2>
                                            <span className="text-xs font-bold px-2 py-1 bg-gray-700 rounded text-gray-300">📍 {getAssetDetails(selectedItem.id).loc}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-emerald-400 font-bold text-sm">
                                                {tInv('shares_fraction', { amount: selectedItem.amount, total: getAssetDetails(selectedItem.id).totalShares.toLocaleString() })}
                                            </p>
                                            <span className="px-2 py-0.5 bg-emerald-900/50 border border-emerald-700 rounded text-emerald-300 text-xs font-black tracking-wider">
                                                {tInv('apy_label')} {getAssetDetails(selectedItem.id).apy}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white font-black text-2xl px-2">&times;</button>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6 flex flex-col">
                                    <div className="bg-black/50 border border-gray-700 p-5 rounded-xl shadow-inner text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{tInv('live_yield')}</h3>
                                        <p className="text-[9px] text-gray-500 mb-3">{tInv('claim_schedule')}</p>

                                        <div className="text-5xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] mb-4">
                                            {liveYield.toFixed(4)} <span className="text-xl text-emerald-600">USDC</span>
                                        </div>

                                        <button onClick={handleClaim} className="hover:scale-105 active:scale-95 transition-transform relative group">
                                            <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/claim.png')} alt="Claim" className="h-10 w-auto object-contain pixelated drop-shadow-lg cursor-pointer" />
                                        </button>

                                        <AnimatePresence>
                                            {claimStatus && (
                                                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-2 text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                                                    {claimStatus}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('economic_data')}</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                                <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('price_m2')}</div>
                                                <div className="text-base font-black text-white">{getAssetDetails(selectedItem.id).price}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                                <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('vacancy_rate')}</div>
                                                <div className="text-base font-black text-white">{getAssetDetails(selectedItem.id).vac}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marché Secondaire OTC */}
                                    <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl mt-auto">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            📈 {tInv('trade_market')}
                                        </h3>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-300">{tInv('current_price')}</span>
                                            <span className="text-xl font-black text-yellow-400">{getDynamicPrice(selectedItem.id).toFixed(2)} USDC</span>
                                        </div>

                                        {localStorage.getItem('governance_done') === 'true' && (
                                            <p className="text-[10px] text-orange-400 mb-4 italic leading-tight">
                                                {tInv('trade_impact')}
                                            </p>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleTrade('sell')}
                                                className="flex-1 py-2.5 bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-600 hover:text-white rounded font-black text-xs uppercase tracking-widest transition-colors shadow-[0_2px_0_rgb(185,28,28)] active:shadow-none active:translate-y-[2px]"
                                            >
                                                {tInv('btn_sell')}
                                            </button>
                                            <button
                                                onClick={() => handleTrade('buy')}
                                                className="flex-1 py-2.5 bg-emerald-900/30 text-emerald-400 border border-emerald-700 hover:bg-emerald-600 hover:text-white rounded font-black text-xs uppercase tracking-widest transition-colors shadow-[0_2px_0_rgb(4,120,87)] active:shadow-none active:translate-y-[2px]"
                                            >
                                                {tInv('btn_buy')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('dao_history')}</h3>
                                        {localStorage.getItem('governance_done') === 'true' ? (
                                            <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-xl flex flex-col gap-4">
                                                <div className="flex justify-between items-center border-b border-purple-500/30 pb-2">
                                                    <p className="text-sm text-purple-300 font-bold">{tInv('vote_passed')}</p>
                                                    <p className="text-xs text-purple-400 font-mono">{tInv('funds_released')}</p>
                                                </div>
                                                <div className="bg-black/60 p-3 rounded-lg border border-gray-700 flex gap-3 items-start relative overflow-hidden shadow-inner min-h-[90px]">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                                                    <div className="flex-shrink-0 mt-1 pl-1">
                                                        <AnimatedAvatar character="jordan" isTalking={isTypingImpact} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-1">
                                                            {tInv('gov_impact_title')}
                                                        </span>
                                                        <div className="text-xs text-gray-300 leading-snug font-bold">
                                                            <TypewriterText key={`impact-${selectedItem.id}`} text={tInv('gov_impact_text')} speed={15} onFinished={() => setIsTypingImpact(false)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-center h-full flex items-center justify-center">
                                                <p className="text-sm text-gray-500 italic">{tInv('vote_pending')}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('tx_ledger')}</h3>
                                        <div className="space-y-2">
                                            <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-300">{tInv('vault_contract')}</span>
                                                <a href={`https://testnet.snowtrace.io/address/${VAULT_CONTRACT_ADDRESS}?chainid=43113`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-red-400 hover:text-red-300 bg-red-900/30 px-2 py-1 rounded transition-colors border border-red-500/30">
                                                    {VAULT_CONTRACT_ADDRESS.slice(0, 6)}...{VAULT_CONTRACT_ADDRESS.slice(-4)} ↗
                                                </a>
                                            </div>

                                            <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                                <span className="text-xs font-bold text-emerald-400">{tInv('tx_purchase')}</span>
                                                {selectedItem.txHash ? (
                                                    <a href={`https://testnet.snowtrace.io/tx/${selectedItem.txHash}?chainid=43113`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded transition-colors border border-emerald-500/30">
                                                        Tx: {selectedItem.txHash.slice(0, 6)}...{selectedItem.txHash.slice(-4)} ↗
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-gray-500">Non disponible</span>
                                                )}
                                            </div>

                                            {/* 🔥 LA NOUVELLE LIGNE POUR LE TRADE OTC (S'affiche uniquement si un trade a eu lieu) 🔥 */}
                                            {selectedItem.otcTxHash && (
                                                <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                                    <span className="text-xs font-bold text-blue-400">{tInv('tx_otc')}</span>
                                                    <span className="text-[10px] font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/30">
                                                        Tx: {selectedItem.otcTxHash.slice(0, 6)}...{selectedItem.otcTxHash.slice(-4)}
                                                    </span>
                                                </div>
                                            )}

                                            {localStorage.getItem('governance_done') === 'true' && (
                                                <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                                    <span className="text-xs font-bold text-purple-400">{tInv('tx_gov')}</span>
                                                    <span className="text-[10px] font-mono text-purple-400 bg-purple-900/30 px-2 py-1 rounded border border-purple-500/30">
                                                        Tx: 0x5179...312b
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 border-t border-gray-700 flex justify-end">
                                <button onClick={() => setSelectedItem(null)} className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors active:scale-95">
                                    {tInv('close')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showGovernance && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
                    >
                        <div className={`bg-[#1e293b] border-2 w-full max-w-2xl rounded-xl shadow-2xl text-white p-6 relative ${voteSuccess ? 'border-emerald-500' : 'border-purple-500'}`}>
                            <div className="flex flex-col sm:flex-row gap-4 items-start relative">
                                <div className={`absolute top-0 left-0 w-1 h-full ${voteSuccess ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                                <div className="flex-shrink-0 mt-1 pl-2">
                                    <AnimatedAvatar character="jordan" isTalking={isTypingGov} />
                                </div>
                                <div className="flex-1 w-full">
                                    <div className={`font-black tracking-widest uppercase text-xs mb-2 border-b border-gray-700 pb-1 ${voteSuccess ? 'text-emerald-400' : 'text-purple-400'}`}>
                                        {tInv('gov_title')}
                                    </div>
                                    <div className="text-white text-sm font-bold min-h-[40px] mb-4">
                                        {!voteSuccess ? (
                                            <TypewriterText key="question" text={tInv('gov_alert', { buildingName: tJordan(`choices.${getAssetDetails(inventory[0]?.id).key}.name`) })} speed={25} onFinished={() => setIsTypingGov(false)} />
                                        ) : (
                                            <TypewriterText key="success" text={tInv('gov_success')} speed={25} onFinished={() => setIsTypingGov(false)} />
                                        )}
                                    </div>

                                    {!isTypingGov && !voteSuccess && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 mt-4">
                                            <button onClick={() => handleVote('OUI')} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded transition-transform active:scale-95 shadow-[0_4px_0_rgb(126,34,206)]">
                                                {tInv('btn_yes')}
                                            </button>
                                            <button onClick={() => handleVote('NON')} className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-black uppercase tracking-widest rounded transition-transform active:scale-95 shadow-[0_4px_0_rgb(71,85,105)]">
                                                {tInv('btn_no')}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};