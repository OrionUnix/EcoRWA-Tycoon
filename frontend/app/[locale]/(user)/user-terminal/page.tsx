'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';

// Imports des Hooks
import { usePixiApp } from './hooks/usePixiApp';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameInput } from './hooks/useGameInput';

// Imports Moteur & UI
import { getGameEngine } from './engine/GameEngine';
import GameUI from './components/GameUI';
import { RoadType, ZoneType } from './engine/types';

export default function UserTerminalGame() {
    // 1. Références DOM & Pixi
    const containerRef = useRef<HTMLDivElement>(null);
    const { appRef, stageRef, isReady } = usePixiApp(containerRef);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);

    // 2. État du Jeu
    const [viewMode, setViewMode] = useState('ALL');
    const [selectedRoad, setSelectedRoad] = useState(RoadType.DIRT);
    const [selectedZone, setSelectedZone] = useState(ZoneType.RESIDENTIAL);

    // Stats UI
    const [fps, setFps] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isValidBuild, setIsValidBuild] = useState(true);

    const [resources, setResources] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    // ✅ Initialisé à null pour garantir que Serveur et Client ont la même valeur au départ
    const [summary, setSummary] = useState<any>(null);

    const previewPathRef = useRef<number[]>([]);
    const isValidBuildRef = useRef(true);

    // 3. INITIALISATION DES CALQUES
    useEffect(() => {
        if (isReady && stageRef.current && !staticGRef.current) {
            console.log("🎨 Initialisation des Layers Pixi...");

            const staticG = new PIXI.Graphics();
            const uiG = new PIXI.Graphics();

            stageRef.current.addChild(staticG);
            stageRef.current.addChild(uiG);

            staticGRef.current = staticG;
            uiGRef.current = uiG;

            // ✅ On force le calcul et ON MET À JOUR L'ÉTAT REACT ici (Client seulement)
            const engine = getGameEngine();
            engine.map.calculateSummary();
            setSummary(engine.map.currentSummary);
        }
    }, [isReady]);

    // 4. BOUCLE DE JEU
    useGameLoop(
        appRef, staticGRef, uiGRef, isReady, viewMode, cursorPos,
        previewPathRef, isValidBuildRef, setFps, setResources, setStats
    );

    // 5. INPUT
    useGameInput(
        stageRef, appRef, isReady, viewMode, selectedRoad, selectedZone,
        setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild,
        previewPathRef, isValidBuildRef
    );

    const t = (key: string) => key;
    const engine = getGameEngine();

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

                // 🚨 CORRECTION CRITIQUE ICI :
                // On utilise la variable d'état 'summary' (qui est null au début)
                // Au lieu de 'engine.map.currentSummary' (qui est aléatoire et différent sur serveur/client)
                summary={summary}

                onSpawnTraffic={() => engine.spawnTraffic()}
                onRegenerate={() => {
                    engine.map.generateWorld();
                    engine.map.calculateSummary();
                    setSummary(engine.map.currentSummary); // Mettre à jour l'UI après regen
                    engine.map.revision++;
                }}
            />
        </div>
    );
}