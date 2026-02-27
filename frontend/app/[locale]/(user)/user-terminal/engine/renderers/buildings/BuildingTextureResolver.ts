import * as PIXI from 'pixi.js';
import { BuildingData } from '../../types';
import { BuildingAssets } from '../../BuildingAssets';
import { AtlasManager } from '../../AtlasManager';
import { asset } from '../../../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// BuildingTextureResolver
// Gère la priorité de chargement des textures.
// 1. Essayer une texture RWA dynamique (URL Web3/IPFS)
// 2. Fallback sur le Spritesheet interne de l'Engine
// ═══════════════════════════════════════════════════════

const globalForRWATextures = globalThis as unknown as { rwaTextureCache: Map<string, PIXI.Texture> };
if (!globalForRWATextures.rwaTextureCache) {
    globalForRWATextures.rwaTextureCache = new Map<string, PIXI.Texture>();
}
const rwaTextureCache = globalForRWATextures.rwaTextureCache;

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

        // PRIORITÉ 1 : Assets Custom HD (BuildingAssets)
        if (!texture) {
            texture = BuildingAssets.getTexture(
                building.type as any,
                lvl,
                building.variant || 0,
                isConstState || isRuined
            );
        }

        // PRIORITÉ 2 : Atlas interne standard (Low Res)
        if (!texture) {
            const typeKey = building.type.toUpperCase();
            let frame = '';

            // Map the types to atlas frame names correctly
            if (typeKey === 'RESIDENTIAL') {
                // house01, house02, house03
                frame = `residences/house${String(lvl).padStart(2, '0')}`;
            } else if (typeKey === 'COMMERCIAL') {
                frame = `commercial/comercial${String(lvl).padStart(2, '0')}`;
            } else if (typeKey === 'INDUSTRIAL') {
                frame = `industrial/indus${String(lvl).padStart(2, '0')}_A`;
            } else if (typeKey === 'POLICE_STATION') {
                frame = `services/policestation/policestation${String(lvl).padStart(2, '0')}`;
            } else if (typeKey === 'FIRE_STATION') {
                frame = `services/firestation/firestation${String(lvl).padStart(2, '0')}`;
            } else if (typeKey === 'CLINIC') {
                frame = `services/hospital/hospital${String(lvl).padStart(2, '0')}`;
            }

            if (frame) {
                texture = AtlasManager.getTexture(frame);
            }

            if (!texture && isConstState) {
                // Generic construction fallback in atlas if available
                texture = AtlasManager.getTexture('construction_site');
            }
        }

        return texture;
    }
}
