import * as PIXI from 'pixi.js';
import { BuildingType } from './types';
import { AtlasManager } from './AtlasManager';
import { asset } from '../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// BuildingAssets — Textures pour les bâtiments
// Tire les textures depuis l'AtlasManager (TexturePacker)
// Fallback: charge les fichiers individuels si atlas manquant
// ═══════════════════════════════════════════════════════

export interface CustomSpriteDef {
    construction?: string;
    levels: string[][]; // Tableau par niveaux : level[0] = tableau des variantes pour Lvl 1
}

export const CUSTOM_SPRITES_CONFIG: Record<string, CustomSpriteDef> = {
    'RESIDENTIAL': {
        construction: '/assets/isometric/Spritesheet/Buildings/residences/construction_house01.png',
        levels: [
            ['/assets/isometric/Spritesheet/Buildings/residences/house01.png', '/assets/isometric/Spritesheet/Buildings/residences/House01_B.png'], // Niveau 1
            ['/assets/isometric/Spritesheet/Buildings/residences/House02_A.png'] // Niveau 2
        ]
    }
};

export class BuildingAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    // ═══════════════════════════════════════
    // MAPPING: BuildingType → Frame(s) dans atlas.json
    // Les noms DOIVENT correspondre aux clés exactes du JSON
    // ═══════════════════════════════════════
    private static readonly MAPPING: Record<string, string[]> = {
        // RESIDENTIAL
        'RESIDENTIAL_LVL1': ['residences/house01.png', 'residences/house02.png', 'residences/house03.png'],
        'RESIDENTIAL_LVL2': ['residences/building.png', 'residences/building01.png', 'residences/building02.png'],
        'RESIDENTIAL_LVL3': ['residences/building02.png'],

        // COMMERCIAL
        'COMMERCIAL_LVL1': ['commercial/comercial01.png', 'commercial/comercial02.png'],
        'COMMERCIAL_LVL2': ['commercial/comercial_building.png'],

        // SERVICES (64x50 ou 100x80)
        'POLICE_STATION': ['services/police_station.png'],
        'FIRE_STATION': ['services/firestation.png'],
        'CLINIC': ['services/hospital.png'],
        'SCHOOL': ['special/school.png'],
        'MUSEUM': ['culture/museum.png'],

        // LOISIRS
        'RESTAURANT': ['special/restaurant.png'],
        'CAFE': ['special/coffee_shop.png'],
        'PARK': ['culture/zoo.png'],

        // SPÉCIAL
        'LIBRARY': ['special/bibliotheque.png'],
        'BANK': ['special/bank.png'],
        'MARKET': ['special/market01.png', 'special/market02.png'],
        'MUNICIPAL': ['special/Municipal.png'],
        'UNIVERSITY': ['special/university.png'],
        'PHARMACY': ['special/pharmacy.png'],

        // UTILITIES
        'WATER_PUMP': ['water/walter_pump.png'],
        'WATER_TOWER': ['water/walter_pump02.png'],
        'POWER_PLANT': ['power/electrical_central_02.png'],
        'NUCLEAR_PLANT': ['power/nuclear.png'],
        'RECYCLING': ['services/recycling_center.png'],
        'TREATMENT_PLANT': ['services/treatmentplant.png'],

        // MINE / EXTRACTION
        'COAL_MINE': ['mine/coal_mine.png'],
        'ORE_MINE': ['mine/iron_mine.png'],
        'STONE_QUARRY': ['mine/stone_quarry.png'],
        'OIL_PUMP': ['mine/stone_quarry.png'], // Placeholder — pas d'oil pump dans l'atlas

        // FOOD
        'FARM': ['food/farm.png'],
        'FISHERMAN': ['food/fishport01.png'],

        // INDUSTRIEL
        'FACTORY': ['industrial/factory.png'],
        'BIKE_FACTORY': ['industrial/bike_factory.png'],
        'IRON_FACTORY': ['industrial/special/iron_factory.png'],
        'COMPONENT_FACTORY': ['industrial/special/component_factory.png'],

        // BOIS
        'LUMBER_CAMP': ['special/lumber_camp.png'],
        'SAWMILL': ['special/sawkill.png'],
        'HUNTER_HUT': ['special/hunter_cabin.png'],

        // CULTURE
        'STADIUM': ['culture/stadium.png'],
        'THEATER': ['culture/theater.png'],
        'SWIMMING_POOL': ['culture/swiming_pool.png'],
        'SPORT_CENTER': ['culture/sport_center.png'],

        // EXCHANGE
        'EXCHANGE_MARKET': ['special/exchangemarket.png'],
    };

    static async load(): Promise<void> {
        if (this._loaded) return;

        console.log('🏗️ BuildingAssets: Chargement depuis l\'atlas...');

        // S'assurer que l'atlas est chargé
        if (!AtlasManager.isReady) {
            await AtlasManager.load();
        }

        let loaded = 0;
        let missed = 0;

        for (const [key, files] of Object.entries(this.MAPPING)) {
            files.forEach((frameName, index) => {
                const texture = AtlasManager.getTexture(frameName);
                const varKey = `${key}_VAR${index}`;

                if (texture) {
                    this.textures.set(varKey, texture);
                    if (index === 0) this.textures.set(key, texture); // Texture par défaut
                    loaded++;
                } else {
                    console.warn(`⚠️ Frame atlas manquante: "${frameName}" (${key})`);
                    missed++;
                }
            });
        }

        this._loaded = true;
        console.log(`✅ BuildingAssets: ${loaded} textures chargées depuis l'atlas (${missed} manquantes)`);

        // ═══════════════════════════════════════
        // PASS 2: Standalone haute résolution (REMPLACE les atlas)
        // Pour les bâtiments qui ont des sprites 128x128 hors atlas
        // ═══════════════════════════════════════
        const STANDALONE_OVERRIDES: Record<string, string> = {
            'HUNTER_HUT': '/assets/isometric/Spritesheet/Buildings/special/hunter_cabin.png',
            'LUMBER_CAMP': '/assets/isometric/Spritesheet/Buildings/special/lumber_camp.png',
            'SAWMILL': '/assets/isometric/Spritesheet/Buildings/special/sawkill.png',
            'EXCHANGE_MARKET': '/assets/isometric/Spritesheet/Buildings/special/exchangemarket.png',
        };

        let overrideCount = 0;
        for (const [key, path] of Object.entries(STANDALONE_OVERRIDES)) {
            try {
                const url = asset(path);
                const tex = await PIXI.Assets.load(url);
                if (tex && !tex.destroyed) {
                    if (tex.source) tex.source.scaleMode = 'nearest';
                    this.textures.set(key, tex);
                    this.textures.set(`${key}_VAR0`, tex);
                    overrideCount++;
                }
            } catch (e) {
                // Fichier introuvable — on garde la version atlas
            }
        }

        if (overrideCount > 0) {
            console.log(`🏗️ BuildingAssets: ${overrideCount} textures overridées en standalone haute-res`);
        }

        // ═══════════════════════════════════════
        // PASS 2.5: CUSTOM ISOMETRIC SPRITES (Mode Modulaire)
        // Charge les assets haute résolution depuis CUSTOM_SPRITES_CONFIG
        // ═══════════════════════════════════════
        let customCount = 0;
        for (const [bType, config] of Object.entries(CUSTOM_SPRITES_CONFIG)) {
            // Variante en construction
            if (config.construction) {
                try {
                    const url = asset(config.construction);
                    const tex = await PIXI.Assets.load(url);
                    if (tex && !tex.destroyed) {
                        if (tex.source) tex.source.scaleMode = 'nearest';
                        (tex as any).isCustomIso = true; // Flag d'identification
                        this.textures.set(`CUSTOM_${bType}_CONSTRUCTION`, tex);
                        customCount++;
                    }
                } catch (e) { }
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
                            (tex as any).isCustomIso = true; // Flag d'identification
                            const customKey = `CUSTOM_${bType}_LVL${lvl + 1}_VAR${v}`;
                            this.textures.set(customKey, tex);

                            // Définit le niveau brut par défaut sur la variance 0
                            if (v === 0) {
                                this.textures.set(`CUSTOM_${bType}_LVL${lvl + 1}`, tex);
                            }
                            customCount++;
                        }
                    } catch (e) { }
                }
            }
        }

        if (customCount > 0) {
            console.log(`🦸 BuildingAssets: ${customCount} custom isometric sprites chargés avec succès !`);
        }

        // ═══════════════════════════════════════
        // PASS 3: Fallback direct PNG pour les frames manquantes
        // ═══════════════════════════════════════
        if (missed > 0) {
            const BASE = '/assets/isometric/Spritesheet/Buildings/';
            let directLoaded = 0;

            for (const [key, files] of Object.entries(this.MAPPING)) {
                for (let index = 0; index < files.length; index++) {
                    const varKey = `${key}_VAR${index}`;
                    if (!this.textures.has(varKey) && !this.textures.has(key)) {
                        try {
                            const url = asset(BASE + files[index]);
                            const tex = await PIXI.Assets.load(url);
                            if (tex && !tex.destroyed) {
                                if (tex.source) tex.source.scaleMode = 'nearest';
                                this.textures.set(varKey, tex);
                                if (index === 0) this.textures.set(key, tex);
                                directLoaded++;
                            }
                        } catch (e) {
                            // Fichier introuvable
                        }
                    }
                }
            }

            if (directLoaded > 0) {
                console.log(`🏗️ BuildingAssets: +${directLoaded} textures chargées en standalone (fallback PNG)`);
            }
        }
    }

    /**
     * Récupère la texture pour un type de bâtiment, niveau et variante.
     * Supporte désormais l'état de construction et les assets custom modulaires.
     */
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

        // Si on est en construction et aucune texture custom n'existe, on retourne undefined 
        // pour laisser BuildingRenderer afficher le bloc 3D de base
        if (isConstruction) return undefined;

        // 2. COMPORTEMENT EXISTANT (Rétrocompatibilité Atlas & Standalone fallback)

        if (type === BuildingType.RESIDENTIAL) {
            const v = (variant || 0) % 3;
            const lvl = Math.min(level || 1, 3);
            key = `RESIDENTIAL_LVL${lvl}`;
            // Essayer la variante spécifique d'abord
            const varTex = this.textures.get(`${key}_VAR${v}`);
            if (varTex) return varTex;
        }
        else if (type === BuildingType.COMMERCIAL) {
            const lvl = Math.min(level || 1, 2);
            key = `COMMERCIAL_LVL${lvl}`;
        }
        else {
            // Mapping direct pour Services et autres
            key = type;
        }

        if (this.textures.has(key)) return this.textures.get(key);

        // Fallback résidentiel
        if (type === BuildingType.RESIDENTIAL) return this.textures.get('RESIDENTIAL_LVL1');

        return undefined;
    }
}
