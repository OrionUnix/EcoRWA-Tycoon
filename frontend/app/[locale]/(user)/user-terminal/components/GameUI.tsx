import React, { useState } from 'react';
import { RoadType, ZoneType, BuildingType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';
import {
    ROADS, LAYERS, formatNumber,
    ResourceItem, ToolButton, ResourceCard, GameTooltip, NeedsDisplay
} from './ui/GameWidgets';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BuildingInspector } from './ui/BuildingInspector';
import { getGameEngine } from '../engine/GameEngine';

interface GameUIProps {
    t: any; // ✅ Accepte le retour de useTranslations() de next-intl
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (type: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (type: ZoneType) => void;
    selectedBuildingType: BuildingType;
    setSelectedBuildingType: (type: BuildingType) => void;
    // ✅ NOUVEAU : Sélection d'un bâtiment existant (Inspection/Upgrade)
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
}

export default function GameUI({
    t,
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    selectedBuildingType, setSelectedBuildingType,
    selectedBuildingId, setSelectedBuildingId, // ✅ Recuperation prop
    totalCost, isValidBuild,
    fps, cursorPos, hoverInfo,
    resources, stats, summary,
    onRegenerate,
    speed, paused, onSetSpeed, onTogglePause
}: GameUIProps) {
    // État pour gérer la catégorie active (VIEWS, ROADS, ZONES, SERVICES)
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const engine = getGameEngine();

    // Alias for summary to avoid changing all the JSX below
    const s = summary || {} as any;


    // Gestion du clic pour ouvrir l'inspecteur
    // On utilise un useEffect pour écouter les changements de sélection venant du moteur ou de l'input
    // Mais GameUI est un composant React pur au dessus du Canvas...
    // Le plus simple est de passer une fonction `onSelectBuilding` à useGameInput, 
    // ou d'exposer un state global.
    // POUR L'INSTANT : On va tricher un peu et checker hoverInfo clické dans le canvas ?
    // Non, utilisons l'event click du jeu.
    // Solution : On ajoute `selectedEntity` dans les props de GameUI venant de page.tsx

    // ATTENTION : Je ne peux pas modifier page.tsx facilement sans voir tout le flow.
    // Je vais ajouter un écouteur d'événement custom ou modifier useGameInput pour set un state ici ?
    // Mieux : GameUI reçoit `selectedBuildingId` en prop, ou le gère via un callback passée au hook.

    // SIMPLIFICATION : Je vais ajouter la logique de sélection dans useGameInput qui appellera un setter passé en prop à GameComponent, qui le passera à GameUI.
    // Mais pour l'instant, modifions GameUI pour afficher le panneau SI une prop est passée.

    // Je vais assumer que je vais modifier le parent (GameComponent) pour gérer cet état.
    // Mais attendez, GameUI est rendu par `page.tsx` (ou `GameComponent` ?).
    // Regardons `page.tsx` ou le parent de GameUI.

    // En attendant, je mets le code du panel commenté ou prêt à être branché.

    // ...

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden font-sans">

            {/* ✅ INSPECTOR PANEL */}
            {selectedBuildingId !== null && engine.map.buildingLayer[selectedBuildingId] && (
                <div className="pointer-events-auto">
                    <BuildingInspector
                        engine={engine.map} // ✅ Pass MapEngine
                        building={engine.map.buildingLayer[selectedBuildingId]!}
                        index={selectedBuildingId}
                        onClose={() => setSelectedBuildingId(null)}
                        onUpgrade={() => {
                            // Force refresh (React reactive update)
                            // We can trigger a re-render by cloning the ID or just relying on engine updates if they trigger react?
                            // For now, simpler:
                            setSelectedBuildingId(null);
                            setTimeout(() => setSelectedBuildingId(selectedBuildingId), 0);
                        }}
                    />
                </div>
            )}

            {/* ... Reste du Jsx ... */}


            {/* ======================= */}
            {/* HAUT : TOP BAR */}
            {/* ======================= */}
            <div className="pointer-events-auto bg-gray-900/95 text-white p-2 flex justify-between items-center border-b border-white/10 shadow-lg backdrop-blur-md z-50">
                <div className="flex gap-8 items-center ml-4">
                    <div className="flex flex-col group relative cursor-help">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{t('Game.toolbar.budget')}</span>
                        <span className={`text-lg font-mono font-bold ${(resources?.money || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${formatNumber(resources?.money)}
                        </span>

                        {/* ✅ BUDGET TOOLTIP */}
                        {stats?.budget && (
                            <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-white/10 p-3 rounded-lg shadow-xl w-48 hidden group-hover:block z-50">
                                <div className="text-xs text-gray-300 space-y-1">
                                    <div className="flex justify-between text-green-400">
                                        <span>Revenus:</span> <span>+{stats.budget.income}$</span>
                                    </div>
                                    <div className="pl-2 border-l border-white/10">
                                        <div className="flex justify-between"><span>Impôts Rés.:</span> <span>{stats.budget.taxIncome.residential}</span></div>
                                        <div className="flex justify-between"><span>Impôts Com.:</span> <span>{stats.budget.taxIncome.commercial}</span></div>
                                        <div className="flex justify-between"><span>Impôts Ind.:</span> <span>{stats.budget.taxIncome.industrial}</span></div>
                                        <div className="flex justify-between text-orange-300"><span>Export:</span> <span>{stats.budget.tradeIncome}</span></div>
                                    </div>
                                    <div className="flex justify-between text-red-400 mt-2 pt-2 border-t border-white/10">
                                        <span>Dépenses:</span> <span>-{stats.budget.expenses}$</span>
                                    </div>
                                    <div className="pl-2 border-l border-white/10 text-red-300">
                                        <div className="flex justify-between"><span>Maintenance:</span> <span>{stats.budget.maintenance}</span></div>
                                    </div>
                                    <div className="flex justify-between font-bold text-white mt-2 pt-2 border-t border-white/20">
                                        <span>Net:</span>
                                        <span className={(stats.budget.income - stats.budget.expenses) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {(stats.budget.income - stats.budget.expenses) >= 0 ? '+' : ''}{stats.budget.income - stats.budget.expenses}$
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{t('Game.toolbar.population')}</span>
                        <span className="text-lg font-mono text-blue-300 font-bold">
                            {formatNumber(stats?.population)}
                        </span>
                    </div>
                </div>

                {/* ✅ Needs Display */}
                <div className="hidden xl:flex ml-8">
                    <NeedsDisplay stats={stats} />
                </div>

                <div className="flex gap-4 text-sm hidden lg:flex">
                    <ResourceItem label={t('Game.toolbar.wood')} value={resources?.wood} color="text-amber-500" />
                    <ResourceItem label={t('Game.toolbar.steel')} value={resources?.steel} color="text-blue-400" />

                </div>

                <div className="flex gap-3 mr-4 items-center">
                    <div className="text-[10px] font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">FPS: {fps}</div>

                    {/* TIME CONTROLS */}
                    <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-white/10">
                        <button
                            onClick={onTogglePause}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${paused ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            ⏸
                        </button>
                        {[1, 2, 4].map(s => (
                            <button
                                key={s}
                                onClick={() => onSetSpeed(s)}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${speed === s && !paused ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>

                    <button onClick={onRegenerate} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-3 py-1 rounded-md text-xs font-bold transition-all">RESET</button>
                    {/* ✅ Remplacement du bouton TRAFFIC par le LanguageSwitcher */}
                    <div className="pointer-events-auto">
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>

            {/* ======================= */}
            {/* MILIEU : WIDGETS LATERAUX ET TOOLTIP */}
            {/* ======================= */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 pointer-events-auto z-40 flex flex-col gap-2 scale-90 origin-right">
                <ResourceCard icon="🛢️" value={resources?.oil} max={5000} label="Oil" color="bg-yellow-600" />
                <ResourceCard icon="⚫" value={resources?.coal} max={5000} label="Coal" color="bg-zinc-700" />
                <ResourceCard icon="🔩" value={resources?.iron} max={5000} label="Iron" color="bg-orange-700" />
                <ResourceCard icon="🌲" value={resources?.wood} max={5000} label="Wood" color="bg-emerald-700" />
                <ResourceCard icon="💧" value={resources?.water} max={5000} label="Water" color="bg-blue-600" />
                <ResourceCard icon="🪙" value={resources?.gold} max={1000} label="Gold" color="bg-yellow-400" />
                <ResourceCard icon="🥈" value={resources?.silver} max={1000} label="Silver" color="bg-slate-400" />
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
                                    <span>{layer.icon}</span> <span>{t(`Game.layers.${layer.id.toLowerCase()}`)}</span>
                                </button>
                            ))}

                            {/* Choix des ROUTES */}
                            {activeCategory === 'ROADS' && ROADS.map(r => (
                                <ToolButton
                                    key={r}
                                    active={viewMode === 'BUILD_ROAD' && selectedRoadType === r}
                                    onClick={() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(r); setActiveCategory(null); }}
                                    label={t(`Game.roads.${r.toLowerCase()}`)}
                                    icon="🛣️"
                                />
                            ))}

                            {/* Choix des ZONES */}
                            {activeCategory === 'ZONES' && (
                                <>
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); setActiveCategory(null); }} label={t('Game.zones_short.RESIDENTIAL')} icon="🏠" color="bg-green-600/30" />
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); setActiveCategory(null); }} label={t('Game.zones_short.COMMERCIAL')} icon="🏢" color="bg-blue-600/30" />
                                    <ToolButton active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL} onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); setActiveCategory(null); }} label={t('Game.zones_short.INDUSTRIAL')} icon="🏭" color="bg-yellow-600/30" />
                                </>
                            )}

                            {/* Choix des SERVICES */}
                            {activeCategory === 'SERVICES' && (
                                <>
                                    {/* --- SERVICES ESSENTIELS --- */}
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.POWER_PLANT}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.POWER_PLANT}`);
                                            setSelectedBuildingType(BuildingType.POWER_PLANT);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.power')}
                                        icon="⚡"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.WATER_PUMP}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.WATER_PUMP}`);
                                            setSelectedBuildingType(BuildingType.WATER_PUMP);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.water')}
                                        icon="💧"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.FOOD_MARKET}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.FOOD_MARKET}`);
                                            setSelectedBuildingType(BuildingType.FOOD_MARKET);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.market')}
                                        icon="🏪"
                                    />

                                    {/* --- PROTECTION & SANTÉ --- */}
                                    <div className="w-[1px] h-8 bg-white/10 mx-1" />

                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.POLICE_STATION}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.POLICE_STATION}`);
                                            setSelectedBuildingType(BuildingType.POLICE_STATION);
                                            setActiveCategory(null);
                                        }}
                                        label="Police"
                                        icon="👮"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.FIRE_STATION}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.FIRE_STATION}`);
                                            setSelectedBuildingType(BuildingType.FIRE_STATION);
                                            setActiveCategory(null);
                                        }}
                                        label="Pompier"
                                        icon="🚒"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.CLINIC}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.CLINIC}`);
                                            setSelectedBuildingType(BuildingType.CLINIC);
                                            setActiveCategory(null);
                                        }}
                                        label="Clinique"
                                        icon="🏥"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.SCHOOL}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.SCHOOL}`);
                                            setSelectedBuildingType(BuildingType.SCHOOL);
                                            setActiveCategory(null);
                                        }}
                                        label="École"
                                        icon="🏫"
                                    />

                                    {/* --- PRODUCTION PRIMAIRE --- */}
                                    <div className="w-[1px] h-8 bg-white/10 mx-1" />

                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.HUNTER_HUT}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.HUNTER_HUT}`);
                                            setSelectedBuildingType(BuildingType.HUNTER_HUT);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.hunter')}
                                        icon="🏹"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.FISHERMAN}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.FISHERMAN}`);
                                            setSelectedBuildingType(BuildingType.FISHERMAN);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.fisherman')}
                                        icon="🎣"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.LUMBER_HUT}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.LUMBER_HUT}`);
                                            setSelectedBuildingType(BuildingType.LUMBER_HUT);
                                            setActiveCategory(null);
                                        }}
                                        label={t('Game.tools.lumberjack')}
                                        icon="🪓"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.COAL_MINE}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.COAL_MINE}`);
                                            setSelectedBuildingType(BuildingType.COAL_MINE);
                                            setActiveCategory(null);
                                        }}
                                        label="Mine Charbon"
                                        icon="⛏️"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.ORE_MINE}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.ORE_MINE}`);
                                            setSelectedBuildingType(BuildingType.ORE_MINE);
                                            setActiveCategory(null);
                                        }}
                                        label="Mine Fer/Or"
                                        icon="⚒️"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.OIL_PUMP}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.OIL_PUMP}`);
                                            setSelectedBuildingType(BuildingType.OIL_PUMP);
                                            setActiveCategory(null);
                                        }}
                                        label="Puits Pétrole"
                                        icon="🛢️"
                                    />
                                </>
                            )}

                            {/* Choix des LOISIRS */}
                            {activeCategory === 'LEISURE' && (
                                <>
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.PARK}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.PARK}`);
                                            setSelectedBuildingType(BuildingType.PARK);
                                            setActiveCategory(null);
                                        }}
                                        label="Parc"
                                        icon="🌳"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.CAFE}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.CAFE}`);
                                            setSelectedBuildingType(BuildingType.CAFE);
                                            setActiveCategory(null);
                                        }}
                                        label="Café"
                                        icon="☕"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.RESTAURANT}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.RESTAURANT}`);
                                            setSelectedBuildingType(BuildingType.RESTAURANT);
                                            setActiveCategory(null);
                                        }}
                                        label="Resto"
                                        icon="🍽️"
                                    />
                                    <ToolButton
                                        active={viewMode === `BUILD_${BuildingType.MUSEUM}`}
                                        onClick={() => {
                                            setViewMode(`BUILD_${BuildingType.MUSEUM}`);
                                            setSelectedBuildingType(BuildingType.MUSEUM);
                                            setActiveCategory(null);
                                        }}
                                        label="Musée"
                                        icon="🏛️"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* BARRE PRINCIPALE (Catégories) */}
                    <div className="bg-gray-900/95 px-4 py-2 rounded-full border border-white/20 flex items-center gap-3 shadow-2xl">

                        {/* Groupe Navigation / Destruction */}
                        <div className="flex gap-1">
                            <ToolButton
                                active={activeCategory === 'VIEWS'}
                                onClick={() => setActiveCategory(activeCategory === 'VIEWS' ? null : 'VIEWS')}
                                label={t('Game.tools.views')} icon="🗺️" variant="circle"
                            />
                            <ToolButton
                                active={viewMode === 'BULLDOZER'}
                                onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                                label={t('Game.tools.bulldose')} icon="🧨" color="bg-red-500/10" variant="circle"
                            />
                        </div>

                        <div className="w-[1px] h-8 bg-white/20" />

                        {/* Groupe Construction */}
                        <div className="flex gap-2">
                            <ToolButton
                                active={activeCategory === 'ROADS'}
                                onClick={() => setActiveCategory(activeCategory === 'ROADS' ? null : 'ROADS')}
                                label={t('Game.tools.roads')} icon="🛣️" variant="circle"
                            />
                            <ToolButton
                                active={activeCategory === 'ZONES'}
                                onClick={() => setActiveCategory(activeCategory === 'ZONES' ? null : 'ZONES')}
                                label={t('Game.tools.zoning')} icon="🏗️" variant="circle"
                            />
                            <ToolButton
                                active={activeCategory === 'SERVICES'}
                                onClick={() => setActiveCategory(activeCategory === 'SERVICES' ? null : 'SERVICES')}
                                label={t('Game.tools.services')} icon="⚡" variant="circle"
                            />
                            <ToolButton
                                active={activeCategory === 'LEISURE'}
                                onClick={() => setActiveCategory(activeCategory === 'LEISURE' ? null : 'LEISURE')}
                                label="Loisirs" icon="🎡" variant="circle"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}