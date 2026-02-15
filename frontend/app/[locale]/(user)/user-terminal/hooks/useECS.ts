import { useEffect, useRef } from 'react';
import { globalWorld, createGameWorld, GameWorld } from '../engine/ecs/world';
import { createTimeSystem } from '../engine/ecs/systems/TimeSystem';
import { createBuildingSystem } from '../engine/ecs/systems/BuildingSystem'; // ✅ Import
import { createWorkerSystem } from '../engine/ecs/systems/WorkerSystem';
import { System } from 'bitecs';

export function useECS(isReady: boolean) {
    const worldRef = useRef<GameWorld>(globalWorld);
    const systemsRef = useRef<System[]>([]);

    useEffect(() => {
        if (!isReady) return;

        console.log("⚙️ ECS: Initialisation du monde...");

        // Initialisation des Systèmes
        systemsRef.current = [
            createTimeSystem(worldRef.current),
            createBuildingSystem(worldRef.current), // ✅ Ajout du système
            createWorkerSystem(worldRef.current) // ✅ Ajout du système Worker
            // Ajouter d'autres systèmes ici (Movement, Render, etc.)
        ];

        console.log("✅ ECS: Prêt.");

        return () => {
            // Cleanup si nécessaire
        };
    }, [isReady]);

    const updateECS = (delta: number, elapsed: number) => {
        if (!worldRef.current) return;

        // Mise à jour du temps global
        worldRef.current.time.delta = delta;
        worldRef.current.time.elapsed = elapsed;

        // Exécution de tous les systèmes
        for (const system of systemsRef.current) {
            system(worldRef.current);
        }
    };

    return { world: worldRef.current, updateECS };
}
