import * as PIXI from 'pixi.js';
import { ProceduralVehicles } from './ProceduralVehicles';

export enum VehicleType {
    CIVILIAN_CAR = 'CIVILIAN_CAR',
    CITY_BUS = 'CITY_BUS',
    GARBAGE_TRUCK = 'GARBAGE_TRUCK',
    POLICE_CRUISER = 'POLICE_CRUISER',
    AMBULANCE = 'AMBULANCE',
    FIRE_TRUCK = 'FIRE_TRUCK',
    OIL_TANKER = 'OIL_TANKER',
    FREIGHT_TRAIN = 'FREIGHT_TRAIN'
}

export class VehicleAssets {
    private static textureCache = new Map<string, PIXI.Texture>();
    private static _loaded = false;

    static async load(app?: PIXI.Application) {
        if (this._loaded || !app) return;

        console.log("🚗 VehicleAssets: Génération procédurale...");

        // Génération pour chaque type
        this.generate(app, VehicleType.CIVILIAN_CAR, 0xFF5722); // Orange
        this.generate(app, VehicleType.CITY_BUS, 0xFFEB3B); // Jaune
        this.generate(app, VehicleType.GARBAGE_TRUCK, 0x4CAF50); // Vert
        this.generate(app, VehicleType.POLICE_CRUISER, 0x2196F3); // Bleu
        this.generate(app, VehicleType.AMBULANCE, 0xFFFFFF); // Blanc
        this.generate(app, VehicleType.FIRE_TRUCK, 0xF44336); // Rouge
        this.generate(app, VehicleType.OIL_TANKER, 0x9E9E9E); // Gris
        this.generate(app, VehicleType.FREIGHT_TRAIN, 0x607D8B); // Gris bleu

        this._loaded = true;
        console.log("✅ Vehicle Assets Generated.");
    }

    private static generate(app: PIXI.Application, type: VehicleType, color: number) {
        // Pour l'instant on génère une seule texture par type (pas de rotation)
        const tex = ProceduralVehicles.generateVehicle(app, type, color);

        // On stocke la même texture pour toutes les directions/frames pour simplifier
        // Clé: TYPE_DIR_FRAME_VARIANT
        // On va simplifier le getter
        this.textureCache.set(type, tex);
    }

    static getTexture(type: VehicleType, direction: number, frameIndex: number, variant: number = 0): PIXI.Texture | null {
        // Retourne la texture générique pour ce type
        return this.textureCache.get(type) || null;
    }

    static clear() {
        this.textureCache.forEach(tex => tex.destroy(true));
        this.textureCache.clear();
        this._loaded = false;
    }
}
