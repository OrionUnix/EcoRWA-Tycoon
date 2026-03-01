import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';

// 📈 COMPOSANT MINI-GRAPHIQUE (Sparkline)
const MiniChart = ({ data, color }: { data: number[], color: string }) => {
    // 🔥 AJOUT DE LA TRADUCTION ICI
    const tTrading = useTranslations('trading');

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 200;
    const height = 40;

    // Calcul des points SVG
    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center justify-center w-full h-full opacity-80">
            <svg width="100%" height="100%" viewBox={`0 -5 ${width} ${height + 10}`} preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
            {/* 🔥 UTILISATION DE LA CLÉ DE TRADUCTION */}
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-2">
                {tTrading('chart_evolution')}
            </span>
        </div>
    );
};

interface RWAPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    rwa: {
        id: number;
        name: string;
        desc: string;
        cost: number;
        apy: string;
        imageName: string;
        location: 'Paris' | 'New York';
    } | null;
}

export const RWAPurchaseModal: React.FC<RWAPurchaseModalProps> = ({
    isOpen, onClose, onConfirm, rwa
}) => {
    const tJordan = useTranslations('jordan');
    const tTrading = useTranslations('trading');

    const [shares, setShares] = useState<number>(1);
    const { displayedText, isTyping } = useTypewriterWithSound((isOpen && rwa) ? tJordan('analysis_intro') : "", 20);

    useEffect(() => {
        if (isOpen) {
            setShares(1);
        }
    }, [isOpen, rwa]);

    if (!isOpen || !rwa) return null;

    const apyValue = parseFloat(rwa.apy.replace('%', '')) / 100;
    const totalCost = shares * rwa.cost;
    const yearlyYield = totalCost * apyValue;
    const monthlyYield = yearlyYield / 12;

    const marketData = rwa.location === 'Paris'
        ? { priceM2: '10 580 €', vacancy: '2.8%', trend: '+1.5%', pop: '2.1M' }
        : { priceM2: '$14 230', vacancy: '1.5%', trend: '+2.3%', pop: '8.3M' };

    // Fausse data d'historique pour le rendu visuel (à remplacer par tes vraies data plus tard)
    const chartData = rwa.location === 'Paris'
        ? [9800, 10100, 10420, 10580, 10700] // Tendance haussière douce
        : [14000, 13600, 14400, 14060, 14230]; // Tendance volatile

    // Couleur du graphique : Vert si ça monte globalement, Rouge si ça baisse
    const chartColor = chartData[chartData.length - 1] >= chartData[0] ? '#34d399' : '#f87171';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="bg-[#1e293b] border-2 border-emerald-500 w-full max-w-5xl rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] text-white overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                >
                    {/* ========================================= */}
                    {/* COLONNE GAUCHE : L'ACTIF ET L'ACHAT       */}
                    {/* ========================================= */}
                    <div className="w-full lg:w-5/12 p-6 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-emerald-400">{rwa.name}</h2>
                            <span className="text-xs font-bold px-2 py-1 bg-gray-700 rounded text-gray-300">📍 {rwa.location}</span>
                        </div>

                        {/* Image du bâtiment */}
                        <div className="flex justify-center mb-6 h-40 bg-black/30 rounded-lg p-2 border border-gray-700 shadow-inner shrink-0">
                            <img src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${rwa.imageName}.png`)} alt={rwa.name} className="h-full object-contain pixelated" />
                        </div>

                        {/* 🔥 LE NOUVEAU GRAPHIQUE POUR COMBLER LE VIDE 🔥 */}
                        <div className="flex-1 flex items-center justify-center mb-6 bg-[#0f172a] rounded-lg border border-gray-700/50 p-4 shadow-inner min-h-[80px]">
                            <MiniChart data={chartData} color={chartColor} />
                        </div>

                        {/* Zone d'achat repoussée vers le bas */}
                        <div className="space-y-4 shrink-0">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">{tTrading('shares_label')}</label>
                                <div className="flex items-center gap-4 mt-1">
                                    <button onClick={() => setShares(Math.max(1, shares - 1))} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded font-black">-</button>
                                    <input
                                        type="number" value={shares} onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 h-10 bg-black text-center font-black text-xl border border-gray-600 rounded outline-none text-white focus:border-emerald-500"
                                    />
                                    <button onClick={() => setShares(shares + 1)} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded font-black">+</button>
                                </div>
                            </div>

                            <div className="bg-black/50 p-4 rounded-lg border border-gray-700 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">{tTrading('unit_cost')}</span>
                                    <span className="font-bold">{rwa.cost} USDC</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                                    <span className="text-gray-400 text-sm font-bold">{tTrading('total_cost')}</span>
                                    <span className="font-black text-2xl text-yellow-400">{totalCost} USDC</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* COLONNE DROITE : ANALYTICS & RENDEMENT    */}
                    {/* ========================================= */}
                    <div className="w-full lg:w-7/12 p-6 bg-gray-900 flex flex-col relative overflow-y-auto">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white font-black text-xl z-10">&times;</button>

                        <div className="flex-1 pr-2 flex flex-col">

                            {/* Analyse Jordan */}
                            <div className="bg-black/40 p-3 rounded-lg border-2 border-gray-700 mb-5 flex flex-col sm:flex-row gap-4 items-start relative overflow-hidden shadow-inner shrink-0">
                                <div className="absolute top-0 left-0 w-1 bg-yellow-400 h-full"></div>
                                <div className="flex-shrink-0 mt-1">
                                    <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                </div>
                                <div className="flex-1 text-xs w-full">
                                    <div className="text-yellow-400 font-black tracking-widest uppercase text-[10px] mb-1 border-b border-gray-700 pb-1">
                                        {tJordan('analysis_title')}
                                    </div>
                                    <div className="text-white text-sm font-bold min-h-[20px]">
                                        <p>{displayedText}</p>
                                    </div>
                                    {!isTyping && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 mt-2">
                                            <p className="text-emerald-300 leading-snug"><strong className="text-white">{tJordan('pros')}</strong> {tJordan(`analysis.${rwa.imageName}.pros`)}</p>
                                            <p className="text-red-400 leading-snug"><strong className="text-white">{tJordan('cons')}</strong> {tJordan(`analysis.${rwa.imageName}.cons`)}</p>
                                            <p className="text-blue-300 leading-snug"><strong className="text-white">{tJordan('admin')}</strong> {tJordan(`analysis.${rwa.imageName}.admin`)}</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Données de marché */}
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1 shrink-0">
                                {tTrading('market_data', { location: rwa.location })}
                            </h3>

                            <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
                                <div className="bg-gray-800 p-2.5 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('price_m2')}</div>
                                    <div className="text-base font-black text-white">{marketData.priceM2}</div>
                                </div>
                                <div className="bg-gray-800 p-2.5 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('yearly_trend')}</div>
                                    <div className="text-base font-black text-emerald-400">{marketData.trend}</div>
                                </div>
                                <div className="bg-gray-800 p-2.5 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('vacancy_rate')}</div>
                                    <div className="text-base font-black text-white">{marketData.vacancy}</div>
                                </div>
                                <div className="bg-gray-800 p-2.5 rounded border border-gray-700">
                                    <div className="text-[9px] text-gray-400 uppercase font-bold">{tTrading('demography')}</div>
                                    <div className="text-base font-black text-white">{marketData.pop}</div>
                                </div>
                            </div>

                            {/* Projections (poussées vers le bas avec mt-auto) */}
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1 mt-auto shrink-0">
                                {tTrading('yield_projection')} ({rwa.apy})
                            </h3>

                            <div className="space-y-2 mb-4 shrink-0">
                                <div className="flex justify-between items-center bg-gray-800 p-2.5 rounded border-l-4 border-emerald-500">
                                    <span className="text-xs font-bold text-gray-300">{tTrading('est_yearly_yield')}</span>
                                    <span className="font-black text-emerald-400">+{yearlyYield.toFixed(2)} USDC</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-800 p-2.5 rounded border-l-4 border-blue-500">
                                    <span className="text-xs font-bold text-gray-300">{tTrading('est_monthly_yield')}</span>
                                    <span className="font-black text-blue-400">+{monthlyYield.toFixed(2)} USDC</span>
                                </div>
                            </div>
                        </div>

                        {/* Bouton d'achat */}
                        <button
                            onClick={() => onConfirm(shares)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-lg transition-transform active:scale-95 shadow-[0_4px_0_rgb(4,120,87)] hover:shadow-[0_2px_0_rgb(4,120,87)] hover:translate-y-[2px] shrink-0"
                        >
                            {tTrading('sign_contract')} ({totalCost} USDC)
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};