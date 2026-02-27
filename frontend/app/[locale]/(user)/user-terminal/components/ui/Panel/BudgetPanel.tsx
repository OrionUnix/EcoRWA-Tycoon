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
        <div className="flex items-center justify-between gap-3 bg-slate-100 p-2 border-2 border-black shadow-[4px_4px_0_0_#000] rounded-none">
            <div className="flex items-center gap-3">
                <img src={icon} className="w-14 h-14 object-contain" alt="" style={{ imageRendering: 'pixelated' }} />
                <span className="text-xl font-bold text-black">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-5 h-5 bg-slate-300 border-2 border-black rounded-none text-[10px] flex items-center justify-center font-bold shadow-[2px_2px_0_0_#000] hover:bg-slate-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-none"
                >
                    -
                </button>
                <div className="w-12 text-center font-mono text-lg font-black bg-white border-2 border-black py-0.5 rounded-none shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.2)] text-black">
                    {value}%
                </div>
                <button
                    onClick={() => onChange(Math.min(20, value + 1))}
                    className="w-5 h-5 bg-slate-300 border-2 border-black rounded-none text-[10px] flex items-center justify-center font-bold shadow-[2px_2px_0_0_#000] hover:bg-slate-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-none"
                >
                    +
                </button>
            </div>
        </div>
    );
}

