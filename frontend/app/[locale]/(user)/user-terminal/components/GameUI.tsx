import React, { useState } from 'react';
// ✅ AJOUT DE BuildingType DANS LES IMPORTS
import { RoadType, ZoneType, BuildingType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';
import {
    ROADS, LAYERS, formatNumber,
    ResourceItem, ToolButton, ResourceCard, GameTooltip
} from './ui/GameWidgets';

interface GameUIProps {
    t: (key: string) => string;
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (type: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (type: ZoneType) => void;
    totalCost: number;
    isValidBuild: boolean;
    fps: number;
    cursorPos: { x: number, y: number };
    hoverInfo: any;
    resources: PlayerResources | null;
    stats: CityStats | null;
    summary: ResourceSummary | null;
    onSpawnTraffic: () => void;
    onRegenerate: () => void;
}

export default function GameUI({
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    totalCost, isValidBuild,
    fps, cursorPos, hoverInfo,
    resources, stats, summary,
    onSpawnTraffic, onRegenerate
}: GameUIProps) {
    // État pour gérer la catégorie active (VIEWS, ROADS, ZONES, SERVICES)
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const isInspectMode = !['BUILD_ROAD', 'ZONE', 'BULLDOZER'].includes(viewMode);
    const s = summary || { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, stone: 0, silver: 0, gold: 0, fertile: 0 };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden font-sans">

            {/* ======================= */}
            {/* HAUT : TOP BAR */}
            {/* ======================= */}
            <div className="pointer-events-auto bg-gray-900/95 text-white p-2 flex justify-between items-center border-b border-white/10 shadow-lg backdrop-blur-md z-50">
                <div className="flex gap-8 items-center ml-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Budget</span>
                        <span className={`text-lg font-mono font-bold ${(resources?.money || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${formatNumber(resources?.money)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Population</span>
                        <span className="text-lg font-mono text-blue-300 font-bold">
                            {formatNumber(stats?.population)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4 text-sm hidden lg:flex">
                    <ResourceItem label="Wood" value={resources?.wood} color="text-amber-500" />
                    <ResourceItem label="Steel" value={resources?.steel} color="text-blue-400" />
                    <ResourceItem label="Energy" value={resources?.energy} color="text-yellow-400" />
                    <ResourceItem label="Water" value={resources?.water} color="text-cyan-400" />
                </div>

                <div className="flex gap-3 mr-4 items-center">
                    <div className="text-[10px] font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">FPS: {fps}</div>
                    <button onClick={onRegenerate} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-3 py-1 rounded-md text-xs font-bold transition-all">RESET</button>
                    <button onClick={onSpawnTraffic} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-bold shadow-lg transition-all">TRAFFIC</button>
                </div>
            </div>

            {/* ======================= */}
            {/* MILIEU : WIDGETS LATERAUX ET TOOLTIP */}
            {/* ======================= */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 pointer-events-auto z-40 flex flex-col gap-2 scale-90 origin-right">
                <ResourceCard icon="🛢️" value={s.oil} label="Oil" color="bg-yellow-600" />
                <ResourceCard icon="⚫" value={s.coal} label="Coal" color="bg-zinc-700" />
                <ResourceCard icon="🔩" value={s.iron} label="Iron" color="bg-orange-700" />
                <ResourceCard icon="🌲" value={s.wood} label="Wood" color="bg-emerald-700" />
                <ResourceCard icon="💧" value={s.water} label="Water" color="bg-blue-600" />
                <ResourceCard icon="🪙" value={s.gold} label="Gold" color="bg-blue-600" />
                <ResourceCard icon="🪙" value={s.silver} label="Silver" color="bg-blue-600" />
            </div>

            {totalCost > 0 && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-2 rounded-full border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto z-50 animate-bounce">
                    <span className={isValidBuild ? 'text-white font-bold' : 'text-red-500 font-black'}>
                        {isValidBuild ? `COÛT PRÉVU : $${totalCost}` : "FONDS INSUFFISANTS"}
                    </span>
                </div>
            )}

            <GameTooltip hoverInfo={hoverInfo} cursorPos={cursorPos} />

            {/* ======================= */}
            {/* BAS : TOOLBAR (SIMCITY STYLE) */}
            {/* ======================= */}
            <div className="flex flex-col items-center pointer-events-auto pb-8 w-full z-50">
                <div className="relative flex flex-col items-center">

                    {/* PANNEAU SECONDAIRE (Pop-up au dessus de la barre) */}
                    {activeCategory && (
                        <div className="absolute bottom-full mb-4 bg-gray-900/95 p-3 rounded-2xl border border-white/10 flex gap-2 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-x-auto max-w-[90vw] no-scrollbar">

                            {/* Choix des VUES (Layers) */}
                            {activeCategory === 'VIEWS' && LAYERS.map(layer => (
                                <button
                                    key={layer.id}
                                    onClick={() => setViewMode(layer.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border
                                     ${viewMode === layer.id ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                                >
                                    <span>{layer.icon}</span> <span>{layer.label}</span>
                                </button>
                            ))}

                            {/* Choix des ROUTES */}
                            {activeCategory === 'ROADS' && ROADS.map(r => (
                                <ToolButton
                                    key={r}
                                    active={viewMode === 'BUILD_ROAD' && selectedRoadType === r}
                                    onClick={() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(r); setActiveCategory(null); }}
                                    label={r.toLowerCase()}
                                    icon="🛣️"
                                />
                            ))}

                            {/* Choix des ZONES */}
                            {activeCategory === 'ZONES' && (
                                <>
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); setActiveCategory(null); }} label="Res" icon="🏠" color="bg-green-600/30" />
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); setActiveCategory(null); }} label="Com" icon="🏢" color="bg-blue-600/30" />
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); setActiveCategory(null); }} label="Ind" icon="🏭" color="bg-yellow-600/30" />
                                </>
                            )}

                            {/* Choix des SERVICES */}
                            {activeCategory === 'SERVICES' && (
                                <>
                                    {/* ✅ CORRECTION : Utilisation de BuildingType pour les bâtiments spécifiques */}
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.POWER_PLANT}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.POWER_PLANT}`);
                                            setActiveCategory(null);
                                        }}
                                        label="Power"
                                        icon="⚡"
                                    />

                                    {/* J'ai commenté la pompe car WATER_PUMP n'existe pas encore dans tes types */}
                                    {/* <ToolButton active={false} onClick={() => {}} label="Pump" icon="🚰" /> */}
                                </>
                            )}
                        </div>
                    )}

                    {/* BARRE PRINCIPALE (Catégories) */}
                    <div className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-3 shadow-2xl">

                        {/* Groupe Navigation / Destruction */}
                        <div className="flex gap-1">
                            <ToolButton
                                active={activeCategory === 'VIEWS'}
                                onClick={() => setActiveCategory(activeCategory === 'VIEWS' ? null : 'VIEWS')}
                                label="Vues" icon="🗺️" variant="circle"
                            />
                            <ToolButton
                                active={viewMode === 'BULLDOZER'}
                                onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                                label="Rasé" icon="🧨" color="bg-red-500/10" variant="circle"
                            />
                        </div>

                        <div className="w-[1px] h-8 bg-white/20" />

                        {/* Groupe Construction */}
                        <div className="flex gap-2">
                            <ToolButton
                                active={activeCategory === 'ROADS'}
                                onClick={() => setActiveCategory(activeCategory === 'ROADS' ? null : 'ROADS')}
                                label="Routes" icon="🛣️" variant="circle"
                            />
                            <ToolButton
                                active={activeCategory === 'ZONES'}
                                onClick={() => setActiveCategory(activeCategory === 'ZONES' ? null : 'ZONES')}
                                label="Zonage" icon="🏗️" variant="circle"
                            />
                            <ToolButton
                                active={activeCategory === 'SERVICES'}
                                onClick={() => setActiveCategory(activeCategory === 'SERVICES' ? null : 'SERVICES')}
                                label="Énergie" icon="⚡" variant="circle"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}