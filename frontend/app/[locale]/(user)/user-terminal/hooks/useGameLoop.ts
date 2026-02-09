import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';
import { ResourceAssets } from '../engine/ResourceAssets'; // ✅ Import de sécurité

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    terrainContainerRef: React.MutableRefObject<PIXI.Container | null>,
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

        console.log("🎬 GameLoop: Running with Resource Support.");

        const tick = () => {
            if (!terrainContainerRef.current || !staticGRef.current || !uiGRef.current) {
                return;
            }

            // Exécution de la logique du moteur (déplacement camions, etc.)
            if (engine.tick) engine.tick();

            const currentZoom = staticGRef.current.parent?.scale.x || 1.0;
            const mapData = engine.map;

            if (mapData) {
                // Détection de changement de Zoom ou de Revision pour redessiner
                const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.1;
                const lodCrossed =
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                if (mapData.revision !== lastRevRef.current ||
                    viewMode !== lastViewModeRef.current ||
                    zoomChanged || lodCrossed) {

                    // ✅ LE RENDU STATIQUE (Sol + Arbres)
                    // On passe le terrainContainerRef.current qui contient les sprites
                    GameRenderer.renderStaticLayer(
                        terrainContainerRef.current,
                        staticGRef.current,
                        mapData,
                        viewMode,
                        false,
                        currentZoom
                    );

                    lastRevRef.current = mapData.revision;
                    lastViewModeRef.current = viewMode;
                    lastZoomRef.current = currentZoom;
                }

                // ✅ LE RENDU DYNAMIQUE (Curseur, Preview)
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

            // Mise à jour de l'UI React (toutes les 30 frames environ pour la performance)
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