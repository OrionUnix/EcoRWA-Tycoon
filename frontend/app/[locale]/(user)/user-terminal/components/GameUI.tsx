import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { RoadType, ZoneType, BuildingType, PlayerResources, CityStats, ResourceSummary, BuildingCategory, BUILDING_SPECS } from '../engine/types';
import {
    ROADS, LAYERS, formatNumber,
    ResourceItem, ToolButton, ResourceCard, GameTooltip, NeedsDisplay
} from './ui/GameWidgets';
import { BuildingInspector } from './ui/BuildingInspector';
import { getGameEngine } from '../engine/GameEngine';

// ✅ SIMCITY 2013 UI COMPONENTS
import { CityInfoBar } from './ui/CityInfoBar';
import { MainToolbar } from './ui/MainToolbar';
import { ActiveToolHUD } from './ui/ActiveToolHUD';
import { RWAInventory } from './ui/RWAInventory';
// ✅ SERVICE PANELS
import { BudgetPanel } from './ui/BudgetPanel';
import { WaterPanel } from './ui/WaterPanel';
import { PowerPanel } from './ui/PowerPanel';
import { FirePanel } from './ui/FirePanel';
import { JobsPanel } from './ui/JobsPanel';
import { DataLayersPanel } from './ui/DataLayersPanel';
import { GameOnboarding } from './ui/GameOnboarding';
import { BobAlertBox } from './ui/BobAlertBox';

interface GameUIProps {
    t: any;
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (type: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (type: ZoneType) => void;
    selectedBuildingType: BuildingType;
    setSelectedBuildingType: (type: BuildingType) => void;
    selectedBuildingId: number | null;
    setSelectedBuildingId: (id: number | null) => void;
    totalCost: number;
    isValidBuild: boolean;
    fps: number;
    cursorPos: { x: number, y: number };
    hoverInfo: any;
    resources: PlayerResources | null;
    stats: CityStats | null;
    summary: ResourceSummary | null;
    onRegenerate: () => void;
    speed: number;
    paused: boolean;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
    onOpenRWA?: () => void;
}

export default function GameUI({
    t,
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    selectedBuildingType, setSelectedBuildingType,
    selectedBuildingId, setSelectedBuildingId,
    totalCost, isValidBuild,
    fps, cursorPos, hoverInfo,
    resources, stats, summary,
    onRegenerate,
    speed, paused, onSetSpeed, onTogglePause,
    onOpenRWA
}: GameUIProps) {
    const { isConnected } = useAccount();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeToolInfo, setActiveToolInfo] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [activeDataLayer, setActiveDataLayer] = useState<string | null>(null);
    const engine = getGameEngine();

