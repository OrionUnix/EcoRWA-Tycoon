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
                <span className="text-[13px] font-bold text-slate-800">{label}</span>
            </td>
            <td className="py-1 px-2 text-right font-mono text-sm text-red-600 font-bold">
                {expense > 0 ? `-$${formatNumber(expense)}` : "§0"}
            </td>
            <td className="py-1 px-2 text-right font-mono text-sm text-green-600 font-bold border-l border-slate-300">
                {income > 0 ? `+$${formatNumber(income)}` : "§0"}
            </td>
        </tr>
    );
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ stats, resources, onClose }) => {
    const t = useTranslations('budget');
    const [tax, setTax] = useState({ res: 9, com: 9, ind: 9 });
    const funds = resources?.money || 0;

    // Simulation des données (à brancher sur ton engine)
    const maint = stats?.budget?.maintenanceDetail || {};
    const revenues = stats?.budget?.taxIncome || {};

    const activeMessage = tax.res > 20 ? "Les gens plient bagage ! Personne ne veut payer autant." : "Budget stable, Maire.";
    const displayedMessage = useTypewriterWithSound(activeMessage, 30);

    return (
        <ServicePanel
            title={
                <div className="flex items-center gap-2">
                    <img src={GAME_ICONS.money} className="w-6 h-6 pixelated" alt="" />
                    <span className="text-lg font-black uppercase tracking-tighter">CITY BUDGET</span>
                </div>
            }
            onClose={onClose}
            width="w-[95vw] max-w-[1000px]"
        >
            <div className="flex flex-col bg-[#c3c7cb] border-4 border-black p-1 shadow-[8px_8px_0_0_#000]">

                {/* TOP: JORDAN ADVISOR (Compact Row) */}
                <div className="flex gap-2 bg-slate-100 border-b-4 border-black p-2 items-center">
                    <div className="w-16 h-16 border-2 border-black rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-pixel">
                        <AnimatedAvatar npcId="jordan" size={64} />
                    </div>
                    <div className="flex-1 bg-white border-2 border-black p-2 shadow-pixel-sm h-16 flex items-center">
                        <p className="text-[13px] leading-tight font-bold italic">"{displayedMessage}"</p>
                    </div>
                </div>

                {/* MAIN: SPREADSHEET LAYOUT */}
                <div className="flex flex-row gap-1 p-1 bg-slate-400">

                    {/* LEFT: THE BIG TABLE (Expenses & Incomes) */}
                    <div className="flex-[2] bg-white border-2 border-black overflow-y-auto max-h-[400px]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-800 text-white text-[11px] uppercase font-black sticky top-0">
                                    <th className="p-1 text-left">Catégorie</th>
                                    <th className="p-1 text-right">Dépenses</th>
                                    <th className="p-1 text-right border-l border-slate-600">Revenus</th>
                                </tr>
                            </thead>
                            <tbody>
                                <BudgetRow label="Impôts (RCI)" income={(revenues.residential || 0) + (revenues.commercial || 0)} icon={GAME_ICONS.residential} />
                                <BudgetRow label="Énergie" expense={maint['POWER']} income={250} icon={GAME_ICONS.power} />
                                <BudgetRow label="Eau" expense={maint['WATER']} income={100} icon={GAME_ICONS.water} />
                                <BudgetRow label="Police & Sécurité" expense={maint['POLICE']} icon={GAME_ICONS.police} />
                                <BudgetRow label="Santé & Social" expense={maint['CIVIC']} icon={GAME_ICONS.medical} />
                                <BudgetRow label="Gouvernement" expense={420} icon={GAME_ICONS.administration} />
                                <BudgetRow label="Exportations (Mines/Bois)" income={3450} icon={GAME_ICONS.export} />
                                <BudgetRow label="Blockchain RWA" income={1500} icon={GAME_ICONS.rwa} />
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT: TAXES & BONDS (Compact Sidebar) */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="bg-white border-2 border-black p-2 shadow-pixel">
                            <h4 className="text-[11px] font-black uppercase mb-2 border-b-2 border-black">Taux d'imposition</h4>
                            {['res', 'com', 'ind'].map((type) => (
                                <div key={type} className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase">{type}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setTax(p => ({ ...p, [type]: Math.max(0, p[type as keyof typeof tax] - 1) }))} className="w-5 h-5 bg-slate-200 border border-black shadow-pixel-sm active:translate-y-px">-</button>
                                        <div className="w-8 text-center text-xs font-black">{tax[type as keyof typeof tax]}%</div>
                                        <button onClick={() => setTax(p => ({ ...p, [type]: Math.min(20, p[type as keyof typeof tax] + 1) }))} className="w-5 h-5 bg-slate-200 border border-black shadow-pixel-sm active:translate-y-px">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* BONDS SECTION */}
                        <div className="bg-slate-200 border-2 border-black p-2 shadow-pixel flex-1">
                            <h4 className="text-[11px] font-black uppercase mb-1">Emprunts (Bonds)</h4>
                            <div className="grid grid-cols-1 gap-1">
                                <button className="text-[10px] bg-blue-600 text-white p-1 border border-black shadow-pixel-sm uppercase font-bold hover:bg-blue-700">Emprunter $10k</button>
                                <button className="text-[10px] bg-slate-400 text-black p-1 border border-black shadow-pixel-sm uppercase font-bold opacity-50 cursor-not-allowed">Rembourser</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER: TOTALS (Compact Row) */}
                <div className="bg-[#b3b7bb] border-t-4 border-black p-2 flex justify-between items-center font-mono">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase">Net / Heure</span>
                            <span className="text-lg font-black text-green-700">+$3,450</span>
                        </div>
                    </div>
                    <div className="bg-black p-2 border-2 border-slate-400 shadow-pixel flex items-center gap-3">
                        <span className="text-[10px] text-white font-black uppercase">Trésorerie</span>
                        <span className="text-xl text-[#FFD700] font-black">${formatNumber(funds)}</span>
                    </div>
                </div>
            </div>
        </ServicePanel>
    );
};