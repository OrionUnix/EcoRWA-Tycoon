import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { getMapEngine } from '../engine/MapEngine';
import { GameRenderer } from '../components/GameRenderer';

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    staticGRef: React.MutableRefObject<PIXI.Graphics | null>,
    uiGRef: React.MutableRefObject<PIXI.Graphics | null>,
    isReady: boolean,
    // Etats nécessaires pour le rendu
    viewMode: string,
    cursorPos: { x: number, y: number },
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    // Setters pour synchroniser l'UI
    setFps: (fps: number) => void,
    setResources: (res: any) => void,
    setStats: (stats: any) => void
) {
    // On utilise une ref pour stocker la dernière révision rendue
    const lastRevRef = useRef(-1);

    useEffect(() => {
        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine(); // Singleton GameEngine
        const map = getMapEngine();     // Singleton MapEngine (Données)

        const tick = () => {
            // 1. Faire avancer le Moteur (Logique)
            engine.tick();

            // 2. Synchroniser l'UI React (Throttled ~ toutes les 30 frames pour perf)
            // On évite de spammer React de mises à jour d'état inutilement
            if (Math.round(app.ticker.lastTime) % 30 < 1) {
                setFps(Math.round(app.ticker.FPS));
                setResources({ ...engine.getResources() }); // Utiliser le getter du GameEngine
                setStats({ ...engine.getStats() });         // Utiliser le getter du GameEngine
            }

            // 3. Rendu Statique (Optimisation: uniquement si la map a changé)
            // engine.map.revision est incrémenté quand on construit/détruit
            if (engine.map.revision !== lastRevRef.current) {
                if (staticGRef.current) {
                    GameRenderer.renderStaticLayer(staticGRef.current, map, viewMode, false);
                }
                lastRevRef.current = engine.map.revision;
            }

            // 4. Rendu Dynamique (À chaque frame: Curseur, Preview, Drag)
            if (uiGRef.current) {
                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    map,
                    cursorPos,
                    previewPathRef.current,
                    viewMode,
                    isValidBuildRef.current
                );
            }
        };

        // Démarrage de la boucle
        app.ticker.add(tick);

        // Nettoyage
        return () => {
            app.ticker.remove(tick);
        };
    }, [isReady, viewMode, cursorPos]); // On relance si le mode ou le curseur change (pour le rendu dynamique immédiat)
}