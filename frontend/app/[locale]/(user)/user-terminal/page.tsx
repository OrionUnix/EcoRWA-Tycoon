'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';

import { usePixiApp } from './hooks/usePixiApp';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameInput } from './hooks/useGameInput';
import { getGameEngine } from './engine/GameEngine';
import GameUI from './components/GameUI';
import { RoadType, ZoneType } from './engine/types';
import { loadBiomeTextures } from './engine/BiomeAssets'; // Le loader

export default function UserTerminalGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { appRef, stageRef, isReady } = usePixiApp(containerRef);

    // Refs pour Pixi
    const terrainContainerRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    // État chargement
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // État jeu
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);

    // Stats
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

    // 1. CHARGEMENT DES ASSETS
    useEffect(() => {
        loadBiomeTextures().then(() => {
            console.log("✅ Page: Assets chargés.");
            setAssetsLoaded(true);
        });
    }, []);

    // 2. SETUP SCÈNE PIXI
    useEffect(() => {
        if (isReady && stageRef.current && assetsLoaded && !staticGRef.current) {
            console.log("🎨 Page: Setup Scène...");

            // Création des couches
            const terrain = new PIXI.Container();
            const staticG = new PIXI.Graphics();
            const uiG = new PIXI.Graphics();

            // Ajout à la scène
            stageRef.current.addChild(terrain);
            stageRef.current.addChild(staticG);
            stageRef.current.addChild(uiG);

            // Sauvegarde des refs
            terrainContainerRef.current = terrain;
            staticGRef.current = staticG;
            uiGRef.current = uiG;

            // Initialisation données
            const engine = getGameEngine();
            engine.map.calculateSummary();
            setSummary(engine.map.currentSummary);
        }
    }, [isReady, assetsLoaded]);

    // 3. BOUCLE DE JEU
    useGameLoop(
        appRef,
        terrainContainerRef,
        staticGRef,
        uiGRef,
        isReady && assetsLoaded, // IMPORTANT : On attend que tout soit prêt
        viewMode,
        cursorPos,
        previewPathRef,
        isValidBuildRef,
        setFps,
        setResources,
        setStats
    );

    // 4. INPUTS
    useGameInput(
        stageRef, appRef, isReady, viewMode, selectedRoad, selectedZone,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef
    );

    const engine = getGameEngine();
    const t = (k: string) => k;

    // ECRAN DE CHARGEMENT
    if (!assetsLoaded) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center text-white">
                <h1 className="text-2xl font-bold">Chargement des textures...</h1>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <div ref={containerRef} className="absolute inset-0 z-0" />

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
                    engine.map.calculateSummary();
                    setSummary(engine.map.currentSummary);
                    engine.map.revision++;
                }}
            />
        </div>
    );
}