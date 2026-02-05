import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { COLORS } from '../components/GameRenderer';
import { INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { gridToScreen } from '../engine/isometric';

/**
 * Hook: usePixiApp
 * Responsabilité: Initialiser PixiJS, gérer le Canvas, les Layers et le centrage caméra
 */
export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const init = async () => {
            const app = new PIXI.Application();
            await app.init({
                resizeTo: window,
                backgroundColor: COLORS.BG,
                antialias: true,
                resolution: window.devicePixelRatio || 1
            });

            if (!containerRef.current) { app.destroy(); return; }
            containerRef.current.appendChild(app.canvas);

            // Configuration Canvas
            app.canvas.style.position = 'absolute';
            app.canvas.style.display = 'block';
            app.canvas.style.width = '100%';  // Ajout conseillé
            app.canvas.style.height = '100%'; // Ajout conseillé

            // Stage & Layers
            const stage = new PIXI.Container();
            stage.sortableChildren = true;
            stage.eventMode = 'static';
            // Zone cliquable infinie pour attraper les événements de souris
            stage.hitArea = new PIXI.Rectangle(-100000, -100000, 200000, 200000);
            app.stage.addChild(stage);

            const staticG = new PIXI.Graphics();
            staticG.label = "Static";

            const uiG = new PIXI.Graphics();
            uiG.label = "UI";
            uiG.zIndex = 100;

            stage.addChild(staticG, uiG);

            // Centrage Caméra (Dynamique)
            const centerStage = () => {
                const zoom = stage.scale.x || INITIAL_ZOOM;
                const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
                stage.position.set(
                    (app.screen.width / 2) - (center.x * zoom),
                    (app.screen.height / 2) - (center.y * zoom)
                );
            };

            // Initial Setup
            stage.scale.set(INITIAL_ZOOM);
            centerStage();

            // Resize handler (PixiJS gère le canvas via resizeTo, on gère juste le centrage)
            app.renderer.on('resize', centerStage);

            // Refs assignation
            appRef.current = app;
            stageRef.current = stage;
            staticGRef.current = staticG;
            uiGRef.current = uiG;
            setIsReady(true);
        };

        init();
        return () => { appRef.current?.destroy({ removeView: true }); };
    }, []);

    return { appRef, stageRef, staticGRef, uiGRef, isReady };
}
