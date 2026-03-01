import * as PIXI from 'pixi.js';
import { BuildingType } from './types';

export const BUILDING_BASE_NAMES: Record<string, string> = {
    [BuildingType.RESIDENTIAL]: 'house',
    [BuildingType.COMMERCIAL]: 'commercial',
    [BuildingType.INDUSTRIAL]: 'indus',
    [BuildingType.MINE]: 'mine',
    [BuildingType.POWER_PLANT]: 'coalfire',
    [BuildingType.WIND_TURBINE]: 'eolien',
    [BuildingType.SOLAR_PANEL]: 'solar',
    [BuildingType.WATER_PUMP]: 'water_pum',
    [BuildingType.FISHERMAN]: 'fishport',
    [BuildingType.POLICE_STATION]: 'police',
    [BuildingType.FIRE_STATION]: 'firestation',
    [BuildingType.CLINIC]: 'hospital',
    [BuildingType.CITY_HALL]: 'cityhall',
    [BuildingType.PARK]: 'square',
    [BuildingType.SCHOOL]: 'primary',
    [BuildingType.MUSEUM]: 'musee',
    [BuildingType.RESTAURANT]: 'restaurant',
    [BuildingType.FOOD_MARKET]: 'market',
    [BuildingType.PHARMACY]: 'pharmacy',
    [BuildingType.LUMBER_HUT]: 'lumber',
    [BuildingType.HUNTER_HUT]: 'hunter',
    [BuildingType.STADIUM]: 'stade',
    [BuildingType.OIL_PUMP]: 'oilpump',
    [BuildingType.OIL_RIG]: 'oilrig',
    [BuildingType.THEATER]: 'theatre',
    [BuildingType.CAFE]: 'cafe'
};

export class BuildingAssets {
    private static _loaded = false;
    private static atlasPath = '/assets/isometric/Spritesheet/building_Atlas.json';

    static async load(onProgress?: (p: number) => void): Promise<void> {
        if (this._loaded) return;
        try {
            await PIXI.Assets.load(this.atlasPath, onProgress);
            this._loaded = true;
            console.log('🦸 BuildingAssets v8: Atlas chargé !');
        } catch (error) {
            console.error('❌ BuildingAssets: Erreur atlas', error);
        }
    }

    static getTexture(
        type: BuildingType,
        level: number = 1,
        variant: number = 0,
        state: 'normal' | 'construction' | 'destruction' = 'normal',
        overrideBaseName?: string
    ): PIXI.Texture | undefined {
        const spritesheet = PIXI.Assets.get(this.atlasPath);
        if (!spritesheet || !spritesheet.textures) return undefined;

        const baseName = overrideBaseName || BUILDING_BASE_NAMES[type];
        if (!baseName) return undefined;

        const lvlStr = String(level).padStart(2, '0');
        const vChar = String.fromCharCode(65 + variant);

        // On prépare les morceaux du nom qu'on cherche
        const searchPart = `${baseName}_${lvlStr}`;
        const isCst = state === 'construction';

        // ✅ RECHERCHE ULTRA-FLOU (Ignore les dossiers et extensions)
        const allKeys = Object.keys(spritesheet.textures);

        let targetKey = allKeys.find(key => {
            const k = key.toLowerCase();
            const b = baseName.toLowerCase();
            // On vérifie si la clé contient le nom de base ET le niveau
            // On ignore le chemin (ex: "mines/ironmine_01_A.png" devient valide pour "ironmine_01")
            const matchBase = k.includes(b) && k.includes(lvlStr);

            if (isCst) return matchBase && k.includes('_cst');
            return matchBase && !k.includes('_cst') && !k.includes('_dst');
        });

        // Si on n'a rien trouvé avec le variant, on prend n'importe quoi qui match la base
        if (!targetKey) {
            targetKey = allKeys.find(key => key.toLowerCase().includes(baseName.toLowerCase()) && key.includes(lvlStr));
        }

        return targetKey ? spritesheet.textures[targetKey] : undefined;
    }
    static isLoaded(): boolean { return this._loaded; }
}