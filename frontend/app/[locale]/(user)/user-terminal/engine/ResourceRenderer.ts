import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH, SURFACE_Y_OFFSET } from './config';
import { asset } from '../utils/assetUtils';
const globalForResources = globalThis as unknown as { resourceCache: Map<number, PIXI.Sprite> };
if (!globalForResources.resourceCache) {
    globalForResources.resourceCache = new Map<number, PIXI.Sprite>();
}
const resourceCache = globalForResources.resourceCache;

// Cache des textures arbres (chargées une fois)
let treeTexturesCache: PIXI.Texture[] | null = null;
let treeTexturesLoading = false;

// ✅ Chemins vers les sprites standalone 128x128
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

    // Lancer le chargement des ressources brutes aussi
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
    console.log(`⛏️ ResourceRenderer: ${rawResourceTexturesCache.size} ressources brutes chargées !`);
}

function getTreeTextures(): PIXI.Texture[] {
    if (treeTexturesCache && treeTexturesCache.length > 0) return treeTexturesCache;

    // Tenter le chargement async (les frames seront dispo à la prochaine frame)
    loadStandaloneTreeTextures();

    return [];
}

export class ResourceRenderer {

    static removeResourceAt(i: number) {
        const sprite = resourceCache.get(i);
        if (sprite) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
            resourceCache.delete(i);
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
        let sprite = resourceCache.get(i);

        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;

        // DÉTECTION DU TYPE DE RESSOURCE DOMINANTE
        let resType = 'NONE';
        if (engine.resourceMaps.oil[i] > 0.5) resType = 'OIL';
        else if (engine.resourceMaps.gold[i] > 0.5) resType = 'GOLD';
        else if (engine.resourceMaps.iron[i] > 0.5) resType = 'IRON';
        else if (engine.resourceMaps.coal[i] > 0.5) resType = 'COAL';
        else if (engine.resourceMaps.stone[i] > 0.5) resType = 'STONE';

        // ════════════════════════════════════════════════════
        // ✅ AFFICHER LES RESSOURCES BRUTES SUR LA CARTE
        // ════════════════════════════════════════════════════
        if (woodAmount > 0.5) {
            resType = 'WOOD';
        } else if (engine.resourceMaps.silver && engine.resourceMaps.silver[i] > 0.5) {
            resType = 'SILVER';
        }
        // L'eau souterraine est gérée via le calque d'eau de surface en temps normal, 
        // on ajoute l'icône seulement si c'est vraiment un point d'eau fort souterrain 
        // (optionnel car sinon on sature l'écran d'icônes bleues).
        else if (engine.resourceMaps.undergroundWater && engine.resourceMaps.undergroundWater[i] > 0.8) {
            resType = 'WATER';
        }

        const waterLevel = engine.getLayer(1)[i];
        const isWater = waterLevel > 0.3;

        const shouldShow = resType !== 'NONE' && !hasRoad && !hasBuilding && !isWater;

        if (shouldShow) {
            if (!sprite) {
                let texture: PIXI.Texture | null = null;
                let tint = 0xFFFFFF;

                if (resType === 'WOOD') {
                    const treeFrames = getTreeTextures();
                    if (treeFrames.length > 0) {
                        const frameIndex = i % treeFrames.length;
                        texture = treeFrames[frameIndex];
                    } else if (ResourceAssets.forestFrames.length > 0) {
                        const frameIndex = i % ResourceAssets.forestFrames.length;
                        texture = ResourceAssets.forestFrames[frameIndex];
                    }
                } else if (resType !== 'NONE') {
                    // Charger la ressource brute (OR, FER, CHARBON, ETC.)
                    texture = rawResourceTexturesCache.get(resType) || null;
                }

                if (!texture) return;

                sprite = new PIXI.Sprite(texture);

                // ✅ CORRECTION DE L'ANCRAGE (TRES IMPORTANT)
                sprite.anchor.set(0.5, 1.0);
                sprite.tint = tint;

                // ✅ Échelle: on agrandit légèrement l'arbre (1.5x), mais pour les minerais on ajuste car ils sont déjà 128x128
                let targetScale = (TILE_WIDTH / texture.width) * 1.5;
                if (resType !== 'WOOD') {
                    targetScale = (TILE_WIDTH * 0.7) / texture.width; // Plus petit pour les minerais au sol
                }
                sprite.scale.set(targetScale);

                container.addChild(sprite);
                resourceCache.set(i, sprite);
            }

            // ✅ SÉCURITÉ : Protection contre les sprites détruits
            try {
                if (sprite.destroyed) {
                    resourceCache.delete(i);
                    sprite = undefined;
                } else {
                    sprite.visible = true;

                    // ✅ RE-ATTACHEMENT
                    if (sprite.parent !== container) {
                        container.addChild(sprite);
                    }

                    // ════════════════════════════════════════════════════
                    // ✅ CORRECTION DU PLACEMENT ISOMÉTRIQUE
                    // Les props (arbres) ont leur racine au centre de la case
                    // ════════════════════════════════════════════════════
                    sprite.x = pos.x;
                    sprite.y = pos.y + SURFACE_Y_OFFSET;

                    // Z-Index : entre le sol et les bâtiments
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    sprite.zIndex = x + y + 0.5;
                }
            } catch (e) {
                console.error(`🚨 [ResourceRenderer] Error drawing resource ${i}:`, e);
                resourceCache.delete(i);
                sprite = undefined;
            }

        } else {
            // Nettoyage si plus nécessaire
            if (sprite) {
                try {
                    if (!sprite.destroyed) {
                        container.removeChild(sprite);
                        sprite.destroy();
                    }
                    resourceCache.delete(i);
                } catch (e) {
                    resourceCache.delete(i);
                }
            }
        }
    }

    static clearAll(container?: PIXI.Container | null) {
        resourceCache.forEach((sprite) => {
            try {
                if (!sprite.destroyed) {
                    if (container && sprite.parent === container) {
                        container.removeChild(sprite);
                    } else if (sprite.parent) {
                        sprite.parent.removeChild(sprite);
                    }
                    sprite.destroy();
                }
            } catch (e) {
                // Sprite déjà détruit, on ignore
            }
        });
        resourceCache.clear();
        // On NE met PAS treeTexturesCache = null, sinon les arbres HD sont perdus au reset!
    }
}