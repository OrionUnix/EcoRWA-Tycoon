'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';

// --- IMPORTS MOTEUR ---
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { useGameBoot } from '../hooks/useGameBoot';
import { getGameEngine } from '../engine/GameEngine';
import { RoadType, ZoneType, BuildingType } from '../engine/types';
import { AssetLoader } from '../engine/core/AssetLoader';
import { PixiStageSetup } from '../engine/core/PixiStageSetup';
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { VehicleRenderer } from '../components/VehicleRenderer';
import { SaveSystem } from '../engine/systems/SaveSystem';

// --- IMPORTS UI ---
import GameUI from '../components/GameUI';
import { useECS } from '../hooks/useECS';
import { TopBar } from './ui/hud/TopBar';
import { AdvisorWidget } from './ui/npcs/AdvisorWidget';
import { GameOnboarding } from './ui/overlay/GameOnboarding';
import { BobWarningModal } from './ui/npcs/BobWarningModal';
import { useFirebaseWeb3Auth } from '../hooks/web3/useFirebaseWeb3Auth';
import { GameLoader } from './ui/overlay/GameLoader';
import { SoftWelcomeModal } from './ui/overlay/SoftWelcomeModal';
import { SimCityLoader } from './ui/overlay/SimCityLoader';
import { JordanPitchModal } from './ui/npcs/JordanPitchModal';
import { AlertSystem } from '../engine/systems/AlertSystem';
import { NpcAlertOverlay } from './ui/widgets/NpcAlertOverlay';
import { useGameSave } from '../hooks/useGameSave';
import { SaveIndicator } from './ui/hud/SaveIndicator';

// --- IMPORTS TUTORIEL DORA ---
import { DoraTutorialModal } from './ui/npcs/DoraTutorialModal';
import { useTutorialStore } from '../hooks/useTutorialStore';

