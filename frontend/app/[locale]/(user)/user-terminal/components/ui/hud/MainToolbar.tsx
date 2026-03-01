'use client';
import React from 'react';
import { BuildingType, ZoneType, RoadType } from '../../../engine/types';
import { DataLayersPanel } from '../Panel/DataLayersPanel';
import { MainBtn } from './MainBtn';
import { SubMenu } from './SubMenu';
import { SC_COLORS, TOOLBAR_CATEGORIES, useToolbarState } from '../../../hooks/useToolbarState';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('toolbar'); // ✅ Use toolbar namespace

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
                {/* Barre principale : Modern Borderless */}
                <div
                    className="flex items-center h-[72px] px-6 gap-4 bg-transparent"
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
                                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2">
                                    <DataLayersPanel
                                        activeLayer={activeDataLayer}
                                        onSelectLayer={setActiveDataLayer}
                                        onSetViewMode={setViewMode}
                                        onClose={() => { setActiveCategory(null); setViewMode('ALL'); setActiveDataLayer(null); }}
                                    />
                                </div>
                            )}

                            <MainBtn
                                id={cat.id}
                                icon={cat.icon}
                                label={t(`categories.${cat.id.toLowerCase()}` as any)} // ✅ Correct key
                                color={cat.color}
                                active={activeCategory === cat.id}
                                onClick={() => toggle(cat.id)}
                            />
                        </div>
                    ))}

                    {/* Bulldozer */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="BULLDOZER" icon={GAME_ICONS.stone} label={t('categories.bulldozer')}
                            color={SC_COLORS.BULLDOZER}
                            active={viewMode === 'BULLDOZER'}
                            onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                        />
                    </div>

                    {/* Settings */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="SETTINGS" icon={GAME_ICONS.administration} label={t('categories.settings')}
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
