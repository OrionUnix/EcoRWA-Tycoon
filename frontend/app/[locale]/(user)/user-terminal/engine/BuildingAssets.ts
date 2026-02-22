import * as PIXI from 'pixi.js';
import { BuildingType } from './types';
import { asset } from '../utils/assetUtils';

export interface CustomSpriteDef {
    construction?: string;
    levels: string[][]; // Tableau par niveaux : level[0] = tableau des variantes pour Lvl 1
}

export const CUSTOM_SPRITES_CONFIG: Record<string, CustomSpriteDef> = {
    'RESIDENTIAL': {
        construction: '/assets/isometric/Spritesheet/Buildings/residences/construction_house01.png',
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/residences/house01_A.png', '/assets/isometric/Spritesheet/Buildings/residences/House01_B.png'], // Niveau 1
            ['/assets/isometric/Spritesheet/Buildings/residences/House02_A.png', '/assets/isometric/Spritesheet/Buildings/residences/House02_B.png'], // Niveau 2
            ['/assets/isometric/Spritesheet/Buildings/residences/House03_A.png', '/assets/isometric/Spritesheet/Buildings/residences/House03_B.png'] // Niveau 3
        ]
    },
    'COMMERCIAL': {
        construction: '/assets/isometric/Spritesheet/Buildings/commercial/construction_commercial01.png',
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/commercial/comercial01.png'], // Niveau 1
            ['/assets/isometric/Spritesheet/Buildings/commercial/comercial02.png'], // Niveau 2
            ['/assets/isometric/Spritesheet/Buildings/commercial/comercial03.png'] // Niveau 3
        ]
    },
    'INDUSTRIAL': {
        construction: '/assets/isometric/Spritesheet/Buildings/industrial/indus01_A.png',
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/industrial/indus01_A.png', '/assets/isometric/Spritesheet/Buildings/industrial/indus01_B.png'], // Niveau 1
            ['/assets/isometric/Spritesheet/Buildings/industrial/indus02_A.png', '/assets/isometric/Spritesheet/Buildings/industrial/indus02_B.png'], // Niveau 2
            ['/assets/isometric/Spritesheet/Buildings/industrial/indus03_A.png', '/assets/isometric/Spritesheet/Buildings/industrial/indus03_B.png'] // Niveau 3
        ]
    },
    'MINE': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/extraction/mine/mine01.png'],
            ['/assets/isometric/Spritesheet/Buildings/extraction/mine/mine02.png'],
            ['/assets/isometric/Spritesheet/Buildings/extraction/mine/mine03.png']
        ]
    },
    'POWER_PLANT': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/energie/coat/coat01.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/coat/coat02.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/coat/coat03.png']
        ]
    },
    'SOLAR_PANEL': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/energie/solar/solar_01.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/solar/solar_02.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/solar/solar_03.png']
        ]
    },
    'WIND_TURBINE': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/energie/eolien/eolien_01.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/eolien/eolien_02.png'],
            ['/assets/isometric/Spritesheet/Buildings/energie/eolien/eolien_03.png']
        ]
    },
    'WATER_PUMP': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/water/walterpump_01.png'],
            ['/assets/isometric/Spritesheet/Buildings/water/walterpump_02.png'],
            ['/assets/isometric/Spritesheet/Buildings/water/walterpump_03.png']
        ]
    },
    'FARM': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/food/farm/farm01.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/farm/farm02.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/farm/farm03.png']
        ]
    },
    'FISHERMAN': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/food/fishport/fishport01.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/fishport/fishport02.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/fishport/fishport03.png']
        ]
    },
    // SERVICES CIVIQUES
    'POLICE_STATION': { levels: [['/assets/isometric/Spritesheet/Buildings/services/policestation/policestation01.png'], ['/assets/isometric/Spritesheet/Buildings/services/policestation/policestation02.png'], ['/assets/isometric/Spritesheet/Buildings/services/policestation/policestation03.png']] },
    'FIRE_STATION': { levels: [['/assets/isometric/Spritesheet/Buildings/services/firestation/firestation01.png'], ['/assets/isometric/Spritesheet/Buildings/services/firestation/firestation02.png'], ['/assets/isometric/Spritesheet/Buildings/services/firestation/firestation03.png']] },
    'CLINIC': { levels: [['/assets/isometric/Spritesheet/Buildings/services/hospital/hospital01.png'], ['/assets/isometric/Spritesheet/Buildings/services/hospital/hospital02.png'], ['/assets/isometric/Spritesheet/Buildings/services/hospital/hospital03.png']] },
    'CITY_HALL': { levels: [['/assets/isometric/Spritesheet/Buildings/services/cityhall/mairie01.png'], ['/assets/isometric/Spritesheet/Buildings/services/cityhall/mairie02.png'], ['/assets/isometric/Spritesheet/Buildings/services/cityhall/mairie03.png']] },

    // PARCS & LOISIRS
    'PARK': { levels: [['/assets/isometric/Spritesheet/Buildings/parcs/square01_A.png', '/assets/isometric/Spritesheet/Buildings/parcs/square01_B.png'], ['/assets/isometric/Spritesheet/Buildings/parcs/square02_A.png', '/assets/isometric/Spritesheet/Buildings/parcs/square02_B.png']] },

    // STANDALONES (Niveau 1 Unique)
    'SCHOOL': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/education/primary/primary01.png'],
            ['/assets/isometric/Spritesheet/Buildings/education/primary/primary02.png'],
            ['/assets/isometric/Spritesheet/Buildings/education/primary/primary03.png']
        ]
    },
    'MUSEUM': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/culture/musem/musee01.png'],
            ['/assets/isometric/Spritesheet/Buildings/culture/musem/musee02.png'],
            ['/assets/isometric/Spritesheet/Buildings/culture/musem/musee03.png']
        ]
    },
    'RESTAURANT': { levels: [['/assets/isometric/Spritesheet/Buildings/special/restaurant_A.png', '/assets/isometric/Spritesheet/Buildings/special/restaurant_B.png']] },
    'CAFE': { levels: [['/assets/isometric/Spritesheet/Buildings/special/coffee_shop.png']] },
    'FOOD_MARKET': { levels: [['/assets/isometric/Spritesheet/Buildings/special/market01.png', '/assets/isometric/Spritesheet/Buildings/special/market02.png']] },
    'PHARMACY': { levels: [['/assets/isometric/Spritesheet/Buildings/special/pharmacy_A.png', '/assets/isometric/Spritesheet/Buildings/special/pharmacy_B.png']] },
    'LUMBER_HUT': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber01_A.png', '/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber01_B.png'],
            ['/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber02_A.png', '/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber02_B.png'],
            ['/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber03_A.png', '/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber03_B.png'],
            ['/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber04_A.png', '/assets/isometric/Spritesheet/Buildings/extraction/lumber_camp/lumber04_B.png']
        ]
    },
    'HUNTER_HUT': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/food/hunter/hunter01.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/hunter/hunter02.png'],
            ['/assets/isometric/Spritesheet/Buildings/food/hunter/hunter03.png']
        ]
    },
    'STADIUM': {
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/culture/sport/stade01.png'],
            ['/assets/isometric/Spritesheet/Buildings/culture/sport/stade02.png'],
            ['/assets/isometric/Spritesheet/Buildings/culture/sport/stade03.png']
        ]
    },
    'THEATER': { levels: [['/assets/isometric/Spritesheet/Buildings/culture/theater.png']] }
};


