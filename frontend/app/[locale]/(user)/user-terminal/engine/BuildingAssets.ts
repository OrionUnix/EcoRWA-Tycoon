import * as PIXI from 'pixi.js';
import { asset } from '../utils/assetUtils';
import { BuildingType } from './types';

export class BuildingAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    static async load() {
        if (this._loaded) return;

        console.log("🏗️ Loading Building Assets...");

        // Liste des fichiers fournis par l'utilisateur
        // Mapping Niveaux -> Fichiers
        // Level 1: house 01a (Variante 0), house 02a (Variante 1), house 03a (Variante 2)
        // Level 2: house 06a...
        // Level 3: house 11a...
        // Level 4: apartment complex 01a...

        // Structure de mapping: [Type] -> [Level] -> [Variant] -> Filename
        const MAPPING: Record<number, Record<number, string[]>> = {
            1: { // Level 1
                0: ['house 01a.png', 'house 02a.png', 'house 03a.png'],
                1: ['house 04a.png', 'house 05a.png', 'house 06a.png'], // Juste pour varier si variante > 0
                2: ['house 07a.png', 'house 08a.png', 'house 09a.png']
            },
            2: { // Level 2
                0: ['house 10a.png', 'house 11a.png', 'house 12a.png'],
                1: ['house 10b.png', 'house 11b.png', 'house 12b.png'],
                2: ['house 10c.png', 'house 11c.png', 'house 12c.png']
            },
            3: { // Level 3
                0: ['apartment complex 01a.png'],
                1: ['apartment complex 01b.png'],
                2: ['apartment complex 01c.png']
            },
            4: {
                0: ['apartment complex 02a.png'],
                1: ['apartment complex 02b.png'],
                2: ['apartment complex 02c.png']
            },
            5: {
                0: ['apartment complex 03a.png'],
                1: ['apartment complex 03b.png'],
                2: ['apartment complex 03c.png']
            }
        };

        // Mapping Commercial (Ajouté suite au retour user)
        const COMMERCIAL_MAPPING: Record<number, Record<number, string[]>> = {
            1: { // Level 1 (Commerces de proximité)
                0: ['convenience store 01a.png', 'convenience store 01b.png', 'convenience store 01d.png'],
                1: ['convenience store 01b.png'],
                2: ['convenience store 01d.png']
            },
            2: { // Level 2 (Station Service ?)
                0: ['gas station a.png'],
                1: ['gas station b.png'],
                2: ['gas station c.png']
            }
        };

        const promises: Promise<void>[] = [];
        const loadedKeys: string[] = [];

        // Helper de chargement
        const loadMapping = (mapping: Record<number, Record<number, string[]>>, prefix: string) => {
            for (const [levelStr, variants] of Object.entries(mapping)) {
                const level = parseInt(levelStr);
                for (const [variantStr, files] of Object.entries(variants)) {
                    const variant = parseInt(variantStr);
                    const filename = files[0];
                    const encodedFilename = encodeURIComponent(filename);
                    const relativePath = `/assets/isometric/Spritesheet/Buildings/${encodedFilename}`;
                    const fullPath = asset(relativePath);

                    const key = `${prefix}_LVL${level}_VAR${variant}`;
                    const simpleKey = `${prefix}_LVL${level}`;

                    const p = PIXI.Assets.load(fullPath).then(texture => {
                        if (texture) {
                            this.textures.set(key, texture);
                            if (variant === 0) this.textures.set(simpleKey, texture);
                            loadedKeys.push(key);
                        }
                    }).catch(e => {
                        console.warn(`⚠️ Texture manquante (${prefix}): ${filename}`, e);
                    });
                    promises.push(p);
                }
            }
        };

        loadMapping(MAPPING, 'RESIDENTIAL');
        loadMapping(COMMERCIAL_MAPPING, 'COMMERCIAL');

        await Promise.all(promises);
        this._loaded = true;
        console.log(`✅ Loaded ${loadedKeys.length} Building Assets`, loadedKeys);
    }

    static getTexture(type: BuildingType, level: number, variant: number): PIXI.Texture | undefined {
        if (type === BuildingType.RESIDENTIAL) {
            // Essai avec variante spécifique
            // Variation est souvent 0, 1, 2
            // On modulo par 3 pour être sûr
            const v = (variant || 0) % 3;
            const keyVar = `RESIDENTIAL_LVL${level}_VAR${v}`;
            if (this.textures.has(keyVar)) return this.textures.get(keyVar);

            // Fallback niveau simple
            const keySimple = `RESIDENTIAL_LVL${level}`;
            if (this.textures.has(keySimple)) return this.textures.get(keySimple);

            // Fallback ultime : Niveau 1
            if (this.textures.has('RESIDENTIAL_LVL1')) return this.textures.get('RESIDENTIAL_LVL1');
        }
        return undefined;
    }
}
