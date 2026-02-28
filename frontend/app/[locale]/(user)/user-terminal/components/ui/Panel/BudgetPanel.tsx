import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ServicePanel } from './ServicePanel';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';
import { useTranslations } from 'next-intl';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { GAME_ICONS } from '../../../../../../../hooks/ui/useGameIcons';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';

interface BudgetPanelProps {
    stats: CityStats | null;
    resources: PlayerResources | null;
    onClose: () => void;
}

// Ligne de tableau ultra-compacte style SimCity
function BudgetRow({ label, expense = 0, income = 0, icon }: { label: string, expense?: number, income?: number, icon: string }) {
    return (
        <tr className="border-b border-slate-400 hover:bg-slate-200/50 transition-none group">
            <td className="py-1 px-2 flex items-center gap-2">
                <img src={icon} className="w-5 h-5 object-contain pixelated" alt="" />
                <span className="text-[21px] font-bold text-slate-800 truncate" title={label}>{label}</span>
            </td>
            <td className="py-1 px-2 text-right font-mono text-[16px] text-red-600 font-bold whitespace-nowrap w-24">
                {expense > 0 ? `-$${formatNumber(expense)}` : "§0"}
            </td>
            <td className="py-1 px-2 text-right font-mono text-[16px] text-green-600 font-bold border-l border-slate-300 whitespace-nowrap w-24">
                {income > 0 ? `+$${formatNumber(income)}` : "§0"}
            </td>
        </tr>
    );
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ stats, resources, onClose }) => {
    const t = useTranslations('budget');
    // Default taxes - currently local state. Should normally connect to a global context or backend state
    const [tax, setTax] = useState({ res: 9, com: 9, ind: 9 });
    const funds = resources?.money || 0;

    // Simulation des données
    const maint = stats?.budget?.maintenanceDetail || {};
    const revenues = stats?.budget?.taxIncome || { residential: 0, commercial: 0, industrial: 0 };
    const tradeExport = stats?.budget?.exportIncome || 0; // Utilisation de la vraie statistique

    // Total computation
    const totalExpenses = stats?.budget?.maintenance || 0;
    // We add all exact revenues matching the table rows to make the visual sum correct
    const exactRevenues = (revenues.residential || 0) + (revenues.commercial || 0) + (revenues.industrial || 0) + tradeExport;
    const netProfitLoss = exactRevenues - totalExpenses;

    const maxTax = Math.max(tax.res, tax.com, tax.ind);
    let activeMessage = t('advisor.generous');
    if (maxTax === 100) {
        activeMessage = t('advisor.suicide');
    } else if (maxTax >= 25) {
        activeMessage = t('advisor.panic');
    } else if (tax.ind > 20) {
        activeMessage = t('advisor.industryDrop');
    } else if (tax.res > 20) {
        activeMessage = t('advisor.residentialDrop');
    } else if (maxTax >= 16) {
        activeMessage = t('advisor.warning');
    } else if (maxTax >= 9) {
        activeMessage = t('advisor.balanced');
    }

    const { displayedText, isTyping } = useTypewriterWithSound(activeMessage, 30);

    return (
        <ServicePanel
            title={
                <div className="flex items-center gap-2">
                    <img src={GAME_ICONS.money} className="w-6 h-6 pixelated" alt="" />
                    <span className="text-lg font-black uppercase tracking-tighter">{t('title')}</span>
                </div>
            }
            onClose={onClose}
            width="w-[95vw] max-w-[1000px]"
            icon="" color="#111"
        >
            <div className="flex flex-col bg-[#c3c7cb] border-4 border-black p-1 shadow-[8px_8px_0_0_#000]">

                {/* TOP: JORDAN ADVISOR (Compact Row) */}
                <div className="flex gap-2 bg-slate-100 border-b-4 border-black p-2 items-center shrink-0">
                    <div className="w-16 h-16 border-2 border-black rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                        <AnimatedAvatar character="jordan" isTalking={isTyping} />
                    </div>
                    <div className="flex-1 bg-white border-2 border-black p-2 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] h-16 flex items-center">
                        <p className="text-[13px] leading-tight font-medium">
                            <span className="font-bold border-b border-black">{t('advisorTitle')}</span> <span className="italic">"{displayedText}"</span>
                        </p>
                    </div>
                </div>

                {/* MAIN: SPREADSHEET LAYOUT */}
                <div className="flex flex-col md:flex-row gap-2 p-2 bg-slate-400">

                    {/* LEFT: THE BIG TABLE (Expenses & Incomes) */}
                    <div className="flex-[2] bg-white border-2 border-black overflow-y-auto max-h-[400px] shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]">
                        <table className="w-full border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-800 text-white text-[11px] uppercase font-black sticky top-0 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] z-10">
                                    <th className="p-2 text-left w-1/2 border-r border-slate-600">{t('headers.category')}</th>
                                    <th className="p-2 text-right w-1/4 border-r border-slate-600">{t('headers.expenses')}</th>
                                    <th className="p-2 text-right w-1/4">{t('headers.revenues')}</th>
                                </tr>
                            </thead>
                            <tbody >
                                <BudgetRow label={t('categories.residential')} income={(revenues.residential || 0) + (revenues.commercial || 0) + (revenues.industrial || 0)} icon={GAME_ICONS.residential} />
                                <BudgetRow label={t('categories.energy')} expense={maint['POWER'] || 0} icon={GAME_ICONS.power} />
                                <BudgetRow label={t('categories.water')} expense={maint['WATER'] || 0} icon={GAME_ICONS.water} />
                                <BudgetRow label={t('categories.police')} expense={maint['POLICE'] || 0} icon={GAME_ICONS.police} />
                                <BudgetRow label={t('categories.health')} expense={maint['CIVIC'] || 0} icon={GAME_ICONS.medical} />
                                <BudgetRow label={t('categories.government')} expense={maint['GOVERNMENT'] || 420} icon={GAME_ICONS.administration} />
                                <BudgetRow label={t('categories.exports')} income={tradeExport} icon={GAME_ICONS.export} />
                                {/* RWA Row Removed as per instruction: "gain rwa x2 revenues et ne se met pas dans ce tableau" */}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT: TAXES & BONDS (Compact Sidebar) */}
                    <div className="md:w-64 flex flex-col gap-2 shrink-0">
                        {/* TAXES SECTION */}
                        <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
                            <h4 className="text-[14px] font-black uppercase mb-3 border-b-2 border-black pb-1">{t('headers.taxRatesTitle')}</h4>
                            {['res', 'com', 'ind'].map((type) => (
                                <div key={type} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-[16px] font-bold uppercase">{t(`categories.${type === 'res' ? 'residential' : type === 'com' ? 'commercial' : 'industrial'}`)}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setTax(p => ({ ...p, [type]: Math.max(0, p[type as keyof typeof tax] - 1) }))} className="w-6 h-6 bg-slate-200 border border-black shadow-[1px_1px_0_0_#000] active:translate-y-px active:shadow-none font-bold flex items-center justify-center">-</button>
                                        <div className="w-10 text-center text-xs font-black bg-slate-50 border border-slate-300 py-0.5">{tax[type as keyof typeof tax]}%</div>
                                        {/* Changed upper limit from 20 to 100 */}
                                        <button onClick={() => setTax(p => ({ ...p, [type]: Math.min(100, p[type as keyof typeof tax] + 1) }))} className="w-6 h-6 bg-slate-200 border border-black shadow-[1px_1px_0_0_#000] active:translate-y-px active:shadow-none font-bold flex items-center justify-center">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* BONDS SECTION */}
                        <div className="bg-slate-200 border-2 border-black p-3 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] flex-1">
                            <h4 className="text-[12px] font-black uppercase mb-2 border-b border-slate-400 pb-1">{t('headers.bondsTitle')}</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button className="text-[16px] bg-blue-600 text-white py-1.5 px-2 border-2 border-black shadow-[2px_2px_0_0_#000] uppercase font-bold hover:bg-blue-700 active:translate-y-px active:shadow-none transition-none">{t('actions.borrow')}</button>
                                <button className="text-[16px] bg-slate-400 text-black py-1.5 px-2 border-2 border-black shadow-[2px_2px_0_0_#000] uppercase font-bold opacity-50 cursor-not-allowed">{t('actions.repay')}</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER: TOTALS (Compact Row) */}
                <div className="bg-[#b3b7bb] border-t-4 border-black p-3 flex justify-between items-center font-mono">
                    <div className="flex gap-4">
                        <div className={`flex flex-col border-2 border-black p-1.5 px-3 bg-white shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]`}>
                            <span className="text-[10px] font-black uppercase text-slate-600 leading-none mb-1">{t('summary.netProfitLoss')}</span>
                            <span className={`text-xl font-black ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'} leading-none`}>
                                {netProfitLoss >= 0 ? '+' : ''}${formatNumber(netProfitLoss)}
                            </span>
                        </div>
                    </div>
                    <div className="bg-black p-2 px-4 border-2 border-slate-400 shadow-[2px_2px_0_0_rgba(255,255,255,0.4)] flex items-center gap-4">
                        <span className="text-xs text-slate-300 font-black uppercase tracking-widest leading-none pt-1">{t('summary.treasury')}</span>
                        <span className="text-2xl text-[#FFD700] font-black leading-none">${formatNumber(funds)}</span>
                    </div>
                </div>
            </div>
        </ServicePanel>
    );
};