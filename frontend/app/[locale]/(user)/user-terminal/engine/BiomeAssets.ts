import * as PIXI from 'pixi.js';
import { ProceduralTiles } from './ProceduralTiles';
import { BiomeType } from './types';
import { TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH } from './config';

const texturesCache = new Map<number, PIXI.Texture[]>();

// ═══════════════════════════════════════════════════════
// Procédural Biome Mapping configuration
// ═══════════════════════════════════════════════════════
const BIOME_ATLAS_MAP: Record<number, string[]> = {
    [BiomeType.PLAINS]: ['grass.png'],
    [BiomeType.FOREST]: ['forest.png'],
    [BiomeType.DESERT]: ['desert.png'],
    [BiomeType.BEACH]: ['bleach.png'],  // "bleach" dans l'atlas = beach/sable
    [BiomeType.MOUNTAIN]: ['mountain.png'],
    [BiomeType.SNOW]: ['snow.png'],
    [BiomeType.OCEAN]: ['ocean.png'],
    [BiomeType.DEEP_OCEAN]: ['deepwalter.png'],  // "deepwalter" dans l'atlas
};

export function clearBiomeTextures() {
    console.log("🧹 Clearing Biome Textures Cache...");
    // Ne détruire que les textures procédurales (pas les atlas)
    texturesCache.forEach(textures => {
        textures.forEach(t => {
            // Sécurité: ne pas détruire les textures atlas (elles appartiennent au Spritesheet)
            if (t && !t.destroyed) {
                // On ne détruit plus les textures ici pour éviter de casser les refs atlas
            }
        });
    });
    texturesCache.clear();
}

export async function loadBiomeTextures(app: PIXI.Application) {
    if (texturesCache.size > 0) return true;

    // ═══════════════════════════════════════
    // GÉNÉRATION PROCÉDURALE
    // ═══════════════════════════════════════

    // ═══════════════════════════════════════
    // FALLBACK: Génération procédurale (ancien système)
    // ═══════════════════════════════════════
    console.log("🔄 BiomeAssets: Génération textures procédurales...");

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

    console.log(`✅ BiomeAssets: Textures procédurales générées.`);
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const patternIndex = Math.abs((x * 7 + y * 13)) % frames.length;
    return frames[patternIndex];
}