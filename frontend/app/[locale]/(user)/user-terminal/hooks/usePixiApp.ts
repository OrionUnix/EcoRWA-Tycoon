import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { COLORS } from '../components/GameRenderer';
import { INITIAL_ZOOM, GRID_SIZE } from '../engine/config';
import { gridToScreen } from '../engine/isometric';

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const staticGRef = useRef<PIXI.Graphics | null>(null);
    const uiGRef = useRef<PIXI.Graphics | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Protection contre le double-init strict mode React
    const initRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || initRef.current) return;
        initRef.current = true;

        const init = async () => {
            const app = new PIXI.Application();

            await app.init({
                resizeTo: window,
                backgroundColor: COLORS.BG,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            // Si le composant a été démonté pendant l'init async, on nettoie tout de suite
            if (!containerRef.current) {
                await app.destroy({ removeView: true });
                return;
            }

            containerRef.current.appendChild(app.canvas);

            // CSS Force
            app.canvas.style.position = 'absolute';
            app.canvas.style.display = 'block';
            app.canvas.style.width = '100%';
            app.canvas.style.height = '100%';

            // Stage Setup
            const stage = new PIXI.Container();
            stage.sortableChildren = true;
            stage.eventMode = 'static';
            stage.hitArea = new PIXI.Rectangle(-100000, -100000, 200000, 200000);
            app.stage.addChild(stage);

            const staticG = new PIXI.Graphics();
            staticG.label = "Static";

            const uiG = new PIXI.Graphics();
            uiG.label = "UI";
            uiG.zIndex = 100;

            stage.addChild(staticG, uiG);

            // Centrage
            const centerStage = () => {
                const zoom = stage.scale.x || INITIAL_ZOOM;
                const center = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
                stage.position.set(
                    (app.screen.width / 2) - (center.x * zoom),
                    (app.screen.height / 2) - (center.y * zoom)
                );
            };

            stage.scale.set(INITIAL_ZOOM);
            centerStage();

            // On attache l'événement resize
            app.renderer.on('resize', centerStage);

            // Assignation Refs
            appRef.current = app;
            stageRef.current = stage;
            staticGRef.current = staticG;
            uiGRef.current = uiG;

            setIsReady(true);
        };

        init();

        // Cleanup robuste
        return () => {
            initRef.current = false;
            setIsReady(false);
            const app = appRef.current;

            if (app) {
                // On enlève d'abord le listener pour éviter l'erreur _cancelResize
                app.renderer.off('resize');

                // On détruit proprement
                // Note: On évite d'attendre la promise ici car useEffect cleanup est synchrone
                // On lance la destruction en "fire and forget" sécurisé
                setTimeout(() => {
                    try {
                        app.destroy({ removeView: true });
                    } catch (e) {
                        console.warn("Pixi destroy error ignored:", e);
                    }
                }, 0);

                appRef.current = null;
            }
        };
    }, []);

    return { appRef, stageRef, staticGRef, uiGRef, isReady };
}