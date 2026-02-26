'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';

// --- IMPORTS MOTEUR ---
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { getGameEngine } from '../engine/GameEngine';
import { RoadType, ZoneType, BuildingType } from '../engine/types';
import { AssetLoader } from '../engine/core/AssetLoader';
import { PixiStageSetup } from '../engine/core/PixiStageSetup';
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { VehicleRenderer } from '../components/VehicleRenderer';

// --- IMPORTS UI ---
import GameUI from '../components/GameUI';
import ChunkExpandOverlay from '../components/ui/ChunkExpandOverlay';
import { useECS } from '../hooks/useECS';
import { TopBar } from '../components/ui/TopBar';
import { AdvisorWidget } from '../components/ui/AdvisorWidget';
import { GameOnboarding } from '../components/ui/GameOnboarding';
import { BobWarningModal } from '../components/ui/BobWarningModal';

export default function UserTerminalClient() {
    // 1. LIENS ET REFS
    const containerRef = useRef<HTMLDivElement>(null);
    const { appRef, viewportRef, stageRef, isReady } = usePixiApp(containerRef);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Conteneurs Pixi (Layers)
    const terrainContainerRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    const { isConnected, address } = useAccount();

    // 2. ÉTATS DE JEU
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);
    const [selectedBuilding, setSelectedBuilding] = useState(BuildingType.POWER_PLANT);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

    // ÉTATS UI
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

    // 3. CHARGEMENT INITIAL DES ASSETS (Délégué à AssetLoader)
    useEffect(() => {
        if (isReady && appRef.current && viewportRef.current) {
            AssetLoader.initAssets(
                appRef.current,
                viewportRef.current,
                terrainContainerRef.current,
                address,
                setAssetsLoaded,
                setIsReloading,
                setSummary
            );
        }
        return () => {
            setAssetsLoaded(false);
            AssetLoader.cleanup();
        };
    }, [isReady]);

    // 4. CONFIGURATION DES CALQUES PIXI (Délégué à PixiStageSetup)
    useEffect(() => {
        if (isReady && viewportRef.current && assetsLoaded && !terrainContainerRef.current) {
            console.log("🎨 Page: Initialisation des Layers Pixi...");

            const layers = PixiStageSetup.setupLayers(viewportRef.current);
            terrainContainerRef.current = layers.terrain;
            staticGRef.current = layers.vectorLayer;
            uiGRef.current = layers.uiLayer;

            const engine = getGameEngine();
            engine.map.revision++;
            setTimeout(() => { engine.map.revision++; }, 200);

            PixiStageSetup.positionCamera(viewportRef.current);
        }
    }, [isReady, assetsLoaded]);

    // 5. RÉGÉNÉRATION DU BIOME SUR CONNEXION WEB3
    useEffect(() => {
        if (isReady && assetsLoaded && isConnected && address) {
            const engine = getGameEngine();
            engine.map.generateWorld(address);
            engine.map.calculateSummary();
            setSummary(engine.map.currentSummary);
            engine.map.revision++;
            setViewMode(prev => prev);
        }
    }, [isReady, assetsLoaded, isConnected, address]);

    // 6. SAUVEGARDE DE LA CAMÉRA
    useEffect(() => {
        return () => {
            if (viewportRef.current) {
                const center = viewportRef.current.center;
                getGameEngine().saveCameraState(center.x, center.y, viewportRef.current.scaled);
            }
        };
    }, []);

    // 7. GAMELOOP ET INPUT
    const { updateECS } = useECS(isReady);
    const selectedBuildingTypeRef = useRef(BuildingType.POWER_PLANT);

    useEffect(() => {
        selectedBuildingTypeRef.current = selectedBuilding;
    }, [selectedBuilding]);

    useEffect(() => {
        if (viewMode !== 'ALL') setSelectedBuildingId(null);
    }, [viewMode]);

    useGameLoop(
        appRef, terrainContainerRef, staticGRef, uiGRef,
        isReady && assetsLoaded, isReloading, viewMode, cursorPos,
        previewPathRef, isValidBuildRef, setFps, setResources, setStats,
        selectedBuildingTypeRef, updateECS
    );

    // ✅ NOUVEAU: Écoute de l'événement d'équipement RWA depuis l'inventaire
    useEffect(() => {
        const handleEquip = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const engine = getGameEngine();
            engine.currentRwaPayload = detail;
            setViewMode('BUILD_RWA');
        };
        window.addEventListener('equip_rwa_building', handleEquip);
        return () => window.removeEventListener('equip_rwa_building', handleEquip);
    }, []);

    useGameInput(
        viewportRef, appRef, isReady && assetsLoaded,
        viewMode, setViewMode, selectedRoad, selectedZone, selectedBuilding,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef, setSelectedBuildingId
    );

    const engine = getGameEngine();
    const t = useTranslations();

    return (
        <>
            <TopBar />
            <AdvisorWidget isVisible={!isConnected} />
            <BobWarningModal />
            {showOnboarding && <GameOnboarding onComplete={() => setShowOnboarding(false)} onClose={() => setShowOnboarding(false)} />}

            <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
                <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

                {!assetsLoaded && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#111', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
                        <div className="loader"></div>
                        <h1 style={{ marginTop: '20px' }}>Génération du territoire...</h1>
                    </div>
                )}

                {assetsLoaded && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                            <GameUI
                                t={t}
                                viewMode={viewMode} setViewMode={setViewMode}
                                selectedRoadType={selectedRoad} setSelectedRoadType={setSelectedRoad}
                                selectedZoneType={selectedZone} setSelectedZoneType={setSelectedZone}
                                selectedBuildingType={selectedBuilding} setSelectedBuildingType={setSelectedBuilding}
                                totalCost={totalCost} isValidBuild={isValidBuild}
                                fps={fps} cursorPos={cursorPos} hoverInfo={hoverInfo}
                                resources={resources} stats={stats} summary={summary}
                                onRegenerate={() => {
                                    if (terrainContainerRef.current) { ResourceRenderer.clearAll(terrainContainerRef.current); VehicleRenderer.clearAll(); }
                                    engine.map.generateWorld("0x" + Math.floor(Math.random() * 1e16).toString(16));
                                    engine.map.revision++;
                                }}
                                speed={speed} paused={paused}
                                onSetSpeed={(s: number) => { setSpeed(s); engine.setSpeed(s); }}
                                onTogglePause={() => { const newPaused = !paused; setPaused(newPaused); engine.isPaused = newPaused; }}
                                selectedBuildingId={selectedBuildingId} setSelectedBuildingId={setSelectedBuildingId}
                                onOpenRWA={() => setShowOnboarding(true)}
                            />
                        </div>
                        <ChunkExpandOverlay viewportRef={viewportRef} isReady={isReady} />
                    </div>
                )}
            </div>
        </>
    );
}
