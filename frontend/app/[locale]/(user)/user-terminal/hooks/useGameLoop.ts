import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';

// ⚠️ LE MOT CLÉ 'export' EST OBLIGATOIRE ICI
export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    terrainContainerRef: React.MutableRefObject<PIXI.Container | null>, // Ajouté
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
            // Vérification de sécurité complète
            if (!terrainContainerRef.current || !staticGRef.current || !uiGRef.current) {
                return;
            }

            if (engine.tick) engine.tick();

            const currentZoom = staticGRef.current.parent?.scale.x || 1.0;
            const mapData = engine.map;

            if (mapData) {
                const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.1;

                const lodCrossed =
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                if (mapData.revision !== lastRevRef.current ||
                    viewMode !== lastViewModeRef.current ||
                    zoomChanged || lodCrossed) {

                    // ✅ APPEL CORRIGÉ
                    GameRenderer.renderStaticLayer(
                        terrainContainerRef.current, // Container Sprites
                        staticGRef.current,          // Graphics Vecteurs
                        mapData,
                        viewMode,
                        false,
                        currentZoom
                    );

                    lastRevRef.current = mapData.revision;
                    lastViewModeRef.current = viewMode;
                    lastZoomRef.current = currentZoom;
                }

                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    mapData,
                    cursorPos,
                    previewPathRef.current,
                    viewMode,
                    isValidBuildRef.current,
                    currentZoom
                );
            }

            if (app.ticker && Math.round(app.ticker.lastTime) % 30 < 1) {
                setFps(Math.round(app.ticker.FPS));
                if (engine.getResources) setResources({ ...engine.getResources() });
                else if (mapData && mapData.resources) setResources({ ...mapData.resources });

                if (engine.getStats) setStats({ ...engine.getStats() });
                else if (mapData && mapData.stats) setStats({ ...mapData.stats });
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