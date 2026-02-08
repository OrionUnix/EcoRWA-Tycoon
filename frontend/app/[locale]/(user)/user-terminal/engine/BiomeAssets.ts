import * as PIXI from 'pixi.js';
import { BiomeType } from './types';

// Chemin exact basé sur tes fichiers
const BASE_PATH = '/assets/isometric/Spritesheet/biome';

// Mapping exact de tes fichiers
const BIOME_FILES: Record<number, string> = {
    [BiomeType.PLAINS]: 'plains.png',
    [BiomeType.DESERT]: 'desert.png',
    [BiomeType.BEACH]: 'beach.png',
    [BiomeType.SNOW]: 'snow.png',
    [BiomeType.FOREST]: 'forest.png',
    [BiomeType.OCEAN]: 'ocean.png',
    [BiomeType.DEEP_OCEAN]: 'deepocean.png',
    [BiomeType.MOUNTAIN]: 'mountain.png',
};

const texturesCache = new Map<number, PIXI.Texture[]>();

export async function loadBiomeTextures() {
    console.log("🔄 Début du chargement des textures...");

    const promises = Object.entries(BIOME_FILES).map(async ([key, filename]) => {
        const biome = Number(key);
        const path = `${BASE_PATH}/${filename}`;

        try {
            // 1. Chargement de l'image globale
            const texture = await PIXI.Assets.load(path);

            // 2. Découpage (4 colonnes x 2 lignes)
            const frames: PIXI.Texture[] = [];
            const cols = 4;
            const rows = 2;
            const w = texture.width / cols;
            const h = texture.height / rows;

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const rect = new PIXI.Rectangle(x * w, y * h, w, h);
                    const tex = new PIXI.Texture({
                        source: texture.source,
                        frame: rect
                    });
                    frames.push(tex);
                }
            }

            texturesCache.set(biome, frames);
            // console.log(`✅ Chargé: ${filename}`);
        } catch (err) {
            console.error(`❌ ERREUR CHARGEMENT ${filename} :`, err);
            // On ne met rien dans le cache, le Renderer utilisera le fallback
        }
    });

    await Promise.all(promises);
    console.log(`🏁 Fin du chargement. ${texturesCache.size} biomes prêts.`);
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;

    // Variation stable pour éviter que ça clignote
    const index = (x + y) % frames.length;
    return frames[index];
}