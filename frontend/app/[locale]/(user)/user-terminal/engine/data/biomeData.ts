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
        oil: { chance: 0.3, intensity: 1.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.8, intensity: 1.0 },
        gold: { chance: 0.01, intensity: 0.2 }, silver: { chance: 0.05, intensity: 0.3 }, stone: { chance: 0.1, intensity: 0.2 }
    },
    [BiomeType.OCEAN]: {
        oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.6, intensity: 0.8 },
        gold: { chance: 0.01, intensity: 0.1 }, silver: { chance: 0.05, intensity: 0.2 }, stone: { chance: 0.1, intensity: 0.2 }
    },
    [BiomeType.BEACH]: {
        oil: { chance: 0.05, intensity: 0.3 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0.2, intensity: 0.3 },
        gold: { chance: 0.02, intensity: 0.1 }, silver: { chance: 0.1, intensity: 0.2 }, stone: { chance: 0.2, intensity: 0.3 }
    },
    [BiomeType.PLAINS]: {
        oil: { chance: 0.05, intensity: 0.4 }, coal: { chance: 0.1, intensity: 0.5 }, iron: { chance: 0.1, intensity: 0.3 },
        wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.4, intensity: 0.5 }, fish: { chance: 0, intensity: 0 },
        gold: { chance: 0.02, intensity: 0.2 }, silver: { chance: 0.1, intensity: 0.3 }, stone: { chance: 0.4, intensity: 0.5 }
    },
    [BiomeType.FOREST]: {
        oil: { chance: 0.02, intensity: 0.2 }, coal: { chance: 0.2, intensity: 0.4 }, iron: { chance: 0.1, intensity: 0.3 },
        wood: { chance: 1.0, intensity: 1.0 }, animals: { chance: 0.9, intensity: 1.0 }, fish: { chance: 0, intensity: 0 },
        gold: { chance: 0.01, intensity: 0.1 }, silver: { chance: 0.05, intensity: 0.2 }, stone: { chance: 0.3, intensity: 0.4 }
    },
    [BiomeType.DESERT]: {
        oil: { chance: 0.8, intensity: 1.0 }, coal: { chance: 0.1, intensity: 0.3 }, iron: { chance: 0.2, intensity: 0.4 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 0.1 }, fish: { chance: 0, intensity: 0 },
        gold: { chance: 0.08, intensity: 0.8 }, silver: { chance: 0.15, intensity: 0.7 }, stone: { chance: 0.3, intensity: 0.4 }
    },
    [BiomeType.MOUNTAIN]: {
        oil: { chance: 0, intensity: 0 }, coal: { chance: 0.7, intensity: 1.0 }, iron: { chance: 0.8, intensity: 1.0 },
        wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.2, intensity: 0.4 }, fish: { chance: 0, intensity: 0 },
        gold: { chance: 0.1, intensity: 1.0 }, silver: { chance: 0.2, intensity: 0.8 }, stone: { chance: 1.0, intensity: 1.0 }
    },
    [BiomeType.SNOW]: {
        oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0.3, intensity: 0.5 }, iron: { chance: 0.3, intensity: 0.5 },
        wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0, intensity: 0 },
        gold: { chance: 0.03, intensity: 0.3 }, silver: { chance: 0.1, intensity: 0.4 }, stone: { chance: 0.5, intensity: 0.6 }
    }
};