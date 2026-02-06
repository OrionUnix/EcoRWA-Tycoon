import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { getMapEngine } from '../engine/MapEngine';
import { screenToGrid } from '../engine/isometric';
import { GRID_SIZE } from '../engine/config';
import { getResourceAtTile } from '../utils/resourceUtils';

export function useGameInput(
    stageRef: React.MutableRefObject<PIXI.Container | null>,
    appRef: React.MutableRefObject<PIXI.Application | null>,
    isReady: boolean, // ✅ NOUVEAU PARAMÈTRE
    viewMode: string,
    selectedRoadType: any,
    selectedZoneType: any,
    setCursorPos: (pos: { x: number, y: number }) => void,
    setHoverInfo: (info: any) => void,
    setTotalCost: (cost: number) => void,
    setIsValidBuild: (valid: boolean) => void,
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>
) {
    const stateRef = useRef({ viewMode, selectedRoadType, selectedZoneType });
    useEffect(() => { stateRef.current = { viewMode, selectedRoadType, selectedZoneType }; }, [viewMode, selectedRoadType, selectedZoneType]);

    useEffect(() => {
        // 🛡️ GUARD: Si Pixi n'est pas prêt, on ne fait RIEN.
        if (!isReady || !appRef.current || !stageRef.current) return;

        const stage = stageRef.current;
        const app = appRef.current;
        const canvas = app.canvas; // Référence stable

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
                const engine = getGameEngine();
                const path = engine.getPreviewPath(startDragTile.x, startDragTile.y, gridPos.x, gridPos.y);
                previewPathRef.current = path;

                if (stateRef.current.viewMode === 'BUILD_ROAD') {
                    setTotalCost(path.length * 10);
                    setIsValidBuild(true);
                    isValidBuildRef.current = true;
                }
            } else {
                if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
                    const idx = gridPos.y * GRID_SIZE + gridPos.x;
                    setHoverInfo(getResourceAtTile(getMapEngine(), idx, stateRef.current.viewMode));
                } else {
                    setHoverInfo(null);
                }
            }
        };

        const onUp = () => {
            isDraggingCam = false;
            if (startDragTile && previewPathRef.current.length > 0) {
                const engine = getGameEngine();
                const { viewMode, selectedRoadType, selectedZoneType } = stateRef.current;

                engine.handleInteraction(previewPathRef.current, viewMode, viewMode === 'BUILD_ROAD' ? selectedRoadType : selectedZoneType);

                setTotalCost(0);
                previewPathRef.current = [];
            }
            startDragTile = null;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const scaleBy = 1.1;
            const oldScale = stage.scale.x;
            const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clamped = Math.max(0.1, Math.min(5, newScale));

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldPos = { x: (mouseX - stage.x) / oldScale, y: (mouseY - stage.y) / oldScale };
            stage.scale.set(clamped);
            stage.position.set(mouseX - worldPos.x * clamped, mouseY - worldPos.y * clamped);
        };

        stage.on('pointerdown', onDown);
        stage.on('pointermove', onMove);
        stage.on('pointerup', onUp);
        stage.on('pointerupoutside', onUp);

        // Ajout sécurisé du wheel listener sur le canvas
        canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            if (stage) {
                stage.off('pointerdown', onDown);
                stage.off('pointermove', onMove);
                stage.off('pointerup', onUp);
                stage.off('pointerupoutside', onUp);
            }
            // Retrait sécurisé
            if (canvas) {
                canvas.removeEventListener('wheel', onWheel);
            }
        };
    }, [isReady, viewMode, selectedRoadType, selectedZoneType]); // Ajout de isReady
}