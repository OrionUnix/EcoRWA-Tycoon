'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js'; // ✅ IMPORT NÉCESSAIRE pour les types
import { useTranslations } from 'next-intl';

import { getGameEngine } from '../engine/GameEngine';
import { RoadType, ZoneType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';

// Hooks Modulaires
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';

import GameUI from './GameUI';

// --- VALEURS PAR DÉFAUT ---
const DEFAULT_SUMMARY: ResourceSummary = {
    oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0,
    stone: 0, silver: 0, gold: 0
};

const DEFAULT_STATS: CityStats = {
    population: 0,
    jobsCommercial: 0,
    jobsIndustrial: 0,
    unemployed: 0,
    demand: { residential: 50, commercial: 50, industrial: 50 },
    energy: { produced: 0, consumed: 0 },
    water: { produced: 0, consumed: 0 },
    food: { produced: 0, consumed: 0 }
};

const DEFAULT_RESOURCES: PlayerResources = {
    money: 50000, wood: 500, concrete: 200, glass: 100, steel: 50,
    stone: 100, coal: 0, iron: 0, oil: 0, food: 0,
    energy: 0, water: 0,
    silver: 0, gold: 0
};

export default function GameCanvas() {
    const t = useTranslations('Game');

    // --- STATE UI ---
    const [viewMode, setViewMode] = useState<any>('ALL');
    const [selectedRoad, setSelectedRoad] = useState<RoadType>(RoadType.ASPHALT);
    const [selectedZone, setSelectedZone] = useState<ZoneType>(ZoneType.RESIDENTIAL);

    // --- STATE FEEDBACK ---
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);
    const [fps, setFps] = useState(0);

    // --- STATE DATA ---
    const [resources, setResources] = useState<PlayerResources>(DEFAULT_RESOURCES);
    const [stats, setStats] = useState<CityStats>(DEFAULT_STATS);
    const [summary, setSummary] = useState<ResourceSummary>(DEFAULT_SUMMARY);

    // --- REFS ---
    const containerRef = useRef<HTMLDivElement>(null);
    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true);

    // ✅ 1. CRÉATION DES REFS POUR LES LAYERS ICI (C'est local au composant)
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    // =========================================================
    // 🧱 ASSEMBLAGE DES BRIQUES (HOOKS)
    // =========================================================

    // 2. Moteur Graphique (On ne récupère QUE ce que usePixiApp renvoie)
    const { appRef, stageRef, isReady } = usePixiApp(containerRef);

    // ✅ 3. INITIALISATION DES CALQUES (Dès que Pixi est prêt)
    useEffect(() => {
        if (isReady && stageRef.current && !staticGRef.current) {
            console.log("🎨 Initialisation des Layers Pixi...");

            const staticG = new PIXI.Graphics();
            const uiG = new PIXI.Graphics();

            // Ajout à la scène
            stageRef.current.addChild(staticG);
            stageRef.current.addChild(uiG);

            // Sauvegarde dans les refs
            staticGRef.current = staticG;
            uiGRef.current = uiG;

            // Force update du résumé
            const engine = getGameEngine();
            if (engine.map) {
                engine.map.calculateSummary();
                setSummary({ ...engine.map.currentSummary });
            }
        }
    }, [isReady]);

    // 4. Gestion des Entrées
    useGameInput(
        stageRef, appRef, isReady,
        viewMode, selectedRoad, selectedZone,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef
    );

    // 5. Boucle de Jeu
    useGameLoop(
        appRef, staticGRef, uiGRef, isReady,
        viewMode, cursorPos, previewPathRef, isValidBuildRef,
        setFps, setResources, setStats
    );

    // =========================================================
    // 🔄 HELPER FUNCTIONS
    // =========================================================

    const handleRegenerate = () => {
        const engine = getGameEngine();
        if (engine && engine.map) {
            engine.map.generateWorld();
            engine.map.calculateSummary();
            setSummary({ ...engine.map.currentSummary });
            setStats({ ...engine.map.stats });
            setResources({ ...engine.map.resources });
            engine.map.revision++;
        }
    };

    const handleSpawnTraffic = () => {
        const engine = getGameEngine();
        if (engine) engine.spawnTraffic();
    };

    // =========================================================
    // 🎨 RENDU REACT
    // =========================================================
    return (
        <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
            {/* COUCHE 1 : JEU (PixiJS) */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* COUCHE 2 : INTERFACE (React HTML) */}
            <GameUI
                t={t}
                viewMode={viewMode} setViewMode={setViewMode}
                selectedRoadType={selectedRoad} setSelectedRoadType={setSelectedRoad}
                selectedZoneType={selectedZone} setSelectedZoneType={setSelectedZone}
                totalCost={totalCost} isValidBuild={isValidBuild}
                fps={fps} cursorPos={cursorPos} hoverInfo={hoverInfo}
                resources={resources}
                stats={stats}
                summary={summary}
                onSpawnTraffic={handleSpawnTraffic}
                onRegenerate={handleRegenerate}
            />
        </div>
    );
}