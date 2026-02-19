'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTranslations } from 'next-intl';

// --- IMPORTS MOTEUR ---
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { getGameEngine } from '../engine/GameEngine';
import { loadBiomeTextures, clearBiomeTextures } from '../engine/BiomeAssets';
import { ResourceAssets } from '../engine/ResourceAssets';
import { RoadAssets } from '../engine/RoadAssets';
import { VehicleAssets } from '../engine/VehicleAssets';
import { BuildingAssets } from '../engine/BuildingAssets'; // Corrected Import
import { RoadType, ZoneType, BuildingType, ScreenType } from '../engine/types'; // Corrected Import
import { GRID_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../engine/config';

// --- IMPORTS UI ---
import GameUI from '../components/GameUI'; // Corrected Import
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { VehicleRenderer } from '../components/VehicleRenderer';
import { BuildingRenderer } from '../engine/BuildingRenderer';
import { GameRenderer, resetGameRenderer } from '../components/GameRenderer';
import { useECS } from '../hooks/useECS';

export default function UserTerminalClient() {
    // 1. LIENS ET REFS
    const containerRef = useRef<HTMLDivElement>(null);
    const { appRef, viewportRef, stageRef, isReady } = usePixiApp(containerRef);

    // Conteneurs Pixi (Layers)
    const terrainContainerRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    // 2. ÉTATS DE JEU
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);
    const [selectedBuilding, setSelectedBuilding] = useState(BuildingType.POWER_PLANT);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
    // UI State for ScreenType (GameUI expects this potentially, or handled internally)
    // NOTE: GameUI might not use ScreenType directly in props based on previous errors, but we keep it safe.

    // ÉTATS UI (Stats & Feedbacks)
    const [fps, setFps] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);
    const [resources, setResources] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);

    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true);

    // 3. CHARGEMENT INITIAL DES ASSETS (Robuste)
    useEffect(() => {
        let active = true;

        const initAssets = async () => {
            if (viewportRef.current) {
                const center = viewportRef.current.center;
                const zoom = viewportRef.current.scaled;
                getGameEngine().saveCameraState(center.x, center.y, zoom);
            }

            setIsReloading(true);

            clearBiomeTextures();
            ResourceAssets.clear(); // Fixed: ResourceAssets static clear
            RoadAssets.clear();     // Fixed: RoadAssets static clear
            VehicleAssets.clear();  // Fixed: VehicleAssets static clear
            VehicleRenderer.clearAll();
            BuildingRenderer.clearCache();
            if (terrainContainerRef.current) {
                ResourceRenderer.clearAll(terrainContainerRef.current);
            }

            resetGameRenderer();

            try {
                console.log("🚀 Page: Démarrage du chargement des assets...");
                if (!appRef.current) throw new Error("App Pixi non initialisée");

                await Promise.all([
                    loadBiomeTextures(appRef.current),
                    ResourceAssets.load(appRef.current), // Corrected: Static load
                    RoadAssets.load(appRef.current),     // Corrected: Static load
                    VehicleAssets.load(appRef.current),  // Corrected: Static load
                    BuildingAssets.load()                // Corrected: Static load (no app arg needed?) - Check BuildingAssets.ts content says static load() no args? 
                    // Let's re-verify BuildingAssets.ts content. It was static async load() { ... } with NO args.
                ]);

                if (active) {
                    console.log("✅ Page: Tous les assets sont chargés.");
                    const engine = getGameEngine();
                    const userWallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

                    if (engine.map.revision === 0) {
                        engine.map.generateWorld(userWallet);
                        engine.map.calculateSummary();
                    }

                    setSummary(engine.map.currentSummary);
                    setAssetsLoaded(true);
                    engine.map.revision++;
                    setIsReloading(false);
                }
            } catch (err) {
                console.error("❌ Page: Erreur lors du chargement des assets:", err);
                setIsReloading(false);
            }
        };

        if (isReady) {
            initAssets();
        }

        return () => {
            active = false;
            setAssetsLoaded(false);
            clearBiomeTextures();
            BuildingRenderer.clearCache();
        };
    }, [isReady]);

    // 4. CONFIGURATION DES CALQUES PIXI (Layers)
    useEffect(() => {
        if (isReady && viewportRef.current && assetsLoaded && !terrainContainerRef.current) {
            console.log("🎨 Page: Initialisation des Layers Pixi...");

            const viewport = viewportRef.current;
            const engine = getGameEngine();

            viewport.sortableChildren = true;

            const terrain = new PIXI.Container();
            terrain.sortableChildren = true;
            terrain.zIndex = 1;
            terrain.label = "terrain";

            const vectorLayer = new PIXI.Graphics();
            vectorLayer.zIndex = 100;

            const uiLayer = new PIXI.Graphics();
            uiLayer.zIndex = 200;

            viewport.addChild(terrain);
            viewport.addChild(vectorLayer);
            viewport.addChild(uiLayer);

            terrainContainerRef.current = terrain;
            staticGRef.current = vectorLayer;
            uiGRef.current = uiLayer;

            engine.map.revision++;

            setTimeout(() => {
                console.log("🔄 Force Redraw Initial...");
                engine.map.revision++;
            }, 200);

            // --- POSITIONNEMENT CAMÉRA (ROBUSTE) ---
            if (engine.lastCameraPosition) {
                console.log("🔄 Restauration de la caméra...", engine.lastCameraPosition);
                viewport.moveCenter(engine.lastCameraPosition.x, engine.lastCameraPosition.y);
                viewport.setZoom(engine.lastZoom);
            }
            else {
                // ✅ FORMULE UTILISATEUR RADICALE
                viewport.resize(window.innerWidth, window.innerHeight);

                const midTileX = GRID_SIZE / 2;
                const midTileY = GRID_SIZE / 2;

                // CenterX/Y = Coordonnées Monde du centre de la grille
                // (midX - midY) * (TILE_WIDTH / 2)
                const isoPixelX = (midTileX - midTileY) * (TILE_WIDTH / 2);
                const isoPixelY = (midTileX + midTileY) * (TILE_HEIGHT / 2);

                console.log(`📍 Centrage RADICAL: WorldCenter=(${isoPixelX}, ${isoPixelY}) Screen=(${window.innerWidth}, ${window.innerHeight})`);

                viewport.moveCenter(isoPixelX, isoPixelY);
                viewport.setZoom(1.0);

                viewport.off('moved');
                viewport.on('moved', () => {
                    const center = viewport.center;
                    getGameEngine().saveCameraState(center.x, center.y, viewport.scaled);
                });
            }
        }
    }, [isReady, assetsLoaded]);

    // 5. SAUVEGARDE DE LA CAMÉRA (Sur démontage)
    useEffect(() => {
        return () => {
            if (viewportRef.current) {
                const center = viewportRef.current.center;
                const zoom = viewportRef.current.scaled;
                getGameEngine().saveCameraState(center.x, center.y, zoom);
            }
        };
    }, []);

    // 6. INITIALISATION ECS & GAMELOOP
    const { updateECS } = useECS(isReady);
    const selectedBuildingTypeRef = useRef(BuildingType.POWER_PLANT);

    useEffect(() => {
        selectedBuildingTypeRef.current = selectedBuilding;
    }, [selectedBuilding]);

    useEffect(() => {
        if (viewMode !== 'ALL') {
            setSelectedBuildingId(null);
        }
    }, [viewMode]);

    useGameLoop(
        appRef,
        terrainContainerRef,
        staticGRef,
        uiGRef,
        isReady && assetsLoaded,
        isReloading,
        viewMode,
        cursorPos,
        previewPathRef,
        isValidBuildRef,
        setFps,
        setResources,
        setStats,
        selectedBuildingTypeRef,
        updateECS
    );

    useGameInput(
        viewportRef,
        appRef,
        isReady && assetsLoaded,
        viewMode,
        setViewMode,
        selectedRoad,
        selectedZone,
        selectedBuilding,
        setCursorPos,
        setHoverInfo,
        setTotalCost,
        setIsValidBuild,
        previewPathRef,
        isValidBuildRef,
        setSelectedBuildingId
    );

    const engine = getGameEngine();
    const t = useTranslations();

    return (
        <div style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            overflow: 'hidden'
        }}>
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1
                }}
            />

            {!assetsLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    backgroundColor: '#111',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <div className="loader"></div>
                    <h1 style={{ marginTop: '20px' }}>Génération du territoire...</h1>
                </div>
            )}

            {assetsLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <GameUI
                            t={t}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            selectedRoadType={selectedRoad}
                            setSelectedRoadType={setSelectedRoad}
                            selectedZoneType={selectedZone}
                            setSelectedZoneType={setSelectedZone}
                            selectedBuildingType={selectedBuilding}
                            setSelectedBuildingType={setSelectedBuilding}
                            totalCost={totalCost}
                            isValidBuild={isValidBuild}
                            fps={fps}
                            cursorPos={cursorPos}
                            hoverInfo={hoverInfo}
                            resources={resources}
                            stats={stats}
                            summary={summary}
                            onRegenerate={() => {
                                if (terrainContainerRef.current) {
                                    ResourceRenderer.clearAll(terrainContainerRef.current);
                                    VehicleRenderer.clearAll();
                                }
                                const randomWallet = "0x" + Math.floor(Math.random() * 1e16).toString(16);
                                engine.map.generateWorld(randomWallet);
                                engine.map.revision++;
                            }}
                            speed={speed}
                            paused={paused}
                            onSetSpeed={(s: number) => {
                                setSpeed(s);
                                engine.setSpeed(s);
                            }}
                            onTogglePause={() => {
                                const newPaused = !paused;
                                setPaused(newPaused);
                                engine.isPaused = newPaused;
                            }}
                            selectedBuildingId={selectedBuildingId}
                            setSelectedBuildingId={setSelectedBuildingId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
