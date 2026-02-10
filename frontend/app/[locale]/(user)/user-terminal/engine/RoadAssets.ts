import * as PIXI from 'pixi.js';
import { asset } from '../utils/assetUtils';

export class RoadAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    static async load() {
        if (this._loaded) return;

        // Verify these filenames against your 'png' folder!
        const files: Record<string, string> = {
            'roadNS': 'roadNS.png',
            'roadEW': 'roadEW.png',
            'roadNE': 'roadNE.png',
            'roadNW': 'roadNW.png',
            'roadES': 'roadES.png', // Or roadSE.png
            'roadSW': 'roadSW.png',
            'roadTE': 'crossroadNES.png', // Example
            'roadTN': 'crossroadNEW.png',
            'roadTS': 'crossroadESW.png',
            'roadTW': 'crossroadNSW.png',
            'crossroad': 'crossroad.png',
            'endN': 'endN.png',
            'endS': 'endS.png',
            'endE': 'endE.png',
            'endW': 'endW.png'
        };

        const promises = Object.entries(files).map(async ([key, filename]) => {
            const path = asset(`/assets/isometric/Spritesheet/roads/png/${filename}`);
            try {
                const texture = await PIXI.Assets.load(path);
                if (texture) this.textures.set(key, texture);
            } catch (e) {
                console.warn(`Missing texture: ${filename}`);
            }
        });

        await Promise.all(promises);
        this._loaded = true;
    }

    static getTexture(name: string): PIXI.Texture | undefined {
        return this.textures.get(name);
    }
}