import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { getGameEngine } from '../engine/GameEngine';
import { screenToGrid, gridToScreen } from '../engine/isometric';
import { RoadManager } from '../engine/RoadManager';
import { RoadType, ZoneType, BuildingType } from '../engine/types';
import { ParticleSystem } from '../engine/systems/ParticleSystem';
import { RWABuildingSpawner } from '../engine/RWABuildingSpawner';
import { BuildingManager } from '../engine/BuildingManager';

export function useGameInput(
    viewportRef: React.MutableRefObject<Viewport | null>, // ✅ Viewport au lieu de stage
    appRef: React.MutableRefObject<PIXI.Application | null>,
    isReady: boolean,
    viewMode: string,
    setViewMode: (mode: string) => void, // ✅ AJOUT
    selectedRoad: RoadType,
    selectedZone: ZoneType,
    selectedBuilding: BuildingType,
    setCursorPos: (pos: { x: number, y: number }) => void,
    setHoverInfo: (info: any) => void,
    setTotalCost: (cost: number) => void,
    setIsValidBuild: (valid: boolean) => void,
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    setSelectedBuildingId: (id: number | null) => void // ✅ AJOUT
) {
    // Refs pour la logique interne
    const isDraggingRef = useRef(false);
    const startTileRef = useRef<number | null>(null);
    const lastPaintedTileRef = useRef<number | null>(null);
    const keysPressed = useRef<{ [key: string]: boolean }>({});

    // --- 1. GESTION CLAVIER (DÉPLACEMENT CAMÉRA) ---
    useEffect(() => {
        if (!isReady || !viewportRef.current || !appRef.current) return;

        const viewport = viewportRef.current;
        const app = appRef.current;
        const BASE_SPEED = 15;

        // Listeners Clavier
        const onKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const onKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Ticker pour fluidité
        const moveTicker = () => {
            const scale = viewport.scale.x || 1;
            const speed = BASE_SPEED / scale; // ⚡ Vitesse dynamique selon le zoom

            if (keysPressed.current['ArrowUp'] || keysPressed.current['z'] || keysPressed.current['w']) {
                viewport.moveCenter(viewport.center.x, viewport.center.y - speed);
            }
            if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) {
                viewport.moveCenter(viewport.center.x, viewport.center.y + speed);
            }
            if (keysPressed.current['ArrowLeft'] || keysPressed.current['q'] || keysPressed.current['a']) {
                viewport.moveCenter(viewport.center.x - speed, viewport.center.y);
            }
            if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
                viewport.moveCenter(viewport.center.x + speed, viewport.center.y);
            }
        };

        app.ticker.add(moveTicker);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            if (app.ticker) app.ticker.remove(moveTicker);
        };
    }, [isReady]);


    // --- 2. GESTION DES MODES (DRAG PAUSE) ---
    useEffect(() => {
        if (!viewportRef.current) return;
        const viewport = viewportRef.current;

        // Si on est en mode construction (Drag nécessaire POUR LA SOURIS SUR LE JEU), on bloque le drag caméra
        // ✅ FIX: On autorise le drag caméra pour les bâtiments simples (click simple)
        const isDragConstruction = viewMode === 'BUILD_ROAD' || viewMode === 'ZONE';

        if (isDragConstruction) {
            viewport.plugins.pause('drag');
        } else {
            viewport.plugins.resume('drag');
        }
    }, [viewMode, isReady]);


    // --- 3. GESTION SOURIS (INTERACTIONS JEU) ---
    useEffect(() => {
        if (!isReady || !viewportRef.current || !appRef.current) return;

        const viewport = viewportRef.current;
        const app = appRef.current;
        const engine = getGameEngine();

        // Plus besoin de wheel ou pan manuel, pixi-viewport gère.
        // On se concentre sur les clics de jeu.

        const getGridPos = (globalX: number, globalY: number) => {
            // Pour être sûr, on prend le point global client et on le convertit dans le monde (viewport)
            // viewport.toLocal gère la transformation (zoom/pan)
            const rect = app.canvas.getBoundingClientRect();
            // Coordonnées relatives au canvas
            const canvasX = globalX - rect.left;
            const canvasY = globalY - rect.top;

            // Transformation vers le monde
            const worldPos = viewport.toLocal({ x: canvasX, y: canvasY });
            return screenToGrid(worldPos.x, worldPos.y);
        };

        const onPointerMove = (e: PointerEvent) => {
            // A. CULLING HOOK (Si besoin futur)
            // viewport.on('moved') est mieux pour ça, mais ici on track le curseur

            // B. CURSEUR
            // Contrairement à avant, on ne bloque pas si 'isPanning', car le panning est géré par viewport
            // Mais attention : si viewport drag, on veut peut-être éviter de construire ?
            // Pixi-viewport gère le drag, donc 'pointermove' continue de fire.

            const gridPos = getGridPos(e.clientX, e.clientY);
            setCursorPos(gridPos);

            // C. LOGIQUE JEU (Preview, Tooltip...)
            const idx = gridPos.y * engine.map.config.size + gridPos.x;

            // Info Tooltip
            if (engine.getResourceAtTile) {
                const info = engine.getResourceAtTile(idx, viewMode);
                setHoverInfo(info);
            }

            // Preview Construction (Drag Gauche)
            if (viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {
                // ✅ PASSAGE DU MOTEUR AU PATHFINDER
                const path = RoadManager.getPreviewPath(engine.map, startTileRef.current, idx);
                previewPathRef.current = path;
                const { cost, valid } = RoadManager.calculateCost(engine.map, path, selectedRoad);
                setTotalCost(cost);
                setIsValidBuild(valid);
                isValidBuildRef.current = valid;
            }
            // 🎨 ZONE BRUSH DRAG-PAINTING
            else if (viewMode === 'ZONE' && isDraggingRef.current) {
                if (idx !== lastPaintedTileRef.current) {
                    engine.handleInteraction(idx, 'ZONE', null, selectedZone);
                    lastPaintedTileRef.current = idx;
                }
            }
            else {
                if (!isDraggingRef.current) {
                    previewPathRef.current = [];
                    setTotalCost(0);
                }
            }
        };

        const onPointerDown = (e: PointerEvent) => {
            // CLIC DROIT / MOLETTE gérés par Viewport (Pan/Zoom)
            if (e.button !== 0) return;

            // CLIC GAUCHE = ACTION JEU
            const gridPos = getGridPos(e.clientX, e.clientY);
            const idx = gridPos.y * engine.map.config.size + gridPos.x;

            if (viewMode === 'BUILD_ROAD') {
                isDraggingRef.current = true;
                startTileRef.current = idx;
                previewPathRef.current = [idx];
            } else if (viewMode === 'BULLDOZER') {
                engine.handleInteraction(idx, viewMode, null, null);
            } else if (viewMode === 'ZONE') {
                isDraggingRef.current = true;
                lastPaintedTileRef.current = idx;
                engine.handleInteraction(idx, 'ZONE', null, selectedZone);
            } else if (viewMode === 'BUILD_RWA') {
                const payload = engine.currentRwaPayload;
                if (!payload) return;

                // 🚨 RÈGLE DE PLACEMENT INTELLIGENT OBLIGATOIRE (Près d'une route)
                const isNearRoad = BuildingManager.isNextToRoad(engine.map, idx);
                if (!isNearRoad) {
                    window.dispatchEvent(new CustomEvent('show_bob_warning', {
                        detail: { messageKey: 'error_road' }
                    }));
                    return; // Stoppe le placement
                }

                const placed = RWABuildingSpawner.placeRWAAtNode(engine.map, idx, payload.rwaId, payload.texturePath, payload.imageName);
                if (placed) {
                    // Reset vers mode sélection
                    engine.currentRwaPayload = null;
                    setViewMode('ALL');
                }
            } else if (viewMode.startsWith('BUILD_')) {
                const result = engine.handleInteraction(idx, viewMode, null, selectedBuilding);

                // ✅ AUTO-DESELECT (Si construction réussie)
                if (result && result.success) {
                    setViewMode('ALL');
                }
            }
            // ✅ MODE SÉLECTION (Terrain vide ou construction, pas les bâtiments qui sont gérés par CustomEvent)
            else if (viewMode === 'ALL') {
                setSelectedBuildingId(null);
                // Permettre d'ouvrir l'achat de terrain même en mode sélection
                engine.handleInteraction(idx, 'ALL', null, null);
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            if (e.button !== 0) return;

            if (viewMode === 'BUILD_ROAD' && isDraggingRef.current && startTileRef.current !== null) {
                const path = previewPathRef.current;
                if (path.length > 0 && isValidBuildRef.current) {
                    engine.handleInteraction(0, 'BUILD_ROAD', path, selectedRoad);
                }
            }

            // Reset commun
            isDraggingRef.current = false;
            startTileRef.current = null;
            previewPathRef.current = [];
            lastPaintedTileRef.current = null;
            setTotalCost(0);
        };

        // ✅ Écoute du CustomEvent "building_clicked" posté par le Sprite Pixi (pointertap)
        // NOTE CRITIQUE : Fonctionne dans TOUS les modes. Un clic sur un bâtiment annule
        // l'outil actif pour prioritiser l'inspection du bâtiment.
        const onBuildingClicked = (e: Event) => {
            const customEvent = e as CustomEvent;
            const idx = customEvent.detail.index;

            if (engine.map.buildingLayer[idx]) {
                // Si on était en train de construire/zoner, on retire l'outil
                if (viewMode !== 'ALL') {
                    setViewMode('ALL');
                }
                setSelectedBuildingId(idx);
            }
        };

        // Attach Events
        const canvas = app.canvas;
        // On écoute sur canvas pour down, mais window pour move/up (drag fiable)
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        // Context menu bloqué
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('building_clicked', onBuildingClicked);

        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
            window.removeEventListener('building_clicked', onBuildingClicked);
        };
    }, [isReady, viewMode, selectedRoad, selectedZone, selectedBuilding, setCursorPos, setHoverInfo, setTotalCost, setIsValidBuild, setSelectedBuildingId]);
}
