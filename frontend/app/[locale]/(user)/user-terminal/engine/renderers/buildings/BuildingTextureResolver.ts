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

    /**
     * Retourne la texture PIXI optimale pour ce bâtiment (Synchrone).
     */
    static getTexture(building: BuildingData, isConstState: boolean, isRuined: boolean, index?: number): PIXI.Texture | undefined {
        let texture: PIXI.Texture | undefined;
        const lvl = building.level || 1;

        let overrideBaseName: string | undefined = undefined;
        let forceNormal = false;

        // 1. RECHERCHE DE LA RESSOURCE DOMINANTE (Strict)
        // 1. DÉTECTION DE LA RESSOURCE DOMINANTE (Version Blindée)
        if (building.type === 'MINE' && index !== undefined) {
            const engine = (globalThis as any).mapEngine;
            if (engine?.resourceMaps) {
                // On récupère TOUTES les valeurs
                const iron = engine.resourceMaps.iron?.[index] || 0;
                const coal = engine.resourceMaps.coal?.[index] || 0;
                const gold = engine.resourceMaps.gold?.[index] || 0;
                const stone = engine.resourceMaps.stone?.[index] || 0;

                // On crée un tableau d'objets pour comparer
                const scan = [
                    { id: 'ironmine', val: iron },
                    { id: 'coalmine', val: coal },
                    { id: 'goldmine', val: gold },
                    { id: 'stonemine', val: stone }
                ];

                // On trie par valeur la plus forte (décroissant)
                scan.sort((a, b) => b.val - a.val);

                // La ressource la plus forte gagne, si elle dépasse le seuil de visibilité (0.05)
                if (scan[0].val > 0.05) {
                    overrideBaseName = scan[0].id;
                    forceNormal = true;
                    // Debug console pour vérifier en temps réel
                    console.log(`⛏️ Mine à l'index ${index} : Détection dominante -> ${scan[0].id} (${scan[0].val.toFixed(2)})`);
                }
            }
        }

        // 2. ÉTAT DU BÂTIMENT
        const stateToUse = isRuined ? 'destruction' : (isConstState && !forceNormal) ? 'construction' : 'normal';

        // PRIORITÉ 0 : Texture Web3/IPFS
        if (building.rwaTexture) {
            const cached = rwaTextureCache.get(building.rwaTexture);
            if (cached && !cached.destroyed) {
                texture = cached;
            } else if (!cached) {
                const url = asset(building.rwaTexture) + `?v=2`;
                PIXI.Assets.load(url).then((tex: PIXI.Texture) => {
                    if (tex && !tex.destroyed) {
                        if (tex.source) tex.source.scaleMode = 'nearest';
                        (tex as any).isCustomIso = true;
                        rwaTextureCache.set(building.rwaTexture!, tex);
                    }
                });
            }
        }

        // PRIORITÉ 1 : Atlas HD (Nos nouvelles mines de Fer, Charbon, etc.)
        if (!texture) {
            texture = BuildingAssets.getTexture(
                building.type as any,
                lvl,
                building.variant || 0,
                stateToUse,
                overrideBaseName
            );
        }

        // PRIORITÉ 2 : Fallback Atlas standard (Anciens assets)
        if (!texture) {
            const typeKey = building.type.toUpperCase();
            let frame = '';
            if (typeKey === 'RESIDENTIAL') frame = `residences/house${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'COMMERCIAL') frame = `commercial/comercial${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'INDUSTRIAL') frame = `industrial/indus${String(lvl).padStart(2, '0')}_A`;
            else if (typeKey === 'POLICE_STATION') frame = `services/policestation/policestation${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'FIRE_STATION') frame = `services/firestation/firestation${String(lvl).padStart(2, '0')}`;
            else if (typeKey === 'CLINIC') frame = `services/hospital/hospital${String(lvl).padStart(2, '0')}`;

            if (frame) texture = AtlasManager.getTexture(frame);
        }

        return texture;
    }
}