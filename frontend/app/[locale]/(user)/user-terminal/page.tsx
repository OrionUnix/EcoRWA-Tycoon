'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';

// --- IMPORTS ---
import { usePixiApp } from './hooks/usePixiApp';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameInput } from './hooks/useGameInput';
import { getGameEngine } from './engine/GameEngine';
import { loadBiomeTextures } from './engine/BiomeAssets';
import { RoadType, ZoneType } from './engine/types';
import GameUI from './components/GameUI';

export default function UserTerminalGame() {
    // 1. LIENS ET REFS
    // On attache la ref tout de suite, même si on charge encore
    const containerRef = useRef<HTMLDivElement>(null);
    const { appRef, stageRef, isReady } = usePixiApp(containerRef);

    // Conteneurs Pixi
    const terrainContainerRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    // 2. ETATS
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);

    // UI Stats
    const [fps, setFps] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);
    const [resources, setResources] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);

    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true);

    // 3. CHARGEMENT INITIAL
    useEffect(() => {
        console.log("🚀 Page: Démarrage du chargement...");
        loadBiomeTextures().then(() => {
            console.log("✅ Page: Assets chargés.");
            const engine = getGameEngine();
            if (engine.map.revision === 0) {
                engine.map.generateWorld();
                engine.map.calculateSummary();
            }
            setSummary(engine.map.currentSummary);
            setAssetsLoaded(true);
        });
    }, []);

    // 4. SETUP DES CALQUES PIXI
    useEffect(() => {
        if (isReady && stageRef.current && assetsLoaded && !staticGRef.current) {
            console.log("🎨 Page: Création des Layers Pixi...");
            const terrain = new PIXI.Container();
            const vectorLayer = new PIXI.Graphics();
            const uiLayer = new PIXI.Graphics();

            // Ajout dans l'ordre (Fond -> Dessus)
            stageRef.current.addChild(terrain);
            stageRef.current.addChild(vectorLayer);
            stageRef.current.addChild(uiLayer);

            terrainContainerRef.current = terrain;
            staticGRef.current = vectorLayer;
            uiGRef.current = uiLayer;

            // Force un premier rendu
            const engine = getGameEngine();
            engine.map.revision++;
        }
    }, [isReady, assetsLoaded]);

    // 5. BOUCLE DE JEU
    useGameLoop(
        appRef, terrainContainerRef, staticGRef, uiGRef,
        isReady && assetsLoaded, viewMode, cursorPos,
        previewPathRef, isValidBuildRef, setFps, setResources, setStats
    );

    // 6. INPUTS
    useGameInput(
        stageRef, appRef, isReady && assetsLoaded,
        viewMode, selectedRoad, selectedZone, setCursorPos,
        setHoverInfo, setTotalCost, setIsValidBuild, previewPathRef, isValidBuildRef
    );

    const t = (k: string) => k;
    const engine = getGameEngine();

    // 7. RENDU FINAL
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>

            {/* A. CONTENEUR PIXI (Z-INDEX 1) - DOIT RECEVOIR LES CLICS */}
            <div
                ref={containerRef}
                style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            />

            {/* B. ÉCRAN DE CHARGEMENT */}
            {!assetsLoaded && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    backgroundColor: '#111', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <h1>Chargement du Monde...</h1>
                </div>
            )}

            {/* C. UI DU JEU (Z-INDEX 10) - LAISSE PASSER LES CLICS */}
            {assetsLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none' // 👈 CRUCIAL : Laisse passer les clics au travers du vide
                }}>
                    {/* Le conteneur interne ne doit PAS bloquer les clics partout */}
                    <div style={{ width: '100%', height: '100%' }}>
                        <GameUI
                            t={t}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            selectedRoadType={selectedRoad}
                            setSelectedRoadType={setSelectedRoad}
                            selectedZoneType={selectedZone}
                            setSelectedZoneType={setSelectedZone}
                            totalCost={totalCost}
                            isValidBuild={isValidBuild}
                            fps={fps}
                            cursorPos={cursorPos}
                            hoverInfo={hoverInfo}
                            resources={resources}
                            stats={stats}
                            summary={summary}
                            onSpawnTraffic={() => engine.spawnTraffic()}
                            onRegenerate={() => {
                                engine.map.generateWorld();
                                engine.map.revision++;
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}