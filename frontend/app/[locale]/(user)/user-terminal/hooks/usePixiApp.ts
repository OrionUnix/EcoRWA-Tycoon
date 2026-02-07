import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

// On accepte HTMLDivElement | null pour satisfaire TypeScript
export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current || appRef.current) return;

        // 1. Initialisation de l'application Pixi
        const app = new PIXI.Application();

        app.init({
            resizeTo: containerRef.current,
            backgroundColor: 0x111111,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        }).then(() => {
            if (!containerRef.current) return;

            // On attache le canvas au DOM
            containerRef.current.appendChild(app.canvas);

            // 2. Création de la "Caméra" (Stage principal)
            const stage = new PIXI.Container();
            stage.sortableChildren = true;
            app.stage.addChild(stage);

            appRef.current = app;
            stageRef.current = stage;

            // Centrage initial
            stage.x = app.screen.width / 2;
            stage.y = app.screen.height / 2;

            // ==============================
            // 🎥 GESTION ZOOM & PAN
            // ==============================
            const canvas = app.canvas;

            // --- ZOOM (MOLETTE) ---
            const onWheel = (e: WheelEvent) => {
                e.preventDefault();
                const scaleChange = 1.1;
                const direction = e.deltaY > 0 ? 1 / scaleChange : scaleChange;

                let newScale = stage.scale.x * direction;

                // Limites du zoom (0.2 = très loin, 4.0 = très près)
                newScale = Math.max(0.2, Math.min(newScale, 4.0));

                // Zoom vers la position de la souris
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Calcul de la position dans le monde avant le zoom
                const worldPos = {
                    x: (mouseX - stage.x) / stage.scale.x,
                    y: (mouseY - stage.y) / stage.scale.y
                };

                // Application du nouveau zoom
                stage.scale.set(newScale);

                // Ajustement de la position pour garder la souris au même endroit
                stage.x = mouseX - worldPos.x * newScale;
                stage.y = mouseY - worldPos.y * newScale;
            };

            // --- PAN (DÉPLACEMENT CARTE) ---
            // On utilise le clic droit (2) ou clic molette (1) pour bouger
            let isPanning = false;
            let lastPos = { x: 0, y: 0 };

            const onMouseDown = (e: MouseEvent) => {
                // 1 = Molette, 2 = Clic Droit
                if (e.button === 1 || e.button === 2) {
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            };

            const onMouseMove = (e: MouseEvent) => {
                if (isPanning) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    stage.x += dx;
                    stage.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            };

            const onMouseUp = () => { isPanning = false; };

            // Désactiver le menu contextuel (clic droit) pour permettre le Pan
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            // Ajout des écouteurs
            canvas.addEventListener('wheel', onWheel);
            canvas.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            setIsReady(true);
        });

        return () => {
            // Nettoyage propre
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, []);

    return { appRef, stageRef, isReady };
}