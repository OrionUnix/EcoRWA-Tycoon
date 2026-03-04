/**
 * SeededRandom.ts
 *
 * 🔒 GÉNÉRATEUR PSEUDO-ALÉATOIRE DÉTERMINISTE
 *
 * PROBLÈME RÉSOLU :
 * L'utilisation de `rng()` (état global/séquentiel) à l'intérieur des boucles de
 * génération de tuiles crée des résultats non-déterministes :
 * si une seule condition change (ex: un biome de plus), toutes les valeurs
 * suivantes dans la séquence RNG sont décalées, produisant une carte différente.
 *
 * SOLUTION :
 * Toutes les décisions aléatoires par tuile (x, y) doivent utiliser une fonction
 * SANS ÉTAT qui calcule toujours la même valeur pour (seed, x, y, salt) donnés.
 * C'est le principe d'un "hash géographique".
 */

/**
 * Convertit une chaîne seed en nombre entier 32-bit (Djb2 hash).
 */
function seedStrToInt(seedStr: string): number {
    let seed = 5381;
    for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) + seed) ^ seedStr.charCodeAt(i);
        seed |= 0; // Force entier 32-bit signé
    }
    return seed >>> 0; // Unsigned 32-bit
}

/**
 * Génère un float [0, 1) déterministe à partir de (seed, x, y, salt).
 * Basé sur l'algorithme de hash "xxHash-like" (Squirrel3).
 *
 * Aucun état n'est conservé entre les appels.
 * Le même triplet (seed, x, y) + salt produit TOUJOURS le même résultat.
 *
 * @param seedInt  - La graine numérique de la map (depuis seedStrToInt)
 * @param x        - Coordonnée X de la tuile
 * @param y        - Coordonnée Y de la tuile
 * @param salt     - Différencie les usages : 0=biome, 1=coal, 2=iron, etc.
 * @returns        Float dans [0, 1)
 */
export function getTileRandom(seedInt: number, x: number, y: number, salt: number = 0): number {
    // Squirrel3 noise hash - rapide et bien distribué
    const BIT_NOISE1 = 0xB5297A4D;
    const BIT_NOISE2 = 0x68E31DA4;
    const BIT_NOISE3 = 0x1B56C4E9;

    let n = (x + salt * 10007) | 0;
    n = Math.imul(n, BIT_NOISE1);
    n ^= (n >>> 8);
    n += (y + salt * 10007) | 0;
    n = Math.imul(n ^ BIT_NOISE2, seedInt | 1);
    n ^= (n >>> 8);
    n += salt;
    n = Math.imul(n, BIT_NOISE3);
    n ^= (n >>> 8);

    return (n >>> 0) / 0xFFFFFFFF;
}

/**
 * Classe utilitaire pour pré-calculer la seed numérique une seule fois
 * et exposer une API pratique.
 *
 * Usage :
 *   const rng = new SeededRandom("0xABC...123");
 *   const val = rng.at(x, y, ResourceSalt.COAL);
 */
export class SeededRandom {
    private seedInt: number;

    constructor(seedStr: string) {
        this.seedInt = seedStrToInt(seedStr);
    }

    /**
     * Retourne un float [0, 1) déterministe pour (x, y, salt).
     */
    at(x: number, y: number, salt: number = 0): number {
        return getTileRandom(this.seedInt, x, y, salt);
    }

    /**
     * Crée un générateur séquentiel compatible avec `createNoise2D` de simplex-noise.
     * UNIQUEMENT pour l'initialisation des fonctions de bruit (appel unique par seed).
     * NE PAS utiliser pour des décisions par tuile.
     */
    createSequentialRng(): () => number {
        let seed = this.seedInt;
        return () => {
            // Mulberry32
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    getSeedInt(): number {
        return this.seedInt;
    }
}

/**
 * Constantes de "salt" pour chaque type de décision aléatoire par tuile.
 * Garantit que chaque ressource a son propre espace de valeurs,
 * même à (x, y) identiques.
 */
export const ResourceSalt = {
    BIOME_VARIATION: 0,
    OIL: 1,
    COAL: 2,
    IRON: 3,
    WOOD: 4,
    ANIMALS: 5,
    FISH: 6,
    GOLD: 7,
    SILVER: 8,
    STONE: 9,
    FOOD: 10,
    UNDERGROUND_WATER: 11,
} as const;
