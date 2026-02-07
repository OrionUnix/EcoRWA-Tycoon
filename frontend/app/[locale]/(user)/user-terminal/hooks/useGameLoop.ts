import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    staticGRef: React.MutableRefObject<PIXI.Graphics | null>,
    uiGRef: React.MutableRefObject<PIXI.Graphics | null>,
    isReady: boolean,
    viewMode: string,
    cursorPos: { x: number, y: number },
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    setFps: (fps: number) => void,
    setResources: (res: any) => void,
    setStats: (stats: any) => void
) {
    const lastRevRef = useRef(-2);
    const lastViewModeRef = useRef('FORCE_INIT');
    const lastZoomRef = useRef(1);

    useEffect(() => {

        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine();

        console.log("🎬 GameLoop: Engine & LOD Ready.");

        const tick = () => {

            if (!staticGRef || !staticGRef.current || !uiGRef || !uiGRef.current) {
                return;
            }


            engine.tick();


            const currentZoom = staticGRef.current.parent?.scale.x || 1.0;


            if (engine.map) {

                const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.1;

                const lodCrossed =
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                if (engine.map.revision !== lastRevRef.current ||
                    viewMode !== lastViewModeRef.current ||
                    zoomChanged || lodCrossed) {

                    GameRenderer.renderStaticLayer(
                        staticGRef.current,
                        engine.map,
                        viewMode,
                        false, // showGrid
                        currentZoom
                    );

                    lastRevRef.current = engine.map.revision;
                    lastViewModeRef.current = viewMode;
                    lastZoomRef.current = currentZoom;
                }
            }

            // 4. RENDU DYNAMIQUE (UI, Preview, Voitures)
            if (engine.map) {
                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    engine.map,
                    cursorPos,
                    previewPathRef.current,
                    viewMode,
                    isValidBuildRef.current,
                    currentZoom
                );
            }

            // 5. UI UPDATES
            if (app.ticker && Math.round(app.ticker.lastTime) % 30 < 1) {
                setFps(Math.round(app.ticker.FPS));
                if (engine.getResources) setResources({ ...engine.getResources() });
                if (engine.getStats) setStats({ ...engine.getStats() });
            }
        };

        app.ticker.add(tick);

        return () => {
            if (app.ticker) {
                app.ticker.remove(tick);
            }
        };
    }, [isReady, viewMode, cursorPos]);
}