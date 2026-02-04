'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations, useLocale } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { LayerType, BiomeType, RoadType } from '../engine/types';
import { getResourceAtTile, ResourceInfo } from '../utils/resourceUtils';
import { RoadManager, RoadCheckResult } from '../engine/RoadManager';

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
    HIGHLIGHT: 0xFFFFFF,
    ROAD_ASPHALT: 0x555555,
    ROAD_BRIDGE: 0x8B4513,
    ROAD_MARKING: 0xFFD700,
    ROAD_PREVIEW_VALID: 0x00FF00,
    ROAD_PREVIEW_INVALID: 0xFF0000
};

type ViewMode = 'ALL' | 'WATER' | 'OIL' | 'COAL' | 'IRON' | 'WOOD' | 'FOOD' | 'BUILD_ROAD' | 'BULLDOZER';

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
    const isValidBuildRef = useRef<boolean>(true);

    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const graphicsRef = useRef<PIXI.Graphics | null>(null);
    const highlightRef = useRef<PIXI.Graphics | null>(null);
    const resizeCleanupRef = useRef<(() => void) | null>(null);

    const viewModeRef = useRef<ViewMode>('ALL');
    const showGridRef = useRef(false);

    // STATES
    const [viewMode, setViewMode] = useState<ViewMode>('ALL');
    const [showGrid, setShowGrid] = useState(false);

    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<ResourceInfo & { biomeName: string } | null>(null);
    const [debugFPS, setDebugFPS] = useState(0);
    const [summary, setSummary] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);

    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
    useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);

    const formatNumber = (num: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num);

    // 1. INIT PIXI
    useEffect(() => {
        if (!pixiContainerRef.current || appRef.current) return;

        let timeoutId: NodeJS.Timeout;

        const init = async () => {
            const app = new PIXI.Application();

            // On initialise en utilisant window directement pour éviter les délais de layout
            await app.init({
                resizeTo: window,
                backgroundColor: COLORS.BG,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                eventMode: 'static',
                autoDensity: true // Important pour le redimensionnement CSS vs Rendu
            });

            if (!pixiContainerRef.current) { app.destroy(); return; }

            // FORCER LE CSS DU CANVAS POUR REMPLIR LE CONTENEUR
            app.canvas.style.position = 'absolute';
            app.canvas.style.width = '100%';
            app.canvas.style.height = '100%';
            app.canvas.style.display = 'block';

            pixiContainerRef.current.appendChild(app.canvas);
            appRef.current = app;

            const stage = new PIXI.Container();
            stage.hitArea = new PIXI.Rectangle(-1000000, -1000000, 2000000, 2000000);
            stage.eventMode = 'static';
            stage.sortableChildren = true;
            app.stage.addChild(stage);

            const graphics = new PIXI.Graphics();
            stage.addChild(graphics);
            graphicsRef.current = graphics;

            const highlight = new PIXI.Graphics();
            highlight.zIndex = 100;
            stage.addChild(highlight);
            highlightRef.current = highlight;

            const centerCamera = () => {
                if (!app.renderer) return;
                const screenW = app.screen.width;
                const screenH = app.screen.height;
                const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);

                stage.position.set(
                    (screenW / 2) - (center.x * INITIAL_ZOOM),
                    (screenH / 2) - (center.y * INITIAL_ZOOM)
                );
                stage.scale.set(INITIAL_ZOOM);
            };

            // Centrage initial différé pour laisser le temps au resizeTo de s'appliquer
            timeoutId = setTimeout(centerCamera, 100);

            // Gestionnaire de redimensionnement manuel (sécurité)
            const handleResize = () => {
                if (!app.renderer) return;
                app.resize();
            };
            window.addEventListener('resize', handleResize);
            resizeCleanupRef.current = () => window.removeEventListener('resize', handleResize);

            // GESTION EVENTS
            let isDraggingCamera = false;
            let lastGlobalX = 0;
            let lastGlobalY = 0;

            const getGridPosFromGlobal = (globalX: number, globalY: number) => {
                const localPos = stage.toLocal({ x: globalX, y: globalY });
                return screenToGrid(localPos.x, localPos.y);
            };

            stage.on('pointerdown', (e) => {
                const globalPos = e.global;
                if ((viewModeRef.current === 'BUILD_ROAD' || viewModeRef.current === 'BULLDOZER') && e.button === 0) {
                    startDragTileRef.current = getGridPosFromGlobal(globalPos.x, globalPos.y);
                } else {
                    isDraggingCamera = true;
                    lastGlobalX = globalPos.x;
                    lastGlobalY = globalPos.y;
                }
            });

            stage.on('pointermove', (e) => {
                const globalPos = e.global;
                const gridPos = getGridPosFromGlobal(globalPos.x, globalPos.y);
                setCursorPos(prev => (prev.x === gridPos.x && prev.y === gridPos.y) ? prev : gridPos);

                const currentMode = viewModeRef.current;

                if ((currentMode === 'BUILD_ROAD' || currentMode === 'BULLDOZER') && startDragTileRef.current) {
                    const start = startDragTileRef.current;
                    const path = RoadManager.getPreviewPath(start.x, start.y, gridPos.x, gridPos.y);
                    previewPathRef.current = path;

                    const engine = getMapEngine();
                    if (currentMode === 'BUILD_ROAD') {
                        let cost = 0;
                        let valid = true;
                        let prevIdx: number | null = null;
                        for (const idx of path) {
                            const check: RoadCheckResult = RoadManager.checkTile(engine, idx, prevIdx);
                            if (!check.valid) valid = false;
                            cost += check.cost;
                            prevIdx = idx;
                        }
                        isValidBuildRef.current = valid;
                        setTotalCost(cost);
                        setIsValidBuild(valid);
                    } else {
                        setTotalCost(0);
                        setIsValidBuild(true);
                    }
                } else {
                    const engine = getMapEngine();
                    if (gridPos.x >= 0 && gridPos.x < engine.config.size && gridPos.y >= 0 && gridPos.y < engine.config.size) {
                        const idx = gridPos.y * engine.config.size + gridPos.x;
                        const info = getResourceAtTile(engine, idx, viewModeRef.current);
                        const biome = engine.biomes[idx] as BiomeType;
                        const biomeKey = BIOME_KEYS[biome] || 'plains';
                        const translatedBiome = t(`biomes.${biomeKey}`);
                        setHoverInfo(prev => {
                            if (prev?.resourceKey === info?.resourceKey && prev?.amount === info?.amount) return prev;
                            return info ? { ...info, biomeName: translatedBiome } : { value: 0, amount: 0, resourceKey: '', unitKey: '', techReq: 0, biomeName: translatedBiome };
                        });
                    } else {
                        setHoverInfo(null);
                    }
                }

                if (isDraggingCamera) {
                    const dx = globalPos.x - lastGlobalX;
                    const dy = globalPos.y - lastGlobalY;
                    stage.position.x += dx;
                    stage.position.y += dy;
                    lastGlobalX = globalPos.x;
                    lastGlobalY = globalPos.y;
                }
            });

            stage.on('pointerup', () => {
                const currentMode = viewModeRef.current;
                if ((currentMode === 'BUILD_ROAD' || currentMode === 'BULLDOZER') && startDragTileRef.current && previewPathRef.current.length > 0) {
                    const engine = getMapEngine();
                    if (currentMode === 'BUILD_ROAD') {
                        if (isValidBuildRef.current) {
                            previewPathRef.current.forEach(idx => engine.placeRoad(idx, RoadType.ASPHALT));
                        }
                    } else if (currentMode === 'BULLDOZER') {
                        previewPathRef.current.forEach(idx => engine.removeRoad(idx));
                    }
                    setSummary({ ...engine.currentSummary });
                    startDragTileRef.current = null;
                    previewPathRef.current = [];
                    setTotalCost(0);
                }
                isDraggingCamera = false;
            });

            app.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomSpeed = 0.001;
                let newZoom = stage.scale.x * (1 - e.deltaY * zoomSpeed);
                newZoom = Math.max(0.1, Math.min(5.0, newZoom));
                const rect = app.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const worldPos = {
                    x: (mouseX - stage.position.x) / stage.scale.x,
                    y: (mouseY - stage.position.y) / stage.scale.y
                };
                stage.scale.set(newZoom);
                stage.position.set(mouseX - worldPos.x * newZoom, mouseY - worldPos.y * newZoom);
            }, { passive: false });

            app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            regenerateWorld();
            setSummary(getMapEngine().currentSummary);
            app.ticker.add(renderLoop);
        };
        init();

        return () => {
            clearTimeout(timeoutId);
            if (resizeCleanupRef.current) resizeCleanupRef.current();
            appRef.current?.destroy({ removeView: true });
            appRef.current = null;
        };
    }, []);

    // 2. RENDER LOOP
    const renderLoop = useCallback(() => {
        const g = graphicsRef.current;
        const h = highlightRef.current;
        const app = appRef.current;
        if (!g || g.destroyed || !h || !app || !app.renderer) return;

        setDebugFPS(Math.round(app.ticker.FPS));
        g.clear();
        h.clear();

        const stage = app.stage.children[0] as PIXI.Container;

        // CULLING
        const topLeft = screenToGrid((0 - stage.x) / stage.scale.x, (0 - stage.y) / stage.scale.y);
        const bottomRight = screenToGrid((app.screen.width - stage.x) / stage.scale.x, (app.screen.height - stage.y) / stage.scale.y);
        const topRight = screenToGrid((app.screen.width - stage.x) / stage.scale.x, (0 - stage.y) / stage.scale.y);
        const bottomLeft = screenToGrid((0 - stage.x) / stage.scale.x, (app.screen.height - stage.y) / stage.scale.y);

        const minX = Math.max(0, Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x) - 2);
        const maxX = Math.min(GRID_SIZE, Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x) + 2);
        const minY = Math.max(0, Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y) - 2);
        const maxY = Math.min(GRID_SIZE, Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y) + 2);

        const currentMode = viewModeRef.current;
        const isGridVisible = showGridRef.current;
        const engine = getMapEngine();
        const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
        const biomes = engine.biomes;
        const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                const i = y * GRID_SIZE + x;
                if (i < 0 || i >= engine.config.totalCells) continue;

                const pos = gridToScreen(x, y);
                const biome = biomes[i];

                let fillColor = 0x000000;
                let strokeAlpha = 0;

                // Terrain
                if (currentMode === 'ALL' || currentMode === 'BUILD_ROAD' || currentMode === 'BULLDOZER') {
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
                    else if (currentMode === 'WATER' && engine.getLayer(LayerType.WATER)[i] > 0.01) fillColor = COLORS.WATER_RES;
                    else if (currentMode === 'FOOD' && (fish[i] > 0.01 || animals[i] > 0.01)) fillColor = COLORS.FOOD;
                }

                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: fillColor });
                if (strokeAlpha > 0) g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });

                // --- PREVIEW ROUTE (CORRECTION) ---
                if (previewPathRef.current.includes(i)) {
                    let color = COLORS.ROAD_PREVIEW_VALID;
                    if (currentMode === 'BULLDOZER') {
                        color = 0xFF0000;
                    } else {
                        const check = RoadManager.checkTile(engine, i, null);
                        if (!check.valid || !isValidBuildRef.current) color = COLORS.ROAD_PREVIEW_INVALID;
                        else if (check.isBridge) color = COLORS.ROAD_BRIDGE;
                    }

                    // RE-DESSINER LE CHEMIN POUR QUE LE FILL S'APPLIQUE
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.closePath();

                    g.fill({ color, alpha: 0.6 });
                }

                // ROUTES (CONTINUOUS GRAPH)
                if (engine.roadLayer && engine.roadLayer[i]) {
                    const road = engine.roadLayer[i];
                    if (road) {
                        const cx = pos.x;
                        const cy = pos.y;

                        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
                        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
                        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
                        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

                        const roadColor = road.isBridge ? COLORS.ROAD_BRIDGE : COLORS.ROAD_ASPHALT;

                        // 1. Asphalt
                        g.beginPath();
                        if (road.connections.n) { g.moveTo(cx, cy); g.lineTo(cx + n_dx, cy + n_dy); }
                        if (road.connections.s) { g.moveTo(cx, cy); g.lineTo(cx + s_dx, cy + s_dy); }
                        if (road.connections.e) { g.moveTo(cx, cy); g.lineTo(cx + e_dx, cy + e_dy); }
                        if (road.connections.w) { g.moveTo(cx, cy); g.lineTo(cx + w_dx, cy + w_dy); }
                        g.stroke({ width: 16, color: roadColor, alpha: 1, cap: 'round', join: 'round' });

                        // 2. Yellow Marking
                        g.beginPath();
                        if (road.connections.n) { g.moveTo(cx, cy); g.lineTo(cx + n_dx, cy + n_dy); }
                        if (road.connections.s) { g.moveTo(cx, cy); g.lineTo(cx + s_dx, cy + s_dy); }
                        if (road.connections.e) { g.moveTo(cx, cy); g.lineTo(cx + e_dx, cy + e_dy); }
                        if (road.connections.w) { g.moveTo(cx, cy); g.lineTo(cx + w_dx, cy + w_dy); }
                        g.stroke({ width: 2, color: COLORS.ROAD_MARKING, alpha: 1, cap: 'round', join: 'round' });
                    }
                }
            }
        }

        // Highlight
        const highlightPos = gridToScreen(cursorPos.x, cursorPos.y);
        h.lineStyle(2, COLORS.HIGHLIGHT, 1);
        h.beginPath();
        h.moveTo(highlightPos.x, highlightPos.y - TILE_HEIGHT / 2);
        h.lineTo(highlightPos.x + TILE_WIDTH / 2, highlightPos.y);
        h.lineTo(highlightPos.x, highlightPos.y + TILE_HEIGHT / 2);
        h.lineTo(highlightPos.x - TILE_WIDTH / 2, highlightPos.y);
        h.closePath();
        h.stroke();

    }, [cursorPos]);

    const handleRegenerate = () => { regenerateWorld(); setSummary(getMapEngine().currentSummary); };
    const ResourceBar = ({ label, value, color }: any) => (<div className="flex items-center gap-2 text-xs mb-1"> <span className="w-16 text-gray-400 font-bold uppercase">{label}</span> <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden"> <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }}></div> </div> <span className="w-8 text-right text-white">{Math.round(value)}%</span> </div>);

    return (
        // FIXED POSITION + Z-INDEX 0 POUR ÊTRE SÛR QU'IL PREND TOUT L'ÉCRAN SANS GÊNER
        <div className="fixed inset-0 w-screen h-screen bg-black z-0 overflow-hidden">
            <div ref={pixiContainerRef} className="absolute inset-0" />

            {/* UI */}
            <div className="absolute top-2 right-2 text-xs text-green-500 font-mono z-20 flex flex-col items-end pointer-events-none">
                <span>FPS: {debugFPS}</span>
                <span className="text-yellow-400">{t('ui.coords')}: {cursorPos.x}, {cursorPos.y}</span>
            </div>

            {viewMode === 'BUILD_ROAD' && totalCost > 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-in fade-in zoom-in duration-200">
                    <div className={`px-4 py-2 rounded-full font-bold text-white shadow-xl backdrop-blur-md border border-white/20 ${isValidBuild ? 'bg-green-600/90' : 'bg-red-600/90'}`}>
                        {isValidBuild ? `Coût: $${totalCost}` : "Construction Impossible"}
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-gray-900/90 p-2 rounded border border-gray-700 shadow-xl backdrop-blur-md">
                <button onClick={() => setViewMode('BUILD_ROAD')} className={`text-left px-3 py-1.5 text-xs font-bold rounded mb-1 border ${viewMode === 'BUILD_ROAD' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>
                    🚧 ROUTE
                </button>
                <button onClick={() => setViewMode('BULLDOZER')} className={`text-left px-3 py-1.5 text-xs font-bold rounded mb-2 border ${viewMode === 'BULLDOZER' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>
                    💣 BULLDOZER
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

            {summary && (
                <div className="absolute bottom-4 left-4 z-10 bg-gray-900/95 p-4 rounded-lg border border-gray-600 shadow-2xl w-64 backdrop-blur-sm pointer-events-none">
                    <h3 className="text-sm font-bold text-white mb-3 border-b border-gray-700 pb-2">{t('ui.data_title')}</h3>
                    <ResourceBar label={t('resources.oil')} value={summary.oil} color="#ffd700" />
                    <ResourceBar label={t('resources.coal')} value={summary.coal} color="#212121" />
                    <ResourceBar label={t('resources.iron')} value={summary.iron} color="#ff5722" />
                    <ResourceBar label={t('resources.wood')} value={summary.wood} color="#00c853" />
                    <ResourceBar label={t('resources.water')} value={summary.water} color="#29b6f6" />
                </div>
            )}

            <button onClick={handleRegenerate} className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded shadow-lg pointer-events-auto">🎲 GÉNÉRER</button>
        </div>
    );
}