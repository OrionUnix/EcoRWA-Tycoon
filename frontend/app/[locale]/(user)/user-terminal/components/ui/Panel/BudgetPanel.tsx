import React, { useState } from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert } from './ServicePanel';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';

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

// Expense row with interactive toggle
function ExpenseRow({ icon, label, value, toggled, onToggle }: { icon: string; label: string; value: number; toggled: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center gap-2 py-2 border-b border-black/5 last:border-0 hover:bg-black/5 px-2 -mx-2 rounded-md transition-colors">
            <span className="text-sm w-5 text-center">{icon}</span>
            <span className="flex-1 text-[11px] font-semibold" style={{ color: '#555' }}>{label}</span>
            <span className="text-[12px] font-bold font-mono text-right mr-3" style={{ color: value > 0 ? '#D0021B' : '#7ED321' }}>
                {value > 0 ? `-$${formatNumber(value)}` : '0$'}
            </span>
            {/* Toggle Switch */}
            <button
                onClick={onToggle}
                className={`w-8 h-4 rounded-full transition-colors relative flex items-center shrink-0 ${toggled ? 'bg-green-500' : 'bg-gray-300'}`}
                title={toggled ? "Désactiver le service (Économie)" : "Activer le service"}
            >
                <div className={`w-3 h-3 bg-white rounded-full mx-0.5 shadow-sm transition-transform ${toggled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

// Emprunt Card
function LoanCard({ name, amount, interest }: { name: string, amount: number, interest: number }) {
    return (
        <button
            className="flex-1 py-3 px-2 rounded-xl text-center transition-all hover:scale-[1.03] hover:shadow-md bg-white border border-black/10"
        >
            <div className="text-[12px] font-bold mb-1" style={{ color: '#2C2C2C' }}>{name}</div>
            <div className="text-[13px] font-mono font-bold" style={{ color: '#4A90E2' }}>
                +${formatNumber(amount)}
            </div>
            <div className="text-[10px] font-semibold mt-1" style={{ color: '#F5A623' }}>
                Taux: {interest}%
            </div>
        </button>
    );
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ stats, resources, onClose }) => {
    const budget = stats?.budget;
    const funds = resources?.money || 0;
    const income = budget?.income || 0;
    const expenses = budget?.expenses || 0;
    const net = income - expenses;
    const maintDetail = budget?.maintenanceDetail || {};

    // Tabs State
    const [activeTab, setActiveTab] = useState<'revenues' | 'services' | 'finance'>('revenues');

    // Tax state (UI-only for now, will wire to engine)
    const [taxRes, setTaxRes] = useState(9);
    const [taxCom, setTaxCom] = useState(9);
    const [taxInd, setTaxInd] = useState(9);

    // Services state (UI-only visual simulation)
    const [toggles, setToggles] = useState<Record<string, boolean>>({
        POWER: true,
        WATER: true,
        CIVIC: true,
        EXTRACTION: true,
        FOOD: true
    });

    const toggleService = (cat: string) => {
        setToggles(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // Employment Data
    const workers = stats?.workers || 0;
    const jobs = stats?.jobs || 0;
    const unemployed = stats?.unemployed || 0;
    const rate = workers > 0 ? Math.round((unemployed / workers) * 100) : 0;

    return (
        <ServicePanel title="Budget & Administration" icon="🏦" color="#4A90E2" onClose={onClose}>

            {/* Header / Trésorerie Rapide - Toujours visible */}
            <div className="flex items-center justify-between py-2 px-4 rounded-xl mb-3 shadow-inner"
                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trésorerie Actuelle</div>
                    <div className="text-[18px] font-bold font-mono" style={{ color: funds >= 0 ? '#2C2C2C' : '#D0021B' }}>
                        ${formatNumber(funds)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Bénéfice Net</div>
                    <div className="text-[18px] font-bold font-mono" style={{ color: net >= 0 ? '#7ED321' : '#D0021B' }}>
                        {net >= 0 ? '+' : ''}{formatNumber(net)}$/h
                    </div>
                </div>
            </div>

            {/* TABS HEADER */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4 shadow-inner">
                <button
                    className={`flex-1 text-[11px] font-bold fill transition-all rounded-md py-1.5 ${activeTab === 'revenues' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'}`}
                    onClick={() => setActiveTab('revenues')}
                >
                    💰 Revenus
                </button>
                <button
                    className={`flex-1 text-[11px] font-bold transition-all rounded-md py-1.5 ${activeTab === 'services' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'}`}
                    onClick={() => setActiveTab('services')}
                >
                    📉 Services
                </button>
                <button
                    className={`flex-1 text-[11px] font-bold transition-all rounded-md py-1.5 ${activeTab === 'finance' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'}`}
                    onClick={() => setActiveTab('finance')}
                >
                    📈 Finance & RWA
                </button>
            </div>

            {/* TABS CONTENT */}

            {activeTab === 'revenues' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <PanelSection title="Revenus Générés">
                        <MetricRow label="Impôts Résidentiels" value={budget?.taxIncome?.residential || 0} icon="🏠" color="#7ED321" suffix="$" />
                        <MetricRow label="Impôts Commerciaux" value={budget?.taxIncome?.commercial || 0} icon="🏢" color="#4A90E2" suffix="$" />
                        <MetricRow label="Impôts Industriels" value={budget?.taxIncome?.industrial || 0} icon="🏭" color="#F5A623" suffix="$" />
                        <div className="mt-1 pb-1 mb-2 border-b border-black/10"></div>
                        <MetricRow label="Commerce (Marchés)" value={budget?.tradeIncome || 0} icon="📦" color="#BD10E0" suffix="$" />
                        <MetricRow label="Chiffre d'Affaires Export" value={budget?.exportIncome || 0} icon="🌍" color="#F5A623" suffix="$" />
                    </PanelSection>

                    <PanelSection title="Taux d'Imposition">
                        <TaxSlider label="Taxe Résidentielle" icon="🏠" value={taxRes} color="#7ED321" onChange={setTaxRes} />
                        <TaxSlider label="Taxe Commerciale" icon="🏢" value={taxCom} color="#4A90E2" onChange={setTaxCom} />
                        <TaxSlider label="Taxe Industrielle" icon="🏭" value={taxInd} color="#F5A623" onChange={setTaxInd} />
                        <div className="mt-2 text-[10px] italic text-center text-gray-400">
                            ⚠️ Des impôts trop élevés nuiront à l'attractivité et réduiront l'arrivée de RWA.
                        </div>
                    </PanelSection>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <PanelSection title="Maintenance des Infrastructures">
                        <ExpenseRow icon="⚡" label="Centrales Électriques" value={maintDetail['POWER'] || 0} toggled={toggles['POWER']} onToggle={() => toggleService('POWER')} />
                        <ExpenseRow icon="💧" label="Pompes & Aquifères" value={maintDetail['WATER'] || 0} toggled={toggles['WATER']} onToggle={() => toggleService('WATER')} />
                        <ExpenseRow icon="🚓" label="Services Civiques" value={maintDetail['CIVIC'] || 0} toggled={toggles['CIVIC']} onToggle={() => toggleService('CIVIC')} />
                        <ExpenseRow icon="⛏️" label="Extractions (Mines/Puits)" value={maintDetail['EXTRACTION'] || 0} toggled={toggles['EXTRACTION']} onToggle={() => toggleService('EXTRACTION')} />
                        <ExpenseRow icon="🍞" label="Approvisionnement (Pêche..)" value={maintDetail['FOOD'] || 0} toggled={toggles['FOOD']} onToggle={() => toggleService('FOOD')} />

                        <div className="mt-3 pt-3 border-t-2 border-dotted border-black/10">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-extrabold uppercase" style={{ color: '#555' }}>Dépenses Totales</span>
                                <span className="text-[16px] font-bold font-mono" style={{ color: '#D0021B' }}>
                                    -${formatNumber(budget?.maintenance || 0)}/h
                                </span>
                            </div>
                        </div>
                    </PanelSection>

                    <div className="mt-3 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-2 items-start">
                        <span className="text-sm">💡</span>
                        <div className="text-[10px] text-yellow-800 leading-tight">
                            <strong>Note du Maire :</strong> Vous pouvez désactiver globalement l'alimentation des services via ces interrupteurs pour réduire drastiquement vos coûts, au prix d'une chute massive de bonheur due aux coupures.
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'finance' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <PanelSection title="Macro-Économie & Emploi">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="text-center py-2 rounded-xl bg-blue-50">
                                <div className="text-[9px] uppercase font-bold text-blue-500">Actifs</div>
                                <div className="text-[14px] font-bold font-mono text-gray-800">{formatNumber(workers)}</div>
                            </div>
                            <div className="text-center py-2 rounded-xl bg-green-50">
                                <div className="text-[9px] uppercase font-bold text-green-500">Postes</div>
                                <div className="text-[14px] font-bold font-mono text-gray-800">{formatNumber(jobs)}</div>
                            </div>
                            <div className="text-center py-2 rounded-xl" style={{ background: unemployed > 0 ? 'rgba(208,2,27,0.08)' : 'rgba(126,211,33,0.08)' }}>
                                <div className="text-[9px] uppercase font-bold" style={{ color: unemployed > 0 ? '#D0021B' : '#7ED321' }}>Chômeurs</div>
                                <div className="text-[14px] font-bold font-mono" style={{ color: unemployed > 0 ? '#D0021B' : '#2C2C2C' }}>{formatNumber(unemployed)}</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                            <span className="text-[11px] font-semibold text-gray-600">Taux de Chômage</span>
                            <span className="text-[13px] font-bold font-mono" style={{ color: rate > 15 ? '#D0021B' : rate > 5 ? '#F5A623' : '#7ED321' }}>
                                {rate}%
                            </span>
                        </div>
                    </PanelSection>

                    <PanelSection title="Marché Obligataire Web3 (RWA)">
                        <div className="text-[11px] text-gray-600 mb-3 leading-snug">
                            Émettez des obligations municipales (Bonds) garanties par les actifs RWA pour lever des fonds on-chain de manière instantanée.
                        </div>
                        <div className="flex gap-2 mb-2">
                            <LoanCard name="Bond Série A" amount={25000} interest={5} />
                            <LoanCard name="Bond Série B" amount={50000} interest={7} />
                            <LoanCard name="Bond Série C" amount={100000} interest={10} />
                        </div>
                        <div className="mt-1 text-[10px] text-center italic text-gray-400">
                            Remboursement Smart-Contract déduit automatiquement (mensuel).
                        </div>
                    </PanelSection>
                </div>
            )}

        </ServicePanel>
    );
};
