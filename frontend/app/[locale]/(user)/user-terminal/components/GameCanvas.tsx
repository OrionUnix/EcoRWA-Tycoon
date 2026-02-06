'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { getGameEngine } from '../engine/GameEngine';
import { RoadType, ZoneType, PlayerResources, CityStats, ResourceSummary } from '../engine/types';

// Hooks Modulaires
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';

import GameUI from './GameUI';

const DEFAULT_SUMMARY: ResourceSummary = { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0 };

export default function GameCanvas() {
    const t = useTranslations('Game');

    // --- STATE UI (Sélection Joueur) ---
    const [viewMode, setViewMode] = useState<any>('ALL');
    const [selectedRoad, setSelectedRoad] = useState<RoadType>(RoadType.ASPHALT);
    const [selectedZone, setSelectedZone] = useState<ZoneType>(ZoneType.RESIDENTIAL);

    // --- STATE FEEDBACK (Visuel immédiat) ---
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);
    const [fps, setFps] = useState(0);

    // --- STATE DATA (Données du jeu synchronisées) ---
    const [resources, setResources] = useState<PlayerResources | null>(null);
    const [stats, setStats] = useState<CityStats | null>(null);
    // ✅ FIX: On stocke le summary dans le state pour éviter le crash "undefined"
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
        stageRef, appRef, viewMode, selectedRoad, selectedZone,
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
    // 🔄 SYNC INITIALE & REGENERATION
    // =========================================================

    // Au montage, on récupère le summary initial du moteur
    useEffect(() => {
        const engine = getGameEngine();
        if (engine) {
            setSummary(engine.summary || DEFAULT_SUMMARY);
        }
    }, [isReady]);

    const handleRegenerate = () => {
        const engine = getGameEngine();
        if (engine) {
            engine.regenerate(); // Régénère la map (via engine)
            setSummary({ ...engine.summary }); // Met à jour l'UI
        }
    };

    const handleSpawnTraffic = () => {
        const engine = getGameEngine();
        if (engine) {
            engine.spawnTraffic(50);
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
                summary={summary} // ✅ Utilise le state sécurisé
                onSpawnTraffic={handleSpawnTraffic}
                onRegenerate={handleRegenerate}
            />
        </div>
    );
}