function MetricRow({ title, amount, type, icon }: { title: string, amount: number, type: 'expense' | 'income', icon?: string }) {
    return (
        <div className="flex justify-between items-center py-1 border-b-2 border-dashed border-slate-400 last:border-0 hover:bg-slate-300 px-2 -mx-2 rounded-none transition-none group">
            <div className="flex items-center gap-3">
                {icon && <img src={icon} className="w-14 h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" alt="" style={{ imageRendering: 'pixelated' }} />}
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

    // Jordan Typewriter Dialogue
    const advisorMessage = t('advisorMessage');
    const displayedMessage = useTypewriterWithSound(advisorMessage, 30);

    // UI Tax State (Visual simulation for now)
    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

    return (
        <ServicePanel
            title={
                <div className="flex items-center gap-3">
                    <img src={GAME_ICONS.money} className="w-10 h-10 object-contain" alt="Money" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-2xl font-bold">{t('title')}</span>
                </div>
            }
            icon="" color="#111" onClose={onClose} width="w-[95vw] max-w-[1200px]"
        >
            <div className="flex flex-col font-sans h-full max-h-[85vh] bg-[#c3c7cb]">

                {/* HEADER ROW 1: ADVISOR BLOCK (Jordan) */}
                <div className="flex gap-4 p-3 border-b-4 border-black shrink-0 shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.2)]">
                    <div className="w-24 h-24 shrink-0 border-4 border-black rounded-full overflow-hidden shadow-[4px_4px_0_0_#000] bg-white flex items-center justify-center">
                        <img
                            src="/assets/isometric/Spritesheet/character/jordan.png"
                            alt="Jordan Advisor"
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                    <div className="flex-1 bg-white border-4 border-black rounded-none p-3 relative shadow-[8px_8px_0_0_#000]">
                        <p className="text-lg font-medium text-black leading-relaxed whitespace-pre-wrap">
                            <span className="font-black text-xl text-black block mb-1">{t('advisorTitle')}</span> {displayedMessage}
                        </p>
                    </div>
                </div>

                {/* BODY ROW 2: 3 COLUMNS SPREADSHEET */}
                <div className="p-3 border-b-4 border-black overflow-y-auto min-h-[300px] flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        {/* COLUMN 1: EXPENSES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col">
                            <div className="bg-red-600 border-b-4 border-black py-1.5 text-center text-lg font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.expenses')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0 pb-0">
                                <MetricRow title={t('categories.energy')} amount={maintDetail['POWER'] || 0} type="expense" icon={GAME_ICONS.power} />
                                <MetricRow title={t('categories.water')} amount={maintDetail['WATER'] || 0} type="expense" icon={GAME_ICONS.water} />
                                <MetricRow title={t('categories.health')} amount={maintDetail['CIVIC'] || 0} type="expense" icon={GAME_ICONS.medical} />
                                <MetricRow title={t('categories.roads')} amount={maintDetail['ROADS'] || 0} type="expense" />
                                <div className="my-1.5 border-b-2 border-dashed border-slate-400" />
                                <MetricRow title={t('categories.exports')} amount={maintDetail['EXTRACTION'] || 0} type="expense" icon={GAME_ICONS.export} />
                                <MetricRow title={t('categories.government')} amount={420} type="expense" icon={GAME_ICONS.administration} />
                            </div>
                            <div className="bg-slate-200 p-2 mt-auto border-t-4 border-black flex justify-between items-center shrink-0">
                                <span className="text-lg font-black text-red-800 uppercase">{t('summary.subtotal')}</span>
                                <span className="text-2xl font-bold font-mono text-red-700">-${formatNumber(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* COLUMN 2: REVENUES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col">
                            <div className="bg-green-600 border-b-4 border-black py-1.5 text-center text-lg font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.revenues')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0 pb-0">
                                <MetricRow title={t('categories.residential')} amount={taxResInc} type="income" icon={GAME_ICONS.residential} />
                                <MetricRow title={t('categories.commercial')} amount={taxComInc} type="income" icon={GAME_ICONS.commercial} />
                                <MetricRow title={t('categories.industrial')} amount={taxIndInc} type="income" icon={GAME_ICONS.industrial} />
                                <div className="my-1.5 border-b-2 border-dashed border-slate-400" />
                                <MetricRow title={t('categories.exports')} amount={tradeExportInc} type="income" icon={GAME_ICONS.export} />
                            </div>

                            {/* RWA SECTION */}
                            <div className="bg-slate-200 border-y-4 border-black p-2 py-1">
                                <span className="text-base font-black text-blue-900 uppercase tracking-wider block">Blockchain</span>
                                <MetricRow title={t('categories.rwaYields')} amount={rwaYields} type="income" icon={GAME_ICONS.rwa} />
                            </div>

                            <div className="bg-slate-200 p-2 border-t-4 border-black flex justify-between items-center shrink-0 mt-auto">
                                <span className="text-lg font-black text-green-800 uppercase">{t('summary.subtotal')}</span>
                                <span className="text-2xl font-bold font-mono text-green-700">+${formatNumber(totalRevenues)}</span>
                            </div>
                        </div>

                        {/* COLUMN 3: TAXES & POLICIES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col">
                            <div className="bg-black border-b-4 border-black py-1.5 text-center text-lg font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.taxes')}
                            </div>
                            <div className="p-3 flex flex-col gap-3">
                                <TaxSlider label={t('categories.residential')} icon={GAME_ICONS.residential} value={taxRes} onChange={setTaxRes} />
                                <TaxSlider label={t('categories.commercial')} icon={GAME_ICONS.commercial} value={taxCom} onChange={setTaxCom} />
                                <TaxSlider label={t('categories.industrial')} icon={GAME_ICONS.industrial} value={taxInd} onChange={setTaxInd} />

                                <div className="mt-2 text-base leading-tight font-bold text-black bg-yellow-200 p-3 rounded-none border-4 border-black shadow-[4px_4px_0_0_#000]">
                                    {t('taxWarning')}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ROW 3: PROFIT & TREASURY */}
                <div className="bg-slate-400 p-3 px-4 flex justify-between items-center shrink-0 border-t-4 border-black shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.4)]">

                    {/* NET BALANCE */}
                    <div className={`py-2 px-4 border-4 border-black shadow-[8px_8px_0_0_#000] flex items-center gap-4 ${netProfitLoss >= 0 ? 'bg-green-400 text-black' : 'bg-red-400 text-white'}`}>
                        <img src={GAME_ICONS.money} className="w-12 h-12 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" alt="Profit" style={{ imageRendering: 'pixelated' }} />
                        <div className="text-lg font-black uppercase tracking-wider">
                            {t('summary.netProfitLoss')}
                        </div>
                        <div className="text-2xl font-black font-mono">
                            {netProfitLoss >= 0 ? '+' : ''}{formatNumber(netProfitLoss)} $/h
                        </div>
                    </div>

                    {/* VAULT / TREASURY */}
                    <div className="flex items-center gap-4 bg-black py-2 px-4 border-4 border-black shadow-[8px_8px_0_0_#000]">
                        <img src={GAME_ICONS.money} className="w-12 h-12 object-contain drop-shadow-[2px_2px_0_rgba(255,255,255,0.2)]" alt="Money" style={{ imageRendering: 'pixelated' }} />
                        <div className="text-sm uppercase font-bold text-slate-300 tracking-[0.1em] text-right leading-tight">
                            Liquid<br /><span className="text-white">{t('summary.treasury')}</span>
                        </div>
                        <div className="text-3xl font-mono font-black text-[#FFD700]">
                            ${formatNumber(funds)}
                        </div>
                    </div>

                </div>

            </div>
        </ServicePanel>
    );
};
