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
    const lastZoomRef = useRef(1); // ✅ Pour ne pas redessiner si le zoom change peu

    useEffect(() => {
        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine();

        console.log("🎬 GameLoop: LOD System Ready.");

        const tick = () => {
            if (engine.tick) engine.tick();

            // Récupérer le zoom actuel depuis le conteneur principal (le parent des Graphics)
            // On suppose que staticGRef est attaché au stage qui subit le zoom
            const currentZoom = staticGRef.current?.parent?.scale.x || 1.0;

            // --- Rendu STATIQUE ---
            if (engine.map && staticGRef.current) {
                // On redessine si :
                // 1. La map change (construction)
                // 2. Le mode change (vue pétrole)
                // 3. Le zoom franchit un seuil de LOD (Important pour la fluidité)

                const zoomChangedSignificantly = Math.abs(currentZoom - lastZoomRef.current) > 0.1;
                // On pourrait être plus fin et ne redessiner que si on passe un seuil LOD (0.6 ou 1.2)

                const needsRedraw =
                    engine.map.revision !== lastRevRef.current ||
                    viewMode !== lastViewModeRef.current ||
                    // Astuce : On force le redraw si on passe d'un niveau de LOD à un autre
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                if (needsRedraw) {
                    GameRenderer.renderStaticLayer(
                        staticGRef.current,
                        engine.map,
                        viewMode,
                        false,
                        currentZoom // ✅ On passe le zoom
                    );

                    lastRevRef.current = engine.map.revision;
                    lastViewModeRef.current = viewMode;
                    lastZoomRef.current = currentZoom;
                }
            }

            // --- Rendu DYNAMIQUE ---
            if (uiGRef.current && engine.map) {
                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    engine.map,
                    cursorPos,
                    previewPathRef.current,
                    viewMode,
                    isValidBuildRef.current,
                    currentZoom // ✅ On passe le zoom aussi ici
                );
            }

            // UI Updates
            if (Math.round(app.ticker.lastTime) % 30 < 1) {
                setFps(Math.round(app.ticker.FPS));
                if (engine.getResources) setResources({ ...engine.getResources() });
                if (engine.getStats) setStats({ ...engine.getStats() });
            }
        };

        app.ticker.add(tick);
        return () => { app.ticker.remove(tick); };
    }, [isReady, viewMode, cursorPos]);
}