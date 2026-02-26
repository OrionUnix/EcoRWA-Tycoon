'use client';
import React from 'react';
import { BuildingType, ZoneType, RoadType } from '../../engine/types';
import { DataLayersPanel } from './DataLayersPanel';
import { MainBtn } from './toolbar/MainBtn';
import { SubMenu } from './toolbar/SubMenu';
import { SC_COLORS, TOOLBAR_CATEGORIES, useToolbarState } from '../../hooks/useToolbarState';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MainToolbarProps {
    activeCategory: string | null;
    setActiveCategory: (cat: string | null) => void;
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (t: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (t: ZoneType) => void;
    setSelectedBuildingType: (t: BuildingType) => void;
    activeDataLayer: string | null;
    setActiveDataLayer: (layer: string | null) => void;
    onOpenRWA?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MainToolbar: React.FC<MainToolbarProps> = ({
    activeCategory, setActiveCategory,
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    setSelectedBuildingType,
    activeDataLayer, setActiveDataLayer,
    onOpenRWA,
}) => {
    const { toggle } = useToolbarState(activeCategory, setActiveCategory);

    return (
        <>
            {/* CSS keyframe for sub-menu animation */}
            <style>{`
                @keyframes ribbonIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)  scale(1); }
                }
            `}</style>

            <div
                className="fixed z-50 pointer-events-auto"
                style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Inter','Segoe UI',sans-serif" }}
            >
                {/* Barre principale */}
                <div
                    className="flex items-center h-[64px] px-4 gap-3 rounded-2xl"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.8) inset',
                        border: '1px solid rgba(255,255,255,0.6)',
                    }}
                >
                    {TOOLBAR_CATEGORIES.map(cat => (
                        <div key={cat.id} className="relative z-50 flex items-center justify-center">
                            {/* Sub-menu or Data Layers Panel */}
                            {activeCategory === cat.id && cat.id !== 'DATA' && (
                                <SubMenu
                                    category={cat.id}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    selectedRoadType={selectedRoadType}
                                    setSelectedRoadType={setSelectedRoadType}
                                    selectedZoneType={selectedZoneType}
                                    setSelectedZoneType={setSelectedZoneType}
                                    setSelectedBuildingType={setSelectedBuildingType}
                                    onClose={() => setActiveCategory(null)}
                                    onOpenRWA={onOpenRWA}
                                />
                            )}
                            {activeCategory === cat.id && cat.id === 'DATA' && (
                                <DataLayersPanel
                                    activeLayer={activeDataLayer}
                                    onSelectLayer={setActiveDataLayer}
                                    onSetViewMode={setViewMode}
                                    onClose={() => { setActiveCategory(null); setViewMode('ALL'); setActiveDataLayer(null); }}
                                />
                            )}

                            <MainBtn
                                id={cat.id}
                                icon={cat.icon}
                                label={cat.label}
                                color={cat.color}
                                active={activeCategory === cat.id}
                                onClick={() => toggle(cat.id)}
                            />
                        </div>
                    ))}

                    {/* Séparateur */}
                    <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,0.1)' }} />

                    {/* Bulldozer */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="BULLDOZER" icon="🚜" label="Raser"
                            color={SC_COLORS.BULLDOZER}
                            active={viewMode === 'BULLDOZER'}
                            onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                        />
                    </div>

                    {/* Settings */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="SETTINGS" icon="⚙️" label="Options"
                            color={SC_COLORS.SETTINGS}
                            active={activeCategory === 'SETTINGS'}
                            onClick={() => toggle('SETTINGS')}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};