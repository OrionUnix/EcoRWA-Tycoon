import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    staticGRef: React.MutableRefObject<PIXI.Graphics | null>,
    uiGRef: React.MutableRefObject<PIXI.Graphics | null>,
    isReady: boolean,
    viewMode: string, // <-- Cette valeur change quand on clique sur les boutons
    cursorPos: { x: number, y: number },
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    setFps: (fps: number) => void,
    setResources: (res: any) => void,
    setStats: (stats: any) => void
) {
    const lastRevRef = useRef(-2);
    // ✅ NOUVEAU : On stocke le dernier mode de vue pour détecter les changements
    const lastViewModeRef = useRef('FORCE_INIT');

    useEffect(() => {
        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine();

        console.log("🎬 GameLoop: Démarrage ou Changement de mode...", { viewMode });

        const tick = () => {
            // 1. Mise à jour Logique
            if (engine.tick) {
                engine.tick();
            }

            // 2. Rendu STATIQUE (Terrain, Ressources, Bâtiments)
            if (engine.map && staticGRef.current) {
                // ✅ CONDITION CORRIGÉE :
                // On redessine SI la map a changé (revision) OU SI le mode de vue a changé
                if (engine.map.revision !== lastRevRef.current || viewMode !== lastViewModeRef.current) {

                    // Debug pour vérifier que ça passe ici
                    // console.log(`🎨 Redrawing Static: Rev ${engine.map.revision} | Mode ${viewMode}`);

                    GameRenderer.renderStaticLayer(
                        staticGRef.current,
                        engine.map,
                        viewMode,
                        false
                    );

                    // On met à jour nos références
                    lastRevRef.current = engine.map.revision;
                    lastViewModeRef.current = viewMode;
                }
            }

            // 3. Rendu DYNAMIQUE (Curseur, Voitures)
            if (uiGRef.current && engine.map) {
                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    engine.map,
                    cursorPos,
                    previewPathRef.current,
                    viewMode,
                    isValidBuildRef.current
                );
            }

            // 4. UI Updates
            if (Math.round(app.ticker.lastTime) % 30 < 1) {
                setFps(Math.round(app.ticker.FPS));
                if (engine.getResources) setResources({ ...engine.getResources() });
                if (engine.getStats) setStats({ ...engine.getStats() });
            }
        };

        app.ticker.add(tick);

        return () => {
            app.ticker.remove(tick);
        };
    }, [isReady, viewMode, cursorPos]); // viewMode est bien une dépendance ici
}