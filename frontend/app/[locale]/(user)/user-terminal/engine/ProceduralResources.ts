import * as PIXI from 'pixi.js';
import { TILE_WIDTH } from './config';

export class ProceduralResources {
    /**
     * Génère une texture d'arbre (Pin/Sapin pour le style isométrique)
     * @param app Instance Pixi
     * @param color Couleur du feuillage
     * @param trunkColor Couleur du tronc
     */
    static generateTree(app: PIXI.Application, color: number = 0x2E7D32, trunkColor: number = 0x5D4037): PIXI.Texture {
        const g = new PIXI.Graphics();

        // ✅ REDIMENSIONNEMENT (x4 par rapport à avant)
        const scale = TILE_WIDTH / 64; // ex: 256 / 64 = 4

        const w = 32 * scale;  // ~128
        const h = 64 * scale;  // ~256

        // Tronc
        const trunkW = 8 * scale;
        const trunkH = 16 * scale;
        g.rect(w / 2 - trunkW / 2, h - trunkH, trunkW, trunkH);
        g.fill({ color: trunkColor });

        // Feuillage (3 triangles empilés)
        const drawLayer = (yFromBottom: number, width: number, height: number, col: number) => {
            const y = h - (yFromBottom * scale);
            const scaledW = width * scale;
            const scaledH = height * scale;

            g.moveTo(w / 2, y);
            g.lineTo(w / 2 + scaledW / 2, y + scaledH);
            g.lineTo(w / 2 - scaledW / 2, y + scaledH);
            g.closePath();
            g.fill({ color: col });
        };

        // Ombre portée (simple)
        g.ellipse(w / 2, h - (2 * scale), 10 * scale, 4 * scale);
        g.fill({ color: 0x000000, alpha: 0.3 });

        drawLayer(40, 24, 24, color);           // Bas
        drawLayer(52, 20, 20, color + 0x111111); // Milieu (plus clair)
        drawLayer(60, 16, 16, color + 0x222222); // Haut (encore plus clair)

        const texture = PIXI.RenderTexture.create({ width: w, height: h });
        app.renderer.render({ container: g, target: texture });
        g.destroy();
        return texture;
    }

    /**
     * Génère un rocher (Pierre/Or/Fer/Charbon)
     */
    static generateRock(app: PIXI.Application, color: number): PIXI.Texture {
        const g = new PIXI.Graphics();
        const scale = TILE_WIDTH / 64;

        const w = 32 * scale; // ~128
        const h = 32 * scale; // ~128

        // Échelle locale pour les points
        const s = (v: number) => v * scale;

        // Forme irrégulière
        g.moveTo(w / 2, s(4));
        g.lineTo(w - s(4), s(12));
        g.lineTo(w - s(8), s(28));
        g.lineTo(s(8), s(24));
        g.lineTo(s(4), s(10));
        g.closePath();

        g.fill({ color: color });

        // Facette "Lumière"
        g.moveTo(w / 2, s(4));
        g.lineTo(w - s(8), s(14)); // Point intérieur
        g.lineTo(s(4), s(10));
        g.closePath();
        g.fill({ color: 0xFFFFFF, alpha: 0.2 });

        // Facette "Ombre"
        g.moveTo(w - s(8), s(28));
        g.lineTo(w - s(4), s(12));
        g.lineTo(w - s(8), s(14)); // Point intérieur
        g.lineTo(s(16), s(20));  // Point intérieur bas
        g.closePath();
        g.fill({ color: 0x000000, alpha: 0.2 });

        const texture = PIXI.RenderTexture.create({ width: w, height: h });
        app.renderer.render({ container: g, target: texture });
        g.destroy();
        return texture;
    }

    /**
     * Génère un baril de pétrole
     */
    static generateOil(app: PIXI.Application): PIXI.Texture {
        const g = new PIXI.Graphics();
        const scale = TILE_WIDTH / 64;

        const w = 32 * scale;
        const h = 32 * scale;

        const s = (v: number) => v * scale;

        // Fût
        g.rect(s(8), s(8), s(16), s(20));
        g.fill({ color: 0x212121 }); // Noir pétrole

        // Bandes (Renforts)
        g.rect(s(8), s(12), s(16), s(2));
        g.fill({ color: 0x424242 });
        g.rect(s(8), s(22), s(16), s(2));
        g.fill({ color: 0x424242 });

        const texture = PIXI.RenderTexture.create({ width: w, height: h });
        app.renderer.render({ container: g, target: texture });
        g.destroy();
        return texture;
    }
}
