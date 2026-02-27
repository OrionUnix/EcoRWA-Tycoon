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
import { SaveSystem } from '../engine/systems/SaveSystem';

// --- IMPORTS UI ---
import GameUI from '../components/GameUI';
import ChunkExpandOverlay from './ui/overlay/ChunkExpandOverlay';
import { useECS } from '../hooks/useECS';
import { TopBar } from './ui/hud/TopBar';
import { AdvisorWidget } from './ui/npcs/AdvisorWidget';
import { GameOnboarding } from './ui/overlay/GameOnboarding';
import { BobWarningModal } from './ui/npcs/BobWarningModal';
import { useFirebaseWeb3Auth } from '../hooks/web3/useFirebaseWeb3Auth';
import { SoftWelcomeModal } from './ui/overlay/SoftWelcomeModal';
import { SimCityLoader } from './ui/overlay/SimCityLoader';
import { JordanPitchModal } from './ui/npcs/JordanPitchModal';
import { AlertSystem } from '../engine/systems/AlertSystem';
import { NpcAlertOverlay } from './ui/widgets/NpcAlertOverlay';

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

    const prevIsConnectedRef = useRef(isConnected);
    const [isSavingDisconnect, setIsSavingDisconnect] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [showJordanPitch, setShowJordanPitch] = useState(false);

    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const { loginAndLoadSave, isAuthenticating } = useFirebaseWeb3Auth();

    // ✅ Déconnexion : On sauvegarde la partie en cours sur le Cloud (plus en Local)
    useEffect(() => {
        if (prevIsConnectedRef.current && !isConnected && assetsLoaded && address) {
            console.log("🔌 Déconnexion détectée. Sauvegarde Cloud forcée...");
            SaveSystem.saveToCloud(getGameEngine().map, address).then(() => {
                SaveSystem.clearDirty();
            });
            setIsSavingDisconnect(true);
            setTimeout(() => {
                setIsSavingDisconnect(false);
            }, 2000); // Animation de 2s
        }
        SaveSystem.setWalletConnected(isConnected);
        prevIsConnectedRef.current = isConnected;
    }, [isConnected, assetsLoaded, address]);

    // ✅ Auto-Save Périodique (Mode Production)
    // Sauvegarde automatiquement sur le cloud toutes les 120 secondes si la partie a été modifiée
    useEffect(() => {
        if (!isConnected || !address || !assetsLoaded || isDemoMode) return;

        const interval = setInterval(() => {
            if (SaveSystem.isDirty) {
                console.log("⏱️ Auto-Save Cloud en cours...");
                SaveSystem.saveToCloud(getGameEngine().map, address).then(() => {
                    SaveSystem.clearDirty();
                });
            }
        }, 120000); // 120 secondes (2 minutes)

        return () => clearInterval(interval);
    }, [isConnected, address, assetsLoaded, isDemoMode]);

    // 2. ÉTATS DE JEU
    const [isReloading, setIsReloading] = useState(false);
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);
    const [selectedBuilding, setSelectedBuilding] = useState(BuildingType.POWER_PLANT);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

    // ✅ Couche DataLayer active (pour les icônes ressources souterraines)
    const [activeResourceLayer, setActiveResourceLayer] = useState<string | null>(null);

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
    const [currentAlert, setCurrentAlert] = useState<{ npc: string, messageKey: string } | null>(null);

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

    // 5. RÉGÉNÉRATION DU BIOME SUR ATTENTE
    // Actuellement on génère le monde directement ou charge la save si connecté.
    const lastGeneratedAddress = useRef<string | null>(null);

    useEffect(() => {
        const initGame = async () => {
            if (!assetsLoaded || !isReady || !viewportRef.current) return;

            const currentTarget = isConnected && address ? address : "0xDEMO";
            if (lastGeneratedAddress.current === currentTarget) return;

            const engine = getGameEngine();

            if (isConnected && address) {
                // IMPORTANT : Si isAuthenticating est en cours, la restoration est couverte par le loader.
                const saveData = await loginAndLoadSave();

                if (saveData) {
                    // On a une sauvegarde, on génère d'abord puis on restaure par dessus
                    engine.map.generateWorld(address);
                    const restored = SaveSystem.restoreIntoEngine(engine.map, saveData);
                    if (restored) {
                        require('../engine/systems/PopulationManager').PopulationManager.initialize(engine.map);
                        SaveSystem.clearDirty();
                    }
                } else {
                    // Aucune sauvegarde: Monde 100% Neuf
                    engine.map.generateWorld(address);
                }
                setIsDemoMode(false);
            } else {
                engine.map.generateWorld("0xDEMO");
                setIsDemoMode(true);
            }

            engine.map.calculateSummary();
            setSummary(engine.map.currentSummary);
            engine.map.revision++;
            setViewMode(prev => prev);
            lastGeneratedAddress.current = currentTarget;
        };

        // Bloquer initGame TANT QUE 'isAuthenticating' est true, pour laisser le loader affiché
        if (!isAuthenticating && !isSavingDisconnect) {
            initGame();
        }
    }, [assetsLoaded, isReady, isConnected, address, isAuthenticating, isSavingDisconnect, loginAndLoadSave]);

    // 6. SAUVEGARDE DE LA CAMÉRA
    useEffect(() => {
        return () => {
            if (viewportRef.current) {
                const center = viewportRef.current.center;
                getGameEngine().saveCameraState(center.x, center.y, viewportRef.current.scaled);
            }
        };
    }, []);

    // 7. NPC ALERT SYSTEM LOOP
    useEffect(() => {
        if (!assetsLoaded || isDemoMode || !isConnected) return;
        const interval = setInterval(() => {
            const engine = getGameEngine();
            if (!engine.isPaused && engine.map.stats) {
                AlertSystem.checkMetrics(engine.map, (npc, messageKey) => {
                    setCurrentAlert({ npc, messageKey });
                });
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [assetsLoaded, isDemoMode, isConnected]);

    // 8. GAMELOOP ET INPUT
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
        selectedBuildingTypeRef, updateECS, activeResourceLayer
    );

    // ✅ NOUVEAU: Écoute de l'événement d'équipement RWA depuis l'inventaire
    useEffect(() => {
        const handleEquip = (e: Event) => {
            if (isDemoMode || !isConnected) {
                setShowJordanPitch(true);
                return;
            }
            const detail = (e as CustomEvent).detail;
            const engine = getGameEngine();
            engine.currentRwaPayload = detail;
            setViewMode('BUILD_RWA');
        };
        const handleResourceLayer = (e: Event) => {
            setActiveResourceLayer((e as CustomEvent).detail ?? null);
        };
        const handleJordanPitch = () => setShowJordanPitch(true);

        window.addEventListener('equip_rwa_building', handleEquip);
        window.addEventListener('set_resource_layer', handleResourceLayer);
        window.addEventListener('request_jordan_pitch', handleJordanPitch);

        return () => {
            window.removeEventListener('equip_rwa_building', handleEquip);
            window.removeEventListener('set_resource_layer', handleResourceLayer);
            window.removeEventListener('request_jordan_pitch', handleJordanPitch);
        };
    }, [isDemoMode, isConnected]);

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
            <TopBar
                speed={speed}
                paused={paused}
                onSetSpeed={(s: number) => { setSpeed(s); engine.setSpeed(s); }}
                onTogglePause={() => { const newPaused = !paused; setPaused(newPaused); engine.isPaused = newPaused; }}
            />
            <AdvisorWidget isVisible={!isConnected} />
            <BobWarningModal />
            {showOnboarding && <GameOnboarding onComplete={() => setShowOnboarding(false)} onClose={() => setShowOnboarding(false)} />}

            <NpcAlertOverlay
                npc={currentAlert?.npc || null}
                messageKey={currentAlert?.messageKey || null}
                onClose={() => setCurrentAlert(null)}
            />

            <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
                <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

                {!assetsLoaded && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#111', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
                        <div className="loader"></div>
                        <h1 style={{ marginTop: '20px' }}>Génération du territoire...</h1>
                    </div>
                )}

                <SimCityLoader visible={isAuthenticating} />

                <JordanPitchModal
                    visible={showJordanPitch}
                    isConnected={isConnected}
                    onClose={() => setShowJordanPitch(false)}
                    onConnectPlay={() => {
                        setShowJordanPitch(false);
                    }}
                />

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
                                selectedBuildingId={selectedBuildingId} setSelectedBuildingId={setSelectedBuildingId}
                                onOpenRWA={() => setShowOnboarding(true)}
                            />
                        </div>
                        <ChunkExpandOverlay viewportRef={viewportRef} isReady={isReady} />
                    </div>
                )}
            </div>

            {/* ✅ Animation de Sauvegarde à la déconnexion */}
            {isSavingDisconnect && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: '"Pixelify Sans", sans-serif' }}>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-6"></div>
                    <h2 className="text-4xl font-bold tracking-widest text-[#FFD700] drop-shadow-[3px_3px_0_#000]">SAUVEGARDE EN COURS...</h2>
                    <p className="mt-3 text-xl text-gray-300">Vos minerais et avancées sont synchronisés de manière permanente</p>
                </div>
            )}
        </>
    );
}
