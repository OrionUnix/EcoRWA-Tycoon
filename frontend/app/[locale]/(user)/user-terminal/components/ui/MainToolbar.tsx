import React from 'react';
import { GlassPanel } from './GlassPanel';
import { BuildingCategory } from '../../engine/types';

// ═══════════════════════════════════════
// SimCity 2013 — MAIN TOOLBAR (Compact)
// Small icon circles (40px) | Centered above InfoBar
// Minimal spacing | Glass pill shape
// ═══════════════════════════════════════

const SC_COLORS = {
    roads: '#4A90E2',
    residential: '#7ED321',
    commercial: '#4A90E2',
    industrial: '#F5A623',
    utilities: '#50E3C2',
    power: '#F8E71C',
    sewage: '#BD10E0',
    bulldozer: '#D0021B',
    dataMaps: '#4A4A4A',
    government: '#9B9B9B',
    rwa: '#BD10E0',
    transport: '#F5A623',
    specialization: '#7B61FF',
    settings: '#9B9B9B',
    services: '#50E3C2',
};

interface MainToolbarProps {
    activeCategory: string | null;
    setActiveCategory: (category: string | null) => void;
    viewMode: string;
    setViewMode: (mode: any) => void;
}

// Compact SimCity 2013 icon (40px circle, no label by default)
function ToolIcon({ active, onClick, icon, label, color }: {
    active: boolean; onClick: () => void; icon: string; label: string; color: string;
}) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className="flex items-center justify-center transition-all duration-150 hover:scale-110"
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: active
                        ? `linear-gradient(145deg, ${color}, ${color}CC)`
                        : `linear-gradient(145deg, ${color}BB, ${color}77)`,
                    boxShadow: active
                        ? `0 3px 12px ${color}60, 0 0 0 2px white, 0 0 0 4px ${color}60`
                        : `0 2px 6px rgba(0,0,0,0.15)`,
                    color: 'white',
                    fontSize: '18px',
                    transform: active ? 'translateY(-4px)' : 'translateY(0)',
                }}
            >
                {icon}
            </button>
            {/* Tooltip label on hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                    style={{ background: 'rgba(0,0,0,0.75)', color: 'white' }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

export const MainToolbar: React.FC<MainToolbarProps> = ({ activeCategory, setActiveCategory, viewMode, setViewMode }) => {
    const toggle = (cat: string) => setActiveCategory(activeCategory === cat ? null : cat);

    const categories = [
        { id: 'ROADS', icon: '🛣️', label: 'Routes', color: SC_COLORS.roads },
        { id: 'ZONES', icon: '🏘️', label: 'Zones', color: SC_COLORS.residential },
        { id: BuildingCategory.SERVICES, icon: '🏛️', label: 'Services', color: SC_COLORS.services },
        { id: BuildingCategory.UTILITIES, icon: '⚡', label: 'Énergie', color: SC_COLORS.utilities },
        { id: BuildingCategory.EXTRACTION, icon: '⛏️', label: 'Industrie', color: SC_COLORS.industrial },
        { id: BuildingCategory.LEISURE, icon: '🎡', label: 'Loisirs', color: SC_COLORS.specialization },
        { id: 'RWA', icon: '🌍', label: 'RWA', color: SC_COLORS.rwa },
        { id: 'DATA', icon: '📊', label: 'Données', color: SC_COLORS.dataMaps },
    ];

    return (
        <div
            className="fixed z-50 pointer-events-auto"
            style={{
                bottom: '48px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
        >
            <GlassPanel variant="toolbar" className="px-4 flex items-center">
                <div className="flex items-center h-[64px]" style={{ gap: '12px' }}>

                    {/* Main Categories */}
                    {categories.map(cat => (
                        <ToolIcon
                            key={cat.id}
                            active={activeCategory === cat.id}
                            onClick={() => toggle(cat.id)}
                            icon={cat.icon}
                            label={cat.label}
                            color={cat.color}
                        />
                    ))}

                    {/* Separator */}
                    <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />

                    {/* Bulldozer */}
                    <ToolIcon
                        active={viewMode === 'BULLDOZER'}
                        onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                        icon="🚜"
                        label="Raser"
                        color={SC_COLORS.bulldozer}
                    />

                    {/* Settings */}
                    <ToolIcon
                        active={activeCategory === 'SETTINGS'}
                        onClick={() => toggle('SETTINGS')}
                        icon="⚙️"
                        label="Options"
                        color={SC_COLORS.settings}
                    />
                </div>
            </GlassPanel>
        </div>
    );
};
