'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations, useLocale } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { LayerType, BiomeType, RoadType, ROAD_SPECS } from '../engine/types';
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
    ROAD_BRIDGE: 0x8B4513,
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
    const [selectedRoadType, setSelectedRoadType] = useState<RoadType>(RoadType.ASPHALT);

    // REFS & STATES
    const startDragTileRef = useRef<{ x: number, y: number } | null>(null);
    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef<boolean>(true);
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const staticGraphicsRef = useRef<PIXI.Graphics | null>(null);
    const uiGraphicsRef = useRef<PIXI.Graphics | null>(null);
    const lastRenderedRevision = useRef<number>(-1);
    const lastViewMode = useRef<ViewMode>('ALL');
    const resizeCleanupRef = useRef<(() => void) | null>(null);
    const viewModeRef = useRef<ViewMode>('ALL');
    const showGridRef = useRef(false);
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

    // INIT PIXI
    useEffect(() => {
        if (!pixiContainerRef.current || appRef.current) return;
        let timeoutId: NodeJS.Timeout;
        const init = async () => {
            const app = new PIXI.Application();
            await app.init({ resizeTo: window, backgroundColor: COLORS.BG, antialias: true, resolution: window.devicePixelRatio || 1, eventMode: 'static', autoDensity: true });
            if (!pixiContainerRef.current) { app.destroy(); return; }
            app.canvas.style.position = 'absolute'; app.canvas.style.width = '100%'; app.canvas.style.height = '100%'; app.canvas.style.display = 'block';
            pixiContainerRef.current.appendChild(app.canvas);
            appRef.current = app;
            const stage = new PIXI.Container();
            stage.hitArea = new PIXI.Rectangle(-1000000, -1000000, 2000000, 2000000);
            stage.eventMode = 'static';
            stage.sortableChildren = true;
            app.stage.addChild(stage);
            const staticGraphics = new PIXI.Graphics(); staticGraphics.label = "StaticLayer"; stage.addChild(staticGraphics); staticGraphicsRef.current = staticGraphics;
            const uiGraphics = new PIXI.Graphics(); uiGraphics.label = "UILayer"; uiGraphics.zIndex = 100; stage.addChild(uiGraphics); uiGraphicsRef.current = uiGraphics;

            const centerCamera = () => {
                if (!app.renderer) return;
                const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
                stage.position.set((app.screen.width / 2) - (center.x * INITIAL_ZOOM), (app.screen.height / 2) - (center.y * INITIAL_ZOOM));
                stage.scale.set(INITIAL_ZOOM);
            };
            timeoutId = setTimeout(centerCamera, 100);
            const handleResize = () => { if (app.renderer) app.resize(); };
            window.addEventListener('resize', handleResize);
            resizeCleanupRef.current = () => window.removeEventListener('resize', handleResize);

            let isDraggingCamera = false; let lastGlobalX = 0; let lastGlobalY = 0;
            const getGridPosFromGlobal = (globalX: number, globalY: number) => { const localPos = stage.toLocal({ x: globalX, y: globalY }); return screenToGrid(localPos.x, localPos.y); };
            stage.on('pointerdown', (e) => {
                const globalPos = e.global;
                if ((viewModeRef.current === 'BUILD_ROAD' || viewModeRef.current === 'BULLDOZER') && e.button === 0) { startDragTileRef.current = getGridPosFromGlobal(globalPos.x, globalPos.y); }
                else { isDraggingCamera = true; lastGlobalX = globalPos.x; lastGlobalY = globalPos.y; }
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
                        let cost = 0; let valid = true; let prevIdx: number | null = null;
                        for (const idx of path) {
                            const check = RoadManager.checkTile(engine, idx, prevIdx);
                            if (!check.valid) valid = false;
                            cost += check.cost; prevIdx = idx;
                        }
                        isValidBuildRef.current = valid; setTotalCost(cost); setIsValidBuild(valid);
                    } else { setTotalCost(0); setIsValidBuild(true); }
                } else {
                    const engine = getMapEngine();
                    if (gridPos.x >= 0 && gridPos.x < engine.config.size && gridPos.y >= 0 && gridPos.y < engine.config.size) {
                        const idx = gridPos.y * engine.config.size + gridPos.x;
                        const info = getResourceAtTile(engine, idx, viewModeRef.current);
                        const biome = engine.biomes[idx] as BiomeType;
                        const biomeKey = BIOME_KEYS[biome] || 'plains';
                        const translatedBiome = t(`biomes.${biomeKey}`);
                        setHoverInfo(prev => { if (prev?.resourceKey === info?.resourceKey && prev?.amount === info?.amount) return prev; return info ? { ...info, biomeName: translatedBiome } : { value: 0, amount: 0, resourceKey: '', unitKey: '', techReq: 0, biomeName: translatedBiome }; });
                    } else { setHoverInfo(null); }
                }
                if (isDraggingCamera) { const dx = globalPos.x - lastGlobalX; const dy = globalPos.y - lastGlobalY; stage.position.x += dx; stage.position.y += dy; lastGlobalX = globalPos.x; lastGlobalY = globalPos.y; }
            });
            stage.on('pointerup', () => {
                const currentMode = viewModeRef.current;
                if ((currentMode === 'BUILD_ROAD' || currentMode === 'BULLDOZER') && startDragTileRef.current && previewPathRef.current.length > 0) {
                    const engine = getMapEngine();
                    if (currentMode === 'BUILD_ROAD') {
                        if (isValidBuildRef.current) {
                            // LOG IMPORTANT POUR LE DEBUG
                            console.log("🚧 Construction:", selectedRoadType);
                            previewPathRef.current.forEach(idx => engine.placeRoad(idx, selectedRoadType));
                        }
                    } else if (currentMode === 'BULLDOZER') { previewPathRef.current.forEach(idx => engine.removeRoad(idx)); }
                    setSummary({ ...engine.currentSummary });
                    startDragTileRef.current = null; previewPathRef.current = []; setTotalCost(0);
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
                const worldPos = { x: (mouseX - stage.position.x) / stage.scale.x, y: (mouseY - stage.position.y) / stage.scale.y };
                stage.scale.set(newZoom); stage.position.set(mouseX - worldPos.x * newZoom, mouseY - worldPos.y * newZoom);
            }, { passive: false });
            app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            regenerateWorld(); setSummary(getMapEngine().currentSummary); app.ticker.add(renderLoop);
        };
        init();
        return () => { clearTimeout(timeoutId); if (resizeCleanupRef.current) resizeCleanupRef.current(); appRef.current?.destroy({ removeView: true }); appRef.current = null; };
    }, []);

    // RENDER LOOP
    const renderLoop = useCallback(() => {
        const staticG = staticGraphicsRef.current;
        const uiG = uiGraphicsRef.current;
        const app = appRef.current;
        if (!staticG || staticG.destroyed || !uiG || !app || !app.renderer) return;
        setDebugFPS(Math.round(app.ticker.FPS));
        const engine = getMapEngine();
        const currentMode = viewModeRef.current;
        const isGridVisible = showGridRef.current;

        if (engine.revision !== lastRenderedRevision.current || currentMode !== lastViewMode.current) {
            staticG.clear();
            const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
            const water = engine.getLayer(LayerType.WATER);
            const biomes = engine.biomes;
            const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const i = y * GRID_SIZE + x;
                    const pos = gridToScreen(x, y);
                    const biome = biomes[i];
                    let fillColor = 0x000000;
                    let strokeAlpha = 0;

                    // Terrain Logic (Inchangé)
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
                        else if (currentMode === 'WATER' && water[i] > 0.01) fillColor = COLORS.WATER_RES;
                        else if (currentMode === 'FOOD' && (fish[i] > 0.01 || animals[i] > 0.01)) fillColor = COLORS.FOOD;
                    }

                    staticG.beginPath();
                    staticG.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    staticG.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    staticG.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    staticG.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    staticG.closePath();
                    staticG.fill({ color: fillColor });
                    if (strokeAlpha > 0) staticG.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });

                    // --- LOGIQUE DE DESSIN DES ROUTES (MULTI-COUCHES & HIGH CONTRAST) ---
                    if (engine.roadLayer && engine.roadLayer[i]) {
                        const road = engine.roadLayer[i];
                        if (road) {
                            const specs = ROAD_SPECS[road.type];
                            if (!specs) continue;

                            const cx = pos.x; const cy = pos.y;
                            const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
                            const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
                            const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
                            const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

                            const drawLine = (width: number, color: number, alpha: number = 1) => {
                                staticG.beginPath();
                                if (road.connections.n) { staticG.moveTo(cx, cy); staticG.lineTo(cx + n_dx, cy + n_dy); }
                                if (road.connections.s) { staticG.moveTo(cx, cy); staticG.lineTo(cx + s_dx, cy + s_dy); }
                                if (road.connections.e) { staticG.moveTo(cx, cy); staticG.lineTo(cx + e_dx, cy + e_dy); }
                                if (road.connections.w) { staticG.moveTo(cx, cy); staticG.lineTo(cx + w_dx, cy + w_dy); }
                                staticG.stroke({ width, color, alpha, cap: 'round', join: 'round' });
                            };

                            const baseWidth = specs.width;
                            const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : specs.color;

                            // 1. BASE (Largeur maximale)
                            drawLine(baseWidth, baseColor, 1);

                            // 2. DÉTAILS DE SURFACE (Layering)
                            if (road.type === RoadType.HIGHWAY) {
                                // 6 voies: Noir(44) -> Gris(34) -> Noir(32) -> Gris(22) -> Noir(20) -> Béton(2)
                                drawLine(baseWidth - 10, 0x666666, 0.5); // Séparateurs extérieurs
                                drawLine(baseWidth - 12, 0x111111, 1);   // Voies médianes
                                drawLine(baseWidth - 22, 0x666666, 0.5); // Séparateurs intérieurs
                                drawLine(baseWidth - 24, 0x111111, 1);   // Voies centrales
                                drawLine(2, 0xCCCCCC, 1);                // Béton central
                            }
                            else if (road.type === RoadType.AVENUE) {
                                // 4 voies: Gris(32) -> Vert(12) -> Blanc(2)
                                // Bande verte très large pour être visible
                                drawLine(12, 0x2E7D32, 1);
                                // Lignes blanches autour du vert
                                drawLine(14, 0xFFFFFF, 0.4);
                            }
                            else if (road.type === RoadType.ASPHALT) {
                                // 2 voies: Gris(20) -> Jaune(1)
                                drawLine(1, 0xFFD700, 0.8);
                            }
                            else if (road.type === RoadType.DIRT) {
                                // Terre(12) -> Ornière(4)
                                drawLine(4, 0x3E2723, 0.3);
                            }

                            // 3. DÉCORATIONS (PROPS)
                            const seed = (i * 9301 + 49297) % 233280;

                            // A. CHEMIN DE TERRE : Poteaux bois (RARE, PAS DE LUMIÈRE)
                            if (road.type === RoadType.DIRT && (seed % 100) < 15) {
                                const sideOffset = 8; const poleH = 5;
                                staticG.beginPath(); staticG.moveTo(cx + sideOffset, cy); staticG.lineTo(cx + sideOffset, cy - poleH);
                                staticG.stroke({ width: 2, color: 0x5D4037 });
                            }

                            // B. ASPHALTE : Lampadaires Jaunes
                            if (road.type === RoadType.ASPHALT && (seed % 100) < 50) {
                                const sideOffset = 11; const lampH = 12;
                                staticG.beginPath(); staticG.moveTo(cx + sideOffset, cy); staticG.lineTo(cx + sideOffset, cy - lampH); staticG.stroke({ width: 1, color: 0x555555 });
                                staticG.beginPath(); staticG.circle(cx + sideOffset, cy - lampH, 2); staticG.fill({ color: 0xFFD700 });
                            }

                            // C. AVENUE : Arbres + Lampadaires Blancs
                            if (road.type === RoadType.AVENUE) {
                                // ARBRES
                                if ((seed % 100) < 70) {
                                    staticG.beginPath(); staticG.circle(cx, cy - 6, 5); staticG.fill({ color: 0x388E3C }); // Feuillage plus gros
                                }
                                // LAMPADAIRES MODERNES
                                if ((seed % 100) > 40) {
                                    const sideOffset = 18; const lampH = 16;
                                    // Gauche
                                    staticG.beginPath(); staticG.moveTo(cx - sideOffset, cy); staticG.lineTo(cx - sideOffset, cy - lampH); staticG.stroke({ width: 1, color: 0xCCCCCC });
                                    staticG.beginPath(); staticG.circle(cx - sideOffset, cy - lampH, 2); staticG.fill({ color: 0xFFFFFF });
                                    // Droite
                                    staticG.beginPath(); staticG.moveTo(cx + sideOffset, cy); staticG.lineTo(cx + sideOffset, cy - lampH); staticG.stroke({ width: 1, color: 0xCCCCCC });
                                    staticG.beginPath(); staticG.circle(cx + sideOffset, cy - lampH, 2); staticG.fill({ color: 0xFFFFFF });
                                }
                            }
                        }
                    }
                }
            }
            lastRenderedRevision.current = engine.revision;
            lastViewMode.current = currentMode;
        }

        uiG.clear();

        // VEHICLES - Rendu
        engine.updateVehicles();
        engine.vehicles.forEach(car => {
            const screenPos = gridToScreen(car.x, car.y);
            let offsetX = 0; let offsetY = 0;
            if (car.path && car.targetIndex < car.path.length) {
                const targetIdx = car.path[car.targetIndex];
                const tx = targetIdx % GRID_SIZE; const ty = Math.floor(targetIdx / GRID_SIZE);
                const dx = tx - car.x; const dy = ty - car.y; const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0.01) {
                    const ux = dx / len; const uy = dy / len;
                    const OFFSET_AMOUNT = 8;
                    const p1 = gridToScreen(0, 0); const p2 = gridToScreen(ux, uy);
                    const screenDx = p2.x - p1.x; const screenDy = p2.y - p1.y;
                    const screenLen = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
                    if (screenLen > 0) {
                        const perpX = -screenDy / screenLen; const perpY = screenDx / screenLen;
                        offsetX = perpX * OFFSET_AMOUNT; offsetY = perpY * OFFSET_AMOUNT;
                    }
                }
            }
            const finalX = screenPos.x + offsetX; const finalY = screenPos.y + offsetY;
            uiG.beginFill(car.color); uiG.drawCircle(finalX, finalY, 4); uiG.endFill();
            uiG.beginFill(0xFFFFFF); uiG.drawCircle(finalX + offsetX * 0.5, finalY + offsetY * 0.5, 1.5); uiG.endFill();
        });

        // Highlight & Preview
        const highlightPos = gridToScreen(cursorPos.x, cursorPos.y);
        uiG.lineStyle(2, COLORS.HIGHLIGHT, 1);
        uiG.beginPath(); uiG.moveTo(highlightPos.x, highlightPos.y - TILE_HEIGHT / 2); uiG.lineTo(highlightPos.x + TILE_WIDTH / 2, highlightPos.y); uiG.lineTo(highlightPos.x, highlightPos.y + TILE_HEIGHT / 2); uiG.lineTo(highlightPos.x - TILE_WIDTH / 2, highlightPos.y); uiG.closePath(); uiG.stroke();

        if (previewPathRef.current.length > 0) {
            for (const idx of previewPathRef.current) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE); const pos = gridToScreen(x, y);
                let color = COLORS.ROAD_PREVIEW_VALID;
                const engine = getMapEngine();
                const check = RoadManager.checkTile(engine, idx, null);

                // --- VISUALISATION DU BLOCAGE (ROUGE SI INVALIDE) ---
                if (currentMode === 'BULLDOZER') { color = 0xFF0000; }
                else if (!check.valid) { color = COLORS.ROAD_PREVIEW_INVALID; } // Rouge si eau ou invalide
                else if (check.isBridge) { color = COLORS.ROAD_BRIDGE; }

                uiG.beginPath(); uiG.moveTo(pos.x, pos.y - TILE_HEIGHT / 2); uiG.lineTo(pos.x + TILE_WIDTH / 2, pos.y); uiG.lineTo(pos.x, pos.y + TILE_HEIGHT / 2); uiG.lineTo(pos.x - TILE_WIDTH / 2, pos.y); uiG.closePath(); uiG.fill({ color, alpha: 0.6 });
            }
        }
    }, [cursorPos]);

    const handleRegenerate = () => { regenerateWorld(); setSummary(getMapEngine().currentSummary); };
    const ResourceBar = ({ label, value, color }: any) => (<div className="flex items-center gap-2 text-xs mb-1"> <span className="w-16 text-gray-400 font-bold uppercase">{label}</span> <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden"> <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }}></div> </div> <span className="w-8 text-right text-white">{Math.round(value)}%</span> </div>);

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black z-0 overflow-hidden">
            <div ref={pixiContainerRef} className="absolute inset-0" />
            <div className="absolute top-2 right-2 text-xs text-green-500 font-mono z-20 flex flex-col items-end pointer-events-none"><span>FPS: {debugFPS}</span><span className="text-yellow-400">{t('ui.coords')}: {cursorPos.x}, {cursorPos.y}</span></div>
            {viewMode === 'BUILD_ROAD' && totalCost > 0 && (<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-in fade-in zoom-in duration-200"><div className={`px-4 py-2 rounded-full font-bold text-white shadow-xl backdrop-blur-md border border-white/20 ${isValidBuild ? 'bg-green-600/90' : 'bg-red-600/90'}`}>{isValidBuild ? `Coût: $${totalCost}` : "Construction Impossible"}</div></div>)}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-gray-900/90 p-2 rounded border border-gray-700 shadow-xl backdrop-blur-md">
                <button onClick={() => setViewMode('BUILD_ROAD')} className={`text-left px-3 py-1.5 text-xs font-bold rounded mb-1 border ${viewMode === 'BUILD_ROAD' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>🚧 CONSTRUCTION ROUTE</button>
                {viewMode === 'BUILD_ROAD' && (
                    <div className="flex flex-col gap-1 ml-2 mb-2 pl-2 border-l border-gray-600">
                        {/* ITERATION SUR LES CLES DIRECTEMENT */}
                        {(Object.keys(ROAD_SPECS) as RoadType[]).map((type) => (
                            <button key={type} onClick={() => setSelectedRoadType(type)} className={`text-left px-2 py-1 text-[10px] font-bold rounded border transition-all flex items-center gap-2 ${selectedRoadType === type ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' : 'text-gray-400 border-transparent hover:text-white'}`}>
                                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: `#${ROAD_SPECS[type].color.toString(16).padStart(6, '0')}` }}></div>
                                <span>{ROAD_SPECS[type].label}</span><span className="text-gray-500 ml-auto">${ROAD_SPECS[type].cost}</span>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={() => setViewMode('BULLDOZER')} className={`text-left px-3 py-1.5 text-xs font-bold rounded mb-2 border ${viewMode === 'BULLDOZER' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>💣 BULLDOZER</button>
                <button onClick={() => { const success = getMapEngine().spawnTraffic(50); if (!success && getMapEngine().vehicles.length === 0) alert("Construisez plus de routes connectées d'abord !"); }} className="text-left px-3 py-1.5 text-xs font-bold rounded mb-2 border bg-purple-600 text-white border-purple-500 hover:bg-purple-500">🚗 TRAFIC (x50)</button>
                <div className="h-px bg-gray-700 my-1"></div>
                {[{ id: 'ALL', label: t('layers.satellite') }, { id: 'OIL', label: t('layers.oil') }, { id: 'COAL', label: t('layers.coal') }, { id: 'IRON', label: t('layers.iron') }, { id: 'WOOD', label: t('layers.forests') }, { id: 'FOOD', label: t('layers.food') }, { id: 'WATER', label: t('layers.water') }].map(l => (<button key={l.id} onClick={() => setViewMode(l.id as ViewMode)} className={`text-left px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${viewMode === l.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>{l.label}</button>))}
            </div>
            {/* Info Panel & Summary (Inchangé) */}
            <div className="absolute top-4 right-4 z-10 w-64 pointer-events-none"> <div className="bg-black/80 backdrop-blur border border-gray-700 rounded p-2 mb-2 flex justify-between items-center text-xs font-mono text-gray-400"> <span>{t('ui.coords')}: [{cursorPos.x}, {cursorPos.y}]</span> {hoverInfo && <span className="text-white font-bold">{hoverInfo.biomeName}</span>} </div> {hoverInfo && hoverInfo.resourceKey ? (<div className="bg-gray-900/95 backdrop-blur border border-blue-500/50 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-top-2"> <div className="flex justify-between items-start mb-2"> <div> <h4 className="text-sm text-gray-400 uppercase tracking-wider text-[10px]">{t('ui.potential')}</h4> <h2 className="text-xl font-bold text-white leading-tight">{t(`resources.${hoverInfo.resourceKey}`)}</h2> </div> <div className="bg-blue-900 text-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700">{t('ui.level_short')} {hoverInfo.techReq}</div> </div> <div className="my-3"> <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{formatNumber(hoverInfo.amount)}</span> <span className="text-sm text-gray-400 ml-1">{t(`units.${hoverInfo.unitKey}`)}</span> </div> <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1"> <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-300" style={{ width: `${Math.min(100, hoverInfo.value * 100)}%` }} /> </div> </div>) : (<div className="bg-black/60 backdrop-blur border border-gray-800 rounded-lg p-4 text-center"> <p className="text-gray-500 text-xs italic">{t('resources.none')}</p> </div>)} </div>
            {summary && (<div className="absolute bottom-4 left-4 z-10 bg-gray-900/95 p-4 rounded-lg border border-gray-600 shadow-2xl w-64 backdrop-blur-sm pointer-events-none"> <h3 className="text-sm font-bold text-white mb-3 border-b border-gray-700 pb-2">{t('ui.data_title')}</h3> <ResourceBar label={t('resources.oil')} value={summary.oil} color="#ffd700" /> <ResourceBar label={t('resources.coal')} value={summary.coal} color="#212121" /> <ResourceBar label={t('resources.iron')} value={summary.iron} color="#ff5722" /> <ResourceBar label={t('resources.wood')} value={summary.wood} color="#00c853" /> <ResourceBar label={t('resources.water')} value={summary.water} color="#29b6f6" /> </div>)}
            <button onClick={handleRegenerate} className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded shadow-lg pointer-events-auto">🎲 GÉNÉRER</button>
        </div>
    );
}