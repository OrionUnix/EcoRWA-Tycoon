import * as PIXI from 'pixi.js';
import { RoadType } from './types';
import { ROAD_SPECS } from './types';
import { TILE_WIDTH, TILE_HEIGHT } from './config';

export class ProceduralRoads {

    /**
     * Génère une texture de route isométrique
     * @param app Instance Pixi
     * @param type Type de route (DIRT, ASPHALT...)
     * @param connections Objet {n, s, e, w} indiquant les connexions
     */
    static generateRoadSquare(
        app: PIXI.Application,
        type: RoadType,
        connections: { n: boolean, s: boolean, e: boolean, w: boolean }
    ): PIXI.Texture {
        const spec = ROAD_SPECS[type];

        // ✅ ADAPTATION AUX NOUVELLES TUILES (256x128)
        const w = TILE_WIDTH;
        const h = TILE_HEIGHT;

        const g = new PIXI.Graphics();

        // 2. Calcul des points centraux
        const cx = w / 2;
        const cy = h / 2;

        // ✅ ÉCHELLE PROPORTIONNELLE
        // Une route classique fait environ 15-20% de la largeur de la tuile
        const scaleFactor = w / 64; // Ratio par rapport à l'ancienne taille (64)
        const roadWidth = (spec.width || 10) * scaleFactor;
        const roadColor = spec.color;

        // Fonction pour dessiner un segment
        const drawSegment = (params: { x1: number, y1: number, x2: number, y2: number }) => {
            g.moveTo(params.x1, params.y1);
            g.lineTo(params.x2, params.y2);
            g.stroke({ width: roadWidth, color: roadColor, cap: 'round' });
        };

        // POINTS DE CONNEXION ISOMÉTRIQUES STRICTS (Milieux des arêtes du losange)
        const pptN = { x: w * 0.75, y: h * 0.25 }; // Nord (Haut-Droit)
        const pptS = { x: w * 0.25, y: h * 0.75 }; // Sud (Bas-Gauche)
        const pptE = { x: w * 0.75, y: h * 0.75 }; // Est (Bas-Droit)
        const pptW = { x: w * 0.25, y: h * 0.25 }; // Ouest (Haut-Gauche)

        // On dessine du centre vers les sorties connectées
        if (connections.n) drawSegment({ x1: cx, y1: cy, x2: pptN.x, y2: pptN.y });
        if (connections.s) drawSegment({ x1: cx, y1: cy, x2: pptS.x, y2: pptS.y });
        if (connections.e) drawSegment({ x1: cx, y1: cy, x2: pptE.x, y2: pptE.y });
        if (connections.w) drawSegment({ x1: cx, y1: cy, x2: pptW.x, y2: pptW.y });

        // Si aucune connexion mais que c'est une route (isolée), on dessine un point ou un petit rond
        if (!connections.n && !connections.s && !connections.e && !connections.w) {
            g.circle(cx, cy, roadWidth / 2);
            g.fill({ color: roadColor });
        } else {
            // Boucher le centre pour éviter les "trous" entre les segments
            g.circle(cx, cy, roadWidth / 2);
            g.fill({ color: roadColor });
        }

        // Ajout de détails (Lignes blanches pour Asphalte)
        if (type !== RoadType.DIRT) {
            const lineWidth = 1;
            const lineColor = 0xFFFFFF;

            // On refait les segments en blanc plus fin par dessus
            const drawLine = (params: { x1: number, y1: number, x2: number, y2: number }) => {
                g.moveTo(params.x1, params.y1);
                g.lineTo(params.x2, params.y2);
                g.stroke({ width: lineWidth, color: lineColor, alpha: 0.5 });
            };

            if (connections.n) drawLine({ x1: cx, y1: cy, x2: pptN.x, y2: pptN.y });
            if (connections.s) drawLine({ x1: cx, y1: cy, x2: pptS.x, y2: pptS.y });
            if (connections.e) drawLine({ x1: cx, y1: cy, x2: pptE.x, y2: pptE.y });
            if (connections.w) drawLine({ x1: cx, y1: cy, x2: pptW.x, y2: pptW.y });
        }

        const renderTexture = PIXI.RenderTexture.create({ width: w, height: h });
        app.renderer.render({ container: g, target: renderTexture });

        // baking sécurisé (comme pour ProceduralTiles)
        const canvas = app.renderer.extract.canvas(renderTexture);
        const texture = PIXI.Texture.from(canvas);

        renderTexture.destroy(true); // destruction du RT dynamique
        g.destroy();

        return texture;
    }
}
