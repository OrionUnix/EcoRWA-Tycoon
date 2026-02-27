import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ServicePanel } from './ServicePanel';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';
import { useTranslations } from 'next-intl';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { GAME_ICONS } from '../../../../../../../hooks/ui/useGameIcons';

interface BudgetPanelProps {
    stats: CityStats | null;
    resources: PlayerResources | null;
    onClose: () => void;
}

function TaxSlider({ value, onChange, label, icon }: { value: number; onChange: (v: number) => void; label: string; icon: string; }) {
    return (
        <div className="flex flex-col gap-3 bg-slate-100 p-3 border-4 border-black shadow-[4px_4px_0_0_#000] rounded-none">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={icon} className="w-14 h-14 object-contain" alt="" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-xl font-bold text-black">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onChange(Math.max(0, value - 1))}
                        className="w-8 h-8 bg-slate-300 border-4 border-black rounded-none text-xl flex items-center justify-center font-black shadow-[2px_2px_0_0_#000] hover:bg-slate-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-none"
                    >
                        -
                    </button>
                    <div className="w-20 text-center font-mono text-2xl font-black bg-white border-4 border-black py-0.5 rounded-none shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.2)] text-black">
                        {value}%
                    </div>
                    <button
                        onClick={() => onChange(Math.min(100, value + 1))}
                        className="w-8 h-8 bg-slate-300 border-4 border-black rounded-none text-xl flex items-center justify-center font-black shadow-[2px_2px_0_0_#000] hover:bg-slate-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-none"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Added native visual slider bar (hidden thumb but tracking bar visible and clickable) */}
            <div className="w-full flex mt-1 items-center gap-2 px-1">
                <span className="text-sm font-black text-black">0%</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="flex-1 h-3 bg-slate-300 border-2 border-black appearance-none cursor-pointer rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <span className="text-sm font-black text-black">100%</span>
            </div>
        </div>
    );
}

