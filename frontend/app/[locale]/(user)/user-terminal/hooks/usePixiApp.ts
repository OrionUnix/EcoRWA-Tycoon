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

            // 🔑 FIX BUG 2: Centrage de la caméra sur le centre de la carte isometrique.
            // La grille isometrique s'étend de:
            //   X: -(GRID_SIZE*TILE_WIDTH/2) à +(GRID_SIZE*TILE_WIDTH/2)
            //   Y: 0 à GRID_SIZE*TILE_HEIGHT
            // Le centre du losange = (0, GRID_SIZE*TILE_HEIGHT/2)
            // viewport.moveCenter(worldX, worldY) place ce point au centre de l'écran.
            const centerMap = () => {
                const mapCenterX = 0; // (GRID_SIZE/2 - GRID_SIZE/2) * TILE_WIDTH/2 = 0
                const mapCenterY = (GRID_SIZE / 2 + GRID_SIZE / 2) * (TILE_HEIGHT / 2); // = GRID_SIZE * TILE_HEIGHT / 2
                viewport!.moveCenter(mapCenterX, mapCenterY);
                viewport!.setZoom(1.0);
            };
            centerMap();

            // Re-center on window resize
            const onResize = () => {
                if (!viewportRef.current) return;
                viewportRef.current.resize(window.innerWidth, window.innerHeight);
                // Only re-center if no camera state was saved (first load)
                // We rely on UserTerminalClient to restore saved camera position
            };
            window.addEventListener('resize', onResize);

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