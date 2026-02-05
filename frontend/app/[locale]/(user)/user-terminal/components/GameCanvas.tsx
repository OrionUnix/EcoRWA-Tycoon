'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getGameEngine } from '../engine/GameEngine';
import { getMapEngine, regenerateWorld } from '../engine/MapEngine';
import { GameRenderer } from './GameRenderer';
import GameUI from './GameUI';
import { usePixiApp } from '../hooks/usePixiApp';
import { useGameInput } from '../hooks/useGameInput';
import { RoadType, ZoneType, PlayerResources, CityStats } from '../engine/types';

/**
 * GameCanvas - Composant Principal Refactorisé
 * Architecture:
 * - usePixiApp: Gère le canvas, PixiJS, layers, camera
 * - useGameInput: Gère la souris, drag, clics, zoom
 * - GameRenderer: Gère le dessin (View pure)
 * - GameEngine: Gère la logique (Controller/Model)
 */
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

    // --- STATE JEU (Sync avec Engine pour UI) ---
    const [resources, setResources] = useState<PlayerResources | null>(null);
    const [stats, setStats] = useState<CityStats | null>(null);

    // --- REFS ---
    const containerRef = useRef<HTMLDivElement>(null);
    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true); // Pour accès synchrone dans les events

    // --- HOOKS ---
    const { appRef, staticGRef, uiGRef, stageRef, isReady } = usePixiApp(containerRef);

    useGameInput(
        stageRef, appRef, viewMode, selectedRoad, selectedZone,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef
    );

    // --- BOUCLE DE JEU (GAME LOOP) ---
    // On la garde ici car elle met à jour les états React locaux (resources, stats) pour l'UI
    React.useEffect(() => {
        if (!isReady || !appRef.current) return;

        const engine = getGameEngine();
        const map = getMapEngine();
        let lastRev = -1;

        const tick = () => {
            // 1. Logique Jeu
            engine.tick();

            // 2. Sync UI (Throttled: maj toutes les 30 frames seulement)
            if (appRef.current && (Math.round(appRef.current.ticker.lastTime) % 30 < 1)) {
                setFps(Math.round(appRef.current.ticker.FPS));
                setResources({ ...engine.resources });
                if (engine.stats) {
                    setStats({ ...engine.stats, demand: { ...engine.stats.demand } });
                }
            }

            // 3. Rendu Statique (Seulement si changement)
            if (engine.revision !== lastRev) {
                GameRenderer.renderStaticLayer(staticGRef.current!, map, viewMode, false);
                lastRev = engine.revision;
            }

            // 4. Rendu Dynamique (Curseur, Preview)
            GameRenderer.renderDynamicLayer(
                uiGRef.current!, map, cursorPos, previewPathRef.current, viewMode, isValidBuildRef.current
            );
        };

        appRef.current.ticker.add(tick);
        return () => { appRef.current?.ticker.remove(tick); };
    }, [isReady, viewMode, cursorPos]); // Dépendances importantes pour le rendu

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
            {/* CANVAS CONTAINER */}
            <div ref={containerRef} className="absolute inset-0" />

            {/* UI LAYER */}
            <GameUI
                t={t}
                viewMode={viewMode} setViewMode={setViewMode}
                selectedRoadType={selectedRoad} setSelectedRoadType={setSelectedRoad}
                selectedZoneType={selectedZone} setSelectedZoneType={setSelectedZone}
                totalCost={totalCost} isValidBuild={isValidBuild}
                fps={fps} cursorPos={cursorPos} hoverInfo={hoverInfo}
                resources={resources} stats={stats} summary={getGameEngine().summary}
                onSpawnTraffic={() => getGameEngine().spawnTraffic(50)}
                onRegenerate={() => { getGameEngine().regenerate(); }}
            />
        </div>
    );
}