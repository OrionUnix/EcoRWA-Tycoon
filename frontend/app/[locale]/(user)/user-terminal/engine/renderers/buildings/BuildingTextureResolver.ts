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
        let forceNormal = false;

        // 1. DÉTECTION DYNAMIQUE DES MINES
        if (building.type === 'MINE' && index !== undefined) {
            // ✅ On vérifie globalThis ET window pour être sûr de trouver le moteur
            const engine = (globalThis as any).mapEngine || (window as any).mapEngine;

            if (engine && engine.resourceMaps) {
                const r = {
                    iron: engine.resourceMaps.iron?.[index] || 0,
                    coal: engine.resourceMaps.coal?.[index] || 0,
                    gold: engine.resourceMaps.gold?.[index] || 0,
                    stone: engine.resourceMaps.stone?.[index] || 0
                };

                // On trie par la valeur la plus forte
                const stats = [
                    { id: 'ironmine', val: r.iron },
                    { id: 'coalmine', val: r.coal },
                    { id: 'goldmine', val: r.gold },
                    { id: 'stonemine', val: r.stone }
                ].sort((a, b) => b.val - a.val);

                if (stats[0].val > 0.05) {
                    overrideBaseName = stats[0].id;
                    forceNormal = true;
                    // On ne log que si nécessaire pour ne pas saturer la console
                }
            }
            // ❌ Pas de log d'erreur ici : si le moteur n'est pas prêt, on reste silencieux
            // pour éviter de spammer la console 60 fois par seconde.
        }

        // 2. DÉTERMINATION DE L'ÉTAT VISUEL
        const stateToUse = isRuined ? 'destruction' : (isConstState && !forceNormal) ? 'construction' : 'normal';

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