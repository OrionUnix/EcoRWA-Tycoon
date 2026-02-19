import * as PIXI from 'pixi.js';
import { BuildingType } from './types';
import { AtlasManager } from './AtlasManager';

// ═══════════════════════════════════════════════════════
// BuildingAssets — Textures pour les bâtiments
// Tire les textures depuis l'AtlasManager (TexturePacker)
// Fallback: charge les fichiers individuels si atlas manquant
// ═══════════════════════════════════════════════════════

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
    }

    /**
     * Récupère la texture pour un type de bâtiment, niveau et variante
     * API identique à l'ancien système — aucun changement pour les appelants
     */
    static getTexture(type: BuildingType, level: number = 1, variant: number = 0): PIXI.Texture | undefined {
        let key = '';

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
