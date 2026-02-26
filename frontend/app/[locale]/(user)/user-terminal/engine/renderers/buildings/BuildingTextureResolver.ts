import * as PIXI from 'pixi.js';
import { BuildingData } from '../../types';
import { BuildingAssets } from '../../BuildingAssets';
import { asset } from '../../../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// BuildingTextureResolver
// Gère la priorité de chargement des textures.
// 1. Essayer une texture RWA dynamique (URL Web3/IPFS)
// 2. Fallback sur le Spritesheet interne de l'Engine
// ═══════════════════════════════════════════════════════

const rwaTextureCache = new Map<string, PIXI.Texture>();

export class BuildingTextureResolver {

    /**
     * Retourne la texture PIXI optimale pour ce bâtiment (Synchrone).
     * S'occupe de déclencher le chargement asynchrone si une texture RWA manque.
     */
    static getTexture(building: BuildingData, isConstState: boolean, isRuined: boolean): PIXI.Texture | undefined {
        let texture: PIXI.Texture | undefined;
        const lvl = building.level || 1;

        // PRIORITÉ 0 : Texture RWA (Load Asynchrone)
        if (building.rwaTexture) {
            const cached = rwaTextureCache.get(building.rwaTexture);

            if (cached && !cached.destroyed) {
                texture = cached;
            } else if (!cached) {
                // Déclencher le load async pour le prochain tick de rendu
                PIXI.Assets.load(asset(building.rwaTexture)).then((tex: PIXI.Texture) => {
                    if (tex && !tex.destroyed) {
                        if (tex.source) tex.source.scaleMode = 'nearest';
                        // Flag custom iso pour le resize dans le Renderer
                        (tex as any).isCustomIso = true;
                        rwaTextureCache.set(building.rwaTexture!, tex);
                    }
                });

                // Fallback provisoire
                texture = BuildingAssets.getTexture(
                    building.type as any,
                    lvl,
                    building.variant || 0,
                    isConstState || isRuined
                );
            }
        }

        // PRIORITÉ 1 : Atlas interne standard
        if (!texture) {
            texture = BuildingAssets.getTexture(
                building.type as any,
                lvl,
                building.variant || 0,
                isConstState || isRuined
            );
        }

        return texture;
    }
}
