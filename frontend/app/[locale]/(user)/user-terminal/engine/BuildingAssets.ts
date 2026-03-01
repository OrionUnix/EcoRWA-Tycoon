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
        const vChar = String.fromCharCode(65 + variant); // A, B, C...

        const isCst = state === 'construction';
        const isDst = state === 'destruction';
        const suffix = isCst ? '_cst' : isDst ? '_dst' : '';

        // ✅ CONSTRUCTION DU NOM DE FRAME EXACT (ex: ironmine_01_A.png)
        // On teste d'abord le nom standardisé que tu as mis dans ton nouveau JSON
        let frameName = `${baseName}_${lvlStr}_${vChar}${suffix}.png`;

        // Cas particulier sans variante (ex: water_pum_01.png)
        if (baseName === 'water_pum') {
            frameName = `${baseName}_${lvlStr}${suffix}.png`;
        }

        let tex = spritesheet.textures[frameName];

        // ✅ FALLBACK : Si la variante B n'existe pas, on force la A
        if (!tex && vChar !== 'A') {
            const fallbackA = `${baseName}_${lvlStr}_A${suffix}.png`;
            tex = spritesheet.textures[fallbackA];
        }

        // ✅ FALLBACK FINAL : Recherche par inclusion (si dossier présent)
        if (!tex) {
            const allKeys = Object.keys(spritesheet.textures);
            const target = allKeys.find(k => k.includes(frameName));
            if (target) tex = spritesheet.textures[target];
        }

        return tex;
    }
    static isLoaded(): boolean { return this._loaded; }
}