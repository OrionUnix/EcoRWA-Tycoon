import * as PIXI from 'pixi.js';
import { asset } from '../utils/assetUtils';
import { BuildingType } from './types';

export class BuildingAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    static async load() {
        if (this._loaded) return;

        console.log("🏗️ Loading Building Assets...");

        // ✅ MAPPING CORRECT (Basé sur les fichiers réels)
        const MAPPING: Record<string, string[]> = {
            // RESIDENTIAL
            'RESIDENTIAL_LVL1': ['residences/house01.png', 'residences/house02.png', 'residences/house03.png'],
            'RESIDENTIAL_LVL2': ['residences/building.png', 'residences/building01.png', 'residences/building02.png'],
            'RESIDENTIAL_LVL3': ['residences/building02.png'], // Placeholder

            // COMMERCIAL (Restos, Cafés, Magasins)
            'COMMERCIAL_LVL1': ['commercial/comercial01.png', 'commercial/comercial02.png'],
            'COMMERCIAL_LVL2': ['commercial/comercial_building.png'],

            // SERVICES
            'POLICE_STATION': ['services/police_station.png'],
            'FIRE_STATION': ['services/firestation.png'],
            'CLINIC': ['services/hospital.png'], // Hospital
            'SCHOOL': ['services/recycling_center.png'], // Placeholder (Recycling -> School)
            'MUSEUM': ['services/treatmentplant.png'],   // Placeholder (Treatment -> Museum)

            // LOISIRS (Utilisent des assets commerciaux ou random pour l'instant)
            'RESTAURANT': ['commercial/comercial01.png'],
            'CAFE': ['commercial/comercial02.png'],
            'PARK': ['residences/construction.png'], // Placeholder (TODO: Add Park Asset)

            // UTILITIES
            'WATER_PUMP': ['services/treatmentplant.png'],
            'POWER_PLANT': ['services/recycling_center.png'], // Placeholder

            // MINES (NEW)
            'COAL_MINE': ['mine/coal_mine.png'],
            'ORE_MINE': ['mine/iron_mine.png'],
            'OIL_PUMP': ['oil_extraction.png'] // Root folder
        };

        const promises: Promise<void>[] = [];
        const loadedKeys: string[] = [];

        for (const [key, files] of Object.entries(MAPPING)) {
            // On charge toutes les variantes pour une clé, mais on stocke la première comme principale
            files.forEach((filename, index) => {
                const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/'); // Keep slashes
                // Attention: Les sous-dossiers sont dans `Buildings/`
                const relativePath = `/assets/isometric/Spritesheet/Buildings/${filename}`; // Pas d'encodage complet
                const fullPath = asset(relativePath);

                // Clé Principale (ex: RESIDENTIAL_LVL1)
                // Clé Variante (ex: RESIDENTIAL_LVL1_VAR0)
                const varKey = `${key}_VAR${index}`;

                const p = PIXI.Assets.load(fullPath).then(texture => {
                    if (texture) {
                        this.textures.set(varKey, texture);
                        if (index === 0) this.textures.set(key, texture); // Default
                        loadedKeys.push(key);
                    }
                }).catch(e => {
                    console.warn(`⚠️ Texture manquante: ${filename}`, e);
                });
                promises.push(p);
            });
        }

        await Promise.all(promises);
        this._loaded = true;
        console.log(`✅ Loaded ${loadedKeys.length} Building Assets`, loadedKeys);
    }

    static getTexture(type: BuildingType, level: number, variant: number): PIXI.Texture | undefined {
        let key = '';

        if (type === BuildingType.RESIDENTIAL) {
            const v = (variant || 0) % 3;
            const lvl = Math.min(level || 1, 3); // Max Level 3 defined
            key = `RESIDENTIAL_LVL${lvl}`;
            // Try variant
            if (this.textures.has(`${key}_VAR${v}`)) return this.textures.get(`${key}_VAR${v}`);
        }
        else if (type === BuildingType.COMMERCIAL) {
            const lvl = Math.min(level || 1, 2);
            key = `COMMERCIAL_LVL${lvl}`;
        }
        else {
            // Direct mapping for Services/Others
            key = type;
        }

        if (this.textures.has(key)) return this.textures.get(key);

        // Fallback
        if (type === BuildingType.RESIDENTIAL) return this.textures.get('RESIDENTIAL_LVL1');

        return undefined;
    }
}
