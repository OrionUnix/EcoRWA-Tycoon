'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { GRID_SIZE, INITIAL_ZOOM, TILE_HEIGHT, TILE_WIDTH } from '../engine/config';
import { RoadType, ZoneType, PlayerResources, CityStats } from '../engine/types';
import { getResourceAtTile } from '../utils/resourceUtils';
import { RoadManager } from '../engine/RoadManager';
import { BuildingManager } from '../engine/BuildingManager';

// IMPORTS LOCAUX
import { GameRenderer, COLORS } from './GameRenderer';
import GameUI from './GameUI';

type ViewMode = 'ALL' | 'WATER' | 'OIL' | 'COAL' | 'IRON' | 'WOOD' | 'FOOD' | 'BUILD_ROAD' | 'BULLDOZER' | 'ZONE';

export default function GameCanvas() {
    const t = useTranslations('Game');

    // STATES
    const [viewMode, setViewMode] = useState<ViewMode>('ALL');
    const [selectedRoadType, setSelectedRoadType] = useState<RoadType>(RoadType.ASPHALT);
    const [selectedZoneType, setSelectedZoneType] = useState<ZoneType>(ZoneType.RESIDENTIAL);

    // UI Data
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [debugFPS, setDebugFPS] = useState(0);
    const [summary, setSummary] = useState<any>(null);
    const [playerResources, setPlayerResources] = useState<PlayerResources | null>(null);
    const [cityStats, setCityStats] = useState<CityStats | null>(null); // State for Stats
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);

    // REFS (For PixiLoop & Logic)
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    const startDragTileRef = useRef<{ x: number, y: number } | null>(null);
    const previewPathRef = useRef<number[]>([]);

    // --- REFS TO AVOID STALE CLOSURES IN LOOP ---
    const viewModeRef = useRef<ViewMode>('ALL');
    const selectedRoadTypeRef = useRef(selectedRoadType);
    const selectedZoneTypeRef = useRef(selectedZoneType);
    const isValidBuildRef = useRef(true);
    const cursorPosRef = useRef({ x: 0, y: 0 }); // New Ref for smoother cursor

    // Cache for rendering
    const lastRenderedRevision = useRef(-1);
    const lastViewMode = useRef<ViewMode>('ALL');

    // Sync Refs
    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
    useEffect(() => { selectedRoadTypeRef.current = selectedRoadType; }, [selectedRoadType]);
    useEffect(() => { selectedZoneTypeRef.current = selectedZoneType; }, [selectedZoneType]);

    // INIT PIXI
    useEffect(() => {
        if (!pixiContainerRef.current) return;
        const init = async () => {
            const app = new PIXI.Application();
            await app.init({
                resizeTo: window,
                backgroundColor: COLORS.BG,
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1
            });

            if (!pixiContainerRef.current) { app.destroy(); return; }

            pixiContainerRef.current.appendChild(app.canvas);
            app.canvas.style.position = 'absolute';
            app.canvas.style.width = '100%';
            app.canvas.style.height = '100%';
            app.canvas.style.display = 'block';

            appRef.current = app;

            const stage = new PIXI.Container();
            stage.sortableChildren = true;
            stage.hitArea = new PIXI.Rectangle(-1000000, -1000000, 2000000, 2000000);
            stage.eventMode = 'static';
            app.stage.addChild(stage);

            const staticG = new PIXI.Graphics();
            staticG.label = "Static";
            stage.addChild(staticG);
            staticGRef.current = staticG;

            const uiG = new PIXI.Graphics();
            uiG.label = "UI";
            uiG.zIndex = 100;
            stage.addChild(uiG);
            uiGRef.current = uiG;

            // Robust Camera Centering
            const centerCamera = () => {
                if (!app.renderer) return;
                app.resize();
                const screenW = app.screen.width;
                const screenH = app.screen.height;
                const centerGrid = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
                stage.position.set(
                    (screenW / 2) - (centerGrid.x * INITIAL_ZOOM),
                    (screenH / 2) - (centerGrid.y * INITIAL_ZOOM)
                );
                stage.scale.set(INITIAL_ZOOM);
            };

            centerCamera();
            setTimeout(centerCamera, 100);

            window.addEventListener('resize', () => { app.resize(); });

            // Setup Inputs
            setupEvents(stage, app);

            // Initial Generation
            regenerateWorld();
            const engine = getMapEngine();
            setSummary(engine.currentSummary);
            setPlayerResources({ ...engine.resources });

            // Start Loop
            app.ticker.add(gameLoop);
        };
        init();
        return () => { appRef.current?.destroy({ removeView: true }); };
    }, []);

    // EVENTS MOUSE
    const setupEvents = (stage: PIXI.Container, app: PIXI.Application) => {
        let isDraggingCam = false;
        let lastX = 0;
        let lastY = 0;

        const getGridPos = (gx: number, gy: number) => {
            const local = stage.toLocal({ x: gx, y: gy });
            return screenToGrid(local.x, local.y);
        };

        stage.on('pointerdown', (e) => {
            if (e.button === 0) {
                if (['BUILD_ROAD', 'BULLDOZER', 'ZONE'].includes(viewModeRef.current)) {
                    startDragTileRef.current = getGridPos(e.global.x, e.global.y);
                } else {
                    isDraggingCam = true;
                    lastX = e.global.x; lastY = e.global.y;
                }
            } else {
                isDraggingCam = true;
                lastX = e.global.x; lastY = e.global.y;
            }
        });

        stage.on('pointermove', (e) => {
            const gridPos = getGridPos(e.global.x, e.global.y);

            // Sync both State (for UI) and Ref (for Game Loop)
            if (gridPos.x !== cursorPosRef.current.x || gridPos.y !== cursorPosRef.current.y) {
                setCursorPos(gridPos);
                cursorPosRef.current = gridPos;
            }

            if (isDraggingCam) {
                const dx = e.global.x - lastX;
                const dy = e.global.y - lastY;
                stage.position.x += dx;
                stage.position.y += dy;
                lastX = e.global.x;
                lastY = e.global.y;
            } else {
                // Construction Preview Logic
                if (startDragTileRef.current) {
                    const path = RoadManager.getPreviewPath(startDragTileRef.current.x, startDragTileRef.current.y, gridPos.x, gridPos.y);
                    previewPathRef.current = path;

                    if (viewModeRef.current === 'BUILD_ROAD') {
                        let cost = 0; let valid = true;
                        const engine = getMapEngine();
                        path.forEach(idx => {
                            const check = RoadManager.checkTile(engine, idx, null);
                            if (!check.valid) valid = false;
                            cost += check.cost;
                        });
                        setTotalCost(cost);
                        setIsValidBuild(valid);
                        isValidBuildRef.current = valid;
                    }
                } else {
                    updateHoverInfo(gridPos);
                }
            }
        });

        const handlePointerUp = () => {
            isDraggingCam = false;
            if (startDragTileRef.current && previewPathRef.current.length > 0) {
                const engine = getMapEngine();
                const mode = viewModeRef.current;

                if (mode === 'BUILD_ROAD' && isValidBuildRef.current) {
                    previewPathRef.current.forEach(idx => engine.placeRoad(idx, selectedRoadTypeRef.current));
                } else if (mode === 'ZONE') {
                    previewPathRef.current.forEach(idx => engine.setZone(idx, selectedZoneTypeRef.current));
                } else if (mode === 'BULLDOZER') {
                    previewPathRef.current.forEach(idx => { engine.removeRoad(idx); engine.removeZone(idx); });
                }

                startDragTileRef.current = null;
                previewPathRef.current = [];
                setTotalCost(0);
                setSummary({ ...engine.currentSummary });
            }
        };

        stage.on('pointerup', handlePointerUp);
        stage.on('pointerupoutside', handlePointerUp);

        app.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const rect = app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = {
                x: (mouseX - stage.position.x) / stage.scale.x,
                y: (mouseY - stage.position.y) / stage.scale.y
            };
            const newScale = Math.max(0.1, Math.min(5, stage.scale.x * (1 - e.deltaY * zoomSpeed)));
            stage.scale.set(newScale);
            stage.position.set(mouseX - worldPos.x * newScale, mouseY - worldPos.y * newScale);
        }, { passive: false });

        app.canvas.addEventListener('contextmenu', e => e.preventDefault());
    };

    const updateHoverInfo = (gridPos: { x: number, y: number }) => {
        const engine = getMapEngine();
        if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
            const idx = gridPos.y * GRID_SIZE + gridPos.x;
            const info = getResourceAtTile(engine, idx, viewModeRef.current);
            setHoverInfo(info ? { ...info, biomeName: 'Biome' } : null);
        } else setHoverInfo(null);
    };

    // --- GAME LOOP ---
    const gameLoop = () => {
        if (!appRef.current || !staticGRef.current || !uiGRef.current) return;
        const app = appRef.current;
        const engine = getMapEngine();

        setDebugFPS(Math.round(app.ticker.FPS));

        // 1. Tick Logic
        engine.tick();

        // 2. Update React UI State (throttled)
        if (app.ticker.lastTime % 30 < 1) {
            setPlayerResources({ ...engine.resources });

            // Force React to detect change by spreading object
            if (engine.stats) {
                setCityStats({
                    ...engine.stats,
                    demand: { ...engine.stats.demand }
                });
            }
        }

        const currentViewMode = viewModeRef.current;

        // 3. Static Render (Only on change)
        if (engine.revision !== lastRenderedRevision.current || currentViewMode !== lastViewMode.current) {
            GameRenderer.renderStaticLayer(staticGRef.current, engine, currentViewMode, false);
            lastRenderedRevision.current = engine.revision;
            lastViewMode.current = currentViewMode;
        }

        // 4. Dynamic Render (Every frame)
        GameRenderer.renderDynamicLayer(
            uiGRef.current,
            engine,
            cursorPosRef.current, // Use Ref for smoothness
            previewPathRef.current,
            viewModeRef.current,
            isValidBuildRef.current
        );
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black z-0 overflow-hidden">
            <div ref={pixiContainerRef} className="absolute inset-0" />
            <GameUI
                t={t}
                viewMode={viewMode} setViewMode={setViewMode}
                selectedRoadType={selectedRoadType} setSelectedRoadType={setSelectedRoadType}
                selectedZoneType={selectedZoneType} setSelectedZoneType={setSelectedZoneType}
                totalCost={totalCost} isValidBuild={isValidBuild}
                fps={debugFPS} cursorPos={cursorPos} hoverInfo={hoverInfo}
                resources={playerResources} summary={summary}
                stats={cityStats}
                onSpawnTraffic={() => getMapEngine().spawnTraffic(50)}
                onRegenerate={() => { regenerateWorld(); getMapEngine().revision++; }}
            />
        </div>
    );
}