import * as PIXI from 'pixi.js';
import { BuildingData } from '../../types';
import { BuildingAssets } from '../../BuildingAssets';
import { AtlasManager } from '../../AtlasManager';
import { asset } from '../../../utils/assetUtils';

const globalForRWATextures = globalThis as unknown as { rwaTextureCache: Map<string, PIXI.Texture> };
if (!globalForRWATextures.rwaTextureCache) {
    globalForRWATextures.rwaTextureCache = new Map<string, PIXI.Texture>();
}
const rwaTextureCache = globalForRWATextures.rwaTextureCache;

export class BuildingTextureResolver {
    static getTexture(building: BuildingData, isConstState: boolean, isRuined: boolean, index?: number): PIXI.Texture | undefined {
        let texture: PIXI.Texture | undefined;
        const lvl = building.level || 1;
        let overrideBaseName: string | undefined = undefined;
        // 1. DÉTERMINATION DE L'ÉTAT VISUEL
        const stateToUse = isRuined ? 'destruction' : isConstState ? 'construction' : 'normal';

        // 2. DÉTECTION DYNAMIQUE DES MINES
        if (building.type === 'MINE') {
            // Pour les états de construction et destruction, on veut le préfixe générique (mine_)
            // On n'applique le préfixe spécifique que dans l'état normal.
            if (stateToUse === 'normal' && building.mining?.resource) {
                switch (building.mining.resource) {
                    case 'IRON': overrideBaseName = 'ironmine'; break;
                    case 'COAL': overrideBaseName = 'coalmine'; break;
                    case 'GOLD': overrideBaseName = 'goldmine'; break;
                    case 'STONE': overrideBaseName = 'stonemine'; break;
                }
            }
        }

        // 3. PRIORITÉ 0 : Texture RWA (Load Asynchrone)
        if (building.rwaTexture) {
            const cached = rwaTextureCache.get(building.rwaTexture);
            if (cached && !cached.destroyed) {
                texture = cached;
            } else if (!cached) {
                const cacheBuster = `?v=2`;
                PIXI.Assets.load(asset(building.rwaTexture) + cacheBuster).then((tex: PIXI.Texture) => {
                    if (tex && !tex.destroyed) {
                        if (tex.source) tex.source.scaleMode = 'nearest';
                        (tex as any).isCustomIso = true;
                        rwaTextureCache.set(building.rwaTexture!, tex);
                    }
                });
            }
        }

        // 4. PRIORITÉ 1 : Assets HD (BuildingAssets - Atlas Principal)
        if (!texture) {
            texture = BuildingAssets.getTexture(
                building.type as any,
                lvl,
                building.variant || 0,
                stateToUse,
                overrideBaseName
            );
        }

        // 5. PRIORITÉ 2 : Atlas Interne Standard (Fallback)
        if (!texture) {
            const typeKey = building.type.toUpperCase();
            let frame = '';

            if (typeKey === 'RESIDENTIAL') frame = `residences/house${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'COMMERCIAL') frame = `commercial/comercial${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'INDUSTRIAL') frame = `industrial/indus${String(lvl).padStart(2, '0')}_A`;
            else if (typeKey === 'WATER_PUMP') frame = `services/waterpump/waterpump${String(lvl).padStart(2, '0')}`;

            if (frame) {
                texture = AtlasManager.getTexture(frame);
            }
        }

        return texture;
    }
}