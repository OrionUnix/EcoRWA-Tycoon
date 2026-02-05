import React from 'react';
import { useLocale } from 'next-intl';
import { RoadType, ROAD_SPECS, ZoneType, PlayerResources, CityStats } from '../engine/types';

interface GameUIProps {
    t: any;
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
    summary: any;
    onSpawnTraffic: () => void;
    onRegenerate: () => void;
    stats: CityStats | null;
}

export default function GameUI({
    t, viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    totalCost, isValidBuild, fps, cursorPos, hoverInfo, resources, summary,
    onSpawnTraffic, onRegenerate,
    stats
}: GameUIProps) {

    const locale = useLocale();
    const formatNumber = (num: number) => new Intl.NumberFormat(locale).format(num);

    // --- CORRECTION : Valeurs par défaut si stats est null (Affichage 0) ---
    const currentStats = stats || {
        population: 0,
        jobsCommercial: 0,
        jobsIndustrial: 0,
        unemployed: 0,
        demand: { residential: 50, commercial: 0, industrial: 0 } // Demande par défaut
    };

    const ResourceBar = ({ label, value, color }: any) => (
        <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-16 text-gray-400 font-bold uppercase">{label}</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }}></div>
            </div>
            <span className="w-8 text-right text-white">{Math.round(value)}%</span>
        </div>
    );

    const RCIBar = ({ r, c, i }: { r: number, c: number, i: number }) => (
        <div className="flex gap-1 h-6 items-end bg-gray-900/50 p-1 rounded border border-gray-700 tooltip" title="Demande RCI">
            {/* R - Vert */}
            <div className="w-2 bg-green-500 transition-all duration-500 rounded-sm" style={{ height: `${Math.max(10, r)}%` }} title={`Résidentiel: ${Math.floor(r)}%`}></div>
            {/* C - Bleu */}
            <div className="w-2 bg-blue-500 transition-all duration-500 rounded-sm" style={{ height: `${Math.max(10, c)}%` }} title={`Commercial: ${Math.floor(c)}%`}></div>
            {/* I - Jaune */}
            <div className="w-2 bg-yellow-500 transition-all duration-500 rounded-sm" style={{ height: `${Math.max(10, i)}%` }} title={`Industriel: ${Math.floor(i)}%`}></div>
        </div>
    );

    return (
        <div className="absolute inset-0 pointer-events-none">

            {/* --- TOP BAR (HUD PRINCIPAL) --- */}
            <div className="absolute top-0 left-0 w-full h-14 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-4 z-50 shadow-xl pointer-events-auto">

                {/* 1. RESSOURCES (GAUCHE) */}
                <div className="flex gap-4 text-xs font-mono text-white items-center">
                    {resources && (
                        <>
                            <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded" title="Bois">
                                <span className="text-amber-600 text-lg">🪵</span>
                                <span>{Math.floor(resources.wood)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded" title="Béton">
                                <span className="text-gray-400 text-lg">🧱</span>
                                <span>{Math.floor(resources.concrete)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded" title="Verre">
                                <span className="text-blue-300 text-lg">🧊</span>
                                <span>{Math.floor(resources.glass)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded" title="Energie">
                                <span className="text-yellow-400 text-lg">⚡</span>
                                <span>{Math.floor(resources.energy)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* 2. POPULATION & RCI (DROITE - Toujours visible maintenant) */}
                <div className="flex items-center gap-4">
                    {/* RCI Bar */}
                    <div className="flex flex-col items-center mr-2">
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider mb-0.5">DEMANDE</span>
                        <RCIBar r={currentStats.demand.residential} c={currentStats.demand.commercial} i={currentStats.demand.industrial} />
                    </div>

                    {/* Population Stats */}
                    <div className="flex gap-4 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-600">
                        {/* Habitants */}
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Population</span>
                            <span className="text-base font-bold text-white leading-none">👥 {formatNumber(currentStats.population)}</span>
                        </div>

                        {/* Jobs */}
                        <div className="flex flex-col items-end border-l border-gray-600 pl-3">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Emplois</span>
                            <div className="flex gap-2 text-xs font-bold leading-none">
                                <span className="text-blue-400" title="Bureaux">🏢 {formatNumber(currentStats.jobsCommercial)}</span>
                                <span className="text-yellow-500" title="Usines">🏭 {formatNumber(currentStats.jobsIndustrial)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FPS & COORDS (Bas Droite) --- */}
            <div className="absolute bottom-4 right-24 text-[10px] text-green-500 font-mono z-20 flex flex-col items-end opacity-70">
                <span>FPS: {fps}</span>
                <span className="text-yellow-400">XY: {cursorPos.x}, {cursorPos.y}</span>
            </div>

            {/* --- COUT CONSTRUCTION (Curseur) --- */}
            {(viewMode === 'BUILD_ROAD' || viewMode === 'ZONE') && totalCost > 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-in fade-in zoom-in duration-200 pointer-events-none">
                    <div className={`px-4 py-2 rounded-full font-bold text-white shadow-xl backdrop-blur-md border border-white/20 ${isValidBuild ? 'bg-green-600/90' : 'bg-red-600/90'}`}>
                        {isValidBuild ? `Coût: $${totalCost}` : "Construction Impossible"}
                    </div>
                </div>
            )}

            {/* --- BARRE D'OUTILS (GAUCHE) --- */}
            <div className="absolute top-20 left-4 z-10 flex flex-col gap-2 bg-gray-900/95 p-3 rounded-lg border border-gray-700 shadow-2xl backdrop-blur-md pointer-events-auto max-h-[80vh] overflow-y-auto w-44">

                {/* Section Routes */}
                <div>
                    <button onClick={() => setViewMode('BUILD_ROAD')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded mb-1 border transition-colors ${viewMode === 'BUILD_ROAD' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}>
                        🚧 ROUTES
                    </button>
                    {viewMode === 'BUILD_ROAD' && (
                        <div className="flex flex-col gap-1 ml-2 pl-2 border-l-2 border-gray-700">
                            {(Object.keys(ROAD_SPECS) as RoadType[]).map((type) => (
                                <button key={type} onClick={() => setSelectedRoadType(type)} className={`w-full text-left px-2 py-1 text-[10px] font-bold rounded border flex items-center justify-between transition-all ${selectedRoadType === type ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-700'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${ROAD_SPECS[type].color.toString(16).padStart(6, '0')}` }}></div>
                                        <span>{ROAD_SPECS[type].label}</span>
                                    </div>
                                    <span>${ROAD_SPECS[type].cost}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Zonage */}
                <div>
                    <button onClick={() => setViewMode('ZONE')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded mb-1 border transition-colors ${viewMode === 'ZONE' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}>
                        🏙️ ZONAGE
                    </button>
                    {viewMode === 'ZONE' && (
                        <div className="flex flex-col gap-1 ml-2 pl-2 border-l-2 border-gray-700">
                            <button onClick={() => setSelectedZoneType(ZoneType.RESIDENTIAL)} className={`w-full text-left px-2 py-1 text-[10px] font-bold rounded border transition-all ${selectedZoneType === ZoneType.RESIDENTIAL ? 'bg-green-600 text-white border-green-400' : 'text-gray-400 border-transparent hover:bg-gray-700'}`}>🟩 RÉSIDENTIEL</button>
                            <button onClick={() => setSelectedZoneType(ZoneType.COMMERCIAL)} className={`w-full text-left px-2 py-1 text-[10px] font-bold rounded border transition-all ${selectedZoneType === ZoneType.COMMERCIAL ? 'bg-blue-600 text-white border-blue-400' : 'text-gray-400 border-transparent hover:bg-gray-700'}`}>🟦 COMMERCIAL</button>
                            <button onClick={() => setSelectedZoneType(ZoneType.INDUSTRIAL)} className={`w-full text-left px-2 py-1 text-[10px] font-bold rounded border transition-all ${selectedZoneType === ZoneType.INDUSTRIAL ? 'bg-yellow-600 text-white border-yellow-400' : 'text-gray-400 border-transparent hover:bg-gray-700'}`}>🟨 INDUSTRIEL</button>
                        </div>
                    )}
                </div>

                {/* Outils & Actions */}
                <div className="space-y-1 mt-2 pt-2 border-t border-gray-700">
                    <button onClick={() => setViewMode('BULLDOZER')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded border transition-colors ${viewMode === 'BULLDOZER' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}>
                        💣 BULLDOZER
                    </button>
                    <button onClick={onSpawnTraffic} className="w-full text-left px-3 py-2 text-xs font-bold rounded border bg-blue-900/50 text-blue-200 border-blue-800 hover:bg-blue-800 hover:text-white transition-colors">
                        🚗 AJOUTER TRAFIC
                    </button>
                </div>

                {/* Filtres Vue */}
                <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 pl-1">Vues</div>
                    <div className="grid grid-cols-2 gap-1">
                        {[{ id: 'ALL', label: 'Satellite' }, { id: 'OIL', label: 'Pétrole' }, { id: 'COAL', label: 'Charbon' }, { id: 'IRON', label: 'Fer' }, { id: 'WOOD', label: 'Forêts' }].map(l => (
                            <button key={l.id} onClick={() => setViewMode(l.id)} className={`px-2 py-1 text-[9px] font-bold rounded border ${viewMode === l.id ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'}`}>
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- INFO PANEL (DROITE) --- */}
            <div className="absolute top-20 right-4 z-10 w-64 pointer-events-auto flex flex-col gap-2">
                {/* Info Tuile */}
                <div className="bg-black/80 backdrop-blur border border-gray-700 rounded p-2 flex justify-between items-center text-xs font-mono text-gray-400">
                    <span>Tuile:</span>
                    {hoverInfo && <span className="text-white font-bold">{hoverInfo.biomeName}</span>}
                </div>

                {/* Info Ressource */}
                {hoverInfo && hoverInfo.resourceKey && (
                    <div className="bg-gray-900/95 backdrop-blur border border-blue-500/50 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-right-2">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Ressource</h4>
                                <h2 className="text-lg font-bold text-white capitalize">{t(`resources.${hoverInfo.resourceKey}`)}</h2>
                            </div>
                            <div className="bg-blue-900 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-700">Niv. {hoverInfo.techReq}</div>
                        </div>
                        <div className="my-2">
                            <span className="text-2xl font-black text-white">{formatNumber(hoverInfo.amount)}</span>
                            <span className="text-xs text-gray-400 ml-1">{t(`units.${hoverInfo.unitKey}`)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- GEOLOGICAL SUMMARY (BAS GAUCHE) --- */}
            {summary && (
                <div className="absolute bottom-4 left-4 z-10 bg-gray-900/95 p-3 rounded-lg border border-gray-600 shadow-2xl w-56 backdrop-blur-sm pointer-events-auto">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">{t('ui.data_title')}</h3>
                    <ResourceBar label={t('resources.oil')} value={summary.oil} color="#ffd700" />
                    <ResourceBar label={t('resources.coal')} value={summary.coal} color="#212121" />
                    <ResourceBar label={t('resources.iron')} value={summary.iron} color="#ff5722" />
                    <ResourceBar label={t('resources.wood')} value={summary.wood} color="#00c853" />
                    <ResourceBar label={t('resources.water')} value={summary.water} color="#29b6f6" />
                </div>
            )}

            {/* BOUTON REGENERATE */}
            <button onClick={onRegenerate} className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded shadow-lg pointer-events-auto transition-transform hover:scale-105 active:scale-95">
                🎲 RELANCER CARTE
            </button>
        </div>
    );
}