import React from 'react';
import { ServicePanel, MetricRow, PanelSection, PanelAlert } from '../Panel/ServicePanel';
import { CityStats } from '../../../engine/types';
import { formatNumber } from '../widgets/helpers';

// ═══════════════════════════════════════
// SimCity 2013 — JOBS / UNEMPLOYMENT PANEL
// ═══════════════════════════════════════

interface JobsPanelProps {
    stats: CityStats | null;
    onClose: () => void;
}

export const JobsPanel: React.FC<JobsPanelProps> = ({ stats, onClose }) => {
    const workers = stats?.workers || 0;
    const jobs = stats?.jobs || 0;
    const unemployed = stats?.unemployed || 0;
    const jobsCom = stats?.jobsCommercial || 0;
    const jobsInd = stats?.jobsIndustrial || 0;
    const rate = workers > 0 ? Math.round((unemployed / workers) * 100) : 0;

    return (
        <ServicePanel title="Emploi & Main-d'Œuvre" icon="💼" color="#4A90E2" onClose={onClose}>

            {/* Summary */}
            <PanelSection title="Vue d'Ensemble">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center py-2 px-1 rounded-xl" style={{ background: 'rgba(74,144,226,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#4A90E2' }}>Actifs</div>
                        <div className="text-[15px] font-bold font-mono" style={{ color: '#2C2C2C' }}>{formatNumber(workers)}</div>
                    </div>
                    <div className="text-center py-2 px-1 rounded-xl" style={{ background: 'rgba(126,211,33,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#7ED321' }}>Postes</div>
                        <div className="text-[15px] font-bold font-mono" style={{ color: '#2C2C2C' }}>{formatNumber(jobs)}</div>
                    </div>
                    <div className="text-center py-2 px-1 rounded-xl" style={{ background: unemployed > 0 ? 'rgba(208,2,27,0.08)' : 'rgba(126,211,33,0.08)' }}>
                        <div className="text-[9px] uppercase font-bold" style={{ color: unemployed > 0 ? '#D0021B' : '#7ED321' }}>Chômeurs</div>
                        <div className="text-[15px] font-bold font-mono" style={{ color: unemployed > 0 ? '#D0021B' : '#2C2C2C' }}>{formatNumber(unemployed)}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#666' }}>Taux de Chômage</span>
                    <span className="text-[14px] font-bold font-mono" style={{ color: rate > 15 ? '#D0021B' : rate > 5 ? '#F5A623' : '#7ED321' }}>
                        {rate}%
                    </span>
                </div>
            </PanelSection>

            {/* By Sector */}
            <PanelSection title="Par Secteur">
                <MetricRow label="Commercial" value={jobsCom} max={jobs || 1} icon="🏢" color="#4A90E2" suffix=" postes" />
                <MetricRow label="Industriel" value={jobsInd} max={jobs || 1} icon="🏭" color="#F5A623" suffix=" postes" />
            </PanelSection>

            {/* Alerts */}
            {rate > 15 && <PanelAlert type="danger" message="Chômage élevé ! Construisez des zones commerciales ou industrielles." />}
            {rate > 5 && rate <= 15 && <PanelAlert type="warning" message="Chômage modéré. Diversifiez l'économie." />}
            {rate <= 5 && workers > 0 && <PanelAlert type="ok" message="Plein emploi ! L'économie est florissante." />}
            {workers === 0 && <PanelAlert type="warning" message="Aucun habitant. Créez des zones résidentielles." />}

        </ServicePanel>
    );
};
