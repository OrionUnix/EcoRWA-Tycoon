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

    // 2. Unload from Pixi Global Cache
    Object.values(BIOME_FILES).forEach(filename => {
        const path = `${BASE_PATH}/${filename}`;
        if (PIXI.Assets.cache.has(path)) {
            PIXI.Assets.unload(path);
        }
    });

    // 3. Invalidate context
    currentContextId++;
}

export async function loadBiomeTextures() {
    // Determine which file to check
    const firstBiome = Number(Object.keys(BIOME_FILES)[0]);

    // STRICT CHECK: The texture must exist, have a source, width > 1, AND valid resource
    const hasValidCache = texturesCache.has(firstBiome) &&
        texturesCache.get(firstBiome)?.[0]?.source?.resource;

    if (hasValidCache) {
        console.log("🎨 Textures found in cache (Valid).");
        return true;
    }

    console.log(`🔄 Loading Biome Textures (Context ${currentContextId})...`);

    // Safety clear before load
    texturesCache.clear();

    const promises = Object.entries(BIOME_FILES).map(async ([key, filename]) => {
        const biome = Number(key);
        const path = `${BASE_PATH}/${filename}`;

        try {
            // Force load
            const texture = await PIXI.Assets.load(path);
            texture.source.scaleMode = 'nearest';

            // Slicing logic
            const frames: PIXI.Texture[] = [];
            const cols = 4;
            const rows = 2;
            const w = Math.floor(texture.width / cols);
            const h = Math.floor(texture.height / rows);

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
        } catch (err) {
            console.error(`❌ Error loading ${filename}:`, err);
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