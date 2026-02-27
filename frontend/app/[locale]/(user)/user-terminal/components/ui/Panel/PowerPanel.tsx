import React from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert, CoverageButton } from './ServicePanel';
import { CityStats } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';

// ═══════════════════════════════════════
// SimCity 2013 — POWER PANEL (Enhanced)
// ═══════════════════════════════════════

interface PowerPanelProps {
    stats: CityStats | null;
    onClose: () => void;
}

export const PowerPanel: React.FC<PowerPanelProps> = ({ stats, onClose }) => {
    const produced = stats?.energy?.produced || 0;
    const consumed = stats?.energy?.consumed || 0;
    const surplus = produced - consumed;
    const pct = produced > 0 ? Math.round((consumed / produced) * 100) : 0;

    return (
        <ServicePanel title="Réseau Électrique" icon="⚡" color="#F8E71C" onClose={onClose}>

            {/* Production & Consumption */}
            <PanelSection title="Production & Consommation">
                <MetricRow label="Production Totale" value={produced} icon="⚡" color="#F8E71C" suffix=" MW" />
                <MetricRow label="Consommation" value={consumed} max={produced || 1} icon="🏠" color="#F5A623" suffix=" MW" />
                <div className="flex items-center justify-between py-2 px-3 rounded-xl mt-1"
                    style={{ background: surplus >= 0 ? 'rgba(248,231,28,0.12)' : 'rgba(208,2,27,0.1)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Surplus</span>
                    <span className="text-[14px] font-bold font-mono" style={{ color: surplus >= 0 ? '#B8A800' : '#D0021B' }}>
                        {surplus >= 0 ? '+' : ''}{formatNumber(surplus)} MW
                    </span>
                </div>
            </PanelSection>

            {/* Grid Load */}
            <PanelSection title="Charge du Réseau">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Utilisation</span>
                    <span className="text-[13px] font-bold" style={{ color: pct > 90 ? '#D0021B' : pct > 70 ? '#F5A623' : '#7ED321' }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct > 90 ? '#D0021B' : pct > 70 ? '#F5A623' : '#F8E71C' }} />
                </div>
            </PanelSection>

            {/* Coverage */}
            <PanelSection title="Couverture">
                <div className="text-[10px] italic" style={{ color: '#999' }}>
                    Les bâtiments non connectés au réseau électrique ne fonctionnent pas.
                </div>
            </PanelSection>

            {surplus < 0 && <PanelAlert type="danger" message="Pénurie d'électricité ! Construisez une centrale." />}
            {surplus === 0 && produced === 0 && <PanelAlert type="warning" message="Aucune production d'énergie. Placez une Centrale." />}
            {surplus > 0 && <PanelAlert type="ok" message="Réseau électrique stable." />}

            <CoverageButton label="Voir Couverture Électrique" />
        </ServicePanel>
    );
};
