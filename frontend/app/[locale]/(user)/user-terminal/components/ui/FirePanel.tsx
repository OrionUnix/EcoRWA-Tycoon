import React from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert, CoverageButton } from './ServicePanel';
import { CityStats } from '../../engine/types';

// ═══════════════════════════════════════
// SimCity 2013 — FIRE DEPARTMENT PANEL (Enhanced)
// ═══════════════════════════════════════

interface FirePanelProps {
    stats: CityStats | null;
    onClose: () => void;
}

export const FirePanel: React.FC<FirePanelProps> = ({ stats, onClose }) => {
    const population = stats?.population || 0;
    const stationsNeeded = Math.max(1, Math.ceil(population / 2000));

    return (
        <ServicePanel title="Caserne de Pompiers" icon="🚒" color="#D0021B" onClose={onClose}>

            <PanelSection title="Couverture">
                <MetricRow label="Population Couverte" value={population} icon="👥" color="#4A90E2" />
                <MetricRow label="Casernes Recommandées" value={stationsNeeded} icon="🚒" color="#D0021B" />
            </PanelSection>

            <PanelSection title="Véhicules">
                <MetricRow label="Camions Disponibles" value={0} icon="🚒" color="#D0021B" />
                <MetricRow label="Bâtiments en Feu" value={0} icon="🔥" color="#F5A623" />
            </PanelSection>

            <PanelSection title="Temps de Réponse">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Temps Moyen</span>
                    <span className="text-[13px] font-bold" style={{ color: '#F5A623' }}>~3 min</span>
                </div>
            </PanelSection>

            <PanelAlert type="ok" message="Couverture incendie opérationnelle." />
            <CoverageButton label="Voir Couverture Incendie" />
        </ServicePanel>
    );
};
