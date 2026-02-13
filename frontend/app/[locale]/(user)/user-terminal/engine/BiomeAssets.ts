import * as PIXI from 'pixi.js';
import { BiomeType } from './types';
import { ProceduralTiles } from './ProceduralTiles'; // ✅ NOUVEAU
import { TILE_WIDTH, TILE_HEIGHT } from './config';


// Store frames
const texturesCache = new Map<number, PIXI.Texture[]>();
// NEW: Track which unique context/mount these textures belong to
let currentContextId: number = 0;

export function clearBiomeTextures() {
    console.log("🧹 Clearing Biome Textures Cache...");

    // 1. Destroy existing textures
    texturesCache.forEach(frames => {
        frames.forEach(tex => tex.destroy(true));
    });
    texturesCache.clear();

    // 2. Unload from Pixi Global Cache (Plus besoin car procédural)
    // Les textures sont maintenant gérées par ProceduralTiles et le cache local.

    // 3. Invalidate context
    currentContextId++;
}

export async function loadBiomeTextures(app: PIXI.Application) {
    // Si déjà généré, on ignore
    if (texturesCache.size > 0) return true;

    console.log("🔄 Génération procédurale des textures biomes...");

    // On définit l'épaisseur de la terre
    const DEPTH = 64;

    // Helper pour générer et stocker
    const gen = (biome: BiomeType, color: number, dirtColor?: number) => {
        const tex = ProceduralTiles.generateBlock(app, TILE_WIDTH, TILE_HEIGHT, DEPTH, color, dirtColor);
        texturesCache.set(biome, [tex]);
    };

    // 1. PLAINE (Herbe verte)
    gen(BiomeType.PLAINS, 0x4CAF50);
    // 2. DESERT (Sable)
    gen(BiomeType.DESERT, 0xEEDD82, 0xD7CCC8);
    // 3. OCEAN (Eau bleue plate, pas de profondeur de terre)
    // Pour l'eau, on réduit le depth ou on le met bleu sombre
    const oceanTex = ProceduralTiles.generateBlock(app, TILE_WIDTH, TILE_HEIGHT, DEPTH, 0x2196F3, 0x1565C0);
    texturesCache.set(BiomeType.OCEAN, [oceanTex]);

    // 4. DEEP OCEAN (Eau profonde)
    const deepOceanTex = ProceduralTiles.generateBlock(app, TILE_WIDTH, TILE_HEIGHT, DEPTH, 0x1565C0, 0x0D47A1);
    texturesCache.set(BiomeType.DEEP_OCEAN, [deepOceanTex]);

    // 5. MOUNTAIN (Gris/Neige)
    gen(BiomeType.MOUNTAIN, 0x9E9E9E, 0x616161);
    // 6. SNOW (Blanc)
    gen(BiomeType.SNOW, 0xFFFFFF, 0xE0E0E0);
    // 7. FOREST (Vert foncé)
    gen(BiomeType.FOREST, 0x2E7D32, 0x1B5E20);
    // 8. BEACH (Sable plus clair)
    gen(BiomeType.BEACH, 0xFFE082, 0xD7CCC8);

    console.log("✅ Toutes les textures procédurales sont générées.");
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const index = (x + y) % frames.length;
    return frames[index];
}