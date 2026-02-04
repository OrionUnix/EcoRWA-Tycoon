import { useEffect, useState, MutableRefObject, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { INITIAL_ZOOM } from '../engine/config';

const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 5.0; // Augmenté pour voir les détails

export function useCamera(
    appRef: MutableRefObject<PIXI.Application | null>,
    containerRef: MutableRefObject<PIXI.Container | null>,
    isReady: boolean
) {
    const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!isReady || !appRef.current || !containerRef.current) return;

        // @ts-ignore
        const view = (appRef.current.canvas || appRef.current.view) as HTMLCanvasElement;
        const container = containerRef.current;

        // --- ZOOM (Mathématiques de précision) ---
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            // 1. Calcul du nouveau scale
            const currentScale = container.scale.x;
            const scaleFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
            const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentScale * scaleFactor));

            // 2. Calcul du décalage pour zoomer VERS la souris
            // Position de la souris dans le monde AVANT le zoom
            const mouseGlobal = { x: e.clientX, y: e.clientY };
            // On convertit la position souris en position locale dans le conteneur
            // (C'est le point du monde qu'on pointe)
            const worldPosAtMouse = {
                x: (mouseGlobal.x - container.x) / currentScale,
                y: (mouseGlobal.y - container.y) / currentScale
            };

            // 3. Application du Zoom
            container.scale.set(newScale);
            setZoomLevel(newScale);

            // 4. Correction de la position (Pan) pour que le point sous la souris ne bouge pas
            // Nouvelle position = Souris - (PointMonde * NouveauZoom)
            container.x = mouseGlobal.x - worldPosAtMouse.x * newScale;
            container.y = mouseGlobal.y - worldPosAtMouse.y * newScale;
        };

        // --- PAN (Déplacement) ---
        const onMouseDown = (e: MouseEvent) => {
            // Clic Droit (2) ou Molette (1)
            if (e.button === 1 || e.button === 2) {
                isDragging.current = true;
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                view.style.cursor = 'grabbing';
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                const dx = e.clientX - lastMousePos.current.x;
                const dy = e.clientY - lastMousePos.current.y;

                container.x += dx;
                container.y += dy;

                lastMousePos.current = { x: e.clientX, y: e.clientY };
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
            view.style.cursor = 'default';
        };

        view.addEventListener('wheel', onWheel, { passive: false });
        view.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        view.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            view.removeEventListener('wheel', onWheel);
            view.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            view.removeEventListener('contextmenu', (e) => e.preventDefault());
        };
    }, [isReady]);

    return { zoomLevel };
}