import React from 'react';
import { RoadType, ZoneType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';

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
    t,
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    totalCost, isValidBuild,
    fps, cursorPos, hoverInfo,
    resources, stats, summary,
    onSpawnTraffic, onRegenerate
}: GameUIProps) {

    const formatNumber = (num: number | undefined) => Math.floor(num || 0).toLocaleString();
    const ROADS = [RoadType.DIRT, RoadType.ASPHALT, RoadType.AVENUE, RoadType.HIGHWAY];

    // ✅ LISTE DES CALQUES COMPLÈTE
    const LAYERS = [
        { id: 'ALL', label: 'Normal', icon: '🌍' },
        { id: 'GROUNDWATER', label: 'Ground Water', icon: '💧' }, // Nappes Phréatiques
        { id: 'WOOD', label: 'Forests', icon: '🌲' },
        { id: 'FOOD', label: 'Food (Fish/Game)', icon: '🍖' },
        { id: 'OIL', label: 'Oil', icon: '🛢️' },
        { id: 'COAL', label: 'Coal', icon: '⚫' },
        { id: 'IRON', label: 'Iron', icon: '🔩' }
    ];

    const isInspectMode = !['BUILD_ROAD', 'ZONE', 'BULLDOZER'].includes(viewMode);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">

            {/* --- TOP BAR --- */}
            <div className="pointer-events-auto bg-gray-900/90 text-white p-2 flex justify-between items-center border-b border-gray-700 shadow-md backdrop-blur-sm">
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase font-bold">Money</span>
                        <span className={`text-lg font-mono font-bold ${(resources?.money || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${formatNumber(resources?.money)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase font-bold">Pop</span>
                        <span className="text-lg font-mono text-blue-300">{formatNumber(stats?.population)}</span>
                    </div>
                </div>

                <div className="flex gap-4 text-sm">
                    <ResourceItem label="Wood" value={resources?.wood} color="text-amber-600" />
                    <ResourceItem label="Steel" value={resources?.steel} color="text-blue-400" />
                    <ResourceItem label="Elec" value={resources?.energy} color="text-yellow-300" />
                    <ResourceItem label="Water" value={resources?.water} color="text-cyan-300" />
                </div>

                <div className="flex gap-2 text-xs text-gray-500">
                    <div>FPS: {fps}</div>
                    <button onClick={onRegenerate} className="bg-red-700 hover:bg-red-600 text-white px-2 rounded">Reset Map</button>
                    <button onClick={onSpawnTraffic} className="bg-purple-700 hover:bg-purple-600 text-white px-2 rounded">Traffic</button>
                </div>
            </div>

            {/* --- TOOLTIP AMÉLIORÉ (LABELS) --- */}
            {hoverInfo && (
                <div className="absolute top-16 left-4 bg-gray-900/95 text-white p-3 rounded border border-gray-500 shadow-xl w-56 text-sm pointer-events-auto z-50">
                    <h3 className="font-bold text-gray-300 border-b border-gray-600 mb-2 pb-1 flex justify-between">
                        <span>Case ({cursorPos.x}, {cursorPos.y})</span>
                        <span className="text-blue-300">{hoverInfo.biome}</span>
                    </h3>

                    <div className="space-y-1">
                        {/* Eau Souterraine */}
                        {hoverInfo.moisture > 0 && (
                            <div className="flex justify-between text-cyan-300">
                                <span>💧 Nappe Phréatique:</span>
                                <span className="font-mono">{(hoverInfo.moisture * 100).toFixed(0)}%</span>
                            </div>
                        )}

                        {/* Ressources (Tonnes) */}
                        {hoverInfo.resources && Object.entries(hoverInfo.resources).map(([key, val]: any) => {
                            if (val <= 0) return null;
                            // On simule une valeur en tonnes basée sur l'intensité (0.0 - 1.0)
                            const tons = Math.floor(val * 1000);

                            let color = "text-gray-300";
                            if (key === 'oil') color = "text-yellow-400";
                            if (key === 'wood') color = "text-green-400";
                            if (key === 'coal') color = "text-gray-400";
                            if (key === 'animals' || key === 'fish') color = "text-pink-400";

                            return (
                                <div key={key} className={`flex justify-between ${color}`}>
                                    <span className="capitalize">{key}:</span>
                                    <span className="font-mono font-bold">{tons} t</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- BOTTOM AREA --- */}
            <div className="flex flex-col items-center pointer-events-auto">

                {/* BARRE CALQUES */}
                {isInspectMode && (
                    <div className="mb-2 bg-black/80 p-2 rounded-lg border border-gray-600 flex gap-2 backdrop-blur">
                        <span className="text-xs text-gray-400 font-bold uppercase self-center mr-2">Vues:</span>
                        {LAYERS.map(layer => (
                            <button
                                key={layer.id}
                                onClick={() => setViewMode(layer.id)}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-all ${viewMode === layer.id
                                        ? 'bg-blue-600 text-white shadow-lg scale-105 ring-1 ring-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                <span>{layer.icon}</span>
                                <span>{layer.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* BARRE D'OUTILS PRINCIPALE */}
                <div className="bg-gray-900/95 p-3 border-t border-gray-700 flex justify-center gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] w-full">
                    <div className="flex gap-2 border-r border-gray-700 pr-4">
                        <ToolButton active={isInspectMode} onClick={() => setViewMode('ALL')} label="Inspect" icon="🔍" />
                        <ToolButton active={viewMode === 'BULLDOZER'} onClick={() => setViewMode('BULLDOZER')} label="Bulldozer" icon="🚜" color="bg-red-900/50" />
                    </div>
                    <div className="flex gap-1 border-r border-gray-700 pr-4 items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Roads</span>
                        {ROADS.map(r => (
                            <ToolButton key={r} active={viewMode === 'BUILD_ROAD' && selectedRoadType === r} onClick={() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(r); }} label={r.toLowerCase()} icon="🛣️" />
                        ))}
                    </div>
                    <div className="flex gap-1 border-r border-gray-700 pr-4 items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Zones</span>
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); }} label="Res" icon="🏠" color="bg-green-900/50" />
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); }} label="Com" icon="🏢" color="bg-blue-900/50" />
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); }} label="Ind" icon="🏭" color="bg-yellow-900/50" />
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Services</span>
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.WIND_TURBINE} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.WIND_TURBINE); }} label="Wind" icon="🌬️" />
                        {/* Ajout pompe à eau */}
                        <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.WATER_PUMP} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.WATER_PUMP); }} label="Pump" icon="🚰" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResourceItem({ label, value, color }: { label: string, value: number | undefined, color: string }) {
    return (
        <div className="flex flex-col items-center min-w-[30px]">
            <span className="text-[10px] text-gray-500 uppercase">{label}</span>
            <span className={`font-mono font-bold ${color}`}>{value !== undefined ? Math.floor(value).toLocaleString() : '0'}</span>
        </div>
    );
}

function ToolButton({ active, onClick, label, icon, color }: any) {
    const baseClass = "flex flex-col items-center justify-center w-12 h-12 rounded transition-all border";
    const activeClass = active ? "border-white bg-gray-600 shadow-inner scale-95" : `border-gray-700 hover:bg-gray-700 ${color || 'bg-gray-800'}`;
    return (
        <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
            <span className="text-lg">{icon}</span>
            <span className="text-[8px] uppercase font-bold mt-[-2px]">{label.substring(0, 4)}</span>
        </button>
    );
}