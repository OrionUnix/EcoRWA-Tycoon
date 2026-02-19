import { BiomeType } from '../types';

export interface ResourceRule {
    chance: number;
    intensity: number;
}

export interface BiomeRule {
    oil: ResourceRule;
    coal: ResourceRule;
    iron: ResourceRule;
    wood: ResourceRule;
    animals: ResourceRule;
    fish: ResourceRule;
    // ✅ Nouvelles ressources ajoutées à l'interface
    gold: ResourceRule;
    silver: ResourceRule;
    stone: ResourceRule;
}

export const BIOME_SIGNATURES: Record<number, BiomeRule> = {
    [BiomeType.DEEP_OCEAN]: {
        oil: { chance: 0.3, intensity: 10000.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.8, intensity: 10000.0 }, // ✅ Wood 0
        gold: { chance: 0.01, intensity: 2000.0 }, silver: { chance: 0.05, intensity: 3000.0 }, stone: { chance: 0.1, intensity: 2000.0 }
    },
    [BiomeType.OCEAN]: {
        oil: { chance: 0.1, intensity: 5000.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.6, intensity: 8000.0 }, // ✅ Wood 0
        gold: { chance: 0.01, intensity: 1000.0 }, silver: { chance: 0.05, intensity: 2000.0 }, stone: { chance: 0.1, intensity: 2000.0 }
    },
    [BiomeType.BEACH]: {
        oil: { chance: 0.05, intensity: 3000.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 2000.0 }, fish: { chance: 0.2, intensity: 3000.0 }, // ✅ Wood 0 (était 0.1)
        gold: { chance: 0.02, intensity: 1000.0 }, silver: { chance: 0.1, intensity: 2000.0 }, stone: { chance: 0.2, intensity: 3000.0 }
    },
    [BiomeType.PLAINS]: {
        oil: { chance: 0.05, intensity: 4000.0 }, coal: { chance: 0.1, intensity: 5000.0 }, iron: { chance: 0.1, intensity: 3000.0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.4, intensity: 5000.0 }, fish: { chance: 0, intensity: 0 }, // ✅ Wood 0 (était 0.2)
        gold: { chance: 0.02, intensity: 2000.0 }, silver: { chance: 0.1, intensity: 3000.0 }, stone: { chance: 0.4, intensity: 5000.0 }
    },
    [BiomeType.FOREST]: {
        oil: { chance: 0.02, intensity: 2000.0 }, coal: { chance: 0.2, intensity: 4000.0 }, iron: { chance: 0.1, intensity: 3000.0 },
        wood: { chance: 1.0, intensity: 10000.0 }, animals: { chance: 0.9, intensity: 10000.0 }, fish: { chance: 0, intensity: 0 }, // ✅ Wood reste actif ici uniquement
        gold: { chance: 0.01, intensity: 1000.0 }, silver: { chance: 0.05, intensity: 2000.0 }, stone: { chance: 0.3, intensity: 4000.0 }
    },
    [BiomeType.DESERT]: {
        oil: { chance: 0.8, intensity: 10000.0 }, coal: { chance: 0.1, intensity: 3000.0 }, iron: { chance: 0.2, intensity: 4000.0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 1000.0 }, fish: { chance: 0, intensity: 0 }, // ✅ Wood 0
        gold: { chance: 0.08, intensity: 8000.0 }, silver: { chance: 0.15, intensity: 7000.0 }, stone: { chance: 0.3, intensity: 4000.0 }
    },
    [BiomeType.MOUNTAIN]: {
        oil: { chance: 0, intensity: 0 }, coal: { chance: 0.7, intensity: 10000.0 }, iron: { chance: 0.8, intensity: 10000.0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.2, intensity: 4000.0 }, fish: { chance: 0, intensity: 0 }, // ✅ Wood 0 (était 0.2)
        gold: { chance: 0.1, intensity: 10000.0 }, silver: { chance: 0.2, intensity: 8000.0 }, stone: { chance: 1.0, intensity: 10000.0 }
    },
    [BiomeType.SNOW]: {
        oil: { chance: 0.1, intensity: 5000.0 }, coal: { chance: 0.3, intensity: 5000.0 }, iron: { chance: 0.3, intensity: 5000.0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 2000.0 }, fish: { chance: 0, intensity: 0 }, // ✅ Wood 0 (était 0.1)
        gold: { chance: 0.03, intensity: 3000.0 }, silver: { chance: 0.1, intensity: 4000.0 }, stone: { chance: 0.5, intensity: 6000.0 }
    }
};