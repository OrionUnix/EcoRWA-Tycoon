import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ServicePanel } from './ServicePanel';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';
import { useTranslations } from 'next-intl';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';

interface BudgetPanelProps {
    stats: CityStats | null;
    resources: PlayerResources | null;
    onClose: () => void;
}

function TaxSlider({ value, onChange, label, icon }: { value: number; onChange: (v: number) => void; label: string; icon: string; }) {
    return (
        <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-gray-300 shadow-sm hover:border-gray-400 transition-colors">
            <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] font-bold text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-5 h-5 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 rounded-md text-[10px] flex items-center justify-center font-bold hover:from-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-inner"
                >
                    -
                </button>
                <div className="w-8 text-center font-mono text-[12px] font-black bg-white border border-gray-400 py-0.5 rounded shadow-inner text-gray-800">
                    {value}%
                </div>
                <button
                    onClick={() => onChange(Math.min(20, value + 1))}
                    className="w-5 h-5 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 rounded-md text-[10px] flex items-center justify-center font-bold hover:from-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-inner"
                >
                    +
                </button>
            </div>
        </div>
    );
}

function MetricRow({ title, amount, type, icon }: { title: string, amount: number, type: 'expense' | 'income', icon?: string }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200/60 last:border-0 hover:bg-black/5 px-2 -mx-2 rounded transition-colors group">
            <div className="flex items-center gap-2">
                {icon && <span className="text-[12px] w-4 text-center opacity-80">{icon}</span>}
                <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{title}</span>
            </div>
            <span className={`text-[12px] font-mono font-bold ${type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
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

    // Jordan Typewriter Dialogue
    const advisorMessage = t('advisorMessage');
    const displayedMessage = useTypewriterWithSound(advisorMessage, 30);

    // UI Tax State (Visual simulation for now)
    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

    return (
        <ServicePanel title={t('title')} icon="" color="#111" onClose={onClose} width="w-[780px] max-w-4xl">
            <div className="flex flex-col font-sans h-full max-h-[85vh] win95-border">

                {/* HEADER ROW 1: ADVISOR BLOCK (Jordan) */}
                <div className="flex gap-4 p-4 bg-gradient-to-b from-slate-200 to-slate-300 border-b border-gray-400 shadow-sm shrink-0">
                    <div className="w-[85px] h-[85px] shrink-0 border-2 border-slate-400 bg-slate-400/30 rounded-lg overflow-hidden shadow-inner flex items-end justify-center relative">
                        <img
                            src="/assets/isometric/Spritesheet/character/jordan.png"
                            alt="Jordan Advisor"
                            className="w-full h-auto object-cover transform translate-y-1 drop-shadow-md"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                    <div className="flex-1 bg-white/90 backdrop-blur-sm border-2 border-slate-300 rounded-xl p-3.5 relative shadow-md">
                        {/* Speech bubble arrow pointer */}
                        <div className="absolute top-8 -left-[14px] w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-slate-300" />
                        <div className="absolute top-[34px] -left-[10px] w-0 h-0 border-y-[8px] border-y-transparent border-r-[11px] border-r-white z-10" />

                        <p className="text-[13px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                            <span className="font-bold text-slate-900">{t('advisorTitle')}</span> {displayedMessage}
                        </p>
                    </div>
                </div>

                {/* BODY ROW 2: 3 COLUMNS SPREADSHEET */}
                <div className="bg-[#d4d0c8] p-3 border-b-2 border-slate-500 overflow-y-auto min-h-[300px] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* COLUMN 1: EXPENSES */}
                        <div className="bg-[#e4e4e4] rounded-sm border-2 border-gray-800 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] flex flex-col">
                            <div className="bg-red-900 border-b-2 border-gray-800 py-1.5 text-center text-[10px] font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.expenses')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0.5 pb-0">
                                <MetricRow title={t('categories.energy')} amount={maintDetail['POWER'] || 0} type="expense" icon="⚡" />
                                <MetricRow title={t('categories.water')} amount={maintDetail['WATER'] || 0} type="expense" icon="💧" />
                                <MetricRow title={t('categories.health')} amount={maintDetail['CIVIC'] || 0} type="expense" icon="🏥" />
                                <MetricRow title={t('categories.roads')} amount={maintDetail['ROADS'] || 0} type="expense" icon="🛣️" />
                                <div className="my-1 border-b border-dashed border-gray-400" />
                                <MetricRow title={t('categories.exports')} amount={maintDetail['EXTRACTION'] || 0} type="expense" icon="⛏️" />
                                <MetricRow title={t('categories.government')} amount={420} type="expense" icon="🏛️" />
                            </div>
                            <div className="bg-[#d0d0d0] p-2 mt-auto border-t-2 border-gray-800 flex justify-between items-center shrink-0">
                                <span className="text-[10px] font-extrabold text-red-700 uppercase">{t('summary.subtotal')}</span>
                                <span className="text-[14px] font-bold font-mono text-red-700">-${formatNumber(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* COLUMN 2: REVENUES */}
                        <div className="bg-[#f0f0f0] rounded-sm border-2 border-slate-400 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] flex flex-col">
                            <div className="bg-green-800 border-b-2 border-slate-400 py-1.5 text-center text-[10px] font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.revenues')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0.5">
                                <MetricRow title={t('categories.residential')} amount={taxResInc} type="income" icon="🏠" />
                                <MetricRow title={t('categories.commercial')} amount={taxComInc} type="income" icon="🏢" />
                                <MetricRow title={t('categories.industrial')} amount={taxIndInc} type="income" icon="🏭" />
                                <div className="my-1 border-b border-dashed border-gray-400" />
                                <MetricRow title={t('categories.exports')} amount={tradeExportInc} type="income" icon="📦" />
                            </div>

                            {/* RWA SECTION */}
                            <div className="bg-[#dcdcdc] border-y-2 border-slate-400 p-2 py-1.5">
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-0.5 block">Blockchain</span>
                                <MetricRow title={t('categories.rwaYields')} amount={rwaYields} type="income" icon="💎" />
                            </div>

                            <div className="bg-[#e4e4e4] p-2.5 border-t-2 border-slate-400 flex justify-between items-center shrink-0 mt-auto">
                                <span className="text-[10px] font-extrabold text-green-800 uppercase">{t('summary.subtotal')}</span>
                                <span className="text-[14px] font-bold font-mono text-green-700">+${formatNumber(totalRevenues)}</span>
                            </div>
                        </div>

                        {/* COLUMN 3: TAXES & POLICIES */}
                        <div className="bg-[#f0f0f0] rounded-sm border-2 border-slate-400 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] flex flex-col">
                            <div className="bg-slate-700 border-b-2 border-slate-400 py-1.5 text-center text-[10px] font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.taxes')}
                            </div>
                            <div className="p-2 flex flex-col gap-2">
                                <TaxSlider label={t('categories.residential')} icon="🏠" value={taxRes} onChange={setTaxRes} />
                                <TaxSlider label={t('categories.commercial')} icon="🏢" value={taxCom} onChange={setTaxCom} />
                                <TaxSlider label={t('categories.industrial')} icon="🏭" value={taxInd} onChange={setTaxInd} />

                                <div className="mt-1 text-[10px] leading-tight text-slate-800 bg-[#ffffe1] p-2 rounded-sm shadow-[inset_1px_1px_0_rgba(0,0,0,0.2)] border border-slate-400">
                                    {t('taxWarning')}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ROW 3: PROFIT & TREASURY */}
                <div className="bg-[#808080] p-2.5 px-4 flex justify-between items-center shrink-0 border-t-2 border-slate-500">

                    {/* NET BALANCE */}
                    <div className={`py-1 px-3 border-2 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4)] flex items-center gap-3 ${netProfitLoss >= 0 ? 'bg-[#c1e2a5] border-[#558b2f] text-[#1b5e20]' : 'bg-[#ffcccc] border-[#b71c1c] text-[#b71c1c]'}`}>
                        <div className="text-[11px] font-black uppercase tracking-wider">
                            {t('summary.netProfitLoss')}
                        </div>
                        <div className="text-[18px] font-black font-mono">
                            {netProfitLoss >= 0 ? '+' : ''}{formatNumber(netProfitLoss)} $/h
                        </div>
                    </div>

                    {/* VAULT / TREASURY */}
                    <div className="flex items-center gap-3 bg-[#1e2328] py-1 px-3 border-2 border-black shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)]">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em] text-right leading-tight">
                            Liquid<br /><span className="text-slate-300">{t('summary.treasury')}</span>
                        </div>
                        <div className="text-[24px] font-mono font-black text-[#FFD700]">
                            ${formatNumber(funds)}
                        </div>
                    </div>

                </div>

            </div>
        </ServicePanel>
    );
};
