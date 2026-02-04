'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations, useLocale } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { LayerType, BiomeType, RoadType } from '../engine/types';
import { getResourceAtTile, ResourceInfo } from '../utils/resourceUtils';
import { RoadManager } from '../engine/RoadManager';

const COLORS = {
    BG: 0x111111,
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,
    WHITE_MODEL: 0xf5f5f5, WATER_MODEL: 0xb3e5fc,
    OIL: 0xffd700, COAL: 0x212121, IRON: 0xff5722,
    WOOD: 0x43a047, FOOD: 0xff3366, WATER_RES: 0x0000ff,
    GRID_LINES: 0x999999,
    HIGHLIGHT: 0xFFFFFF
};

type ViewMode = 'ALL' | 'WATER' | 'OIL' | 'COAL' | 'IRON' | 'WOOD' | 'FOOD' | 'BUILD_ROAD';

const BIOME_KEYS: Record<number, string> = {
    [BiomeType.DEEP_OCEAN]: 'deep_ocean', [BiomeType.OCEAN]: 'ocean',
    [BiomeType.BEACH]: 'beach', [BiomeType.DESERT]: 'desert',
    [BiomeType.PLAINS]: 'plains', [BiomeType.FOREST]: 'forest',
    [BiomeType.MOUNTAIN]: 'mountain', [BiomeType.SNOW]: 'snow',
};

