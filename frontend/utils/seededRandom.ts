/**
 * Seeded Random Number Generator
 * Based on Mulberry32 algorithm
 * Ensures deterministic map generation based on wallet address
 */

/**
 * Simple hash function to convert string to seed number
 */
export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Mulberry32 Seeded Random Number Generator
 * Returns a function that generates deterministic random numbers
 */
export function createSeededRandom(seed: number) {
    return function () {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Create RNG from wallet address or default seed
 */
export function createRNG(walletAddress?: string | null): () => number {
    const seedString = walletAddress || 'EcoRWA_Default_Seed_2024';
    const seed = hashString(seedString);
    return createSeededRandom(seed);
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(rng: () => number, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Get random boolean with specified probability
 */
export function randomBool(rng: () => number, probability: number = 0.5): boolean {
    return rng() < probability;
}
