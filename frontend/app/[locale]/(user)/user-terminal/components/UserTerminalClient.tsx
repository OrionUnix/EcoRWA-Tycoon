'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { useTranslations } from 'next-intl';

// --- IMPORTS MOTEUR ---
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { getGameEngine } from '../engine/GameEngine';
import { loadBiomeTextures } from '../engine/BiomeAssets';
import { ResourceAssets } from '../engine/ResourceAssets';
import { RoadAssets } from '../engine/RoadAssets';
import { RoadType, ZoneType, BuildingType } from '../engine/types';

// --- IMPORTS UI ---
import GameUI from '../components/GameUI';
import { ResourceRenderer } from '../engine/ResourceRenderer';

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

    // 3. CHARGEMENT INITIAL DES ASSETS
    useEffect(() => {
        console.log("🚀 Page: Démarrage du chargement des assets...");

        // On attend que TOUTES les textures soient prêtes
        Promise.all([
            loadBiomeTextures(),
            ResourceAssets.load(),
            RoadAssets.load()
        ])
            .then(() => {
                console.log("✅ Page: Tous les assets sont chargés.");

                const engine = getGameEngine();
                // Pour le moment (Test) - Simulation Wallet
                const fakeWallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

                // Générer le monde si ce n'est pas déjà fait (avec Seed unique)
                if (engine.map.revision === 0) {
                    engine.map.generateWorld(fakeWallet);
                    engine.map.calculateSummary();
                }

                setSummary(engine.map.currentSummary);
                setAssetsLoaded(true);
            })
            .catch(err => {
                console.error("❌ Page: Erreur lors du chargement des assets:", err);
            });
    }, []);

    // 4. CONFIGURATION DES CALQUES PIXI (Layers)
    useEffect(() => {
        if (isReady && stageRef.current && viewportRef.current && assetsLoaded && !terrainContainerRef.current) {
            console.log("🎨 Page: Initialisation des Layers Pixi...");

            const viewport = viewportRef.current;
            const stage = stageRef.current;

            // Layer 1: Terrain & Ressources (Containers pour les Sprites)
            const terrain = new PIXI.Container();
            terrain.sortableChildren = true; // Crucial pour le zIndex des arbres

            // Layer 2: Vecteurs (Routes, Grilles, Overlays STATIC)
            // On les met dans le viewport pour qu'ils bougent avec le monde
            const vectorLayer = new PIXI.Graphics();

            // Layer 3: Interface In-Game (Curseurs, Preview construction)
            // Ceux-ci doivent aussi être dans le viewport pour suivre le curseur monde
            const uiLayer = new PIXI.Graphics();

            // Ajout au VIEWPORT (et non au stage direct) pour bénéficier du zoom/pan
            viewport.addChild(terrain);
            viewport.addChild(vectorLayer);
            viewport.addChild(uiLayer);

            // Note: Si on veut une UI statique (HUD), on l'ajoute à 'stage' après 'viewport'
            // Exemple : stage.addChild(hudContainer);

            terrainContainerRef.current = terrain;
            staticGRef.current = vectorLayer;
            uiGRef.current = uiLayer;

            // Déclencher un premier rendu
            getGameEngine().map.revision++;

            // --- CENTRAGE AUTOMATIQUE ROBUSTE ---
            let attempts = 0;
            const MAX_ATTEMPTS = 60; // Abandonne après ~1 seconde si vide

            const attemptCentering = () => {
                // Si le composant est démonté ou refs nulles, on arrête
                if (!viewport || terrain.destroyed) return;

                const bounds = terrain.getLocalBounds();

                // On vérifie si le terrain a une "matière" (largeur > 0)
                if (bounds && bounds.width > 0) {
                    const centerX = bounds.x + bounds.width / 2;
                    const centerY = bounds.y + bounds.height / 2;

                    console.log(`🎯 Centrage réussi (Tentative ${attempts}) :`, centerX, centerY);

                    viewport.moveCenter(centerX, centerY);
                    viewport.setZoom(1.0); // Ajuste selon tes goûts
                } else {
                    // Si le terrain est encore vide, on réessaie à la prochaine frame
                    attempts++;
                    if (attempts < MAX_ATTEMPTS) {
                        requestAnimationFrame(attemptCentering);
                    } else {
                        console.warn("⚠️ Impossible de centrer : Terrain vide après timeout.");
                    }
                }
            };

            // Lance la tentative
            requestAnimationFrame(attemptCentering);
        }
    }, [isReady, assetsLoaded, stageRef, viewportRef]);

    // 5. ACTIVATION DE LA BOUCLE DE JEU (Logic & Render)
    useGameLoop(
        appRef,
        terrainContainerRef,
        staticGRef,
        uiGRef,
        isReady && assetsLoaded,
        viewMode,
        cursorPos,
        previewPathRef,
        isValidBuildRef,
        setFps,
        setResources,
        setStats
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
