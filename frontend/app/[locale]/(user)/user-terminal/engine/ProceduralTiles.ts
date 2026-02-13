import * as PIXI from 'pixi.js';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

export class ProceduralTiles {
    // Génère un bloc isométrique complet (Surface + Terre en dessous)
    static generateBlock(
        app: PIXI.Application,
        width: number,
        height: number,
        depth: number,
        baseColor: number,
        dirtColor: number = 0x8D6E63
    ): PIXI.Texture {

        const g = new PIXI.Graphics();

        // --- 1. FACE SUPÉRIEURE (Le Losange de surface) ---
        g.moveTo(width / 2, 0)
            .lineTo(width, height / 2)
            .lineTo(width / 2, height)
            .lineTo(0, height / 2)
            .closePath();

        g.fill({ color: baseColor });

        // --- 2. TEXTURE PROCÉDURALE (Bruit) ---
        // Pour éviter de faire crasher le navigateur avec 30 000 rectangles,
        // on dessine des petits blocs de 4x4 pixels uniquement au centre
        // Optimisation: On dessine moins de détails si ce n'est pas nécessaire
        for (let y = height * 0.2; y < height * 0.8; y += 4) {
            for (let x = width * 0.2; x < width * 0.8; x += 4) {
                // On utilise le bruit Simplex pour créer des taches organiques
                const n = noise2D(x * 0.05, y * 0.05);
                if (n > 0.3) {
                    // Ajoute des petites taches sombres (ex: brins d'herbe ou cailloux)
                    g.rect(x, y, 4, 4);
                    g.fill({ color: 0x000000, alpha: 0.05 });
                } else if (n < -0.3) {
                    // Ajoute des petites taches claires
                    g.rect(x, y, 4, 4);
                    g.fill({ color: 0xFFFFFF, alpha: 0.05 });
                }
            }
        }

        // --- 3. FACE GAUCHE (Profondeur - Terre) ---
        g.moveTo(0, height / 2)
            .lineTo(width / 2, height)
            .lineTo(width / 2, height + depth)
            .lineTo(0, height / 2 + depth)
            .closePath();

        g.fill({ color: dirtColor }); // Couleur terre de base

        // --- 4. FACE DROITE (Profondeur - Ombrée) ---
        g.moveTo(width / 2, height)
            .lineTo(width, height / 2)
            .lineTo(width, height / 2 + depth)
            .lineTo(width / 2, height + depth)
            .closePath();

        // On assombrit la face droite pour l'effet 3D isométrique (lumière venant de gauche)
        g.fill({ color: dirtColor, alpha: 0.7 });
        g.fill({ color: 0x000000, alpha: 0.3 }); // Couche d'ombre

        // 6. GÉNÉRATION DE LA TEXTURE
        // On "photographie" ce Graphics pour en faire une vraie texture utilisable
        const texture = app.renderer.generateTexture(g);

        // Nettoyage immédiat du Graphics pour libérer la mémoire
        g.destroy();

        return texture;
    }
}