export default function GameCanvas() {
    const t = useTranslations('Game');
    const locale = useLocale();

    // REFS
    const startDragTileRef = useRef<{ x: number, y: number } | null>(null);
    const previewPathRef = useRef<number[]>([]);

    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const graphicsRef = useRef<PIXI.Graphics | null>(null);
    const highlightRef = useRef<PIXI.Graphics | null>(null);

    const viewModeRef = useRef<ViewMode>('ALL');
    const showGridRef = useRef(false);

    // STATES
    const [viewMode, setViewMode] = useState<ViewMode>('ALL');
    const [showGrid, setShowGrid] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<ResourceInfo & { biomeName: string } | null>(null);
    const [debugFPS, setDebugFPS] = useState(0);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
    useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);

    const formatNumber = (num: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num);

    // 1. INIT PIXI
    useEffect(() => {
        if (!pixiContainerRef.current || appRef.current) return;

        const init = async () => {
            const app = new PIXI.Application();
            await app.init({
                resizeTo: pixiContainerRef.current!,
                backgroundColor: COLORS.BG,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                eventMode: 'static' // CRUCIAL pour les événements Pixi
            });

            if (!pixiContainerRef.current) { app.destroy(); return; }
            pixiContainerRef.current.appendChild(app.canvas);
            appRef.current = app;

            // STAGE CONFIG
            const stage = new PIXI.Container();
            // Zone de clic infinie pour attraper les événements partout
            stage.hitArea = new PIXI.Rectangle(-1000000, -1000000, 2000000, 2000000);
            stage.eventMode = 'static'; // Active l'interactivité sur le stage
            stage.sortableChildren = true;
            app.stage.addChild(stage);

            // LAYERS
            const graphics = new PIXI.Graphics();
            stage.addChild(graphics);
            graphicsRef.current = graphics;

            const highlight = new PIXI.Graphics();
            highlight.zIndex = 100; // Toujours au dessus
            stage.addChild(highlight);
            highlightRef.current = highlight;

            // CENTRAGE CAMÉRA INITIAL
            const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
            stage.position.set(
                (app.screen.width / 2) - (center.x * INITIAL_ZOOM),
                (app.screen.height / 2) - (center.y * INITIAL_ZOOM)
            );
            stage.scale.set(INITIAL_ZOOM);

            // --- GESTION DES ÉVÉNEMENTS (LA CORRECTION EST ICI) ---
            let isDraggingCamera = false;
            let lastGlobalX = 0;
            let lastGlobalY = 0;

            // 1. Pointer Down
            stage.on('pointerdown', (e) => {
                const globalPos = e.global; // Position écran brute

                // Clic Gauche + Mode Route
                if (viewModeRef.current === 'BUILD_ROAD' && e.button === 0) {
                    // Conversion magique Pixi : Écran -> Monde (tient compte du Zoom/Pan)
                    const localPos = stage.toLocal(globalPos);
                    const gridPos = screenToGrid(localPos.x, localPos.y);
                    startDragTileRef.current = gridPos;
                }
                // Sinon Caméra
                else {
                    isDraggingCamera = true;
                    lastGlobalX = globalPos.x;
                    lastGlobalY = globalPos.y;
                }
            });

            // 2. Pointer Move
            stage.on('pointermove', (e) => {
                const globalPos = e.global;

                // A. GESTION SOURIS / TOOLTIP / PREVIEW
                const localPos = stage.toLocal(globalPos); // La position EXACTE dans le monde du jeu
                const gridPos = screenToGrid(localPos.x, localPos.y);

                setCursorPos(gridPos); // Update UI debug

                // Calcul Preview Route
                if (viewModeRef.current === 'BUILD_ROAD' && startDragTileRef.current) {
                    const start = startDragTileRef.current;
                    const path = RoadManager.getPreviewPath(start.x, start.y, gridPos.x, gridPos.y);
                    previewPathRef.current = path;
                } else {
                    // Update Tooltip Ressource
                    const engine = getMapEngine();
                    if (gridPos.x >= 0 && gridPos.x < engine.config.size && gridPos.y >= 0 && gridPos.y < engine.config.size) {
                        const idx = gridPos.y * engine.config.size + gridPos.x;
                        const info = getResourceAtTile(engine, idx, viewModeRef.current);
                        const biome = engine.biomes[idx] as BiomeType;
                        const biomeKey = BIOME_KEYS[biome] || 'plains';
                        const translatedBiome = t(`biomes.${biomeKey}`);

                        if (info) setHoverInfo({ ...info, biomeName: translatedBiome });
                        else setHoverInfo({ value: 0, amount: 0, resourceKey: '', unitKey: '', techReq: 0, biomeName: translatedBiome });
                    } else {
                        setHoverInfo(null);
                    }
                }

                // B. GESTION CAMÉRA (PAN)
                if (isDraggingCamera) {
                    const dx = globalPos.x - lastGlobalX;
                    const dy = globalPos.y - lastGlobalY;
                    stage.position.x += dx;
                    stage.position.y += dy;
                    lastGlobalX = globalPos.x;
                    lastGlobalY = globalPos.y;
                }
            });

            // 3. Pointer Up
            stage.on('pointerup', (e) => { // 'pointerup' capture aussi le relâchement hors canvas
                // Fin construction route
                if (viewModeRef.current === 'BUILD_ROAD' && startDragTileRef.current && previewPathRef.current.length > 0) {
                    const engine = getMapEngine();
                    previewPathRef.current.forEach(idx => engine.placeRoad(idx, RoadType.ASPHALT));
                    setSummary({ ...engine.currentSummary }); // Force refresh UI
                    startDragTileRef.current = null;
                    previewPathRef.current = [];
                }
                isDraggingCamera = false;
            });

            // 4. Zoom (Wheel) - Doit rester sur le canvas DOM
            app.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomSpeed = 0.001;
                let newZoom = stage.scale.x * (1 - e.deltaY * zoomSpeed);
                newZoom = Math.max(0.2, Math.min(5.0, newZoom));

                // Zoom centré sur la souris
                const rect = app.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Position souris dans le monde AVANT zoom
                const worldPos = {
                    x: (mouseX - stage.position.x) / stage.scale.x,
                    y: (mouseY - stage.position.y) / stage.scale.y
                };

                stage.scale.set(newZoom);
                // Ajuster la position pour garder le point sous la souris fixe
                stage.position.set(
                    mouseX - worldPos.x * newZoom,
                    mouseY - worldPos.y * newZoom
                );
            }, { passive: false });

            // Désactiver le clic droit par défaut
            app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            regenerateWorld();
            setSummary(getMapEngine().currentSummary);
            app.ticker.add(renderLoop);
        };
        init();
        return () => { appRef.current?.destroy({ removeView: true }); appRef.current = null; };
    }, []);

    // 2. RENDER LOOP
    const renderLoop = useCallback(() => {
        const g = graphicsRef.current;
        const h = highlightRef.current;
        if (!g || g.destroyed || !h || h.destroyed) return;
        if (appRef.current) setDebugFPS(Math.round(appRef.current.ticker.FPS));

        g.clear();
        h.clear();

        const currentMode = viewModeRef.current;
        const isGridVisible = showGridRef.current;
        const engine = getMapEngine();
        const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
        const water = engine.getLayer(LayerType.WATER);
        const biomes = engine.biomes;
        const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y); // Position écran du CENTRE de la tuile
                const biome = biomes[i];

                let fillColor = 0x000000;
                let strokeAlpha = 0;

                // --- LOGIQUE D'AFFICHAGE DU TERRAIN ---
                if (currentMode === 'ALL' || currentMode === 'BUILD_ROAD') {
                    if (biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.DEEP_OCEAN;
                    else if (biome === BiomeType.OCEAN) fillColor = COLORS.OCEAN;
                    else if (biome === BiomeType.BEACH) fillColor = COLORS.BEACH;
                    else if (biome === BiomeType.FOREST) fillColor = COLORS.FOREST;
                    else if (biome === BiomeType.DESERT) fillColor = COLORS.DESERT;
                    else if (biome === BiomeType.MOUNTAIN) fillColor = COLORS.MOUNTAIN;
                    else if (biome === BiomeType.SNOW) fillColor = COLORS.SNOW;
                    else fillColor = getVariation(i) ? COLORS.PLAINS : COLORS.PLAINS_VAR;
                    if (isGridVisible) strokeAlpha = 0.1;
                } else {
                    fillColor = COLORS.WHITE_MODEL;
                    if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.WATER_MODEL;
                    strokeAlpha = 0.15;

                    if (currentMode === 'OIL' && oil[i] > 0.01) fillColor = COLORS.OIL;
                    else if (currentMode === 'COAL' && coal[i] > 0.01) fillColor = COLORS.COAL;
                    else if (currentMode === 'IRON' && iron[i] > 0.01) fillColor = COLORS.IRON;
                    else if (currentMode === 'WOOD' && wood[i] > 0.01) fillColor = COLORS.WOOD;
                    else if (currentMode === 'WATER' && water[i] > 0.01) fillColor = COLORS.WATER_RES;
                    else if (currentMode === 'FOOD' && (fish[i] > 0.01 || animals[i] > 0.01)) fillColor = COLORS.FOOD;
                }

                // DESSIN DU TERRAIN
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: fillColor });
                if (strokeAlpha > 0) g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });

                // --- PREVIEW ROUTE ---
                if (previewPathRef.current.includes(i)) {
                    g.fill({ color: 0x00FF00, alpha: 0.6 }); // Vert plus visible
                }

                // --- ROUTES RÉELLES ---
                if (engine.roadLayer && engine.roadLayer[i]) {
                    const road = engine.roadLayer[i];
                    if (road) {
                        const roadColor = road.isBridge ? 0x8B4513 : 0x555555;
                        g.beginPath();
                        g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                        g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                        g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                        g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                        g.closePath();
                        g.fill({ color: roadColor });

                        // Connexions
                        g.lineStyle(3, 0xFFD700, 1); // Jaune plus épais
                        const cx = pos.x; const cy = pos.y;
                        const qw = TILE_WIDTH / 4; const qh = TILE_HEIGHT / 4;

                        g.beginPath();
                        if (road.connections.n) { g.moveTo(cx, cy); g.lineTo(cx - qw, cy - qh); }
                        if (road.connections.s) { g.moveTo(cx, cy); g.lineTo(cx + qw, cy + qh); }
                        if (road.connections.e) { g.moveTo(cx, cy); g.lineTo(cx + qw, cy - qh); }
                        if (road.connections.w) { g.moveTo(cx, cy); g.lineTo(cx - qw, cy + qh); }
                        g.stroke();
                        g.lineStyle(0);
                    }
                }
            }
        }

        // --- HIGHLIGHT SOURIS (Sur le calque supérieur) ---
        // On récupère la pos souris stockée dans le state (mise à jour par pointermove)
        // Note: Pour une fluidité parfaite à 144hz, on pourrait utiliser une Ref pour cursorPos aussi
        // mais ici c'est suffisant.
        const highlightPos = gridToScreen(cursorPos.x, cursorPos.y);
        h.lineStyle(2, COLORS.HIGHLIGHT, 1);
        h.beginPath();
        h.moveTo(highlightPos.x, highlightPos.y - TILE_HEIGHT / 2);
        h.lineTo(highlightPos.x + TILE_WIDTH / 2, highlightPos.y);
        h.lineTo(highlightPos.x, highlightPos.y + TILE_HEIGHT / 2);
        h.lineTo(highlightPos.x - TILE_WIDTH / 2, highlightPos.y);
        h.closePath();
        h.stroke();

    }, [cursorPos]); // Le highlight dépend de la position curseur

    const handleRegenerate = () => { regenerateWorld(); setSummary(getMapEngine().currentSummary); };
    const ResourceBar = ({ label, value, color }: any) => (<div className="flex items-center gap-2 text-xs mb-1"> <span className="w-16 text-gray-400 font-bold uppercase">{label}</span> <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden"> <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }}></div> </div> <span className="w-8 text-right text-white">{Math.round(value)}%</span> </div>);

    // ... (Le JSX reste identique) ...
    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <div ref={pixiContainerRef} className="absolute inset-0" />

            <div className="absolute top-2 right-2 text-xs text-green-500 font-mono z-20 flex flex-col items-end">
                <span>FPS: {debugFPS}</span>
                <span className="text-yellow-400">{t('ui.coords')}: {cursorPos.x}, {cursorPos.y}</span>
            </div>

            {/* UI GAUCHE - BOUTONS */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-gray-900/90 p-2 rounded border border-gray-700 shadow-xl backdrop-blur-md">
                <button onClick={() => setViewMode('BUILD_ROAD')} className={`text-left px-3 py-1.5 text-xs font-bold rounded mb-2 border ${viewMode === 'BUILD_ROAD' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>
                    🚧 ROUTE
                </button>
                <div className="h-px bg-gray-700 my-1"></div>
                {[
                    { id: 'ALL', label: t('layers.satellite') },
                    { id: 'OIL', label: t('layers.oil') },
                    { id: 'COAL', label: t('layers.coal') },
                    { id: 'IRON', label: t('layers.iron') },
                    { id: 'WOOD', label: t('layers.forests') },
                    { id: 'FOOD', label: t('layers.food') },
                    { id: 'WATER', label: t('layers.water') },
                ].map(l => (
                    <button key={l.id} onClick={() => setViewMode(l.id as ViewMode)}
                        className={`text-left px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${viewMode === l.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        {l.label}
                    </button>
                ))}
            </div>

            {/* UI BAS GAUCHE - RESSOURCES */}
            {summary && (
                <div className="absolute bottom-4 left-4 z-10 bg-gray-900/95 p-4 rounded-lg border border-gray-600 shadow-2xl w-64 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white mb-3 border-b border-gray-700 pb-2">{t('ui.data_title')}</h3>
                    <ResourceBar label={t('resources.oil')} value={summary.oil} color="#ffd700" />
                    <ResourceBar label={t('resources.coal')} value={summary.coal} color="#212121" />
                    <ResourceBar label={t('resources.iron')} value={summary.iron} color="#ff5722" />
                    <ResourceBar label={t('resources.wood')} value={summary.wood} color="#00c853" />
                    <ResourceBar label={t('resources.water')} value={summary.water} color="#29b6f6" />
                </div>
            )}

            {/* TOOLTIP */}
            <div className="absolute top-4 right-4 z-10 w-64 pointer-events-none">
                <div className="bg-black/80 backdrop-blur border border-gray-700 rounded p-2 mb-2 flex justify-between items-center text-xs font-mono text-gray-400">
                    <span>{t('ui.coords')}: [{cursorPos.x}, {cursorPos.y}]</span>
                    {hoverInfo && <span className="text-white font-bold">{hoverInfo.biomeName}</span>}
                </div>
                {hoverInfo && hoverInfo.resourceKey ? (
                    <div className="bg-gray-900/95 backdrop-blur border border-blue-500/50 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-sm text-gray-400 uppercase tracking-wider text-[10px]">{t('ui.potential')}</h4>
                                <h2 className="text-xl font-bold text-white leading-tight">{t(`resources.${hoverInfo.resourceKey}`)}</h2>
                            </div>
                            <div className="bg-blue-900 text-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700">{t('ui.level_short')} {hoverInfo.techReq}</div>
                        </div>
                        <div className="my-3">
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{formatNumber(hoverInfo.amount)}</span>
                            <span className="text-sm text-gray-400 ml-1">{t(`units.${hoverInfo.unitKey}`)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-300" style={{ width: `${Math.min(100, hoverInfo.value * 100)}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-black/60 backdrop-blur border border-gray-800 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-xs italic">{t('resources.none')}</p>
                    </div>
                )}
            </div>

            <button onClick={handleRegenerate} className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded shadow-lg pointer-events-auto">🎲 GÉNÉRER</button>
        </div>
    );
}