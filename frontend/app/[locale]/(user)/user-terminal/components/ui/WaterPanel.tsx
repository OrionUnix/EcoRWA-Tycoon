import React from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert, CoverageButton } from './ServicePanel';
import { CityStats } from '../../engine/types';
import { formatNumber } from './GameWidgets';

// ═══════════════════════════════════════
// SimCity 2013 — WATER PANEL (Enhanced)
// ═══════════════════════════════════════

interface WaterPanelProps {
    stats: CityStats | null;
    onClose: () => void;
}

export const WaterPanel: React.FC<WaterPanelProps> = ({ stats, onClose }) => {
    const produced = stats?.water?.produced || 0;
    const consumed = stats?.water?.consumed || 0;
    const surplus = produced - consumed;
    const pct = produced > 0 ? Math.round((consumed / produced) * 100) : 0;

    return (
        <ServicePanel title="Réseau d'Eau" icon="💧" color="#50E3C2" onClose={onClose}>

            {/* Production & Consumption */}
            <PanelSection title="Production & Consommation">
                <MetricRow label="Production Totale" value={produced} icon="🚰" color="#50E3C2" suffix=" m³/hr" />
                <MetricRow label="Consommation" value={consumed} max={produced || 1} icon="🏠" color="#4A90E2" suffix=" m³/hr" />
                <div className="flex items-center justify-between py-2 px-3 rounded-xl mt-1"
                    style={{ background: surplus >= 0 ? 'rgba(80,227,194,0.1)' : 'rgba(208,2,27,0.1)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Surplus</span>
                    <span className="text-[14px] font-bold font-mono" style={{ color: surplus >= 0 ? '#50E3C2' : '#D0021B' }}>
                        {surplus >= 0 ? '+' : ''}{formatNumber(surplus)} m³/hr
                    </span>
                </div>
            </PanelSection>

            {/* Infrastructure */}
            <PanelSection title="Infrastructure">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Charge réseau</span>
                    <span className="text-[13px] font-bold" style={{ color: pct > 90 ? '#D0021B' : pct > 70 ? '#F5A623' : '#7ED321' }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct > 90 ? '#D0021B' : pct > 70 ? '#F5A623' : '#50E3C2' }} />
                </div>
            </PanelSection>

            {/* Pollution */}
            <PanelSection title="Qualité de l'Eau">
                <MetricRow label="Pollution" value={0} icon="☁️" color="#F5A623" suffix="%" />
                <div className="text-[10px] italic mt-1" style={{ color: '#bbb' }}>
                    Les zones industrielles proches polluent la nappe phréatique.
                </div>
            </PanelSection>

            {/* Alerts */}
            {surplus < 0 && <PanelAlert type="danger" message="Pénurie d'eau ! Construisez plus de stations de pompage." />}
            {surplus === 0 && produced === 0 && <PanelAlert type="warning" message="Aucune production d'eau. Placez une Station de Pompage." />}
            {surplus > 0 && <PanelAlert type="ok" message="Approvisionnement en eau suffisant." />}

            <CoverageButton label="Voir Couverture Eau" />
        </ServicePanel>
    );
};
