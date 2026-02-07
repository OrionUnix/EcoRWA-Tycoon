import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { screenToGrid } from '../engine/isometric';
import { RoadManager } from '../engine/RoadManager';
import { RoadType, ZoneType } from '../engine/types';

export function useGameInput(
    stageRef: React.MutableRefObject<PIXI.Container | null>,
    appRef: React.MutableRefObject<PIXI.Application | null>,
    isReady: boolean,
    viewMode: string,
    selectedRoad: RoadType,
    selectedZone: ZoneType,
    setCursorPos: (pos: { x: number, y: number }) => void,
    setHoverInfo: (info: any) => void,
    setTotalCost: (cost: number) => void,
    setIsValidBuild: (valid: boolean) => void,
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>
) {
    // Refs pour le Drag & Drop
    const isDraggingRef = useRef(false);
    const startTileRef = useRef<number | null>(null);
    const lastHoverIdxRef = useRef<number>(-1);

    useEffect(() => {
        if (!isReady || !stageRef.current || !appRef.current) return;
        const stage = stageRef.current;
        const engine = getGameEngine();

        // --- GESTION DU SURVOL (HOVER) ---
        const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
            const localPos = stage.toLocal(e.global);
            const gridPos = screenToGrid(localPos.x, localPos.y);

            // Sécurité : ne pas sortir de la grille
            if (gridPos.x < 0 || gridPos.x >= engine.map.config.size ||
                gridPos.y < 0 || gridPos.y >= engine.map.config.size) return;

            const idx = gridPos.y * engine.map.config.size + gridPos.x;

            // Mise à jour curseur UI
            setCursorPos(gridPos);

            // Optim: Ne rien faire si on est toujours sur la même case
            if (idx === lastHoverIdxRef.current) return;
            lastHoverIdxRef.current = idx;

            // 1. Récupération des infos pour le Tooltip
            if (engine.map && typeof (engine.map as any).getLayer === 'function') {
                // On utilise getResourceAtTile depuis resourceUtils normalement, 
                // mais ici on passe par le moteur si vous l'avez exposé, sinon on ignore pour l'instant
                // ou mieux : importez getResourceAtTile de utils/resourceUtils si besoin.
            }

            // 2. Gestion du Drag & Drop (Prévisualisation)
            if (viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {

                // 🚨 CORRECTION ICI : On utilise RoadManager directement, pas engine
                const path = RoadManager.getPreviewPath(startTileRef.current, idx);

                previewPathRef.current = path;

                // Calcul du coût et validation
                const { cost, valid } = RoadManager.calculateCost(engine.map, path, selectedRoad);

                setTotalCost(cost);
                setIsValidBuild(valid);
                isValidBuildRef.current = valid;
            } else {
                // Pas de drag, reset preview
                if (previewPathRef.current.length > 0) {
                    previewPathRef.current = [];
                    setTotalCost(0);
                }
            }
        };

        // --- CLIC ENFONCÉ (DÉBUT DRAG) ---
        const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
            if (e.button !== 0) return; // Clic gauche uniquement

            const localPos = stage.toLocal(e.global);
            const gridPos = screenToGrid(localPos.x, localPos.y);
            const idx = gridPos.y * engine.map.config.size + gridPos.x;

            if (viewMode === 'BUILD_ROAD') {
                isDraggingRef.current = true;
                startTileRef.current = idx;
                previewPathRef.current = [idx];
            } else if (viewMode === 'BULLDOZER') {
                engine.handleInteraction(idx, viewMode, null, null);
            } else if (viewMode === 'ZONE') {
                engine.handleInteraction(idx, viewMode, null, selectedZone);
            }
        };

        // --- RELÂCHEMENT (FIN DRAG & CONSTRUCTION) ---
        const onPointerUp = () => {
            if (viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {

                const path = previewPathRef.current;

                if (path.length > 0 && isValidBuildRef.current) {
                    // Construction
                    engine.handleInteraction(0, 'BUILD_ROAD', path, selectedRoad);
                }

                // Reset
                isDraggingRef.current = false;
                startTileRef.current = null;
                previewPathRef.current = [];
                setTotalCost(0);
            }
        };

        stage.eventMode = 'static';
        stage.hitArea = new PIXI.Rectangle(-5000, -5000, 10000, 10000);

        stage.on('pointermove', onPointerMove);
        stage.on('pointerdown', onPointerDown);
        stage.on('pointerup', onPointerUp);
        stage.on('pointerupoutside', onPointerUp);

        return () => {
            stage.off('pointermove', onPointerMove);
            stage.off('pointerdown', onPointerDown);
            stage.off('pointerup', onPointerUp);
            stage.off('pointerupoutside', onPointerUp);
        };
    }, [isReady, viewMode, selectedRoad, selectedZone]);
}