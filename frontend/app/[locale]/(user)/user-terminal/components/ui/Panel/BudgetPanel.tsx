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
        <div className="flex items-center justify-between gap-2 bg-white p-2 border-4 border-black shadow-[4px_4px_0_0_#000] mb-3 last:mb-0">
            <div className="flex items-center gap-2">
                <img src={icon} className="w-6 h-6 object-contain" alt="" style={{ imageRendering: 'pixelated' }} />
                <span className="text-xs font-bold text-black">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-6 h-6 bg-slate-200 border-2 border-black rounded-none text-xs flex items-center justify-center font-black hover:bg-slate-300 active:translate-y-px transition-none"
                >
                    -
                </button>
                <div className="w-10 text-center font-mono text-sm font-black bg-white border-2 border-black py-0.5 text-black">
                    {value}%
                </div>
                <button
                    onClick={() => onChange(Math.min(100, value + 1))}
                    className="w-6 h-6 bg-slate-200 border-2 border-black rounded-none text-xs flex items-center justify-center font-black hover:bg-slate-300 active:translate-y-px transition-none"
                >
                    +
                </button>
            </div>
        </div>
    );
}

function MetricRow({ title, amount, type, icon, isBold = false }: { title: string, amount: number, type: 'expense' | 'income', icon?: string, isBold?: boolean }) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b-2 border-dashed border-slate-300 last:border-0 hover:bg-slate-200 px-3 transition-none">
            <div className="flex items-center gap-3">
                {icon ? <img src={icon} className="w-6 h-6 object-contain opacity-80" alt="" style={{ imageRendering: 'pixelated' }} /> : <div className="w-6 h-6" />}
                <span className={`text-sm text-black ${isBold ? 'font-black' : 'font-bold'}`}>{title}</span>
            </div>
            <span className={`text-base font-mono font-black ${type === 'expense' ? 'text-red-700' : 'text-green-700'}`}>
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

    const taxResInc = budget?.taxIncome?.residential || 0;
    const taxComInc = budget?.taxIncome?.commercial || 0;
    const taxIndInc = budget?.taxIncome?.industrial || 0;
    const tradeExportInc = (budget?.tradeIncome || 0) + (budget?.exportIncome || 0);

    const rwaYields = 3450;

    const totalRevenues = taxResInc + taxComInc + taxIndInc + tradeExportInc + rwaYields;
    const totalExpenses = budget?.maintenance || 0;
    const netProfitLoss = totalRevenues - totalExpenses;

    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

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
                <div className="flex items-center gap-3">
                    <img src={GAME_ICONS.money} className="w-8 h-8 object-contain" alt="Money" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-xl font-bold uppercase text-white tracking-widest">{t('title')}</span>
                </div>
            }
            icon="" color="#111" onClose={onClose} width="w-[90vw] max-w-[1100px]"
        >
            <div className="flex flex-col font-sans h-full max-h-[85vh] bg-[#c3c7cb]">

                {/* HEADER ROW 1: ADVISOR BLOCK (Jordan) */}
                <div className="flex gap-4 p-4 shrink-0 bg-[#c3c7cb]">
                    {/* Avatar Container */}
                    <div className="w-24 h-24 shrink-0 border-4 border-black shadow-[4px_4px_0_0_#000] bg-slate-400 p-1 flex items-center justify-center relative">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-slate-600 flex items-center justify-center">
                            <img
                                src="/assets/isometric/Spritesheet/character/jordan.png"
                                alt="Jordan Advisor"
                                className="w-[120%] h-[120%] object-cover transform translate-y-1 scale-110"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>
                    </div>
                    {/* Speech Bubble Container */}
                    <div className="flex-1 bg-white border-4 border-black p-4 relative shadow-[4px_4px_0_0_#000] flex items-center">
                        <p className="text-sm font-medium text-black leading-relaxed">
                            <span className="font-black text-sm text-black">{t('advisorTitle')}: </span>
                            {displayedMessage}
                        </p>
                    </div>
                </div>

                {/* BODY ROW 2: 3 COLUMNS SPREADSHEET */}
                <div className="px-4 pb-4 flex-1 flex flex-col min-h-[400px] overflow-hidden bg-[#c3c7cb]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full">

                        {/* COLUMN 1: EXPENSES */}
                        <div className="bg-white rounded-none border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col h-full overflow-hidden">
                            <div className="bg-red-600 border-b-4 border-black py-2 text-center text-sm font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.expenses')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0 overflow-y-auto bg-slate-50">
                                <MetricRow title={t('categories.energy')} amount={maintDetail['POWER'] || 0} type="expense" icon={GAME_ICONS.power} />
                                <MetricRow title={t('categories.water')} amount={maintDetail['WATER'] || 0} type="expense" icon={GAME_ICONS.water} />
                                <MetricRow title={t('categories.health')} amount={maintDetail['CIVIC'] || 0} type="expense" icon={GAME_ICONS.medical} />
                                <MetricRow title={t('categories.roads')} amount={maintDetail['ROADS'] || 0} type="expense" icon={GAME_ICONS.road} />
                                <div className="my-1 border-b-2 border-dashed border-slate-300" />
                                <MetricRow title={t('categories.exports')} amount={maintDetail['EXTRACTION'] || 0} type="expense" icon={GAME_ICONS.export} />
                                <MetricRow title={t('categories.government')} amount={420} type="expense" icon={GAME_ICONS.administration} />
                            </div>
                            <div className="bg-white p-3 border-t-4 border-black flex justify-between items-center shrink-0">
                                <span className="text-sm font-black text-red-800 uppercase">{t('summary.subtotal')} (/HOUR)</span>
                                <span className="text-lg font-bold font-mono text-red-700">-${formatNumber(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* COLUMN 2: REVENUES */}
                        <div className="bg-white rounded-none border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col h-full overflow-hidden">
                            <div className="bg-green-600 border-b-4 border-black py-2 text-center text-sm font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.revenues')}
                            </div>
                            <div className="p-2 flex-1 flex flex-col gap-0 overflow-y-auto bg-slate-50">
                                <MetricRow title={t('categories.residential')} amount={taxResInc} type="income" icon={GAME_ICONS.residential} />
                                <MetricRow title={t('categories.commercial')} amount={taxComInc} type="income" icon={GAME_ICONS.commercial} />
                                <MetricRow title={t('categories.industrial')} amount={taxIndInc} type="income" icon={GAME_ICONS.industrial} />
                                <div className="my-1 border-b-2 border-dashed border-slate-300" />
                                <MetricRow title={t('categories.exports')} amount={tradeExportInc} type="income" icon={GAME_ICONS.export} />
                            </div>

                            {/* RWA SECTION */}
                            <div className="bg-white border-y-4 border-black px-2 py-1 shrink-0">
                                <span className="text-xs font-black text-blue-800 uppercase tracking-widest block mb-1 mt-1 px-2">BLOCKCHAIN</span>
                                <MetricRow title={t('categories.rwaYields')} amount={rwaYields} type="income" icon={GAME_ICONS.rwa} isBold />
                            </div>

                            <div className="bg-white p-3 flex justify-between items-center shrink-0">
                                <span className="text-sm font-black text-green-800 uppercase">{t('summary.subtotal')} (/HOUR)</span>
                                <span className="text-lg font-bold font-mono text-green-700">+${formatNumber(totalRevenues)}</span>
                            </div>
                        </div>

                        {/* COLUMN 3: TAXES & POLICIES */}
                        <div className="bg-slate-100 rounded-none border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col h-full overflow-hidden">
                            <div className="bg-black border-b-4 border-black py-2 text-center text-sm font-black uppercase text-white tracking-widest shrink-0">
                                {t('headers.taxes')}
                            </div>
                            <div className="p-3 flex flex-col gap-0 overflow-y-auto bg-slate-50 flex-1">
                                <TaxSlider label={t('categories.residential')} icon={GAME_ICONS.residential} value={taxRes} onChange={setTaxRes} />
                                <TaxSlider label={t('categories.commercial')} icon={GAME_ICONS.commercial} value={taxCom} onChange={setTaxCom} />
                                <TaxSlider label={t('categories.industrial')} icon={GAME_ICONS.industrial} value={taxInd} onChange={setTaxInd} />

                                <div className="mt-auto pt-4">
                                    <div className="text-xs leading-snug font-medium text-black bg-[#fafaa8] p-3 rounded-none border-4 border-black shadow-[2px_2px_0_0_#000]">
                                        {t('taxWarning')}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ROW: PROFIT & TREASURY */}
                <div className="bg-[#b3b7bb] px-4 py-4 flex justify-between items-center shrink-0 border-t-4 border-black">

                    {/* NET BALANCE */}
                    <div className={`py-2 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center gap-4 shrink-0 ${netProfitLoss >= 0 ? 'bg-[#1ed760] text-black' : 'bg-red-500 text-white'}`}>
                        <div className="text-sm font-black uppercase tracking-widest">
                            {t('summary.netProfitLoss')}
                        </div>
                        <div className="text-xl font-black font-mono">
                            {netProfitLoss >= 0 ? '+' : ''}{formatNumber(netProfitLoss)} $/h
                        </div>
                    </div>

                    {/* VAULT / TREASURY */}
                    <div className="flex items-center gap-6 bg-black py-2 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] shrink-0 relative overflow-hidden">
                        <div className="text-xs uppercase font-black text-white tracking-widest text-right leading-tight max-w-[80px]">
                            Liquid<br />{t('summary.treasury')}
                        </div>
                        <div className="text-2xl font-mono font-black text-[#FFD700]">
                            ${formatNumber(funds)}
                        </div>
                    </div>
                </div>
            </div>
        </ServicePanel>
    );
};
