import * as PIXI from 'pixi.js';
import { asset } from '../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// AtlasManager — TexturePacker Spritesheet Loader
// Charge l'atlas une seule fois (1 JSON + 1 PNG)
// Expose les textures par nom de frame (ex: "services/firestation.png")
// ═══════════════════════════════════════════════════════

const ATLAS_JSON_PATH = '/assets/isometric/Spritesheet/atlas.json';
const ATLAS_IMAGE_PATH = '/assets/isometric/Spritesheet/atlas.png';

export class AtlasManager {
    private static _loaded = false;
    private static _loading = false;
    private static _spritesheet: PIXI.Spritesheet | null = null;
    private static _textures: Map<string, PIXI.Texture> = new Map();

    /** True si l'atlas est chargé et prêt */
    static get isReady(): boolean {
        return this._loaded;
    }

    /** Nombre de frames disponibles */
    static get frameCount(): number {
        return this._textures.size;
    }

    /**
     * Charge l'atlas JSON + PNG et parse toutes les frames.
     * Idempotent : ne charge qu'une seule fois.
     */
    static async load(): Promise<void> {
        if (this._loaded || this._loading) return;
        this._loading = true;

        console.log('🗺️ AtlasManager: Chargement de l\'atlas...');

        try {
            // 1. Fetch le JSON (coordonnées des sprites)
            const jsonUrl = asset(ATLAS_JSON_PATH);
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${jsonUrl}`);
            const atlasData = await response.json();

            // 2. Charger l'image PNG comme BaseTexture PIXI
            const imageUrl = asset(ATLAS_IMAGE_PATH);
            const baseTexture = await PIXI.Assets.load(imageUrl);

            // ✅ PIXEL ART CRISP: Forcer le mode NEAREST (pas de lissage bilinéaire)
            if (baseTexture.source) {
                baseTexture.source.scaleMode = 'nearest';
            } else if (baseTexture.baseTexture) {
                // Fallback PixiJS v7
                baseTexture.baseTexture.scaleMode = 0; // NEAREST
            }

            // 3. Créer le Spritesheet PIXI à partir du JSON + BaseTexture
            this._spritesheet = new PIXI.Spritesheet(baseTexture, atlasData);
            await this._spritesheet.parse();

            // 4. Stocker toutes les frames dans notre Map
            const frames = this._spritesheet.textures;
            for (const [name, texture] of Object.entries(frames)) {
                this._textures.set(name, texture);
            }

            this._loaded = true;
            console.log(`✅ AtlasManager: ${this._textures.size} frames chargées.`);

            // Debug: afficher les noms des frames
            if (this._textures.size > 0) {
                const sample = Array.from(this._textures.keys()).slice(0, 5);
                console.log(`   Exemples: ${sample.join(', ')}`);
            }
        } catch (err) {
            console.error('❌ AtlasManager: Erreur de chargement:', err);
            this._loading = false;
        }
    }

    /**
     * Récupère une texture par son nom de frame exact (tel que dans atlas.json).
     * Ex: "services/firestation.png", "residences/house01.png"
     * 
     * @param frameName Nom exact de la frame dans atlas.json
     * @returns La texture PIXI, ou undefined si non trouvée
     */
    static getTexture(frameName: string): PIXI.Texture | undefined {
        // Tentative directe
        let tex = this._textures.get(frameName);
        if (tex) return tex;

        // Fallback: essayer avec/sans .png
        if (frameName.endsWith('.png')) {
            tex = this._textures.get(frameName.replace('.png', ''));
        } else {
            tex = this._textures.get(frameName + '.png');
        }

        return tex;
    }

    /**
     * Vérifie si une frame existe dans l'atlas
     */
    static hasFrame(frameName: string): boolean {
        return this.getTexture(frameName) !== undefined;
    }

    /**
     * Liste tous les noms de frames disponibles
     */
    static getFrameNames(): string[] {
        return Array.from(this._textures.keys());
    }

    /**
     * Réinitialise l'atlas (utile pour hot reload)
     */
    static clear(): void {
        this._textures.clear();
        this._spritesheet = null;
        this._loaded = false;
        this._loading = false;
    }
}
