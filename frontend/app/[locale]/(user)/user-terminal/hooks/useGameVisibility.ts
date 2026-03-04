import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { SaveSystem } from '../engine/systems/SaveSystem';
import { PersistenceManager } from '../engine/systems/PersistenceManager';

/**
 * Hook personnalisé gérant le "Battery Saver" et le système de "Idle Catch-up".
 * Coupe le rendu PixiJS et calcule les rentes d'inactivité quand l'onglet est masqué.
 */
export const useGameVisibility = (
    address: string | undefined,
    isAssetsLoaded: boolean
) => {
    const pauseTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isAssetsLoaded) return;

        const handleVisibilityChange = () => {
            const engine = getGameEngine();

            if (document.hidden) {
                // Le joueur quitte l'onglet
                console.log("⏸️ [useGameVisibility] Onglet masqué, pause de PixiJS et du jeu.");
                PIXI.Ticker.shared.stop();
                engine.isPaused = true;
                pauseTimeRef.current = Date.now();

            } else {
                // Le joueur revient
                console.log("▶️ [useGameVisibility] Onglet visible, reprise du jeu.");

                if (pauseTimeRef.current) {
                    const deltaMs = Date.now() - pauseTimeRef.current;
                    const deltaHours = deltaMs / (1000 * 60 * 60);

                    // Si absence de plus de 60 secondes (60000ms)
                    if (deltaMs > 60000) {
                        SaveSystem.processOfflineGains(engine.map, deltaHours);

                        // Forcer une sauvegarde immédiate pour consolider les gains dans Firebase
                        if (address) {
                            PersistenceManager.autoSave(engine.map, address, true);
                        }
                    }
                }

                pauseTimeRef.current = null;
                engine.isPaused = false;
                PIXI.Ticker.shared.start();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAssetsLoaded, address]);
};
