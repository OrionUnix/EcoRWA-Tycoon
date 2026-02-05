'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';

import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { gridToScreen, screenToGrid } from '../engine/isometric';
import { GRID_SIZE, INITIAL_ZOOM, TILE_HEIGHT, TILE_WIDTH } from '../engine/config';
import { RoadType, ZoneType, PlayerResources } from '../engine/types';
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
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);

    // REFS (Pour PixiLoop)
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    const startDragTileRef = useRef<{ x: number, y: number } | null>(null);
    const previewPathRef = useRef<number[]>([]);

    // --- REFS POUR LA BOUCLE DE JEU (EVITE LES CLOSURES STALES) ---
    const viewModeRef = useRef<ViewMode>('ALL');
    const selectedRoadTypeRef = useRef(selectedRoadType);
    const selectedZoneTypeRef = useRef(selectedZoneType);
    const isValidBuildRef = useRef(true);

    // Cache pour le rendu
    const lastRenderedRevision = useRef(-1);
    const lastViewMode = useRef<ViewMode>('ALL');

    // Synchro Refs
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
            // Zone de hit géante pour attraper les clics partout
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

            // Fonction de centrage robuste
            const centerCamera = () => {
                if (!app.renderer) return;
                app.resize(); // Force le recalcul des dimensions

                const screenW = app.screen.width;
                const screenH = app.screen.height;

                // Le centre de la grille (en pixels isométriques)
                const centerGrid = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);

                // On positionne le stage pour que le centre de la grille soit au centre de l'écran
                stage.position.set(
                    (screenW / 2) - (centerGrid.x * INITIAL_ZOOM),
                    (screenH / 2) - (centerGrid.y * INITIAL_ZOOM)
                );
                stage.scale.set(INITIAL_ZOOM);
            };

            // Centrage immédiat + différé (pour être sûr)
            centerCamera();
            setTimeout(centerCamera, 100);

            // Gestionnaire de redimensionnement fenêtre
            window.addEventListener('resize', () => {
                app.resize();
            });

            // Events
            setupEvents(stage, app);

            regenerateWorld();
            const engine = getMapEngine();
            setSummary(engine.currentSummary);
            setPlayerResources({ ...engine.resources });

            app.ticker.add(gameLoop);
        };
        init();
        return () => { appRef.current?.destroy({ removeView: true }); };
    }, []);

    // EVENTS SOURIS
    const setupEvents = (stage: PIXI.Container, app: PIXI.Application) => {
        let isDraggingCam = false;
        let lastX = 0;
        let lastY = 0;

        const getGridPos = (gx: number, gy: number) => {
            const local = stage.toLocal({ x: gx, y: gy });
            return screenToGrid(local.x, local.y);
        };

        stage.on('pointerdown', (e) => {
            // Clic gauche (0)
            if (e.button === 0) {
                // Si on est en mode construction, on commence le drag de tuiles
                if (['BUILD_ROAD', 'BULLDOZER', 'ZONE'].includes(viewModeRef.current)) {
                    startDragTileRef.current = getGridPos(e.global.x, e.global.y);
                } else {
                    // Sinon on déplace la caméra
                    isDraggingCam = true;
                    lastX = e.global.x;
                    lastY = e.global.y;
                }
            } else {
                // Clic droit ou molette : déplacement caméra aussi
                isDraggingCam = true;
                lastX = e.global.x;
                lastY = e.global.y;
            }
        });

        stage.on('pointermove', (e) => {
            const gridPos = getGridPos(e.global.x, e.global.y);
            setCursorPos(prev => (prev.x === gridPos.x && prev.y === gridPos.y) ? prev : gridPos);

            if (isDraggingCam) {
                // Déplacement caméra
                const dx = e.global.x - lastX;
                const dy = e.global.y - lastY;
                stage.position.x += dx;
                stage.position.y += dy;
                lastX = e.global.x;
                lastY = e.global.y;
            } else {
                // Mode Construction : Prévisualisation
                if (startDragTileRef.current) {
                    const path = RoadManager.getPreviewPath(startDragTileRef.current.x, startDragTileRef.current.y, gridPos.x, gridPos.y);
                    previewPathRef.current = path;

                    if (viewModeRef.current === 'BUILD_ROAD') {
                        // Calc cost & validity
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
                    // Hover Info
                    updateHoverInfo(gridPos);
                }
            }
        });

        const handlePointerUp = () => {
            isDraggingCam = false;

            // Validation construction
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
        stage.on('pointerupoutside', handlePointerUp); // Important si on relâche hors du canvas

        app.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            // Zoom centré sur la souris
            const rect = app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Position monde avant zoom
            const worldPos = {
                x: (mouseX - stage.position.x) / stage.scale.x,
                y: (mouseY - stage.position.y) / stage.scale.y
            };

            const newScale = Math.max(0.1, Math.min(5, stage.scale.x * (1 - e.deltaY * zoomSpeed)));
            stage.scale.set(newScale);

            // Ajuster la position pour que le point sous la souris ne bouge pas
            stage.position.set(
                mouseX - worldPos.x * newScale,
                mouseY - worldPos.y * newScale
            );
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

    // GAME LOOP PRINCIPALE
    const gameLoop = () => {
        if (!appRef.current || !staticGRef.current || !uiGRef.current) return;
        const app = appRef.current;
        const engine = getMapEngine();

        setDebugFPS(Math.round(app.ticker.FPS));

        // 1. Tick logique (Simulation)
        engine.tick();
        if (app.ticker.lastTime % 30 < 1) setPlayerResources({ ...engine.resources });

        const currentViewMode = viewModeRef.current;

        // 2. Rendu Statique
        if (engine.revision !== lastRenderedRevision.current || currentViewMode !== lastViewMode.current) {
            GameRenderer.renderStaticLayer(staticGRef.current, engine, currentViewMode, false);
            lastRenderedRevision.current = engine.revision;
            lastViewMode.current = currentViewMode;
        }

        // 3. Rendu Dynamique
        GameRenderer.renderDynamicLayer(
            uiGRef.current,
            engine,
            cursorPos,
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
                onSpawnTraffic={() => getMapEngine().spawnTraffic(50)}
                onRegenerate={() => { regenerateWorld(); getMapEngine().revision++; }}
            />
        </div>
    );
}