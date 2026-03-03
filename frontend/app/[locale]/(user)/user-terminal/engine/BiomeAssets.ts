import * as PIXI from 'pixi.js';
import { ProceduralTiles } from './ProceduralTiles';
import { BiomeType } from './types';
import { TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH } from './config';

// ═══════════════════════════════════════════════════════════
// Cache des textures procédurales (fallback)
// ═══════════════════════════════════════════════════════════
const texturesCache = new Map<number, PIXI.Texture[]>();

// ═══════════════════════════════════════════════════════════
// Cache des textures PNG réelles (ground system)
// ═══════════════════════════════════════════════════════════
const groundTexturesCache = new Map<number, PIXI.Texture[]>();
let groundTexturesLoaded = false;
let groundTexturesLoading = false;

// Chemin base des assets ground
const GROUND_BASE = '/assets/isometric/Spritesheet/ground/';

/**
 * Mapping Biome → variantes PNG
 * On utilise les noms exacts du dossier public/assets/isometric/Spritesheet/ground/
 */
const BIOME_PNG_MAP: Record<number, string[]> = {
    [BiomeType.PLAINS]: ['gras.png'],
    [BiomeType.FOREST]: ['dirt.png'],                   // ✅ Sous-bois : terre marron uniquement
    [BiomeType.DESERT]: ['sand.png'],
    [BiomeType.BEACH]: ['sand.png'],
    [BiomeType.MOUNTAIN]: ['dirt.png'],
    [BiomeType.SNOW]: ['sand_B.png'],                             // sable clair = neige (fallback)
    [BiomeType.OCEAN]: ['walter.png'],
    [BiomeType.DEEP_OCEAN]: ['walter_B.png'],
};

// ═══════════════════════════════════════════════════════════
// LOADER PNG Ground
// ═══════════════════════════════════════════════════════════

/**
 * Charge toutes les textures PNG ground via PIXI.Assets.
 * Idempotent (ne charge qu'une fois). Retourne une Promise résolue
 * quand toutes les textures sont disponibles dans le cache.
 */
export async function loadGroundTextures(): Promise<boolean> {
    if (groundTexturesLoaded) return true;
    if (groundTexturesLoading) {
        // Attendre la fin du chargement en cours
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (groundTexturesLoaded) {
                    clearInterval(check);
                    resolve(true);
                }
            }, 50);
        });
    }

    groundTexturesLoading = true;
    console.log('🌱 BiomeAssets: Chargement des textures PNG ground...');

    // Collecter toutes les URLs uniques
    const allUrls = new Set<string>();
    for (const variants of Object.values(BIOME_PNG_MAP)) {
        for (const file of variants) {
            allUrls.add(GROUND_BASE + file);
        }
    }

    try {
        // Charger en parallèle
        await PIXI.Assets.load(Array.from(allUrls));

        // Peupler le cache
        for (const [biomeKey, variants] of Object.entries(BIOME_PNG_MAP)) {
            const biomeId = Number(biomeKey);
            const textures: PIXI.Texture[] = [];
            for (const file of variants) {
                const url = GROUND_BASE + file;
                const tex = PIXI.Assets.get<PIXI.Texture>(url);
                if (tex && !tex.destroyed) {
                    // ✅ REPEAT mode requis pour le seamless via UV matrix (Pixi v8+)
                    if (tex.source) {
                        tex.source.style.addressModeU = 'repeat';
                        tex.source.style.addressModeV = 'repeat';

                        // Optionnels mais recommandés pour les textures au sol
                        tex.source.style.minFilter = 'linear';
                        tex.source.style.magFilter = 'linear';
                        (tex.source.style as any).anisotropicLevel = 8;

                        tex.source.update();
                    }
                    textures.push(tex);
                } else {
                    console.warn(`⚠️ BiomeAssets: Texture manquante → ${url}`);
                }
            }
            if (textures.length > 0) {
                groundTexturesCache.set(biomeId, textures);
            }
        }

        groundTexturesLoaded = true;
        groundTexturesLoading = false;
        console.log(`✅ BiomeAssets: ${groundTexturesCache.size} biomes chargés avec textures PNG.`);
        return true;

    } catch (err) {
        console.error('❌ BiomeAssets: Échec chargement textures PNG ground:', err);
        groundTexturesLoading = false;
        return false;
    }
}

/**
 * Retourne une texture PNG pour un biome donné.
 * Sélection déterministe basée sur (x, y) → pas de flickering.
 * Retourne null si les textures ne sont pas encore chargées.
 */
export function getGroundTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = groundTexturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const idx = Math.abs((x * 7 + y * 13)) % frames.length;
    return frames[idx];
}

/** Indique si les textures PNG sont prêtes */
export function isGroundTexturesReady(): boolean {
    return groundTexturesLoaded;
}

/** Réinitialise le cache des textures ground (ex: changement de monde) */
export function clearGroundTextures(): void {
    // On ne DÉTRUIT pas les textures PIXI.Assets — elles sont gérées par le loader global
    groundTexturesCache.clear();
    groundTexturesLoaded = false;
    groundTexturesLoading = false;
}

// ═══════════════════════════════════════════════════════════
// FALLBACK PROCÉDURAL (conservé intact)
// ═══════════════════════════════════════════════════════════

export function clearBiomeTextures() {
    console.log('🧹 Clearing Biome Textures Cache...');
    texturesCache.clear();
}

export async function loadBiomeTextures(app: PIXI.Application) {
    if (texturesCache.size > 0) return true;

    console.log('🔄 BiomeAssets: Génération textures procédurales...');

    const DEPTH = TILE_DEPTH;
    const VARIATIONS = 3;

    const cGrass = ProceduralTiles.PALETTE['grass'];
    const cForest = ProceduralTiles.PALETTE['forest'];
    const cDirt = ProceduralTiles.PALETTE['dirt'];
    const cStone = ProceduralTiles.PALETTE['stone'];
    const cSand = ProceduralTiles.PALETTE['sand'];
    const cDesert = ProceduralTiles.PALETTE['desert'];
    const cSnow = ProceduralTiles.PALETTE['snow'];
    const cWater = ProceduralTiles.PALETTE['water'];

    const createBiomeSet = (biome: BiomeType, topColor: number, sideColor: number, customDepth: number = DEPTH) => {
        const textures: PIXI.Texture[] = [];
        for (let i = 0; i < VARIATIONS; i++) {
            const block = ProceduralTiles.generateTexturedBlock(
                app, TILE_WIDTH, TILE_HEIGHT, customDepth, topColor, sideColor
            );
            textures.push(block);
        }
        texturesCache.set(biome, textures);
    };

    createBiomeSet(BiomeType.PLAINS, cGrass, cDirt);
    createBiomeSet(BiomeType.DESERT, cDesert, cDesert);
    createBiomeSet(BiomeType.OCEAN, cWater, cWater);
    createBiomeSet(BiomeType.DEEP_OCEAN, cWater, cWater);
    createBiomeSet(BiomeType.MOUNTAIN, cStone, cStone);
    createBiomeSet(BiomeType.SNOW, cSnow, cSnow);
    createBiomeSet(BiomeType.FOREST, cForest, cDirt);
    createBiomeSet(BiomeType.BEACH, cSand, cSand);

    console.log('✅ BiomeAssets: Textures procédurales générées.');
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const patternIndex = Math.abs((x * 7 + y * 13)) % frames.length;
    return frames[patternIndex];
}