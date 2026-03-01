import * as PIXI from 'pixi.js';
import { BuildingType } from './types';

/**
 * Configuration mapping BuildingType to their atlas base name.
 */
export const BUILDING_BASE_NAMES: Record<string, string> = {
    [BuildingType.RESIDENTIAL]: 'house',
    [BuildingType.COMMERCIAL]: 'commercial',
    [BuildingType.INDUSTRIAL]: 'indus',
    [BuildingType.MINE]: 'mine',
    [BuildingType.POWER_PLANT]: 'coalfire',
    [BuildingType.WIND_TURBINE]: 'eolien',
    [BuildingType.SOLAR_PANEL]: 'solar',
    [BuildingType.WATER_PUMP]: 'walterpump',
    [BuildingType.FISHERMAN]: 'fishport',
    [BuildingType.POLICE_STATION]: 'police',
    [BuildingType.FIRE_STATION]: 'fire',
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
    public static readonly FALLBACK_TEX = PIXI.Texture.WHITE;
    private static atlasPath = '/assets/isometric/Spritesheet/building_Atlas.json';

    /**
     * Charges look atlas de bâtiments.
     * @param onProgress Callback optionnel pour suivre la progression (0 à 1)
     */
    static async load(onProgress?: (p: number) => void): Promise<void> {
        if (this._loaded) return;

        console.log('🏗️ BuildingAssets: Chargement de l\'atlas...');

        try {
            // PIXI.Assets.load accepte un deuxième argument de progression
            await PIXI.Assets.load(this.atlasPath, onProgress);

            // On force le scaleMode nearest pour le pixel art si nécessaire
            const atlas = PIXI.Assets.get(this.atlasPath);
            if (atlas && atlas.baseTexture) {
                atlas.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }

            this._loaded = true;
            console.log('🦸 BuildingAssets: Atlas chargé avec succès !');
        } catch (error) {
            console.error('❌ BuildingAssets: Erreur lors du chargement de l\'atlas', error);
        }
    }

    /**
     * Récupère une texture depuis l'atlas en fonction des paramètres du bâtiment.
     * @param type Le type de bâtiment
     * @param level Niveau (1, 2, 3...)
     * @param variant Index de la variante (0 -> A, 1 -> B...)
     * @param state État visuel ('normal', 'construction', 'destruction')
     */
    static getTexture(
        type: BuildingType,
        level: number = 1,
        variant: number = 0,
        state: 'normal' | 'construction' | 'destruction' = 'normal'
    ): PIXI.Texture {
        const baseName = BUILDING_BASE_NAMES[type];

        if (!baseName) {
            console.warn(`⚠️ BuildingAssets: Pas de mapping baseName pour le type ${type}`);
            return this.FALLBACK_TEX;
        }

        // Construction du nom de la frame
        const levelStr = String(level).padStart(2, '0');
        const variantChar = String.fromCharCode(65 + variant); // 0 -> A, 1 -> B...

        let suffix = '';
        if (state === 'construction') suffix = '_cst';
        if (state === 'destruction') suffix = '_dst';

        const frameBase = `${baseName}_${levelStr}_${variantChar}`;
        const frameFull = `${frameBase}${suffix}.png`;

        // 1. Essai avec le suffixe d'état
        let texture = PIXI.Assets.get(frameFull);

        if (texture) return texture;

        // 2. Fallback intelligent : si l'état spécial (cst/dst) manque, on essaie la version normale
        if (state !== 'normal') {
            const frameNormal = `${frameBase}.png`;
            texture = PIXI.Assets.get(frameNormal);
            if (texture) {
                console.warn(`⚠️ BuildingAssets: Frame d'état "${state}" manquante pour ${frameFull}, fallback sur normal.`);
                return texture;
            }
        }

        // 3. Échec total
        console.warn(`❌ BuildingAssets: Texture introuvable dans l'atlas : ${frameFull}`);
        return this.FALLBACK_TEX;
    }

    static isLoaded(): boolean {
        return this._loaded;
    }
}