export class BuildingAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    static async load(): Promise<void> {
        if (this._loaded) return;

        console.log('🏗️ BuildingAssets: Chargement...');

        // 1. CARGAISON DES SPRITES CUSTOMS (Haute Résolution Modulaire)
        let customCount = 0;
        for (const [bType, config] of Object.entries(CUSTOM_SPRITES_CONFIG)) {
            // Variante en construction
            if (config.construction) {
                try {
                    const url = asset(config.construction);
                    const tex = await PIXI.Assets.load(url);
                    if (tex && !tex.destroyed) {
                        if (tex.source) tex.source.scaleMode = 'nearest';
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (tex as any).isCustomIso = true;
                        this.textures.set(`CUSTOM_${bType}_CONSTRUCTION`, tex);
                        customCount++;
                    }
                } catch (e) {
                    console.warn(`⚠️ Spritesheet manquant pour la construction de ${bType}`, e);
                }
            }

            // Variantes par niveau
            for (let lvl = 0; lvl < config.levels.length; lvl++) {
                const variants = config.levels[lvl];
                for (let v = 0; v < variants.length; v++) {
                    try {
                        const url = asset(variants[v]);
                        const tex = await PIXI.Assets.load(url);
                        if (tex && !tex.destroyed) {
                            if (tex.source) tex.source.scaleMode = 'nearest';
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (tex as any).isCustomIso = true;
                            const customKey = `CUSTOM_${bType}_LVL${lvl + 1}_VAR${v}`;
                            this.textures.set(customKey, tex);

                            // Définit le niveau brut par défaut sur la variance 0
                            if (v === 0) {
                                this.textures.set(`CUSTOM_${bType}_LVL${lvl + 1}`, tex);
                            }
                            customCount++;
                        }
                    } catch (e) {
                        console.warn(`⚠️ Spritesheet manquant pour ${bType} (Niv ${lvl + 1} / Var ${v}) -> ${variants[v]}`, e);
                    }
                }
            }
        }

        if (customCount > 0) {
            console.log(`🦸 BuildingAssets: ${customCount} custom isometric sprites chargés avec succès !`);
        }

        this._loaded = true;
    }

    static getTexture(type: BuildingType, level: number = 1, variant: number = 0, isConstruction: boolean = false): PIXI.Texture | undefined {
        let key = '';

        // 1. VÉRIFICATION DU CUSTOM CONFIG (Priorité absolue)
        if (CUSTOM_SPRITES_CONFIG[type]) {
            if (isConstruction) {
                const tex = this.textures.get(`CUSTOM_${type}_CONSTRUCTION`);
                if (tex) return tex;
            } else {
                const lvlIndex = Math.max(1, level);
                const configDef = CUSTOM_SPRITES_CONFIG[type];

                // Si le niveau demandé dépasse le nombre de niveaux configurés, on borne
                const actualLvl = Math.min(lvlIndex, configDef.levels.length);
                const variantsArray = configDef.levels[actualLvl - 1] || [];

                // Utilisation du modulo pour déterminer la variante aléatoire (50/50 safe)
                const mappedVariant = variantsArray.length > 0 ? (variant % variantsArray.length) : 0;

                const customKeyBase = `CUSTOM_${type}_LVL${actualLvl}`;
                const texVar = this.textures.get(`${customKeyBase}_VAR${mappedVariant}`);
                if (texVar) return texVar;

                // Fallback de sécurité (VAR0)
                const texLvl = this.textures.get(customKeyBase);
                if (texLvl) return texLvl;
            }
        }

        // Si aucune texture hd n'a été trouvée
        return undefined;
    }
}
