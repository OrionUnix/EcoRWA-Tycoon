import React, { useState } from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert } from './ServicePanel';
import { CityStats, PlayerResources } from '../../engine/types';
import { formatNumber } from './GameWidgets';

// ═══════════════════════════════════════
// SimCity 2013 — COMPLETE BUDGET PANEL
// Treasury | Taxes (modifiable) | Revenue | Expenses | Loans | Unemployment
// ═══════════════════════════════════════

interface BudgetPanelProps {
    stats: CityStats | null;
    resources: PlayerResources | null;
    onClose: () => void;
}

// Tax slider component
function TaxSlider({ label, icon, value, color, onChange }: {
    label: string; icon: string; value: number; color: string; onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-3 py-2">
            <span className="text-lg w-6 text-center">{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: '#555' }}>{label}</span>
                    <span className="text-[13px] font-bold font-mono" style={{ color }}>{value}%</span>
                </div>
                <input
                    type="range" min={0} max={20} step={1} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${color} ${value * 5}%, rgba(0,0,0,0.08) ${value * 5}%)`,
                        accentColor: color,
                    }}
                />
                <div className="flex justify-between text-[9px] font-mono mt-0.5" style={{ color: '#bbb' }}>
                    <span>0%</span><span>10%</span><span>20%</span>
                </div>
            </div>
        </div>
    );
}

// Expense row with icon
function ExpenseRow({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <div className="flex items-center gap-2 py-1.5">
            <span className="text-sm w-5 text-center">{icon}</span>
            <span className="flex-1 text-[11px] font-semibold" style={{ color: '#555' }}>{label}</span>
            <span className="text-[12px] font-bold font-mono" style={{ color: value > 0 ? '#D0021B' : '#7ED321' }}>
                {value > 0 ? `-$${formatNumber(value)}` : 'OK'}
            </span>
        </div>
    );
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ stats, resources, onClose }) => {
    const budget = stats?.budget;
    const funds = resources?.money || 0;
    const income = budget?.income || 0;
    const expenses = budget?.expenses || 0;
    const net = income - expenses;

    // Tax state (UI-only for now, will wire to engine)
    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

    // Employment
    const workers = stats?.workers || 0;
    const jobs = stats?.jobs || 0;
    const unemployed = stats?.unemployed || 0;
    const rate = workers > 0 ? Math.round((unemployed / workers) * 100) : 0;

    return (
        <ServicePanel title="Budget Municipal" icon="💰" color="#4A90E2" onClose={onClose}>

            {/* ═══ TREASURY ═══ */}
            <PanelSection title="Trésorerie">
                <div className="flex items-center justify-between py-3 px-4 rounded-xl mb-2"
                    style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[12px] font-semibold" style={{ color: '#555' }}>Fonds Disponibles</span>
                    <span className="text-[20px] font-bold font-mono" style={{ color: funds >= 0 ? '#2C2C2C' : '#D0021B' }}>
                        ${formatNumber(funds)}
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 py-2 px-3 rounded-xl text-center" style={{ background: 'rgba(126,211,33,0.1)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#7ED321' }}>Revenus</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: '#7ED321' }}>+${formatNumber(income)}/hr</div>
                    </div>
                    <div className="flex-1 py-2 px-3 rounded-xl text-center" style={{ background: 'rgba(208,2,27,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#D0021B' }}>Dépenses</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: '#D0021B' }}>-${formatNumber(expenses)}/hr</div>
                    </div>
                </div>
                <div className="mt-2 py-2 px-4 rounded-xl text-center"
                    style={{ background: net >= 0 ? 'rgba(126,211,33,0.15)' : 'rgba(208,2,27,0.15)' }}>
                    <span className="text-[10px] uppercase font-bold mr-2" style={{ color: '#777' }}>Bénéfice Net</span>
                    <span className="text-[16px] font-bold font-mono" style={{ color: net >= 0 ? '#7ED321' : '#D0021B' }}>
                        {net >= 0 ? '+' : ''}{formatNumber(net)}$/hr
                    </span>
                </div>
            </PanelSection>

            {/* ═══ TAXES (Modifiable) ═══ */}
            <PanelSection title="Taxes (Ajustables)">
                <TaxSlider label="Taxe Résidentielle" icon="🏠" value={taxRes} color="#7ED321" onChange={setTaxRes} />
                <TaxSlider label="Taxe Commerciale" icon="🏢" value={taxCom} color="#4A90E2" onChange={setTaxCom} />
                <TaxSlider label="Taxe Industrielle" icon="🏭" value={taxInd} color="#F5A623" onChange={setTaxInd} />
                <div className="mt-1 px-3 py-1.5 rounded-lg text-[10px] italic" style={{ background: 'rgba(0,0,0,0.03)', color: '#999' }}>
                    ⚠️ Des taxes élevées réduisent le bonheur et la croissance.
                </div>
            </PanelSection>

            {/* ═══ INCOME BREAKDOWN ═══ */}
            <PanelSection title="Revenus par Catégorie">
                <MetricRow label="Impôts Résidentiels" value={budget?.taxIncome?.residential || 0} icon="🏠" color="#7ED321" suffix="$" />
                <MetricRow label="Impôts Commerciaux" value={budget?.taxIncome?.commercial || 0} icon="🏢" color="#4A90E2" suffix="$" />
                <MetricRow label="Impôts Industriels" value={budget?.taxIncome?.industrial || 0} icon="🏭" color="#F5A623" suffix="$" />
                <MetricRow label="Export / Commerce" value={budget?.tradeIncome || 0} icon="📦" color="#BD10E0" suffix="$" />
            </PanelSection>

            {/* ═══ EXPENSES BY SERVICE ═══ */}
            <PanelSection title="Dépenses par Service">
                <ExpenseRow icon="💧" label="Eau" value={0} />
                <ExpenseRow icon="⚡" label="Électricité" value={0} />
                <ExpenseRow icon="🚰" label="Égouts" value={0} />
                <ExpenseRow icon="🚒" label="Pompiers" value={0} />
                <ExpenseRow icon="🚔" label="Police" value={0} />
                <ExpenseRow icon="🏥" label="Santé" value={0} />
                <ExpenseRow icon="🏫" label="Éducation" value={0} />
                <ExpenseRow icon="🚌" label="Transport" value={0} />
                <ExpenseRow icon="🎡" label="Loisirs" value={0} />
                <ExpenseRow icon="🏭" label="Industrie" value={0} />
                <ExpenseRow icon="🌍" label="RWA" value={0} />
                <div className="mt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] font-bold" style={{ color: '#555' }}>Maintenance Totale</span>
                        <span className="text-[13px] font-bold font-mono" style={{ color: '#D0021B' }}>
                            -${formatNumber(budget?.maintenance || 0)}/hr
                        </span>
                    </div>
                </div>
            </PanelSection>

            {/* ═══ LOANS ═══ */}
            <PanelSection title="Emprunts">
                <div className="grid grid-cols-3 gap-2">
                    {['Bond A', 'Bond B', 'Bond C'].map((name, i) => (
                        <button
                            key={name}
                            className="py-2.5 px-2 rounded-xl text-center transition-all hover:scale-[1.03]"
                            style={{
                                background: 'rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,0,0,0.08)',
                            }}
                        >
                            <div className="text-[11px] font-bold" style={{ color: '#2C2C2C' }}>{name}</div>
                            <div className="text-[10px] font-mono" style={{ color: '#999' }}>
                                ${formatNumber([25000, 50000, 100000][i])}
                            </div>
                            <div className="text-[9px]" style={{ color: '#F5A623' }}>
                                {[5, 7, 10][i]}% intérêt
                            </div>
                        </button>
                    ))}
                </div>
                <div className="mt-2 text-[10px] italic" style={{ color: '#bbb' }}>
                    Cliquez pour emprunter. Remboursement automatique sur 12 mois.
                </div>
            </PanelSection>

            {/* ═══ EMPLOYMENT ═══ */}
            <PanelSection title="Emploi">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center py-2 rounded-xl" style={{ background: 'rgba(74,144,226,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#4A90E2' }}>Actifs</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: '#2C2C2C' }}>{formatNumber(workers)}</div>
                    </div>
                    <div className="text-center py-2 rounded-xl" style={{ background: 'rgba(126,211,33,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#7ED321' }}>Postes</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: '#2C2C2C' }}>{formatNumber(jobs)}</div>
                    </div>
                    <div className="text-center py-2 rounded-xl" style={{ background: unemployed > 0 ? 'rgba(208,2,27,0.08)' : 'rgba(126,211,33,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: unemployed > 0 ? '#D0021B' : '#7ED321' }}>Chômeurs</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: unemployed > 0 ? '#D0021B' : '#2C2C2C' }}>{formatNumber(unemployed)}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Taux de Chômage</span>
                    <span className="text-[13px] font-bold font-mono" style={{ color: rate > 15 ? '#D0021B' : rate > 5 ? '#F5A623' : '#7ED321' }}>
                        {rate}%
                    </span>
                </div>
            </PanelSection>

            {/* ═══ RECENT TRANSACTIONS ═══ */}
            <PanelSection title="Transactions Récentes">
                <div className="space-y-1">
                    <div className="flex items-center justify-between py-1 text-[11px]">
                        <span style={{ color: '#555' }}>💰 Collecte d'impôts</span>
                        <span className="font-mono font-bold" style={{ color: '#7ED321' }}>+${formatNumber(income)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-[11px]">
                        <span style={{ color: '#555' }}>🔧 Maintenance</span>
                        <span className="font-mono font-bold" style={{ color: '#D0021B' }}>-${formatNumber(budget?.maintenance || 0)}</span>
                    </div>
                </div>
                <div className="mt-1 text-[10px] text-center italic" style={{ color: '#ccc' }}>
                    (les transactions détaillées apparaissent en temps réel)
                </div>
            </PanelSection>

            {/* ═══ ALERTS ═══ */}
            {net < 0 && <PanelAlert type="danger" message="Déficit budgétaire ! Réduisez les dépenses ou augmentez les revenus." />}
            {net >= 0 && net < 100 && <PanelAlert type="warning" message="Bénéfice marginal. Diversifiez vos revenus." />}
            {net >= 100 && <PanelAlert type="ok" message="Finances saines. Continuez à investir !" />}
            {rate > 15 && <PanelAlert type="danger" message="Chômage élevé ! Créez des zones commerciales/industrielles." />}

        </ServicePanel>
    );
};
