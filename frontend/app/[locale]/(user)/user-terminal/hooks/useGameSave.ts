import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import * as PIXI from 'pixi.js';
import { PersistenceManager } from '../engine/systems/PersistenceManager';
import { getGameEngine } from '../engine/GameEngine';
import { SaveSystem } from '../engine/systems/SaveSystem';

/**
 * Hook personnalisé gérant la sauvegarde automatique de la ville, le Battery Saver 
 * et le système de Idle Catch-up (optimisation Firebase).
 */
export const useGameSave = (
    address: string | undefined,
    isAssetsLoaded: boolean
) => {
    const { isConnected } = useAccount();
    const SAVE_INTERVAL = 60 * 1000; // 1 minute (Batching Firebase)
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pauseTimeRef = useRef<number | null>(null);

    // 1. Gestion centralisée (Visibility + Auto-Save)
    useEffect(() => {
        if (!isConnected || !address || !isAssetsLoaded) return;

        const engine = getGameEngine();

        const startInterval = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                PersistenceManager.autoSave(engine.map, address);
            }, SAVE_INTERVAL);
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Le joueur quitte l'onglet -> PAUSE
                console.log("⏸️ [BatterySaver] Onglet masqué, pause de PixiJS et arrêt des sauvegardes.");
                PIXI.Ticker.shared.stop();
                engine.isPaused = true;

                // Stoppe l'intervalle Firebase
                stopInterval();

                // Force une dernière sauvegarde (Batch Push)
                PersistenceManager.autoSave(engine.map, address, true);

                pauseTimeRef.current = Date.now();

            } else {
                // Le joueur revient -> REPRISE
                console.log("▶️ [BatterySaver] Onglet visible, reprise du jeu.");

                if (pauseTimeRef.current) {
                    const deltaMs = Date.now() - pauseTimeRef.current;
                    const deltaHours = deltaMs / (1000 * 60 * 60);

                    // Si absence significative (> 60 secondes) -> Idle Catch-up
                    if (deltaMs > 60000) {
                        SaveSystem.processOfflineGains(engine.map, deltaHours);
                        // Consolidation immédiate des gains
                        PersistenceManager.autoSave(engine.map, address, true);
                    }
                }

                pauseTimeRef.current = null;
                engine.isPaused = false;
                PIXI.Ticker.shared.start();

                // Relance l'intervalle Firebase
                startInterval();
            }
        };

        // Démarrage initial
        startInterval();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isConnected, address, isAssetsLoaded]);

    // 2. Sauvegarde d'urgence lors de la fermeture (Beacon API)
    useEffect(() => {
        const handleEmergencySave = () => {
            if (isConnected && address && isAssetsLoaded) {
                const engine = getGameEngine();
                PersistenceManager.sendBeaconSave(engine.map, address);
            }
        };

        window.addEventListener('beforeunload', handleEmergencySave);
        window.addEventListener('pagehide', handleEmergencySave);
        return () => {
            window.removeEventListener('beforeunload', handleEmergencySave);
            window.removeEventListener('pagehide', handleEmergencySave);
        };
    }, [isConnected, address, isAssetsLoaded]);
};

