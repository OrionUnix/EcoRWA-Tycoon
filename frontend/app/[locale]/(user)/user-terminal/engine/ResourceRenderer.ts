import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH, SURFACE_Y_OFFSET } from './config';
import { asset } from '../utils/assetUtils';

// Gestion robuste du cache global (évite les fuites Mémoire/HMR)
const globalForResources = globalThis as unknown as { resourceCache: Map<number, PIXI.Sprite> };
if (!globalForResources.resourceCache) {
    globalForResources.resourceCache = new Map<number, PIXI.Sprite>();
}
const getResourceCache = () => globalForResources.resourceCache;

// Cache des textures arbres (chargées une fois)
let treeTexturesCache: PIXI.Texture[] | null = null;
let treeTexturesLoading = false;


const STANDALONE_TREE_PATHS = [
    '/assets/isometric/Spritesheet/resources/trees/tree.png',
    '/assets/isometric/Spritesheet/resources/trees/tree02.png',
    '/assets/isometric/Spritesheet/resources/trees/tree03.png',
    '/assets/isometric/Spritesheet/resources/trees/tree04.png',
    '/assets/isometric/Spritesheet/resources/trees/tree05.png',
    '/assets/isometric/Spritesheet/resources/trees/tree06.png',
    '/assets/isometric/Spritesheet/resources/trees/tree07.png',
    '/assets/isometric/Spritesheet/resources/trees/tree08.png',
    '/assets/isometric/Spritesheet/resources/trees/tree09.png',
    '/assets/isometric/Spritesheet/resources/trees/tree10.png',
    '/assets/isometric/Spritesheet/resources/trees/tree11.png',
    '/assets/isometric/Spritesheet/resources/trees/tree12.png',
];

// Cache des textures ressources brutes
let rawResourceTexturesCache: Map<string, PIXI.Texture> = new Map();
let rawResourceLoading = false;

const RAW_RESOURCE_PATHS: Record<string, string> = {
    COAL: '/assets/isometric/Spritesheet/resources/raw/coa.png',
    GOLD: '/assets/isometric/Spritesheet/resources/raw/gold.png',
    IRON: '/assets/isometric/Spritesheet/resources/raw/iron.png',
    OIL: '/assets/isometric/Spritesheet/resources/raw/oil.png',
    SILVER: '/assets/isometric/Spritesheet/resources/raw/silver.png',
    STONE: '/assets/isometric/Spritesheet/resources/raw/stone.png',
    WATER: '/assets/isometric/Spritesheet/resources/raw/walter.png',
};

export async function loadStandaloneTreeTextures(): Promise<void> {
    if (treeTexturesCache || treeTexturesLoading) return;
    treeTexturesLoading = true;

    const loaded: PIXI.Texture[] = [];
    for (const path of STANDALONE_TREE_PATHS) {
        try {
            const url = asset(path);
            const tex = await PIXI.Assets.load(url);
            if (tex && !tex.destroyed) {
                if (tex.source) tex.source.scaleMode = 'nearest';
                loaded.push(tex);
            }
        } catch (e) { }
    }

    if (loaded.length > 0) {
        treeTexturesCache = loaded;
        console.log(`🌲 ResourceRenderer: ${loaded.length} arbres standalone 128px chargés !`);
    } else {
        treeTexturesCache = [];
    }
    treeTexturesLoading = false;
    loadRawResourceTextures();
}

export async function loadRawResourceTextures(): Promise<void> {
    if (rawResourceLoading) return;
    rawResourceLoading = true;

    for (const [key, path] of Object.entries(RAW_RESOURCE_PATHS)) {
        try {
            const url = asset(path);
            const tex = await PIXI.Assets.load(url);
            if (tex && !tex.destroyed) {
                if (tex.source) tex.source.scaleMode = 'nearest';
                rawResourceTexturesCache.set(key, tex);
            }
        } catch (e) { }
    }
    rawResourceLoading = false;
}

function getTreeTextures(): PIXI.Texture[] {
    if (treeTexturesCache && treeTexturesCache.length > 0) return treeTexturesCache;
    loadStandaloneTreeTextures();
    return [];
}

export class ResourceRenderer {

    static removeResourceAt(i: number) {
        const cache = getResourceCache();
        const sprite = cache.get(i);
        if (sprite) {
            if (!sprite.destroyed) {
                if (sprite.parent) {
                    sprite.parent.removeChild(sprite);
                }
                sprite.destroy({
                    children: true,
                    texture: false
                });
            }
            cache.delete(i);
        }
    }

    static drawResource(
        container: PIXI.Container,
        engine: MapEngine,
        i: number,
        pos: { x: number, y: number },
        woodAmount: number,
        biome: number
    ) {
        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;

        let resType = 'NONE';
        if (woodAmount > 0.5) resType = 'WOOD';
        else if (engine.resourceMaps.oil && engine.resourceMaps.oil[i] > 0.8) resType = 'OIL';
        else if (engine.resourceMaps.gold && engine.resourceMaps.gold[i] > 0.8) resType = 'GOLD';
        else if (engine.resourceMaps.iron && engine.resourceMaps.iron[i] > 0.8) resType = 'IRON';
        else if (engine.resourceMaps.coal && engine.resourceMaps.coal[i] > 0.8) resType = 'COAL';
        else if (engine.resourceMaps.stone && engine.resourceMaps.stone[i] > 0.8) resType = 'STONE';
        else if (engine.resourceMaps.silver && engine.resourceMaps.silver[i] > 0.8) resType = 'SILVER';
        else if (engine.resourceMaps.undergroundWater && engine.resourceMaps.undergroundWater[i] > 0.9) resType = 'WATER';

        const waterLevel = engine.getLayer(1)[i];
        const isWater = waterLevel > 0.3;

        const shouldShow = resType !== 'NONE' && !hasRoad && !hasBuilding && !isWater;

        if (shouldShow) {
            const cache = getResourceCache();
            let sprite = cache.get(i);

            if (!sprite || sprite.destroyed) {
                let texture: PIXI.Texture | null = null;
                if (resType === 'WOOD') {
                    const treeFrames = getTreeTextures();
                    if (treeFrames.length > 0) {
                        texture = treeFrames[i % treeFrames.length];
                    }
                } else if (resType !== 'NONE') {
                    texture = rawResourceTexturesCache.get(resType) || null;
                }

                if (!texture) return;

                sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5, 1);

                let targetScale = (TILE_WIDTH / texture.width) * 1.4;
                if (resType !== 'WOOD') {
                    targetScale = (TILE_WIDTH * 0.4) / texture.width;
                }
                sprite.scale.set(targetScale);

                container.addChild(sprite);
                cache.set(i, sprite);
            }

            sprite.visible = true;
            if (sprite.parent !== container) {
                container.addChild(sprite);
            }

            sprite.x = pos.x;
            const Y_OFFSET = resType === 'WOOD' ? 0 : 4;
            sprite.y = pos.y + Y_OFFSET;

            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            sprite.zIndex = x + y + 0.5;

        } else {
            this.removeResourceAt(i);
        }
    }

    static clearAll(container?: PIXI.Container | null) {
        const cache = getResourceCache();
        cache.forEach((sprite) => {
            if (!sprite.destroyed) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.destroy({ children: true, texture: false });
            }
        });
        cache.clear();
    }
}