function MetricRow({ title, amount, type, icon }: { title: string, amount: number, type: 'expense' | 'income', icon?: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-slate-400 last:border-0 hover:bg-slate-300 px-3 -mx-3 rounded-none transition-none group">
            <div className="flex items-center gap-3">
                {icon ? <img src={icon} className="w-14 h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" alt="" style={{ imageRendering: 'pixelated' }} /> : <div className="w-14 h-14" />}
                <span className="text-xl font-bold text-black">{title}</span>
            </div>
            <span className={`text-2xl font-mono font-black ${type === 'expense' ? 'text-red-700' : 'text-green-700'}`}>
                {type === 'expense' && amount > 0 ? '-' : ''}${formatNumber(amount)}
            </span>
        </div>
    );
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ stats, resources, onClose }) => {
    const t = useTranslations('budget');
    const budget = stats?.budget;
    const funds = resources?.money || 0;
    const maintDetail = budget?.maintenanceDetail || {};

    // Revenue calculations
    const taxResInc = budget?.taxIncome?.residential || 0;
    const taxComInc = budget?.taxIncome?.commercial || 0;
    const taxIndInc = budget?.taxIncome?.industrial || 0;
    const tradeExportInc = (budget?.tradeIncome || 0) + (budget?.exportIncome || 0);

    // Hardcoded demo value for RWA Yields feature requested by user
    const rwaYields = 3450;

    // Aggregate revenues & expenses
    const totalRevenues = taxResInc + taxComInc + taxIndInc + tradeExportInc + rwaYields;
    const totalExpenses = budget?.maintenance || 0;
    const netProfitLoss = totalRevenues - totalExpenses;

    // UI Tax State
    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

    // Jordan Dynamic Dialogue Logic
    let activeMessage = t('advisorMessage');
    const maxTax = Math.max(taxRes, taxCom, taxInd);

    if (maxTax === 100) {
        activeMessage = "C'est un suicide économique ! La ville sera vide demain !";
    } else if (maxTax >= 25) {
        activeMessage = "Maire, c'est du vol ! Les entreprises vont fermer et la population va fuir !";
    } else if (taxInd > 20) {
        activeMessage = "Maire, les usines ferment ! On va droit vers un chômage massif !";
    } else if (taxRes > 20) {
        activeMessage = "Les gens plient bagage ! Personne ne veut payer autant pour vivre ici.";
    } else if (maxTax >= 16) {
        activeMessage = "Attention, les citoyens commencent à grincer des dents...";
    } else if (maxTax >= 9) {
        activeMessage = "C'est le juste milieu. L'argent rentre, personne ne râle trop.";
    } else {
        activeMessage = "On est trop généreux, Maire ! On pourrait doubler nos profits.";
    }

    const displayedMessage = useTypewriterWithSound(activeMessage, 30);

    return (
        <ServicePanel
            title={
                <div className="flex items-center gap-4">
                    <img src={GAME_ICONS.money} className="w-12 h-12 object-contain" alt="Money" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-3xl font-black uppercase text-white tracking-widest leading-none" style={{ textShadow: '3px 3px 0 #000' }}>{t('title')}</span>
                </div>
            }
            icon="" color="#111" onClose={onClose} width="w-[98vw] max-w-[1400px]"
        >
            <div className="flex flex-row gap-5 font-sans h-[85vh] bg-[#c3c7cb] p-4">

                {/* LEFT PANEL: JORDAN ADVISOR (25%) */}
                <div className="w-[340px] shrink-0 bg-white border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col relative h-full rounded-none">
                    <div className="bg-white border-b-4 border-black py-3 px-4 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center z-10 shrink-0">
                        <span className="text-2xl font-black uppercase text-black tracking-widest shrink-0">JORDAN SPEAK</span>
                    </div>

                    <div className="p-4 flex flex-col items-center gap-6 flex-1 overflow-y-auto bg-slate-100 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)]">
                        {/* Avatar Container */}
                        <div className="w-48 h-48 shrink-0 border-8 border-black rounded-full overflow-hidden shadow-[8px_8px_0_0_#000] bg-slate-300 flex items-center justify-center bg-blue-500 mt-2">
                            <img
                                src="/assets/isometric/Spritesheet/character/jordan.png"
                                alt="Jordan Advisor"
                                className="w-full h-full object-cover transform translate-y-3 scale-110"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* Speech Bubble Container */}
                        <div className="bg-[#f0a8d0] border-4 border-black p-5 relative shadow-[4px_4px_0_0_#000] w-full flex-1">
                            {/* Dialogue Tail Triangle */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-black"></div>
                            <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[15px] border-l-transparent border-r-transparent border-b-[#f0a8d0] z-10"></div>

                            <p className="text-xl font-medium text-black leading-relaxed whitespace-pre-wrap">
                                <span className="font-black text-2xl text-black block mb-3 border-b-4 border-black pb-2">{t('advisorTitle')}</span>
                                {displayedMessage}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: FINANCIAL GRID & FOOTER (75%) */}
                <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">

                    {/* THE 3 COLUMNS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 overflow-y-auto p-1 py-1 px-1 flex-1">

                        {/* COLUMN 1: EXPENSES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col h-full">
                            <div className="bg-red-600 border-b-4 border-black py-4 text-center text-xl font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.expenses')}
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-0 pb-0 overflow-y-auto">
                                <MetricRow title={t('categories.energy')} amount={maintDetail['POWER'] || 0} type="expense" icon={GAME_ICONS.power} />
                                <MetricRow title={t('categories.water')} amount={maintDetail['WATER'] || 0} type="expense" icon={GAME_ICONS.water} />
                                <MetricRow title={t('categories.health')} amount={maintDetail['CIVIC'] || 0} type="expense" icon={GAME_ICONS.medical} />
                                <MetricRow title={t('categories.roads')} amount={maintDetail['ROADS'] || 0} type="expense" />
                                <div className="my-2 border-b-4 border-dashed border-slate-400" />
                                <MetricRow title={t('categories.exports')} amount={maintDetail['EXTRACTION'] || 0} type="expense" icon={GAME_ICONS.export} />
                                <MetricRow title={t('categories.government')} amount={420} type="expense" icon={GAME_ICONS.administration} />
                            </div>
                            <div className="bg-slate-200 p-4 mt-auto border-t-4 border-black flex justify-between items-center shrink-0 shadow-[inset_0_4px_0_0_rgba(0,0,0,0.1)]">
                                <span className="text-xl font-black text-red-800 uppercase">{t('summary.subtotal')} (/H)</span>
                                <span className="text-3xl font-bold font-mono text-red-700">-${formatNumber(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* COLUMN 2: REVENUES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col h-full">
                            <div className="bg-green-600 border-b-4 border-black py-4 text-center text-xl font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.revenues')}
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-0 pb-0 overflow-y-auto">
                                <MetricRow title={t('categories.residential')} amount={taxResInc} type="income" icon={GAME_ICONS.residential} />
                                <MetricRow title={t('categories.commercial')} amount={taxComInc} type="income" icon={GAME_ICONS.commercial} />
                                <MetricRow title={t('categories.industrial')} amount={taxIndInc} type="income" icon={GAME_ICONS.industrial} />
                                <div className="my-2 border-b-4 border-dashed border-slate-400" />
                                <MetricRow title={t('categories.exports')} amount={tradeExportInc} type="income" icon={GAME_ICONS.export} />
                            </div>

                            {/* RWA SECTION */}
                            <div className="bg-slate-200 border-y-4 border-black p-4 shrink-0">
                                <span className="text-xl font-black text-blue-900 uppercase tracking-widest block mb-2">BLOCKCHAIN</span>
                                <MetricRow title={t('categories.rwaYields')} amount={rwaYields} type="income" icon={GAME_ICONS.rwa} />
                            </div>

                            <div className="bg-slate-200 p-4 border-t-4 border-black flex justify-between items-center shrink-0 mt-auto shadow-[inset_0_4px_0_0_rgba(0,0,0,0.1)]">
                                <span className="text-xl font-black text-green-800 uppercase">{t('summary.subtotal')} (/H)</span>
                                <span className="text-3xl font-bold font-mono text-green-700">+${formatNumber(totalRevenues)}</span>
                            </div>
                        </div>

                        {/* COLUMN 3: TAXES & POLICIES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col h-full">
                            <div className="bg-black border-b-4 border-black py-4 text-center text-xl font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.taxes')}
                            </div>
                            <div className="p-4 flex flex-col gap-5 overflow-y-auto">
                                <TaxSlider label={t('categories.residential')} icon={GAME_ICONS.residential} value={taxRes} onChange={setTaxRes} />
                                <TaxSlider label={t('categories.commercial')} icon={GAME_ICONS.commercial} value={taxCom} onChange={setTaxCom} />
                                <TaxSlider label={t('categories.industrial')} icon={GAME_ICONS.industrial} value={taxInd} onChange={setTaxInd} />

                                <div className="mt-2 text-lg leading-snug font-bold text-black bg-yellow-300 p-4 rounded-none border-4 border-black shadow-[4px_4px_0_0_#000]">
                                    {t('taxWarning')}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* FOOTER ROW: PROFIT & TREASURY */}
                    <div className="bg-slate-400 p-4 shrink-0 border-4 border-black shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.4)] flex justify-between items-center gap-6 mt-1">

                        {/* NET BALANCE */}
                        <div className={`py-4 px-6 border-4 border-black shadow-[8px_8px_0_0_#000] flex items-center gap-6 shrink-0 ${netProfitLoss >= 0 ? 'bg-green-400 text-black' : 'bg-red-500 text-white'}`}>
                            <img src={GAME_ICONS.money} className="w-16 h-16 object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)]" alt="Profit" style={{ imageRendering: 'pixelated' }} />
                            <div className="text-2xl font-black uppercase tracking-widest">
                                {t('summary.netProfitLoss')}
                            </div>
                            <div className="text-5xl font-black font-mono" style={{ textShadow: netProfitLoss >= 0 ? 'none' : '2px 2px 0 #000' }}>
                                {netProfitLoss >= 0 ? '+' : ''}{formatNumber(netProfitLoss)} $/h
                            </div>
                        </div>

                        {/* VAULT / TREASURY */}
                        <div className="flex items-center gap-6 bg-black py-4 px-6 border-4 border-black shadow-[8px_8px_0_0_#000] ml-auto shrink-0 flex-1 justify-end relative overflow-hidden">
                            {/* Vault Icon Background Overlay (Subtle) */}
                            <img src={GAME_ICONS.vault} className="w-32 h-32 object-contain absolute opacity-20 -left-4 -bottom-4" alt="" style={{ imageRendering: 'pixelated' }} />

                            <img src={GAME_ICONS.money} className="w-16 h-16 object-contain drop-shadow-[2px_2px_0_rgba(255,255,255,0.2)] z-10" alt="Money" style={{ imageRendering: 'pixelated' }} />
                            <div className="text-xl uppercase font-black text-slate-300 tracking-[0.1em] text-right leading-tight z-10">
                                Liquid<br /><span className="text-white tracking-widest">{t('summary.treasury')}</span>
                            </div>
                            <div className="text-5xl font-mono font-black text-[#FFD700] z-10" style={{ textShadow: '2px 2px 0 #000' }}>
                                ${formatNumber(funds)}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </ServicePanel>
    );
};
