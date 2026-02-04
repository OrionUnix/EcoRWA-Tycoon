'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { LayerType, BiomeType } from '../engine/types';
import { getResourceAtTile, ResourceInfo } from '../utils/resourceUtils';

const COLORS = {
    BG: 0x111111,
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,

    WHITE_MODEL: 0xf5f5f5,
    WATER_MODEL: 0xb3e5fc,

    OIL: 0xffd700,
    COAL: 0x212121,
    IRON: 0xff5722,
    WOOD: 0x43a047,
    FOOD: 0xff3366,
    WATER_RES: 0x0000ff
};

type ViewMode = 'ALL' | 'WATER' | 'OIL' | 'COAL' | 'IRON' | 'WOOD' | 'FOOD';

const BIOME_NAMES = {
    [BiomeType.DEEP_OCEAN]: 'MER', [BiomeType.OCEAN]: 'CÔTE', [BiomeType.BEACH]: 'PLAGE',
    [BiomeType.DESERT]: 'DÉSERT', [BiomeType.PLAINS]: 'PLAINE', [BiomeType.FOREST]: 'FORÊT',
    [BiomeType.MOUNTAIN]: 'MONTAGNE', [BiomeType.SNOW]: 'NEIGE',
};

export default function GameCanvas() {
    const t = useTranslations('Game');
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const graphicsRef = useRef<PIXI.Graphics | null>(null);

    const viewState = useRef({ x: 0, y: 0, zoom: INITIAL_ZOOM, isDragging: false, lastMouse: { x: 0, y: 0 } });
    const lastHoverUpdate = useRef(0);

    const [viewMode, setViewMode] = useState<ViewMode>('ALL');
    const [showGrid, setShowGrid] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<ResourceInfo & { biomeName: string } | null>(null);
    const [debugFPS, setDebugFPS] = useState(0);
    const [summary, setSummary] = useState<any>(null);

    // Fonction Helper
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(num);
    };

    // 1. INIT PIXI
    useEffect(() => {
        if (!pixiContainerRef.current || typeof window === 'undefined') return;
        if (appRef.current) return;

        const init = async () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            const app = new PIXI.Application();
            await app.init({
                width, height, backgroundColor: COLORS.BG, antialias: true, resolution: window.devicePixelRatio || 1
            });

            // --- CORRECTION TYPE SCRIPT ---
            // On vérifie que le ref existe toujours après le 'await'
            if (!pixiContainerRef.current) {
                app.destroy();
                return;
            }

            pixiContainerRef.current.appendChild(app.canvas);
            appRef.current = app;

            const stage = new PIXI.Container();
            const graphics = new PIXI.Graphics();
            stage.addChild(graphics);
            app.stage.addChild(stage);
            graphicsRef.current = graphics;

            const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
            viewState.current.x = (width / 2) - (center.x * INITIAL_ZOOM);
            viewState.current.y = (height / 2) - (center.y * INITIAL_ZOOM);
            stage.position.set(viewState.current.x, viewState.current.y);
            stage.scale.set(INITIAL_ZOOM);

            regenerateWorld();
            setSummary(getMapEngine().currentSummary);
            drawMap();
        };
        init();
        return () => { appRef.current?.destroy({ removeView: true }); appRef.current = null; };
    }, []);

    // 2. RENDER LOOP
    const drawMap = useCallback(() => {
        const g = graphicsRef.current;
        if (!g || g.destroyed) return;
        if (appRef.current) setDebugFPS(Math.round(appRef.current.ticker.FPS));

        g.clear();
        const engine = getMapEngine();
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

                if (viewMode === 'ALL') {
                    if (biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.DEEP_OCEAN;
                    else if (biome === BiomeType.OCEAN) fillColor = COLORS.OCEAN;
                    else if (biome === BiomeType.BEACH) fillColor = COLORS.BEACH;
                    else if (biome === BiomeType.FOREST) fillColor = COLORS.FOREST;
                    else if (biome === BiomeType.DESERT) fillColor = COLORS.DESERT;
                    else if (biome === BiomeType.MOUNTAIN) fillColor = COLORS.MOUNTAIN;
                    else if (biome === BiomeType.SNOW) fillColor = COLORS.SNOW;
                    else fillColor = getVariation(i) ? COLORS.PLAINS : COLORS.PLAINS_VAR;

                    if (showGrid) strokeAlpha = 0.1;
                } else {
                    // DATA MODE
                    fillColor = COLORS.WHITE_MODEL;
                    if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.WATER_MODEL;
                    strokeAlpha = 0.15;

                    if (viewMode === 'OIL' && oil[i] > 0.1) fillColor = COLORS.OIL;
                    else if (viewMode === 'COAL' && coal[i] > 0.1) fillColor = COLORS.COAL;
                    else if (viewMode === 'IRON' && iron[i] > 0.1) fillColor = COLORS.IRON;
                    else if (viewMode === 'WOOD' && wood[i] > 0.1) fillColor = COLORS.WOOD;
                    else if (viewMode === 'WATER' && water[i] > 0.1) fillColor = COLORS.WATER_RES;
                    else if (viewMode === 'FOOD') {
                        if (fish[i] > 0.1 || animals[i] > 0.1) fillColor = COLORS.FOOD;
                    }
                }

                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();

                g.fill({ color: fillColor });
                if (strokeAlpha > 0) g.stroke({ width: 1, color: 0x999999, alpha: strokeAlpha });
            }
        }
    }, [viewMode, showGrid]);

    useEffect(() => { if (appRef.current) drawMap(); }, [viewMode, showGrid, drawMap]);

    // 3. INPUTS
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!appRef.current) return;
            const stage = appRef.current.stage.children[0];
            const zoomSpeed = 0.001;
            let newZoom = viewState.current.zoom * (1 - e.deltaY * zoomSpeed);
            newZoom = Math.max(0.1, Math.min(4.0, newZoom));
            viewState.current.zoom = newZoom;
            stage.scale.set(newZoom);
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calcul position Monde
            const worldPos = {
                x: (mouseX - viewState.current.x) / viewState.current.zoom,
                y: (mouseY - viewState.current.y) / viewState.current.zoom
            };

            viewState.current.x = mouseX - worldPos.x * newZoom;
            viewState.current.y = mouseY - worldPos.y * newZoom;
            stage.position.set(viewState.current.x, viewState.current.y);
        };

        const handleMouseDown = (e: MouseEvent) => { viewState.current.isDragging = true; viewState.current.lastMouse = { x: e.clientX, y: e.clientY }; };

        const handleMouseMove = (e: MouseEvent) => {
            const app = appRef.current;
            if (!app) return;
            const stage = app.stage.children[0];

            if (viewState.current.isDragging) {
                const dx = e.clientX - viewState.current.lastMouse.x;
                const dy = e.clientY - viewState.current.lastMouse.y;
                viewState.current.x += dx;
                viewState.current.y += dy;
                viewState.current.lastMouse = { x: e.clientX, y: e.clientY };
                stage.position.set(viewState.current.x, viewState.current.y);
            }

            // TOOLTIP LOGIC
            const now = Date.now();
            if (now - lastHoverUpdate.current > 40) {
                lastHoverUpdate.current = now;

                // Utilisation de toLocal pour corriger le décalage
                const localPos = stage.toLocal({ x: e.clientX, y: e.clientY });
                const gridPos = screenToGrid(localPos.x, localPos.y);
                setCursorPos(gridPos);

                const engine = getMapEngine();
                if (gridPos.x >= 0 && gridPos.x < engine.config.size && gridPos.y >= 0 && gridPos.y < engine.config.size) {
                    const idx = gridPos.y * engine.config.size + gridPos.x;
                    const biome = engine.biomes[idx] as BiomeType;
                    const info = getResourceAtTile(engine, idx, viewMode);
                    setHoverInfo(info ? { ...info, biomeName: BIOME_NAMES[biome] || '' } : null);
                } else {
                    setHoverInfo(null);
                }
            }
        };
        const handleMouseUp = () => { viewState.current.isDragging = false; };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', e => e.preventDefault());
        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', e => e.preventDefault());
        };
    }, [viewMode]);

    const handleRegenerate = () => {
        regenerateWorld();
        setSummary(getMapEngine().currentSummary);
        drawMap();
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

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <div ref={pixiContainerRef} className="absolute inset-0" />
            <div className="absolute top-2 right-2 text-xs text-green-500 font-mono z-20">FPS: {debugFPS}</div>

            {/* UI GAUCHE */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-gray-900/90 p-2 rounded border border-gray-700 shadow-xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                    <h3 className="text-xs text-blue-400 font-bold uppercase px-1">Vues</h3>
                    <button onClick={() => setShowGrid(!showGrid)} className={`text-[10px] px-2 py-0.5 rounded border ${showGrid ? 'bg-blue-600 text-white border-blue-500' : 'text-gray-400 border-gray-600'}`}>#</button>
                </div>
                {[
                    { id: 'ALL', label: '🌍 Satellite' },
                    { id: 'OIL', label: '🛢️ Pétrole' },
                    { id: 'COAL', label: '🪨 Charbon' },
                    { id: 'IRON', label: '🔩 Fer' },
                    { id: 'WOOD', label: '🌲 Forêts' },
                    { id: 'FOOD', label: '🍖 Nourriture' },
                    { id: 'WATER', label: '💧 Eau' },
                ].map(l => (
                    <button key={l.id} onClick={() => setViewMode(l.id as ViewMode)}
                        className={`text-left px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${viewMode === l.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        {l.label}
                    </button>
                ))}
            </div>

            {/* UI BAS GAUCHE (RAPPORT) */}
            {summary && (
                <div className="absolute bottom-4 left-4 z-10 bg-gray-900/95 p-4 rounded-lg border border-gray-600 shadow-2xl w-64 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white mb-3 border-b border-gray-700 pb-2">RAPPORT GÉOLOGIQUE</h3>
                    <ResourceBar label="Pétrole" value={summary.oil} color="#ffd700" />
                    <ResourceBar label="Charbon" value={summary.coal} color="#212121" />
                    <ResourceBar label="Fer" value={summary.iron} color="#ff5722" />
                    <ResourceBar label="Bois" value={summary.wood} color="#00c853" />
                    <ResourceBar label="Eau" value={summary.water} color="#29b6f6" />
                </div>
            )}

            {/* UI DROITE (TOOLTIP) */}
            <div className="absolute top-4 right-4 z-10 w-64 pointer-events-none">
                {/* Boite Coordonnées */}
                <div className="bg-black/80 backdrop-blur border border-gray-700 rounded p-2 mb-2 flex justify-between items-center text-xs font-mono text-gray-400">
                    <span>XY: [{cursorPos.x}, {cursorPos.y}]</span>
                    {hoverInfo?.biomeName && (
                        <span className="text-white font-bold">{hoverInfo.biomeName}</span>
                    )}
                </div>

                {/* Boite Détail Ressource */}
                {hoverInfo ? (
                    <div className="bg-gray-900/95 backdrop-blur border border-blue-500/50 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-sm text-gray-400 uppercase tracking-wider text-[10px]">
                                    {t('ui.potential')}
                                </h4>
                                <h2 className="text-xl font-bold text-white leading-tight">
                                    {t(`resources.${hoverInfo.resourceKey}`)}
                                </h2>
                            </div>
                            <div className="bg-blue-900 text-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700">
                                {t('ui.level_short')} {hoverInfo.techReq}
                            </div>
                        </div>

                        <div className="my-3">
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                {formatNumber(hoverInfo.amount)}
                            </span>
                            <span className="text-sm text-gray-400 ml-1">
                                {t(`units.${hoverInfo.unitKey}`)}
                            </span>
                        </div>

                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-300"
                                style={{ width: `${Math.min(100, hoverInfo.value * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>Pauvre</span>
                            <span>Abondant</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-black/60 backdrop-blur border border-gray-800 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-xs italic">{t('resources.none')}</p>
                    </div>
                )}
            </div>

            <button onClick={handleRegenerate} className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded shadow-lg pointer-events-auto">
                🎲 GÉNÉRER
            </button>
        </div>
    );
}