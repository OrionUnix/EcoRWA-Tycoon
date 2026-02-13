import * as PIXI from 'pixi.js';
import { withBasePath } from '../utils/assetUtils';

export class ResourceAssets {
    public static forestFrames: PIXI.Texture[] = [];
    private static isLoaded = false;

    static clear() {
        this.forestFrames.forEach(tex => tex.destroy(true));
        this.forestFrames = [];
        this.isLoaded = false;
    }

    static async load() {
        if (this.isLoaded) return;

        try {
            const forestPath = withBasePath('/assets/isometric/Spritesheet/biome/resources/animes/forest.png');
            console.log("🌲 ResourceAssets: Chargement de", forestPath);

            const texture = await PIXI.Assets.load({
                src: forestPath,
                loadStrategy: 'image',
            });

            console.log(`📏 Texture reçue: ${texture.width}x${texture.height}`);

            // --- CONFIGURATION DU DÉCOUPAGE ---
            // Si votre image forest.png est une grille (ex: 2 colonnes, 2 lignes) :
            const cols = 2;
            const rows = 2;

            const frameWidth = texture.width / cols;
            const frameHeight = texture.height / rows;

            // On vide les frames au cas où (évite les doublons au rechargement)
            this.forestFrames = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const rect = new PIXI.Rectangle(
                        c * frameWidth,
                        r * frameHeight,
                        frameWidth,
                        frameHeight
                    );

                    // Sécurité : vérifier que le rectangle ne dépasse pas de la texture
                    if (rect.x + rect.width <= texture.width && rect.y + rect.height <= texture.height) {
                        this.forestFrames.push(new PIXI.Texture({
                            source: texture.source,
                            frame: rect
                        }));
                    }
                }
            }

            if (this.forestFrames.length === 0) {
                throw new Error("Aucune frame n'a pu être découpée. Vérifiez les dimensions.");
            }

            this.isLoaded = true;
            console.log(`✅ Assets Forest chargés: ${this.forestFrames.length} frames découpées.`);
        } catch (err) {
            console.error("❌ Erreur critique ResourceAssets:", err);
        }
    }
}