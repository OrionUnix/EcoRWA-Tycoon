import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PersistenceManager } from '../engine/systems/PersistenceManager';
import { getGameEngine } from '../engine/GameEngine';

/**
 * Hook personnalisé pour gérer la sauvegarde automatique de la ville.
 */
export const useGameSave = (
    address: string | undefined,
    isAssetsLoaded: boolean
) => {
    const { isConnected } = useAccount();
    const SAVE_INTERVAL = 120 * 1000; // 2 minutes

    // 1. Sauvegarde automatique périodique via PersistenceManager
    useEffect(() => {
        if (!isConnected || !address || !isAssetsLoaded) return;

        const interval = setInterval(() => {
            PersistenceManager.autoSave(getGameEngine().map, address);
        }, SAVE_INTERVAL);

        return () => clearInterval(interval);
    }, [isConnected, address, isAssetsLoaded]);

    // 2. Sauvegarde lors de la fermeture (Beacon API / pagehide)
    useEffect(() => {
        const handleEmergencySave = () => {
            if (isConnected && address && isAssetsLoaded) {
                const engine = getGameEngine();
                const payload = PersistenceManager.serializeGame(engine.map);

                // On tente une sauvegarde ultime via Beacon vers l'API interne
                const blob = new Blob([JSON.stringify({ address, payload })], { type: 'application/json' });
                navigator.sendBeacon('/api/emergency-save', blob);
            }
        };

        window.addEventListener('pagehide', handleEmergencySave);
        return () => window.removeEventListener('pagehide', handleEmergencySave);
    }, [isConnected, address, isAssetsLoaded]);
};
