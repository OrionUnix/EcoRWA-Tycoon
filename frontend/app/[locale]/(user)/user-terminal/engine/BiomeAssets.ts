import * as PIXI from 'pixi.js';
import { BiomeType } from './types';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

const BASE_PATH = withBasePath('/assets/isometric/Spritesheet/biome');

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
    console.log("🔄 Début du chargement des textures biomes...");

    const promises = Object.entries(BIOME_FILES).map(async ([key, filename]) => {
        const biome = Number(key);
        const path = `${BASE_PATH}/${filename}`;

        try {
            const texture = await PIXI.Assets.load(path);

            // 🔙 RETOUR EN ARRIÈRE CRUCIAL : 
            // 'nearest' garde les bords solides. 'linear' crée du flou (et donc des trous).
            texture.source.scaleMode = 'nearest';

            // 2. Découpage
            const frames: PIXI.Texture[] = [];
            const cols = 4;
            const rows = 2;

            // On utilise Math.floor pour être sûr, mais assure-toi que tes images sont des multiples de 4
            const w = Math.floor(texture.width / cols);
            const h = Math.floor(texture.height / rows);

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const rect = new PIXI.Rectangle(x * w, y * h, w, h);

                    // On crée la texture
                    const tex = new PIXI.Texture({
                        source: texture.source,
                        frame: rect
                    });
                    frames.push(tex);
                }
            }
            texturesCache.set(biome, frames);
        } catch (err) {
            console.error(`❌ Erreur ${filename}:`, err);
        }
    });

    await Promise.all(promises);
    return true;
}

export function getBiomeTexture(biome: number, x: number, y: number): PIXI.Texture | null {
    const frames = texturesCache.get(biome);
    if (!frames || frames.length === 0) return null;
    const index = (x + y) % frames.length;
    return frames[index];
}