    // Onboarding s'affiche si le joueur n'a pas encore reçu sa subvention de départ (par ex < 10k)
    // En production on vérifierait un flag `hasCompletedOnboarding`
    const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
        return engine.map.resources.money < 10000;
    });

    // Cancel active tool
    const cancelTool = () => setViewMode('NAVIGATE');

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

            {/* ═══════════════════════════════════════ */}
            {/* BUILDING INSPECTOR (Overlay) */}
            {/* ═══════════════════════════════════════ */}
            {selectedBuildingId !== null && engine.map.buildingLayer[selectedBuildingId] && (
                <div className="pointer-events-auto">
                    <BuildingInspector
                        engine={engine.map}
                        building={engine.map.buildingLayer[selectedBuildingId]!}
                        index={selectedBuildingId}
                        stats={stats}
                        onClose={() => setSelectedBuildingId(null)}
                        onUpgrade={() => {
                            setSelectedBuildingId(null);
                            setTimeout(() => setSelectedBuildingId(selectedBuildingId), 0);
                        }}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════ */}

            {/* ═══════════════════════════════════════ */}
            {/* ONBOARDING (Starter RWA) */}
            {/* ═══════════════════════════════════════ */}
            {/* TODO: Lier l'affichage de l'onboarding au profil on-chain si connecté. */}
            {isConnected && typeof (window as any) !== 'undefined' && !(window as any).localStorage.getItem('onboarding_done') && (
                <GameOnboarding
                    onComplete={() => {
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem('onboarding_done', 'true');
                            setViewMode(viewMode);
                        }
                    }}
                    onClose={() => {
                        if (typeof window !== 'undefined') {
                            // On met "onboarding_done" à true pour ne plus l'afficher, 
                            // ou tu peux gérer ça différemment si 'fermer' = 'remettre à plus tard'
                            window.localStorage.setItem('onboarding_done', 'true');
                            setViewMode(viewMode);
                        }
                    }}
                />
            )}
            {/* ═══════════════════════════════════════ */}
            {/* SERVICE PANELS (Modal Overlays) */}
            {/* ═══════════════════════════════════════ */}
            {activePanel === 'BUDGET' && <BudgetPanel stats={stats} resources={resources} onClose={() => setActivePanel(null)} />}
            {activePanel === 'WATER' && <WaterPanel stats={stats} onClose={() => setActivePanel(null)} />}
            {activePanel === 'POWER' && <PowerPanel stats={stats} onClose={() => setActivePanel(null)} />}
            {activePanel === 'FIRE' && <FirePanel stats={stats} onClose={() => setActivePanel(null)} />}
            {activePanel === 'JOBS' && <JobsPanel stats={stats} onClose={() => setActivePanel(null)} />}

            {/* Resources now displayed in CityInfoBar bottom strip */}

            {/* ═══════════════════════════════════════ */}
            {/* TOP-RIGHT: Misc Controls */}
            {/* ═══════════════════════════════════════ */}
            <div className="fixed top-4 right-4 pointer-events-auto z-50 flex gap-2 items-center mt-12">
                <button onClick={onRegenerate} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(208,2,27,0.15)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.3)' }}>
                    RESET
                </button>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* COST PREVIEW (Floating pill) */}
            {/* ═══════════════════════════════════════ */}
            {totalCost > 0 && (
                <div className="absolute bottom-36 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                    <div
                        className="px-6 py-3 rounded-full text-sm font-bold animate-bounce"
                        style={{
                            background: isValidBuild ? 'rgba(255,255,255,0.95)' : 'rgba(208,2,27,0.9)',
                            color: isValidBuild ? '#2C2C2C' : 'white',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {isValidBuild ? `Coût prévu : $${totalCost}` : "FONDS INSUFFISANTS"}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* TOOLTIP */}
            {/* ═══════════════════════════════════════ */}
            <GameTooltip hoverInfo={hoverInfo} cursorPos={cursorPos} />

            {/* ═══════════════════════════════════════ */}
            {/* ACTIVE TOOL HUD (Bottom-Left, above InfoBar) */}
            {/* ═══════════════════════════════════════ */}
            <ActiveToolHUD
                viewMode={viewMode}
                selectedRoadType={selectedRoadType}
                selectedZoneType={selectedZoneType}
                selectedBuildingType={selectedBuildingType}
                onCancel={cancelTool}
            />

            {/* ═══════════════════════════════════════ */}
            {/* CITY INFO BAR (Bottom-Left, always visible) */}
            {/* ═══════════════════════════════════════ */}
            <CityInfoBar
                fps={fps}
                speed={speed}
                paused={paused}
                onTogglePause={onTogglePause}
                onSetSpeed={onSetSpeed}
                stats={stats}
                resources={resources}
                onOpenPanel={setActivePanel}
            />

            {/* ═══════════════════════════════════════ */}
            {/* DATA LAYERS PANEL MAITENANT RENDU DANS MAINTOOLBAR */}
            {/* ═══════════════════════════════════════ */}



            {/* ═══════════════════════════════════════ */}
            {/* MAIN TOOLBAR (Bottom-Center) */}
            {/* ═══════════════════════════════════════ */}
            <MainToolbar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedRoadType={selectedRoadType}
                setSelectedRoadType={setSelectedRoadType}
                selectedZoneType={selectedZoneType}
                setSelectedZoneType={setSelectedZoneType}
                setSelectedBuildingType={setSelectedBuildingType}
                activeDataLayer={activeDataLayer}
                setActiveDataLayer={setActiveDataLayer}
                onOpenRWA={onOpenRWA}
            />
            <RWAInventory />
        </div>
    );
}