import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { AtlasManager } from './AtlasManager';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH, SURFACE_Y_OFFSET } from './config';
import { asset } from '../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// ResourceRenderer — Rendu des ressources naturelles
// Priorité: Standalone 128px > Atlas (tree.png, tree02.png) > Procédural
// ═══════════════════════════════════════════════════════

const resourceCache = new Map<number, PIXI.Sprite>();

// Cache des textures arbres (chargées une fois)
let treeTexturesCache: PIXI.Texture[] | null = null;
let treeTexturesLoading = false;

// ✅ Chemins vers les sprites standalone 128x128
const STANDALONE_TREE_PATHS = [
    '/assets/isometric/Spritesheet/resources/tree.png',
    '/assets/isometric/Spritesheet/resources/tree02.png',
];

/**
 * Charge les textures arbres avec priorité :
 *   1. Standalone 128x128 PNGs (meilleur rendu)
 *   2. Atlas frames (fallback si standalone absent)
 * 
 * ⚠️ Doit être appelé AVANT le premier render (dans Promise.all du startup)
 */
export async function loadStandaloneTreeTextures(): Promise<void> {
    if (treeTexturesCache || treeTexturesLoading) return;
    treeTexturesLoading = true;

    const loaded: PIXI.Texture[] = [];
    for (const path of STANDALONE_TREE_PATHS) {
        try {
            const url = asset(path);
            const tex = await PIXI.Assets.load(url);
            if (tex && !tex.destroyed) {
                // ✅ PIXEL ART CRISP
                if (tex.source) tex.source.scaleMode = 'nearest';
                loaded.push(tex);
            }
        } catch (e) {
            // Silencieux — on essaiera l'atlas en fallback
        }
    }

    if (loaded.length > 0) {
        treeTexturesCache = loaded;
        console.log(`🌲 ResourceRenderer: ${loaded.length} arbres standalone 128px chargés !`);
    } else {
        // Fallback: atlas
        treeTexturesCache = getAtlasTreeTexturesSync();
        if (treeTexturesCache.length > 0) {
            console.log(`🌲 ResourceRenderer: ${treeTexturesCache.length} arbres atlas (fallback).`);
        }
    }
    treeTexturesLoading = false;
}

/** Sync atlas tree textures (fallback) */
function getAtlasTreeTexturesSync(): PIXI.Texture[] {
    if (!AtlasManager.isReady) return [];
    const result: PIXI.Texture[] = [];
    for (const name of ['tree.png', 'tree02.png']) {
        const tex = AtlasManager.getTexture(name);
        if (tex) result.push(tex);
    }
    return result;
}

function getTreeTextures(): PIXI.Texture[] {
    if (treeTexturesCache && treeTexturesCache.length > 0) return treeTexturesCache;

    // Tenter le chargement async (les frames seront dispo à la prochaine frame)
    loadStandaloneTreeTextures();

    // En attendant, essayer l'atlas en synchrone
    const atlas = getAtlasTreeTexturesSync();
    if (atlas.length > 0) return atlas;

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

        // ✅ BOIS (Arbres) prioritaire en forêt
        if (woodAmount > 0.1 && biome === BiomeType.FOREST) {
            resType = 'WOOD';
        }

        // Masquer les minerais (pas de formes noires sur la carte)
        if (resType !== 'WOOD') {
            resType = 'NONE';
        }

        const shouldShow = resType !== 'NONE' && !hasRoad && !hasBuilding;

        if (shouldShow) {
            if (!sprite) {
                let texture: PIXI.Texture | null = null;
                let tint = 0xFFFFFF;

                if (resType === 'WOOD') {
                    // ═══════════════════════════════════════
                    // PRIORITÉ 1: Standalone 128px > Atlas > Procédural
                    // ═══════════════════════════════════════
                    const treeFrames = getTreeTextures();
                    if (treeFrames.length > 0) {
                        const frameIndex = i % treeFrames.length;
                        texture = treeFrames[frameIndex];
                    }
                    // ═══════════════════════════════════════
                    // FALLBACK: Procédural (ResourceAssets.forestFrames)
                    // ═══════════════════════════════════════
                    else if (ResourceAssets.forestFrames.length > 0) {
                        const frameIndex = i % ResourceAssets.forestFrames.length;
                        texture = ResourceAssets.forestFrames[frameIndex];
                    }
                }

                if (!texture) return;

                sprite = new PIXI.Sprite(texture);

                // ✅ Ancrage base-centre : l'arbre "se tient debout"
                sprite.anchor.set(0.5, 1.0);
                sprite.tint = tint;

                // ✅ Échelle: adapter au grid (atlas = 16px, grille = TILE_WIDTH px)
                const treeScale = TILE_WIDTH / texture.width;
                sprite.scale.set(treeScale);

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

                    // Position isométrique
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
        treeTexturesCache = null; // Reset pour recharger au prochain render
    }
}