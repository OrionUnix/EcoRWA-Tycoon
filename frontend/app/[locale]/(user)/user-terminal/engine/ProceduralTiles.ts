import * as PIXI from 'pixi.js';

export class ProceduralTiles {

    static generateBlock(
        app: PIXI.Application,
        w: number,
        h: number,
        depth: number,
        color: number,
        sideColor?: number
    ): PIXI.Texture {
        const container = new PIXI.Container();
        const g = new PIXI.Graphics();
        container.addChild(g);

        const halfW = w / 2;
        const halfH = h / 2;

        const sideColorLeft = sideColor ?? this.adjustColor(color, -40);
        const sideColorRight = this.adjustColor(sideColorLeft, -20);

        // 1. CÔTÉ GAUCHE (Terre)
        g.moveTo(0, halfH)
            .lineTo(halfW, h)
            .lineTo(halfW, h + depth)
            .lineTo(0, halfH + depth)
            .closePath();
        g.fill({ color: sideColorLeft });

        // 2. CÔTÉ DROIT (Ombre)
        g.moveTo(halfW, h)
            .lineTo(w, halfH)
            .lineTo(w, halfH + depth)
            .lineTo(halfW, h + depth)
            .closePath();
        g.fill({ color: sideColorRight });

        // 3. SURFACE (Losange du dessus)
        g.moveTo(0, halfH)
            .lineTo(halfW, 0)
            .lineTo(w, halfH)
            .lineTo(halfW, h)
            .closePath();
        g.fill({ color: color });

        // 4. BORDURES (Highlight)
        const stroke = new PIXI.Graphics();
        stroke.moveTo(0, halfH).lineTo(halfW, 0).lineTo(w, halfH).lineTo(halfW, h).closePath();
        stroke.moveTo(halfW, h).lineTo(halfW, h + depth);
        stroke.stroke({ width: 1, color: 0x000000, alpha: 0.2 });
        container.addChild(stroke);

        // 6. GÉNÉRATION TEXTURE (BAKING)
        // Pour être compatible avec @pixi/tilemap en v8, on convertit le RenderTexture en Texture statique
        const renderTexture = PIXI.RenderTexture.create({ width: w, height: h + depth + 2 });
        app.renderer.render({ container, target: renderTexture });

        // Baking sécurisé pour Tilemap (Evite le problème de RenderTexture dynamique)
        const canvas = app.renderer.extract.canvas(renderTexture);
        const texture = PIXI.Texture.from(canvas);

        renderTexture.destroy(true); // On nettoie le buffer dynamique

        return texture;
    }

    // ✅ NOUVEAU: Map des couleurs pour les textures pixels
    static PALETTE: { [key: string]: number } = {
        'grass': 0x57A64A,      // Plains (Vert)
        'forest': 0x2D5A27,     // Forest (Vert foncé)
        'dirt': 0x8B5A2B,       // Earth/Side
        'stone': 0x808080,      // Mountain (Gris)
        'sand': 0xDBCFA3,       // Beach (Jaune)
        'desert': 0xC2B280,     // Desert (Jaune foncé)
        'snow': 0xFFFFFF,       // Snow
        'water': 0x4060E0,      // River/Ocean (Bleu)
        'wood': 0x6B4423        // Wood
    };

    /**
     * Crée une texture 1x1 de couleur unie pour servir de texture de base
     */
    static createPixelTexture(app: PIXI.Application, type: string): PIXI.Texture {
        const color = this.PALETTE[type] || 0xFF00FF; // Magenta si inconnu
        const g = new PIXI.Graphics();

        // Dessin simple et robuste
        g.rect(0, 0, 16, 16);
        g.fill({ color: color });

        const renderTexture = PIXI.RenderTexture.create({ width: 16, height: 16 });
        app.renderer.render({ container: g, target: renderTexture });

        // Baking
        const canvas = app.renderer.extract.canvas(renderTexture);
        const texture = PIXI.Texture.from(canvas);
        renderTexture.destroy(true);

        return texture;
    }

    /**
     * Génère un bloc en utilisant des couleurs spécifiques pour le dessus et les côtés
     */
    static generateTexturedBlock(
        app: PIXI.Application,
        w: number,
        h: number,
        depth: number,
        topColor: number,  // ✅ Changement: On passe la couleur directement
        sideColor: number  // ✅ Changement: On passe la couleur directement
    ): PIXI.Texture {
        const container = new PIXI.Container();
        const g = new PIXI.Graphics();
        container.addChild(g);

        const halfW = w / 2;
        const halfH = h / 2;

        // 1. CÔTÉ GAUCHE
        g.moveTo(0, halfH).lineTo(halfW, h).lineTo(halfW, h + depth).lineTo(0, halfH + depth).closePath();
        g.fill({ color: sideColor });

        // 2. CÔTÉ DROIT (Ombré)
        g.moveTo(halfW, h).lineTo(w, halfH).lineTo(w, halfH + depth).lineTo(halfW, h + depth).closePath();
        g.fill({ color: this.adjustColor(sideColor, -20) });

        // 3. DESSUS
        g.moveTo(0, halfH).lineTo(halfW, 0).lineTo(w, halfH).lineTo(halfW, h).closePath();
        g.fill({ color: topColor });

        // 4. Highlight
        const stroke = new PIXI.Graphics();
        stroke.moveTo(0, halfH).lineTo(halfW, 0).lineTo(w, halfH).lineTo(halfW, h).closePath();
        stroke.moveTo(halfW, h).lineTo(halfW, h + depth);
        stroke.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
        container.addChild(stroke);

        // Baking
        const renderTexture = PIXI.RenderTexture.create({ width: w, height: h + depth + 2 });
        app.renderer.render({ container, target: renderTexture });

        const canvas = app.renderer.extract.canvas(renderTexture);
        const texture = PIXI.Texture.from(canvas);
        renderTexture.destroy(true);

        return texture;
    }

    private static adjustColor(color: number, amount: number): number {
        let r = (color >> 16) + amount;
        let g = ((color >> 8) & 0x00FF) + amount;
        let b = (color & 0x0000FF) + amount;

        r = Math.max(Math.min(255, r), 0);
        g = Math.max(Math.min(255, g), 0);
        b = Math.max(Math.min(255, b), 0);

        return (r << 16) | (g << 8) | b;
    }
}