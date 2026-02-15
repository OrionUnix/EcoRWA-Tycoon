import * as PIXI from 'pixi.js';
import { ProceduralResources } from './ProceduralResources';

export class ResourceAssets {
    public static forestFrames: PIXI.Texture[] = [];
    public static rockFrames: PIXI.Texture[] = []; // ✅ NOUVEAU
    public static oilFrames: PIXI.Texture[] = [];  // ✅ NOUVEAU

    private static isLoaded = false;

    static get isReady() {
        return this.isLoaded;
    }

    static clear() {
        this.forestFrames.forEach(tex => tex.destroy(true));
        this.rockFrames.forEach(tex => tex.destroy(true));
        this.oilFrames.forEach(tex => tex.destroy(true));
        this.forestFrames = [];
        this.rockFrames = [];
        this.oilFrames = [];
        this.isLoaded = false;
    }

    static async load(app?: PIXI.Application) {
        if (this.isLoaded || !app) return;

        console.log("🌲 ResourceAssets: Génération procédurale...");

        try {
            // 1. GÉNÉRATION ARBRES (3 Variantes)
            this.forestFrames.push(ProceduralResources.generateTree(app, 0x2E7D32, 0x5D4037)); // Vert foncé
            this.forestFrames.push(ProceduralResources.generateTree(app, 0x388E3C, 0x4E342E)); // Vert moyen
            this.forestFrames.push(ProceduralResources.generateTree(app, 0x4CAF50, 0x3E2723)); // Vert clair

            // 2. GÉNÉRATION ROCHERS (Minerais)
            this.rockFrames.push(ProceduralResources.generateRock(app, 0x9E9E9E)); // Pierre
            this.rockFrames.push(ProceduralResources.generateRock(app, 0x3E2723)); // Charbon
            this.rockFrames.push(ProceduralResources.generateRock(app, 0xB71C1C)); // Fer
            this.rockFrames.push(ProceduralResources.generateRock(app, 0xFFD700)); // Or

            // 3. GÉNÉRATION PÉTROLE
            this.oilFrames.push(ProceduralResources.generateOil(app));

            this.isLoaded = true;
            console.log(`✅ Assets Resources générés.`);
        } catch (err) {
            console.error("❌ Erreur critique ResourceAssets:", err);
        }
    }
}
