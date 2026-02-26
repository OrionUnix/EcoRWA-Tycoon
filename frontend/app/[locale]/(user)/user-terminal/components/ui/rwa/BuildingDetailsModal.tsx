import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { AnimatedAvatar } from '../../AnimatedAvatar';
import { TypewriterText } from '../../TypewriterText';
import { useTranslations } from 'next-intl';
import { getAssetDetails, getDynamicPrice } from '../../../hooks/useRWAInventory';

const VAULT = '0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A';

const BORDER_COLORS: Record<string, string> = {
    blue: 'border-[#4682B4]',
    orange: 'border-[#E66C2C]',
    green: 'border-[#4E9258]',
};

interface Props {
    item: any;
    liveYield: number;
    claimStatus: string;
    placedIds: Set<number>;
    isTypingImpact: boolean;
    onClose: () => void;
    onClaim: () => void;
    onTrade: (type: 'buy' | 'sell') => void;
    onPlaceOnMap: (item: any) => void;
    onTypingFinished: () => void;
}

export const BuildingDetailsModal: React.FC<Props> = ({
    item, liveYield, claimStatus, placedIds, isTypingImpact,
    onClose, onClaim, onTrade, onPlaceOnMap, onTypingFinished,
}) => {
    const tInv = useTranslations('inventory');
    const tJordan = useTranslations('jordan');
    const tTrading = useTranslations('trading');
    const tBob = useTranslations('bob');
    const details = getAssetDetails(item.id);
    const govDone = localStorage.getItem(`gov_done_${item.id}`) === 'true';

    return (
        <motion.div
            key="dashboard-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className={`bg-[#1e293b] border-2 w-full max-w-5xl rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] text-white overflow-hidden flex flex-col ${BORDER_COLORS[item.colorTheme] ?? 'border-gray-500'}`}
            >
                {/* Header */}
                <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex justify-center items-center border border-gray-600 shrink-0">
                            <img src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${item.imageName}.png`)} alt="Asset" className="h-12 object-contain pixelated" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black uppercase tracking-widest">{tJordan(`choices.${details.key}.name`)}</h2>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-700 rounded text-gray-300">📍 {details.loc}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-emerald-400 font-bold text-sm">
                                    {tInv('shares_fraction', { amount: item.amount, total: details.totalShares.toLocaleString() })}
                                </p>
                                <span className="px-2 py-0.5 bg-emerald-900/50 border border-emerald-700 rounded text-emerald-300 text-xs font-black">
                                    {tInv('apy_label')} {details.apy}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white font-black text-2xl px-2">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Colonne gauche */}
                    <div className="space-y-6 flex flex-col">
                        {/* Yield tracker */}
                        <div className="bg-black/50 border border-gray-700 p-5 rounded-xl shadow-inner text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{tInv('live_yield')}</h3>
                            <p className="text-[9px] text-gray-500 mb-3">{tInv('claim_schedule')}</p>
                            <div className="text-5xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] mb-4">
                                {liveYield.toFixed(4)} <span className="text-xl text-emerald-600">USDC</span>
                            </div>
                            <button onClick={onClaim} className="hover:scale-105 active:scale-95 transition-transform">
                                <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/claim.png')} alt="Claim" className="h-10 w-auto object-contain pixelated drop-shadow-lg" />
                            </button>
                            <AnimatePresence>
                                {claimStatus && (
                                    <motion.p key="claim-toast" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="absolute bottom-2 text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                                        {claimStatus}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Place on Map */}
                        <div className="bg-yellow-400/10 border-2 border-yellow-400/60 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest">🗺️ {tBob('rwa_place_title')}</h3>
                                <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 tracking-widest animate-pulse">★ x2 BONUS</span>
                            </div>
                            {placedIds.has(item.id) ? (
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <span>✅</span><span>{tBob('rwa_placed_confirm')}</span>
                                </div>
                            ) : (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    onPlaceOnMap(item);
                                }}
                                    className="w-full py-2.5 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-[0_4px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1">
                                    🏗️ {tBob('rwa_place_title')} →
                                </button>
                            )}
                        </div>

                        {/* Données économiques */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('economic_data')}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('price_m2')}</div>
                                    <div className="text-base font-black text-white">{details.price}</div>
                                </div>
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('vacancy_rate')}</div>
                                    <div className="text-base font-black text-white">{details.vac}</div>
                                </div>
                            </div>
                        </div>

                        {/* Marché OTC */}
                        <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl mt-auto">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">📈 {tInv('trade_market')}</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">{tInv('current_price')}</span>
                                <span className="text-xl font-black text-yellow-400">{getDynamicPrice(item.id).toFixed(2)} USDC</span>
                            </div>
                            {govDone && (
                                <p className={`text-[10px] mb-4 italic leading-tight ${item.id === 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {tInv('trade_impact')}
                                </p>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => onTrade('sell')} className="flex-1 py-2.5 bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-600 hover:text-white rounded font-black text-xs uppercase tracking-widest transition-colors shadow-[0_2px_0_rgb(185,28,28)] active:shadow-none active:translate-y-[2px]">
                                    {tInv('btn_sell')}
                                </button>
                                <button onClick={() => onTrade('buy')} className="flex-1 py-2.5 bg-emerald-900/30 text-emerald-400 border border-emerald-700 hover:bg-emerald-600 hover:text-white rounded font-black text-xs uppercase tracking-widest transition-colors shadow-[0_2px_0_rgb(4,120,87)] active:shadow-none active:translate-y-[2px]">
                                    {tInv('btn_buy')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-6 flex flex-col">
                        {/* Historique DAO */}
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('dao_history')}</h3>
                            {govDone ? (
                                <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-xl flex flex-col gap-4">
                                    <div className="flex justify-between items-center border-b border-purple-500/30 pb-2">
                                        <p className="text-sm text-purple-300 font-bold">{tInv(`gov_scenarios.${details.key}.history_title`)}</p>
                                        <p className="text-xs text-purple-400 font-mono">{tInv(`gov_scenarios.${details.key}.history_sub`)}</p>
                                    </div>
                                    <div className="bg-black/60 p-3 rounded-lg border border-gray-700 flex gap-3 items-start relative overflow-hidden shadow-inner min-h-[90px]">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                                        <div className="flex-shrink-0 mt-1 pl-1">
                                            <AnimatedAvatar character="jordan" isTalking={isTypingImpact} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-1">
                                                {tInv(`gov_scenarios.${details.key}.impact_title`)}
                                            </span>
                                            <div className="text-xs text-gray-300 leading-snug font-bold">
                                                <TypewriterText
                                                    key={`impact-${item.id}`}
                                                    text={tInv(`gov_scenarios.${details.key}.impact_text`)}
                                                    speed={15}
                                                    onFinished={onTypingFinished}
                                                />
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

                        {/* Ledger TX */}
                        <div className="shrink-0">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tInv('tx_ledger')}</h3>
                            <div className="space-y-2">
                                <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-300">{tInv('vault_contract')}</span>
                                    <a href={`https://testnet.snowtrace.io/address/${VAULT}?chainid=43113`} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] font-mono text-red-400 hover:text-red-300 bg-red-900/30 px-2 py-1 rounded border border-red-500/30">
                                        {VAULT.slice(0, 6)}...{VAULT.slice(-4)} ↗
                                    </a>
                                </div>
                                <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                    <span className="text-xs font-bold text-emerald-400">{tInv('tx_purchase')}</span>
                                    {item.txHash
                                        ? <a href={`https://testnet.snowtrace.io/tx/${item.txHash}?chainid=43113`} target="_blank" rel="noopener noreferrer"
                                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/30">
                                            Tx: {item.txHash.slice(0, 6)}...{item.txHash.slice(-4)} ↗
                                        </a>
                                        : <span className="text-[10px] font-mono text-gray-500">Non disponible</span>
                                    }
                                </div>
                                {item.otcTxHash && (
                                    <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                        <span className="text-xs font-bold text-blue-400">{tInv('tx_otc')}</span>
                                        <span className="text-[10px] font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/30">
                                            Tx: {item.otcTxHash.slice(0, 6)}...{item.otcTxHash.slice(-4)}
                                        </span>
                                    </div>
                                )}
                                {govDone && (
                                    <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg flex justify-between items-center">
                                        <span className="text-xs font-bold text-purple-400">{tInv('tx_gov')}</span>
                                        <span className="text-[10px] font-mono text-purple-400 bg-purple-900/30 px-2 py-1 rounded border border-purple-500/30">
                                            Tx: 0x5179b438f7a9...312b2
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors active:scale-95">
                        {tInv('close')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
