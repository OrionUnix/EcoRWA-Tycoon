'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { getGameEngine } from '../engine/GameEngine';
import { regenerateWorld } from '../engine/MapEngine';
import { RoadType, ZoneType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';

// Hooks Modulaires
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';

import GameUI from './GameUI';

// --- VALEURS PAR DÉFAUT (Pour éviter le crash "undefined") ---
const DEFAULT_SUMMARY: ResourceSummary = {
    oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0
};

const DEFAULT_STATS: CityStats = {
    population: 0,
    jobsCommercial: 0,
    jobsIndustrial: 0,
    unemployed: 0,
    demand: { residential: 50, commercial: 50, industrial: 50 }, // Valeurs moyennes par défaut
    energy: { produced: 0, consumed: 0 },
    water: { produced: 0, consumed: 0 },
    food: { produced: 0, consumed: 0 }
};

const DEFAULT_RESOURCES: PlayerResources = {
    money: 50000, wood: 500, concrete: 200, glass: 100, steel: 50,
    stone: 100, coal: 0, iron: 0, oil: 0, food: 0,
    energy: 0, water: 0
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

    // --- STATE DATA (Sécurisés avec valeurs par défaut) ---
    // ✅ FIX : On initialise avec DEFAULT_RESOURCES et DEFAULT_STATS pour éviter le crash
    const [resources, setResources] = useState<PlayerResources>(DEFAULT_RESOURCES);
    const [stats, setStats] = useState<CityStats>(DEFAULT_STATS);
    const [summary, setSummary] = useState<ResourceSummary>(DEFAULT_SUMMARY);

    // --- REFS ---
    const containerRef = useRef<HTMLDivElement>(null);
    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true);

    // =========================================================
    // 🧱 ASSEMBLAGE DES BRIQUES (HOOKS)
    // =========================================================

    // 1. Moteur Graphique
    const { appRef, staticGRef, uiGRef, stageRef, isReady } = usePixiApp(containerRef);

    // 2. Gestion des Entrées
    useGameInput(
        stageRef, appRef, isReady,
        viewMode, selectedRoad, selectedZone,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef
    );

    // 3. Boucle de Jeu
    useGameLoop(
        appRef, staticGRef, uiGRef, isReady,
        viewMode, cursorPos, previewPathRef, isValidBuildRef,
        setFps, setResources, setStats
    );

    // =========================================================
    // 🔄 SYNC INITIALE
    // =========================================================

    // Au montage, on force une première lecture des données du moteur
    useEffect(() => {
        const engine = getGameEngine();
        if (engine && engine.map) {
            if (engine.map.currentSummary) setSummary(engine.map.currentSummary);
            if (engine.map.stats) setStats({ ...engine.map.stats });
            if (engine.map.resources) setResources({ ...engine.map.resources });
        }
    }, [isReady]);

    const handleRegenerate = () => {
        const engine = getGameEngine();
        if (engine && engine.map) {
            engine.map.generateWorld();
            // Mise à jour immédiate des états pour l'UI
            setSummary({ ...engine.map.currentSummary });
            setStats({ ...engine.map.stats });
            setResources({ ...engine.map.resources });
        }
    };

    const handleSpawnTraffic = () => {
        const engine = getGameEngine();
        if (engine && engine.map) {
            // Petite protection si la méthode n'existe pas encore (TrafficSystem)
            if ((engine.map as any).spawnTraffic) {
                (engine.map as any).spawnTraffic(50);
            } else {
                console.log("TrafficSystem gère le spawn automatiquement.");
            }
        }
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