// src/utils/worldGenerator.ts
import seedrandom from 'seedrandom';

export const generateWorldData = (size: number, seed: string) => {
    const rng = seedrandom(seed);
    const world = [];

    for (let x = -size / 2; x < size / 2; x++) {
        for (let z = -size / 2; z < size / 2; z++) {
            // Utilisation d'un bruit simple (ou random basé sur seed)
            const val = rng(); 
            let type = 'grass';
            
            // Logique de génération
            if (val < 0.05) type = 'river'; // 5% de chance d'eau
            else if (val < 0.15) type = 'tree'; // 10% de chance de forêt
            
            world.push({ x, z, type });
        }
    }
    return world;
};