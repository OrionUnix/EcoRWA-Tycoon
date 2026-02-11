import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { screenToGrid } from '../engine/isometric';
import { RoadManager } from '../engine/RoadManager';
import { RoadType, ZoneType, BuildingType } from '../engine/types';
import { AutoZoneBrush } from '../zoning/AutoZoneBrush';

export function useGameInput(
    stageRef: React.MutableRefObject<PIXI.Container | null>, // C'est le worldContainer
    appRef: React.MutableRefObject<PIXI.Application | null>,
    isReady: boolean,
    viewMode: string,
    selectedRoad: RoadType,
    selectedZone: ZoneType,
    selectedBuilding: BuildingType,
    setCursorPos: (pos: { x: number, y: number }) => void,
    setHoverInfo: (info: any) => void,
    setTotalCost: (cost: number) => void,
    setIsValidBuild: (valid: boolean) => void,
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>
) {
    // Refs pour la logique interne
    const isDraggingRef = useRef(false);       // Pour la construction (Clic Gauche)
    const isPanningRef = useRef(false);        // Pour le déplacement (Clic Droit)
    const lastPanPos = useRef({ x: 0, y: 0 }); // Position précédente de la souris pour le Pan
    const startTileRef = useRef<number | null>(null);
    const lastPaintedTileRef = useRef<number | null>(null); // 🆕 Pour éviter de repeindre la même case

    useEffect(() => {
        if (!isReady || !stageRef.current || !appRef.current) return;

        const stage = stageRef.current; // Le worldContainer
        const app = appRef.current;     // L'application Pixi
        const engine = getGameEngine();

        // --- 1. GESTION DU ZOOM (MOLETTE) ---
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            const scaleFactor = 1.1;
            const direction = e.deltaY > 0 ? (1 / scaleFactor) : scaleFactor;

            let newScale = stage.scale.x * direction;

            // Limites du zoom (Min: 0.2, Max: 3.0)
            if (newScale < 0.2) newScale = 0.2;
            if (newScale > 3.0) newScale = 3.0;

            // Zoom centré sur la souris (Calculs mathématiques)
            // 1. Position de la souris avant zoom (local au monde)
            const mouseGlobal = { x: e.clientX, y: e.clientY };
            const worldPos = stage.toLocal(mouseGlobal);

            // 2. Appliquer le zoom
            stage.scale.set(newScale);

            // 3. Ajuster la position du monde pour que la souris reste au même endroit
            const newWorldPos = stage.toGlobal(worldPos);
            stage.x += (mouseGlobal.x - newWorldPos.x);
            stage.y += (mouseGlobal.y - newWorldPos.y);
        };

        // --- 2. GESTION DU MOUVEMENT (POINTER MOVE) ---
        const onPointerMove = (e: PointerEvent) => {
            // A. GESTION DU PAN (Déplacement Caméra - Clic Droit)
            if (isPanningRef.current) {
                const dx = e.clientX - lastPanPos.current.x;
                const dy = e.clientY - lastPanPos.current.y;

                stage.x += dx;
                stage.y += dy;

                lastPanPos.current = { x: e.clientX, y: e.clientY };
                return; // Si on bouge la caméra, on ne fait rien d'autre
            }

            // B. GESTION DU CURSEUR (Calcul case grille)
            // On transforme la position souris écran -> position locale dans le monde zoomé
            // Attention : e.clientX est relatif à la fenêtre, il faut utiliser les events Pixi ou compenser
            // Ici on utilise l'event natif DOM ajouté sur le canvas, donc il faut le bounding rect si besoin
            // Mais Pixi gère 'toLocal' depuis le global (screen).

            const rect = app.canvas.getBoundingClientRect();
            const globalX = e.clientX - rect.left;
            const globalY = e.clientY - rect.top;

            const localPos = stage.toLocal({ x: globalX, y: globalY });
            const gridPos = screenToGrid(localPos.x, localPos.y);

            setCursorPos(gridPos);

            // C. TOOLTIP & CONSTRUCTION
            const idx = gridPos.y * engine.map.config.size + gridPos.x;

            // Info Tooltip
            if (engine.getResourceAtTile) {
                const info = engine.getResourceAtTile(idx, viewMode);
                setHoverInfo(info);
            }

            // Preview Construction (Drag Gauche)
            if (viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {
                const path = RoadManager.getPreviewPath(startTileRef.current, idx);
                previewPathRef.current = path;
                const { cost, valid } = RoadManager.calculateCost(engine.map, path, selectedRoad);
                setTotalCost(cost);
                setIsValidBuild(valid);
                isValidBuildRef.current = valid;
            }
            // 🎨 ZONE BRUSH DRAG-PAINTING
            else if (viewMode === 'ZONE' && isDraggingRef.current) {
                // Peindre la zone si on change de case
                if (idx !== lastPaintedTileRef.current) {
                    const painted = AutoZoneBrush.paintZone(engine.map, idx, selectedZone);
                    if (painted) {
                        lastPaintedTileRef.current = idx;
                    }
                }
            }
            else {
                if (!isDraggingRef.current) {
                    previewPathRef.current = [];
                    setTotalCost(0);
                }
            }
        };

        // --- 3. CLIC ENFONCÉ (POINTER DOWN) ---
        const onPointerDown = (e: PointerEvent) => {
            // CLIC DROIT (2) ou MOLETTE (1) = PAN
            if (e.button === 2 || e.button === 1) {
                isPanningRef.current = true;
                lastPanPos.current = { x: e.clientX, y: e.clientY };
                e.preventDefault();
                return;
            }

            // CLIC GAUCHE (0) = ACTION JEU
            if (e.button === 0) {
                const rect = app.canvas.getBoundingClientRect();
                const localPos = stage.toLocal({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                const gridPos = screenToGrid(localPos.x, localPos.y);
                const idx = gridPos.y * engine.map.config.size + gridPos.x;

                if (viewMode === 'BUILD_ROAD') {
                    isDraggingRef.current = true;
                    startTileRef.current = idx;
                    previewPathRef.current = [idx];
                } else if (viewMode === 'BULLDOZER') {
                    engine.handleInteraction(idx, viewMode, null, null);
                } else if (viewMode === 'ZONE') {
                    // 🎨 MODE PINCEAU : Lancer le drag-paint
                    isDraggingRef.current = true;
                    lastPaintedTileRef.current = idx;
                    AutoZoneBrush.paintZone(engine.map, idx, selectedZone);
                } else if (viewMode.startsWith('BUILD_')) {
                    // Construction de bâtiment
                    engine.handleInteraction(idx, viewMode, null, selectedBuilding);
                }
            }
        };

        // --- 4. RELÂCHEMENT (POINTER UP) ---
        const onPointerUp = (e: PointerEvent) => {
            // Fin du Pan
            if (e.button === 2 || e.button === 1) {
                isPanningRef.current = false;
            }

            // Fin de la Construction
            if (e.button === 0 && viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {
                const path = previewPathRef.current;
                if (path.length > 0 && isValidBuildRef.current) {
                    engine.handleInteraction(0, 'BUILD_ROAD', path, selectedRoad);
                }
                isDraggingRef.current = false;
                startTileRef.current = null;
                previewPathRef.current = [];
                setTotalCost(0);
            }

            // 🎨 Fin du Zone Brush Drag
            if (e.button === 0 && viewMode === 'ZONE' && isDraggingRef.current) {
                isDraggingRef.current = false;
                lastPaintedTileRef.current = null;
                console.log('✅ Zone brush drag terminé');
            }
        };

        // --- 5. ATTACHEMENT DES EVENTS (DOM natif pour fiabilité) ---
        const canvas = app.canvas;
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove); // Window pour ne pas perdre le drag si on sort
        window.addEventListener('pointerup', onPointerUp);
        // Empêcher le menu contextuel sur clic droit
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
        };
    }, [isReady, viewMode, selectedRoad, selectedZone, selectedBuilding]);
}