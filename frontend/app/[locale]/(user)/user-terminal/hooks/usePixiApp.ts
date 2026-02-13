import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../engine/config';

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const [isReady, setIsReady] = useState(false);
    const mountId = useRef(Math.random());

    useEffect(() => {
        if (!containerRef.current) return;

        console.log(`🔌 [PixiApp ${mountId.current.toFixed(4)}] Montage...`);
        let isMounted = true;
        let app: PIXI.Application | null = null;
        let viewport: Viewport | null = null;

        const initPixi = async () => {
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }

            app = new PIXI.Application();
            await app.init({
                resizeTo: containerRef.current!,
                backgroundColor: 0x111111,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            if (!isMounted || !app.renderer) return;

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(app.canvas);
            }

            // --- CONFIGURATION VIEWPORT ---

            const WORLD_WIDTH = GRID_SIZE * TILE_WIDTH;
            const WORLD_HEIGHT = GRID_SIZE * TILE_HEIGHT;

            viewport = new Viewport({
                screenWidth: app.screen.width,
                screenHeight: app.screen.height,
                worldWidth: WORLD_WIDTH,
                worldHeight: WORLD_HEIGHT,
                events: app.renderer.events,
            });

            app.stage.addChild(viewport);

            viewport
                .drag()
                .pinch()
                .wheel()
                .decelerate()
                .clampZoom({ minScale: 0.2, maxScale: 3.0 });

            appRef.current = app;
            viewportRef.current = viewport;
            stageRef.current = app.stage;

            console.log(`✅ [PixiApp] Prêt.`);
            setIsReady(true);
        };

        initPixi();

        return () => {
            isMounted = false;
            setIsReady(false);
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
                viewportRef.current = null;
            }
        };
    }, []);

    return { appRef, viewportRef, stageRef, isReady };
}