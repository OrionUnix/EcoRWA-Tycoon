import React from 'react';
import { RoadType, ZoneType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';
// Import des widgets depuis le fichier que tu m'as montré
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

    const isInspectMode = !['BUILD_ROAD', 'ZONE', 'BULLDOZER'].includes(viewMode);
    const s = summary || { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, stone: 0, silver: 0, gold: 0, fertile: 0 };

    return (
        // ✅ 1. CONTENEUR PRINCIPAL : justify-between pousse le contenu aux extrémités
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">

            {/* ======================= */}
            {/* HAUT : TOP BAR */}
            {/* ======================= */}
            <div className="pointer-events-auto bg-gray-900/90 text-white p-2 flex justify-between items-center border-b border-gray-700 shadow-md backdrop-blur-sm z-50">

                {/* Gauche */}
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase font-bold">Money</span>
                        <span className={`text-lg font-mono font-bold ${(resources?.money || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${formatNumber(resources?.money)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase font-bold">Pop</span>
                        <span className="text-lg font-mono text-blue-300">
                            {formatNumber(stats?.population)}
                        </span>
                    </div>
                </div>

                {/* Centre (Masqué sur mobile) */}
                <div className="flex gap-4 text-sm hidden md:flex">
                    <ResourceItem label="Wood" value={resources?.wood} color="text-amber-600" />
                    <ResourceItem label="Concrete" value={resources?.concrete} color="text-gray-400" />
                    <ResourceItem label="Steel" value={resources?.steel} color="text-blue-400" />
                    <div className="border-l border-gray-600 mx-1"></div>
                    <ResourceItem label="Elec" value={resources?.energy} color="text-yellow-300" />
                    <ResourceItem label="Water" value={resources?.water} color="text-cyan-300" />
                </div>

                {/* Droite */}
                <div className="flex gap-2 text-xs text-gray-500">
                    <div>FPS: {fps}</div>
                    <button onClick={onRegenerate} className="bg-red-700 hover:bg-red-600 text-white px-2 rounded">Reset</button>
                    <button onClick={onSpawnTraffic} className="bg-purple-700 hover:bg-purple-600 text-white px-2 rounded">Traffic</button>
                </div>
            </div>

            {/* ======================= */}
            {/* MILIEU : SIDEBAR & TOOLTIPS */}
            {/* ======================= */}

            {/* 1. Sidebar Droite (Ressources Grid) */}
            <div className="fixed right-6 top-1/4 -translate-y-1/4 pointer-events-auto z-40">
                <div className="flex flex-row gap-0.5 p-6 ">
                    <ResourceCard icon="🛢️" value={s.oil} label="Pétrole" color="bg-yellow-500" description="Énergie fossile & Plastiques." />
                    <ResourceCard icon="⚫" value={s.coal} label="Charbon" color="bg-zinc-500" description="Énergie & Acier." />
                    <ResourceCard icon="🔩" value={s.iron} label="Fer" color="bg-orange-600" description="Matériau de base." />
                    <ResourceCard icon="🪨" value={s.stone} label="Pierre" color="bg-stone-500" description="Béton & Routes." />
                    <ResourceCard icon="🌲" value={s.wood} label="Bois" color="bg-emerald-600" description="Construction." />
                    <ResourceCard icon="💧" value={s.water} label="Eau" color="bg-blue-500" description="Eau potable." />
                    <ResourceCard icon="🥈" value={s.silver} label="Argent" color="bg-cyan-300" description="Tech." />
                    <ResourceCard icon="🥇" value={s.gold} label="Or" color="bg-amber-400" description="Richesse." />
                </div>
            </div>

            {/* 2. Coût Construction */}
            {totalCost > 0 && (
                <div className="self-center mt-4 bg-black/80 text-white px-4 py-2 rounded-full border border-white/20 backdrop-blur pointer-events-auto z-50">
                    <span className={isValidBuild ? 'text-white' : 'text-red-500 font-bold'}>
                        Coût: ${totalCost} {isValidBuild ? '' : '(Impossible)'}
                    </span>
                </div>
            )}

            {/* 3. Tooltip au survol */}
            <GameTooltip hoverInfo={hoverInfo} cursorPos={cursorPos} />

            {/* ======================= */}
            {/* BAS : TOOLBAR (Collé en bas grâce à justify-between) */}
            {/* ======================= */}
            <div className="flex flex-col items-center pointer-events-auto pb-0 w-full z-50">

                {/* Barre Secondaire : CALQUES (Inspect Mode) */}
                {isInspectMode && (
                    <div className="mb-2 bg-black/80 p-2 rounded-lg border border-gray-600 flex gap-2 backdrop-blur overflow-x-auto max-w-[90vw]">
                        <span className="text-xs text-gray-400 font-bold uppercase self-center mr-2">Vues:</span>
                        {LAYERS.map(layer => (
                            <button key={layer.id} onClick={() => setViewMode(layer.id)} className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-all whitespace-nowrap ${viewMode === layer.id ? 'bg-blue-600 text-white shadow-lg scale-105 ring-1 ring-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                <span>{layer.icon}</span><span>{layer.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Barre Principale : OUTILS */}
                <div className="bg-gray-900/95 p-3 border-t border-gray-700 flex justify-center gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] w-full overflow-x-auto">

                    {/* Général */}
                    <div className="flex gap-2 border-r border-gray-700 pr-4">
                        <ToolButton active={isInspectMode} onClick={() => setViewMode('ALL')} label="Inspect" icon="🔍" />
                        <ToolButton active={viewMode === 'BULLDOZER'} onClick={() => setViewMode('BULLDOZER')} label="Bulldozer" icon="🚜" color="bg-red-900/50" />
                    </div>

                    {/* Routes */}
                    <div className="flex gap-1 border-r border-gray-700 pr-4 items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase rotate-180 hidden md:block" style={{ writingMode: 'vertical-rl' }}>Roads</span>
                        {ROADS.map(r => (
                            <ToolButton key={r} active={viewMode === 'BUILD_ROAD' && selectedRoadType === r} onClick={() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(r); }} label={r.toLowerCase()} icon="🛣️" />
                        ))}
                    </div>

                    {/* Zones */}
                    <div className="flex gap-1 border-r border-gray-700 pr-4 items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase rotate-180 hidden md:block" style={{ writingMode: 'vertical-rl' }}>Zones</span>
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); }} label="Res" icon="🏠" color="bg-green-900/50" />
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); }} label="Com" icon="🏢" color="bg-blue-900/50" />
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); }} label="Ind" icon="🏭" color="bg-yellow-900/50" />
                    </div>

                    {/* Services */}
                    <div className="flex gap-1 items-center">
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.WIND_TURBINE} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.WIND_TURBINE); }} label="Wind" icon="🌬️" />
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.WATER_PUMP} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.WATER_PUMP); }} label="Pump" icon="🚰" />
                    </div>
                </div>
            </div>
        </div>
    );
}