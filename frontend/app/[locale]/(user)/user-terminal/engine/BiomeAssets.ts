import * as PIXI from 'pixi.js';
import { ProceduralTiles } from './ProceduralTiles';
import { BiomeType } from './types';
import { TILE_WIDTH, TILE_HEIGHT } from './config';

const texturesCache = new Map<number, PIXI.Texture[]>();

export function clearBiomeTextures() {
    console.log("🧹 Clearing Biome Textures Cache...");
    texturesCache.forEach(textures => {
        textures.forEach(t => t.destroy(true));
    });
    texturesCache.clear();
}

export async function loadBiomeTextures(app: PIXI.Application) {
    if (texturesCache.size > 0) return true;

    console.log("🔄 Génération textures Minecraft Isometric...");

    // Profondeur des blocs (Proportionnelle à la hauteur)
    // ✅ MODIF: On réduit drastiquement la hauteur pour éviter le "flickering" et l'overlap
    const DEPTH = 4; // TILE_HEIGHT; // C'était 64, on passe à 4 pour un effet "Tuile Plate"
    const VARIATIONS = 3; // 3 variantes de texture par biome

    // Couleurs directes (Setup)
    const cGrass = ProceduralTiles.PALETTE['grass'];
    const cForest = ProceduralTiles.PALETTE['forest'];
    const cDirt = ProceduralTiles.PALETTE['dirt'];
    const cStone = ProceduralTiles.PALETTE['stone'];
    const cSand = ProceduralTiles.PALETTE['sand'];
    const cDesert = ProceduralTiles.PALETTE['desert'];
    const cSnow = ProceduralTiles.PALETTE['snow'];
    const cWater = ProceduralTiles.PALETTE['water'];
    const cWood = ProceduralTiles.PALETTE['wood'];

    // Helper pour créer un set de blocs
    const createBiomeSet = (biome: BiomeType, topColor: number, sideColor: number, customDepth: number = DEPTH) => {
        const textures: PIXI.Texture[] = [];

        for (let i = 0; i < VARIATIONS; i++) {
            // Variation subtile de la couleur pour briser la répétition
            // On fait varier un peu la teinte si i > 0
            let varTop = topColor;

            if (i > 0) {
                // Petite variation RGB possible ici, mais on garde simple pour l'instant
            }

            const block = ProceduralTiles.generateTexturedBlock(
                app,
                TILE_WIDTH,
                TILE_HEIGHT,
                customDepth,
                varTop,
                sideColor
            );
            textures.push(block);
        }
        texturesCache.set(biome, textures);
    };

    // --- CONFIGURATION DES BIOMES (COULEURS) ---

    // 1. PLAINE : Vert / Terre
    createBiomeSet(BiomeType.PLAINS, cGrass, cDirt);

    // 2. DESERT : Jaune Foncé / Jaune Foncé
    createBiomeSet(BiomeType.DESERT, cDesert, cDesert);

    // 3. OCEAN : Bleu / Bleu (Depth réduite)
    createBiomeSet(BiomeType.OCEAN, cWater, cWater);

    // 4. DEEP OCEAN : Bleu / Bleu
    createBiomeSet(BiomeType.DEEP_OCEAN, cWater, cWater);

    // 5. MOUNTAIN : Gris / Gris (Haut)
    createBiomeSet(BiomeType.MOUNTAIN, cStone, cStone);

    // 6. SNOW : Blanc / Blanc
    createBiomeSet(BiomeType.SNOW, cSnow, cSnow);

    // 7. FOREST : Vert Foncé / Terre
    createBiomeSet(BiomeType.FOREST, cForest, cDirt);

    // 8. BEACH : Jaune (Sable) / Jaune
    createBiomeSet(BiomeType.BEACH, cSand, cSand);

    console.log(`✅ Textures Biomes (Couleurs) générées.`);
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const patternIndex = Math.abs((x * 7 + y * 13)) % frames.length;
    return frames[patternIndex];
}