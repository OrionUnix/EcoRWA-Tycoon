'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
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
import { RoadType, ZoneType, BuildingType } from '../engine/types';
import { gridToScreen } from '../engine/isometric'; // ✅ Import
import { GRID_SIZE } from '../engine/config'; // ✅ Import
// --- IMPORTS UI ---
import GameUI from '../components/GameUI';
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { VehicleRenderer } from '../components/VehicleRenderer';
import { BuildingRenderer } from '../components/BuildingRenderer'; // ✅ Import
import { GameRenderer, resetGameRenderer } from '../components/GameRenderer'; // ✅ Import GameRenderer & Reset
import { useECS } from '../hooks/useECS'; // ✅ Import ECS

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
    const [isReloading, setIsReloading] = useState(false); // ✅ NOUVEAU
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);
    const [selectedBuilding, setSelectedBuilding] = useState(BuildingType.POWER_PLANT);

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
            // 💾 SAUVEGARDE CAMÉRA AVANT RELOAD (Fix Offset)
            if (viewportRef.current) {
                const center = viewportRef.current.center;
                const zoom = viewportRef.current.scaled;
                getGameEngine().saveCameraState(center.x, center.y, zoom);
            }

            // 🧹 NETTOYAGE PRÉVENTIF 🧹 
            setIsReloading(true); // ✅ ON BLOQUE TOUT (Render & Input) 

            clearBiomeTextures();
            ResourceAssets.clear();
            RoadAssets.clear();
            VehicleAssets.clear();
            BuildingRenderer.clearCache();
            // ✅ On vide le cache des ressources (Arbres/Minerais) pour forcer le redessin
            ResourceRenderer.clearAll(terrainContainerRef.current);

            resetGameRenderer(); // ✅ RESET COMPLET (Fix Black Map)

            try {
                console.log("🚀 Page: Démarrage du chargement des assets...");
                if (!appRef.current) throw new Error("App Pixi non initialisée"); // Sécurité

                await Promise.all([
                    loadBiomeTextures(appRef.current),
                    ResourceAssets.load(appRef.current), // ✅ Correction: Passage de l'app
                    RoadAssets.load(),
                    VehicleAssets.load()
                ]);

                if (active) {
                    console.log("✅ Page: Tous les assets sont chargés.");
                    const engine = getGameEngine();

                    // Pour le moment (Test) - Simulation Wallet
                    const fakeWallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

                    // Générer le monde si ce n'est pas déjà fait
                    if (engine.map.revision === 0) {
                        engine.map.generateWorld(fakeWallet);
                        engine.map.calculateSummary();
                    }

                    setSummary(engine.map.currentSummary);
                    setAssetsLoaded(true);
                    setIsReloading(false); // ✅ ON DÉBLOQUE
                }
            } catch (err) {
                console.error("❌ Page: Erreur lors du chargement des assets:", err);
                setIsReloading(false); // Safety
            }
        };

        if (isReady) {
            initAssets();
        }

        return () => {
            active = false;
            setAssetsLoaded(false);
            // On vide aussi à la destruction pour être propre
            clearBiomeTextures();
            BuildingRenderer.clearCache(); // ✅ NOUVEAU
        };
    }, [isReady]);

    // 4. CONFIGURATION DES CALQUES PIXI (Layers)
    useEffect(() => {
        if (isReady && viewportRef.current && assetsLoaded && !terrainContainerRef.current) {
            console.log("🎨 Page: Initialisation des Layers Pixi...");

            const viewport = viewportRef.current;
            const engine = getGameEngine();

            // Layer 1: Terrain
            const terrain = new PIXI.Container();
            terrain.sortableChildren = true;

            // Layer 2: Vecteurs
            const vectorLayer = new PIXI.Graphics();

            // Layer 3: UI
            const uiLayer = new PIXI.Graphics();

            viewport.addChild(terrain);
            viewport.addChild(vectorLayer);
            viewport.addChild(uiLayer);

            terrainContainerRef.current = terrain;
            staticGRef.current = vectorLayer;
            uiGRef.current = uiLayer;

            // ✅ INITIALISATION PARTICULES (DÉSACTIVÉ POUR CRASH FIX)
            // import('../engine/systems/ParticleSystem').then(({ ParticleSystem }) => {
            //     ParticleSystem.init(terrain);
            // });

            engine.map.revision++;

            // --- POSITIONNEMENT CAMÉRA ---

            // Cas A : Restauration (Retour de changement de langue)
            if (engine.lastCameraPosition) {
                console.log("🔄 Restauration de la caméra...", engine.lastCameraPosition);
                viewport.moveCenter(engine.lastCameraPosition.x, engine.lastCameraPosition.y);
                viewport.setZoom(engine.lastZoom);
            }
            // Cas B : Centrage Initial (Déterminisme Mathématique)
            else {
                // On calcule le centre exact de la grille (32x32)
                const centerGridX = GRID_SIZE / 2;
                const centerGridY = GRID_SIZE / 2;
                const centerPos = gridToScreen(centerGridX, centerGridY);

                console.log("📍 Centrage initial sur :", centerPos);
                viewport.moveCenter(centerPos.x, centerPos.y);
                viewport.setZoom(1.0); // Zoom par défaut

                // --- PERSISTANCE CONTINUE (TOUJOURS ACTIVE) ---
                viewport.off('moved'); // Évite les doublons
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
                console.log("💾 Sauvegarde position avant démontage:", center);
                getGameEngine().saveCameraState(center.x, center.y, zoom);
            }
        };
    }, []);

    // 5. ACTIVATION DE LA BOUCLE DE JEU (Logic & Render)
    // 5. ACTIVATION DE LA BOUCLE DE JEU (Logic & Render)

    // ✅ Initialisation ECS
    const { updateECS } = useECS(isReady);

    useGameLoop(
        appRef,
        terrainContainerRef,
        staticGRef,
        uiGRef,
        isReady && assetsLoaded,
        isReloading, // ✅ Passage du flag
        viewMode,
        cursorPos,
        previewPathRef,
        isValidBuildRef,
        setFps,
        setResources,
        setStats,
        updateECS // ✅ Injection de la boucle ECS
    );

    // 6. GESTION DES INPUTS (Souris, Zoom, Pan, Click)
    // 6. GESTION DES INPUTS (Souris, Zoom, Pan, Click)
    useGameInput(
        viewportRef, // ✅ Utilisation du Viewport pour les inputs monde
        appRef,
        isReady && assetsLoaded,
        viewMode,
        selectedRoad,
        selectedZone,
        selectedBuilding,
        setCursorPos,
        setHoverInfo,
        setTotalCost,
        setIsValidBuild,
        previewPathRef,
        isValidBuildRef
    );

    const engine = getGameEngine();
    const t = useTranslations(); // ✅ Utiliser les vraies traductions i18n


    // 7. RENDU FINAL
    return (
        <div style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            overflow: 'hidden'
        }}>

            {/* A. CANVAS PIXI (Reçoit les événements souris) */}
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1
                }}
            />

            {/* B. ÉCRAN DE CHARGEMENT */}
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

            {/* C. INTERFACE UTILISATEUR (Calque transparent par-dessus le jeu) */}
            {assetsLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none' // Laisse passer les clics vers Pixi
                }}>
                    {/* On réactive les clics uniquement pour les éléments de l'UI */}
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
                                // 1. Vider physiquement tous les sprites d'arbres du container
                                if (terrainContainerRef.current) {
                                    ResourceRenderer.clearAll(terrainContainerRef.current);
                                    VehicleRenderer.clearAll();
                                }
                                // 2. Créer le nouveau monde (On simule un nouveau wallet pour le refresh)
                                const randomWallet = "0x" + Math.floor(Math.random() * 1e16).toString(16);
                                engine.map.generateWorld(randomWallet);
                                engine.map.revision++; // Force le rafraîchissement
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
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
