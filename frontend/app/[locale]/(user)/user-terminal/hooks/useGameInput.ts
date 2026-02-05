import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { getMapEngine } from '../engine/MapEngine';
import { screenToGrid } from '../engine/isometric';
import { GRID_SIZE } from '../engine/config';
import { getResourceAtTile } from '../utils/resourceUtils';
import { RoadType, ZoneType } from '../engine/types'; // Import types

/**
 * Hook: useGameInput
 * Responsabilité: Gérer les interactions souris/touch (Drag, Click, Zoom) et déléguer au GameEngine
 */
export function useGameInput(
    stageRef: React.MutableRefObject<PIXI.Container | null>,
    appRef: React.MutableRefObject<PIXI.Application | null>,
    viewMode: string,
    selectedRoadType: RoadType,
    selectedZoneType: ZoneType,
    setCursorPos: (pos: { x: number, y: number }) => void,
    setHoverInfo: (info: any) => void,
    setTotalCost: (cost: number) => void,
    setIsValidBuild: (valid: boolean) => void,
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>
) {
    // Refs internes pour éviter les stale closures dans les event listeners Pixi
    const stateRef = useRef({ viewMode, selectedRoadType, selectedZoneType });
    useEffect(() => { stateRef.current = { viewMode, selectedRoadType, selectedZoneType }; }, [viewMode, selectedRoadType, selectedZoneType]);

    useEffect(() => {
        const stage = stageRef.current;
        const app = appRef.current;
        if (!stage || !app) return;

        let isDraggingCam = false;
        let lastX = 0, lastY = 0;
        let startDragTile: { x: number, y: number } | null = null;

        const getGridPos = (e: any) => {
            const local = stage.toLocal({ x: e.global.x, y: e.global.y });
            return screenToGrid(local.x, local.y);
        };

        const onDown = (e: any) => {
            const mode = stateRef.current.viewMode;
            if (e.button === 0 && ['BUILD_ROAD', 'BULLDOZER', 'ZONE'].includes(mode)) {
                startDragTile = getGridPos(e);
            } else {
                isDraggingCam = true;
                lastX = e.global.x; lastY = e.global.y;
            }
        };

        const onMove = (e: any) => {
            const gridPos = getGridPos(e);
            setCursorPos(gridPos);

            if (isDraggingCam) {
                stage.position.x += e.global.x - lastX;
                stage.position.y += e.global.y - lastY;
                lastX = e.global.x; lastY = e.global.y;
            } else if (startDragTile) {
                // Logic Preview Path via GameEngine
                const engine = getGameEngine();
                const path = engine.getPreviewPath(startDragTile.x, startDragTile.y, gridPos.x, gridPos.y);
                previewPathRef.current = path;

                if (stateRef.current.viewMode === 'BUILD_ROAD') {
                    const validation = engine.validateBuildPath(path);
                    setTotalCost(validation.cost);
                    setIsValidBuild(validation.valid);
                    isValidBuildRef.current = validation.valid;
                } else {
                    // Pour Zone/Bulldozer, c'est toujours valide (ou gratuit)
                    setTotalCost(0);
                    setIsValidBuild(true);
                    isValidBuildRef.current = true;
                }
            } else {
                // Hover Info
                if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
                    const idx = gridPos.y * GRID_SIZE + gridPos.x;
                    const engine = getMapEngine();
                    const info = getResourceAtTile(engine, idx, stateRef.current.viewMode);
                    setHoverInfo(info ? { ...info, biomeName: 'Biome' } : null);
                } else {
                    setHoverInfo(null);
                }
            }
        };

        const onUp = () => {
            isDraggingCam = false;

            if (startDragTile && previewPathRef.current.length > 0) {
                const gameEngine = getGameEngine();
                const { viewMode, selectedRoadType, selectedZoneType } = stateRef.current;

                // Délégation au GameEngine
                if (viewMode === 'BUILD_ROAD' && isValidBuildRef.current) {
                    gameEngine.handleBuildRoad(previewPathRef.current, selectedRoadType);
                } else if (viewMode === 'ZONE') {
                    gameEngine.handleSetZone(previewPathRef.current, selectedZoneType);
                } else if (viewMode === 'BULLDOZER') {
                    gameEngine.handleBulldoze(previewPathRef.current);
                }

                // Reset UI
                setTotalCost(0);
                previewPathRef.current = [];
            }
            startDragTile = null;
        };

        // Wheel Zoom
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const scaleBy = 1.1;
            const oldScale = stage.scale.x;
            const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clamped = Math.max(0.1, Math.min(5, newScale));

            // Zoom vers la souris
            const rect = app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = { x: (mouseX - stage.position.x) / oldScale, y: (mouseY - stage.position.y) / oldScale };
            stage.scale.set(clamped);
            stage.position.set(mouseX - worldPos.x * clamped, mouseY - worldPos.y * clamped);
        };

        stage.on('pointerdown', onDown);
        stage.on('pointermove', onMove);
        stage.on('pointerup', onUp);
        stage.on('pointerupoutside', onUp);
        app.canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            stage.off('pointerdown', onDown);
            stage.off('pointermove', onMove);
            stage.off('pointerup', onUp);
            stage.off('pointerupoutside', onUp);
            app.canvas?.removeEventListener('wheel', onWheel);
        };
    }, [viewMode, selectedRoadType, selectedZoneType]);
}