// --- IMPORTS START SCREEN ---
import { useSaveStore } from '@/hooks/useSaveStore';
import { StartScreen } from './StartScreen';

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

    const { saveMode, userId, setSaveMode, setUserId } = useSaveStore();

    // Auto-skip StartScreen if wallet is already connected via Wagmi (page reload)
    useEffect(() => {
        if (isConnected && address && saveMode === null) {
            setSaveMode('web3');
            setUserId(address);
        }
    }, [isConnected, address, saveMode, setSaveMode, setUserId]);

    const prevIsConnectedRef = useRef(isConnected);
    const [isSavingDisconnect, setIsSavingDisconnect] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [showJordanPitch, setShowJordanPitch] = useState(false);



    const [assetsLoaded, setAssetsLoaded] = useState(false);
    // useFirebaseWeb3Auth reste pour l'indicateur d'authentification UI (SimCityLoader)
    const { isAuthenticating } = useFirebaseWeb3Auth();

    // ✅ Système de Sauvegarde Automatique, Session & Battery Saver
    useGameSave(address, assetsLoaded);

    // ✅ Gestion du status wallet (Dirty flag / Connection state)
    useEffect(() => {
        SaveSystem.setWalletConnected(isConnected);

        // 🧹 BUG FIX: Reset le jeu à la déconnexion pour éviter le State Leak
        if (prevIsConnectedRef.current && !isConnected) {
            console.log("🧹 Déconnexion détectée : Nettoyage de la ville et de l'inventaire...");
            // 1. Vider l'inventaire local des RWA
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('rwa_inventory');
                // On dispatch l'évènement pour forcer useRWAInventory à se reload (et donc vider la liste)
                window.dispatchEvent(new Event('rwa_purchased'));
            }

            // 2. Reset du moteur de jeu
            const engine = getGameEngine();
            engine.resetGame();
            // Force re-render pour nettoyer les résidus UI
            setIsReloading(true);
            setTimeout(() => setIsReloading(false), 100);
        }

        prevIsConnectedRef.current = isConnected;
    }, [isConnected]);

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

    // 3. PRÉCHARGEMENT DES ASSETS (Délégué à AssetLoader, contrôlé par useGameBoot)
    const preloadAssetsCb = useCallback(async () => {
        if (!appRef.current || !viewportRef.current) throw new Error("PixiJS n'est pas prêt");
        await AssetLoader.initAssets(
            appRef.current,
            viewportRef.current,
            terrainContainerRef.current,
            address,
            setAssetsLoaded,
            setIsReloading,
            setSummary
        );
    }, [address, isReady]);

    // Cleanup des assets à la destruction du composant
    useEffect(() => {
        return () => {
            setAssetsLoaded(false);
            AssetLoader.cleanup();
        };
    }, []);

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

    // 5. 🔒 BOOT FLOW VERROUILLÉ — useGameBoot garantit l'ordre séquentiel :
    //    A(Wallet) → B(loadSave) → C(seed) → D(preload) → E(generateWorld) → F(isReady)
    //    Le moteur graphique ne dessine AUCUN pixel avant que bootState.isReady soit true.

    const getBootId = () => {
        if (saveMode === null) return null; // BOOT EN PAUSE TANT QUE LE JOUEUR N'A PAS CHOISI
        if (saveMode === 'none') return undefined; // MODE DEMO SANS SAUVEGARDE
        if (saveMode === 'web3') return address; // PRIORITÉ AU WALLET WAGMI SI DISPO
        return userId; // MODE WEB2 (CODE MAIRE)
    };

    const bootState = useGameBoot(
        getBootId(),
        isReady ? preloadAssetsCb : undefined // Ne démarre le boot complet que si PixiJS est prêt !
    );

    // Sync du mode démo avec l'état du boot
    useEffect(() => {
        setIsDemoMode(!isConnected);
    }, [isConnected]);

    // Déclenche le calcul du résumé et le premier rendu dès que le boot est complet
    useEffect(() => {
        if (bootState.isReady && assetsLoaded) {
            const engine = getGameEngine();
            engine.map.calculateSummary();
            setSummary(engine.map.currentSummary);
            engine.map.revision++;

            // Lancer le tuto de Dora 1 seconde après le chargement de la carte
            setTimeout(() => {
                const tutorial = useTutorialStore.getState();
                if (!tutorial.isActive) {
                    tutorial.startTutorial();
                }
            }, 1000);
        }
    }, [bootState.isReady, assetsLoaded]);

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
            if (document.hidden) return; // 🛑 FinOps: Stop computation when tab is hidden

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
        // On n'efface la sélection que si le mode change VERS un mode de construction
        // et non depuis un mode de construction (ce qui serait le cas après un clic bâtiment)
        if (viewMode !== 'ALL') {
            // Délai pour éviter la race condition avec onBuildingClicked qui
            // appelle setViewMode('ALL') + setSelectedBuildingId(idx) au même moment
            setTimeout(() => setSelectedBuildingId(null), 0);
        }
    }, [viewMode]);

    // ✅ La boucle de rendu ne démarre que si PixiJS est prêt ET le boot est complet
    const gameIsFullyReady = isReady && assetsLoaded && bootState.isReady;

    useGameLoop(
        appRef, terrainContainerRef, staticGRef, uiGRef,
        gameIsFullyReady, isReloading, viewMode, cursorPos,
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
        viewportRef, appRef, gameIsFullyReady,
        viewMode, setViewMode, selectedRoad, selectedZone, selectedBuilding,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef, setSelectedBuildingId
    );

    const engine = getGameEngine();
    const t = useTranslations();

    return (
        <>
            {/* 🖥️ ÉCRAN DE DÉMARRAGE HYBRIDE WEB2 / WEB3 / DEMO */}
            {saveMode === null && <StartScreen />}

            <BobWarningModal />
            {showOnboarding && <GameOnboarding onComplete={() => setShowOnboarding(false)} onClose={() => setShowOnboarding(false)} />}

            {/* 👩‍🏫 MODALE TUTORIEL DORA */}
            <DoraTutorialModal viewMode={viewMode} onClose={() => { }} />

            <NpcAlertOverlay
                npc={currentAlert?.npc || null}
                messageKey={currentAlert?.messageKey || null}
                onClose={() => setCurrentAlert(null)}
            />

            <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
                <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

                {/* 🔒 Écran de chargement : plein écran, affiché JUSQU'À ce que le boot soit 100% complet */}
                {/* On le cache explicitement si on est sur l'écran d'accueil (saveMode === null) */}
                {saveMode !== null && (!assetsLoaded || !bootState.isReady) && (
                    <GameLoader phase={bootState.phase} error={bootState.error} />
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
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <GameUI
                            t={t}
                            viewMode={viewMode} setViewMode={setViewMode}
                            selectedRoadType={selectedRoad} setSelectedRoadType={setSelectedRoad}
                            selectedZoneType={selectedZone} setSelectedZoneType={setSelectedZone}
                            selectedBuildingType={selectedBuilding} setSelectedBuildingType={setSelectedBuilding}
                            totalCost={totalCost} isValidBuild={isValidBuild}
                            fps={fps} cursorPos={cursorPos} hoverInfo={hoverInfo}
                            resources={resources} stats={stats} summary={summary}
                            speed={speed} paused={paused}
                            onSetSpeed={(s: number) => { setSpeed(s); engine.setSpeed(s); }}
                            onTogglePause={() => { const newPaused = !paused; setPaused(newPaused); engine.isPaused = newPaused; }}
                            selectedBuildingId={selectedBuildingId} setSelectedBuildingId={setSelectedBuildingId}
                            onOpenRWA={() => setShowOnboarding(true)}
                        />
                        <SaveIndicator />
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
