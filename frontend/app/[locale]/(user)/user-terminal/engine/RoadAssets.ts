import * as PIXI from 'pixi.js';
import { RoadType } from './types';
import { ProceduralRoads } from './ProceduralRoads';

export class RoadAssets {
    private static _loaded = false;
    // Map: "TYPE_BITMASK" -> Texture
    // Bitmask: N=1, S=2, E=4, W=8
    public static textures: Map<string, PIXI.Texture> = new Map();

    static clear() {
        this.textures.forEach(tex => tex.destroy(true));
        this.textures.clear();
        this._loaded = false;
    }

    static async load(app?: PIXI.Application) {
        if (this._loaded || !app) return;

        console.log("🛣️ RoadAssets: Génération procédurale...");

        const types = [RoadType.DIRT, RoadType.ASPHALT, RoadType.AVENUE, RoadType.HIGHWAY];

        for (const type of types) {
            // Générer les 16 combinaisons (0 à 15)
            for (let i = 0; i < 16; i++) {
                const n = (i & 1) !== 0; // Bit 0
                const s = (i & 2) !== 0; // Bit 1
                const e = (i & 4) !== 0; // Bit 2
                const w = (i & 8) !== 0; // Bit 3

                const tex = ProceduralRoads.generateRoadSquare(app, type, { n, s, e, w });

                const key = `${type}_${i}`;
                this.textures.set(key, tex);
            }
        }

        this._loaded = true;
        console.log("✅ Road Assets Generated (16 variants per type)");
    }

    /**
     * Récupère la texture pour une configuration donnée
     */
    static getTexture(type: RoadType, conns: { n: boolean, s: boolean, e: boolean, w: boolean }): PIXI.Texture | undefined {
        let mask = 0;
        if (conns.n) mask |= 1;
        if (conns.s) mask |= 2;
        if (conns.e) mask |= 4;
        if (conns.w) mask |= 8;

        const key = `${type}_${mask}`;
        const tex = this.textures.get(key);

        if (tex) {
            if (tex.destroyed || (tex.source && tex.source.destroyed)) {
                console.error(`💀 [RoadAssets] ZOMBIE TEXTURE détectée pour le type: ${key}`);
                return undefined;
            }
        } else {
            // Optional: Warn if missing (but might be normal for some incomplete sets)
            // console.warn(`⚠️ [RoadAssets] Texture introuvable pour le type: ${key}`);
        }

        return tex;
    }
}
