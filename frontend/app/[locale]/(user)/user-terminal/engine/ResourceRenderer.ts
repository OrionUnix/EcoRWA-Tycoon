import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH, SURFACE_Y_OFFSET, RESOURCE_SCALE } from './config'; // Ajout GRID_SIZE, TILE_WIDTH

const resourceCache = new Map<number, PIXI.Sprite>();

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
        else if (woodAmount > 0.1 && biome === BiomeType.FOREST) {
            resType = 'WOOD';
        } else if (woodAmount > 0.1) {
            // DEBUG: Pourquoi du bois ici si ce n'est pas une forêt ?
            // console.warn(`🌲 Wood found on non-forest tile ${i} (Biome: ${biome})`);
            // On force le type WOOD uniquement si on est sûr (ou on le laisse à NONE pour masquer)
            resType = 'NONE';
        }

        const shouldShow = resType !== 'NONE' && !hasRoad && !hasBuilding;

        if (shouldShow) {
            if (!sprite) {
                // SÉLECTION DE LA TEXTURE SELON LE TYPE
                let texture: PIXI.Texture | null = null;

                let tint = 0xFFFFFF;

                if (resType === 'WOOD' && ResourceAssets.forestFrames.length > 0) {
                    const frameIndex = i % ResourceAssets.forestFrames.length;
                    texture = ResourceAssets.forestFrames[frameIndex];
                } else if (resType === 'OIL' && ResourceAssets.oilFrames.length > 0) {
                    texture = ResourceAssets.oilFrames[0];
                } else if (ResourceAssets.rockFrames.length > 0) {
                    // MAPPING DES ROCHERS AVEC FALLBACK
                    let rockIndex = 0; // Stone par défaut

                    // Si on a les frames spécifiques, on les utilise (si tu les as générées)
                    // Sinon on fallback sur la frame 0 (Stone) et on Teinte

                    if (resType === 'COAL') {
                        rockIndex = 1;
                        if (!ResourceAssets.rockFrames[1]) { rockIndex = 0; tint = 0x555555; }
                    }
                    if (resType === 'IRON') {
                        rockIndex = 2;
                        if (!ResourceAssets.rockFrames[2]) { rockIndex = 0; tint = 0xBCAAA4; } // Rouille
                    }
                    if (resType === 'GOLD') {
                        rockIndex = 3;
                        if (!ResourceAssets.rockFrames[3]) { rockIndex = 0; tint = 0xFFD700; } // Or
                    }

                    if (ResourceAssets.rockFrames[rockIndex]) {
                        texture = ResourceAssets.rockFrames[rockIndex];
                    } else {
                        // Fallback ultime : Pierre de base
                        texture = ResourceAssets.rockFrames[0];
                    }
                }

                if (!texture) {
                    // ✅ ECHEC CRITIQUE : Si on devait afficher une ressource mais qu'on a pas de texture
                    // On log pour info, mais surtout on s'assure que le système sache qu'il manque des trucs.
                    // (Note: La gestion du retry se fait dans GameRenderer qui check ResourceAssets.isReady)
                    return;
                }

                sprite = new PIXI.Sprite(texture);

                // Ancrage pour que les pieds de l'objet soient au bas de l'image
                sprite.anchor.set(0.5, 0.9);
                sprite.tint = tint; // ✅ Application de la teinte (si fallback)

                // Variation de taille légère
                // Variation de taille légère
                const randomSeed = Math.sin(i) * 10000;
                const scale = 0.85 + (Math.abs(randomSeed % 1) * 0.3);

                // ✅ APPLICATION DE L'ÉCHELLE DEMANDÉE (x4)
                sprite.scale.set(RESOURCE_SCALE);

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

                    // ✅ RE-ATTACHEMENT (Crucial pour le mode Clean-Redraw)
                    if (sprite.parent !== container) {
                        container.addChild(sprite);
                    }

                    // ✅ ISOMÉTRIQUE CONFIRMÉ
                    // const pos = gridToScreen(x, y) est déjà passé en argument via 'pos'

                    sprite.x = pos.x;
                    // Position Y : Bas de la tuile + Offset 3D (Remontée pour sortir du sol)
                    sprite.y = pos.y + SURFACE_Y_OFFSET;

                    // ✅ CALCUL Z-INDEX UNIFIÉ
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
    }
}