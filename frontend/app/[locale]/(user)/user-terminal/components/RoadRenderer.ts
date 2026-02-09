import * as PIXI from 'pixi.js';
import { RoadData, RoadType } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { COLORS } from '../engine/constants';

// Cache pour stocker les graphiques de route individuels
const roadCache = new Map<number, PIXI.Graphics>();

export class RoadRenderer {

    static drawTile(
        container: PIXI.Container,
        road: RoadData,
        x: number,
        y: number,
        pos: { x: number, y: number },
        isHigh: boolean,
        isLow: boolean
    ) {
        const i = y * GRID_SIZE + x;
        let graphics = roadCache.get(i);

        // Création ou récupération du graphique
        if (!graphics) {
            graphics = new PIXI.Graphics();
            container.addChild(graphics);
            roadCache.set(i, graphics);
        }

        // Nettoyage
        graphics.clear();
        graphics.visible = true;

        // Positionnement & Z-Index
        graphics.x = pos.x;
        graphics.y = pos.y;
        graphics.zIndex = x + y + 0.1; // Juste au-dessus du sol

        // --- CONFIGURATION DU STYLE SELON LE TYPE ---
        let roadWidth = 14;
        let baseColor = 0x555555;
        let lineColor = 0xFFFFFF; // Couleur du marquage au sol
        let hasMarking = false;
        let isDashed = false;
        let border: { width: number, color: number } | null = null; // Trottoir ou bordure

        switch (road.type) {
            case RoadType.DIRT:
                // Terre marron, 1 voie, lent
                roadWidth = 12;
                baseColor = 0x8B4513; // SaddleBrown
                hasMarking = false;
                break;

            case RoadType.ASPHALT:
                // Bitume gris, 2 voies
                roadWidth = 20;
                baseColor = 0x555555; // Gris bitume
                hasMarking = true;
                isDashed = true;
                lineColor = 0xFFFFFF;
                border = { width: 24, color: 0x999999 }; // Trottoir gris clair
                break;

            case RoadType.AVENUE:
                // Avenue verte (décoration), 4 voies
                roadWidth = 28;
                baseColor = 0x2E7D32; // Vert (ForestGreen) pour le fond/déco
                hasMarking = true; // On redessinera du gris par dessus plus tard
                lineColor = 0xCCCCCC;
                border = { width: 32, color: 0x1B5E20 }; // Bordure vert foncé
                break;

            case RoadType.HIGHWAY:
                // Autoroute noire, 6 voies, très rapide
                roadWidth = 36;
                baseColor = 0x111111; // Noir presque total
                hasMarking = true;
                isDashed = false; // Ligne continue ou double
                lineColor = 0xFFCC00; // Jaune orangé
                break;

            default: // Fallback
                roadWidth = 14;
                baseColor = 0x555555;
                break;
        }

        if (isLow) {
            // Mode dézoomé simple
            graphics.rect(-roadWidth / 2, -roadWidth / 4, roadWidth, roadWidth / 2).fill({ color: baseColor });
            return;
        }

        // Coordonnées des points cardinaux (Bords exacts de la tuile)
        // ISO : Le Nord est en haut (0, -H/2), Sud en bas (0, H/2), etc.
        const n = { x: 0, y: -TILE_HEIGHT / 2 };
        const s = { x: 0, y: TILE_HEIGHT / 2 };
        const e = { x: TILE_WIDTH / 2, y: 0 };
        const w = { x: -TILE_WIDTH / 2, y: 0 };

        // Récupération des connexions
        const conns = road.connections || { n: false, s: false, e: false, w: false };

        // --- 1. DESSIN DU FOND (Trottoirs / Bordures) ---
        if (border) {
            const bWidth = border.width;
            const bColor = border.color;

            // Pour éviter les "trous" au centre, on dessine un losange central
            graphics.beginPath();
            graphics.moveTo(0, -bWidth / 3); // Approx pour couvrir le centre iso
            graphics.lineTo(bWidth / 1.5, 0);
            graphics.lineTo(0, bWidth / 3);
            graphics.lineTo(-bWidth / 1.5, 0);
            graphics.fill({ color: bColor });

            // Branches
            graphics.stroke({ width: bWidth, color: bColor, cap: 'butt' }); // 'butt' = bout plat
            graphics.beginPath();
            if (conns.n) { graphics.moveTo(0, 0); graphics.lineTo(n.x, n.y); }
            if (conns.s) { graphics.moveTo(0, 0); graphics.lineTo(s.x, s.y); }
            if (conns.e) { graphics.moveTo(0, 0); graphics.lineTo(e.x, e.y); }
            if (conns.w) { graphics.moveTo(0, 0); graphics.lineTo(w.x, w.y); }
            graphics.stroke();
        }

        // --- 2. DESSIN DE LA ROUTE (Surface roulable) ---

        // Comblement du centre (Losange plus petit)
        // Cela évite les lignes blanches entre les segments qui se rejoignent
        graphics.beginPath();
        graphics.moveTo(0, -roadWidth / 4);
        graphics.lineTo(roadWidth / 2, 0);
        graphics.lineTo(0, roadWidth / 4);
        graphics.lineTo(-roadWidth / 2, 0);
        graphics.fill({ color: baseColor });

        // Branches de la route
        graphics.stroke({ width: roadWidth, color: baseColor, cap: 'butt' });
        graphics.beginPath();
        if (conns.n) { graphics.moveTo(0, 0); graphics.lineTo(n.x, n.y); }
        if (conns.s) { graphics.moveTo(0, 0); graphics.lineTo(s.x, s.y); }
        if (conns.e) { graphics.moveTo(0, 0); graphics.lineTo(e.x, e.y); }
        if (conns.w) { graphics.moveTo(0, 0); graphics.lineTo(w.x, w.y); }
        graphics.stroke();

        // --- 3. DÉTAILS SPÉCIAUX (Avenue & Autoroute) ---

        // Pour l'AVENUE, on ajoute des bandes grises sur le fond vert
        if (road.type === RoadType.AVENUE) {
            const laneWidth = 18; // Bitume au centre
            const laneColor = 0x666666;

            graphics.stroke({ width: laneWidth, color: laneColor, cap: 'butt' });
            graphics.beginPath();
            if (conns.n) { graphics.moveTo(0, 0); graphics.lineTo(n.x, n.y); }
            if (conns.s) { graphics.moveTo(0, 0); graphics.lineTo(s.x, s.y); }
            if (conns.e) { graphics.moveTo(0, 0); graphics.lineTo(e.x, e.y); }
            if (conns.w) { graphics.moveTo(0, 0); graphics.lineTo(w.x, w.y); }
            graphics.stroke();

            // Comblement centre avenue
            graphics.circle(0, 0, laneWidth / 2.5).fill({ color: laneColor });
        }

        // --- 4. MARQUAGE AU SOL (Lignes blanches/jaunes) ---
        if (hasMarking && !road.isBridge) {
            const markWidth = road.type === RoadType.HIGHWAY ? 2 : 1;

            // Configuration des pointillés
            // Pixi Graphics standard ne gère pas nativement 'dashed' facilement sur un stroke complexe
            // On simule par une ligne pleine avec alpha réduit ou couleur distincte

            graphics.stroke({
                width: markWidth,
                color: lineColor,
                alpha: isDashed ? 0.6 : 1.0,
                cap: 'butt'
            });

            graphics.beginPath();
            // On dessine les lignes seulement sur les axes connectés
            if (conns.n) { graphics.moveTo(0, 0); graphics.lineTo(n.x, n.y); }
            if (conns.s) { graphics.moveTo(0, 0); graphics.lineTo(s.x, s.y); }
            if (conns.e) { graphics.moveTo(0, 0); graphics.lineTo(e.x, e.y); }
            if (conns.w) { graphics.moveTo(0, 0); graphics.lineTo(w.x, w.y); }
            graphics.stroke();

            // Petit point central pour les intersections
            if ((conns.n && conns.e) || (conns.n && conns.w) || (conns.s && conns.e) || (conns.s && conns.w)) {
                graphics.circle(0, 0, markWidth).fill({ color: lineColor });
            }
        }

        // --- 5. PONTS ---
        if (road.isBridge) {
            // Rambardes du pont
            graphics.stroke({ width: roadWidth + 2, color: 0x3E2723, alpha: 1, cap: 'butt' });
            graphics.beginPath();
            if (conns.n || conns.s) { // Vertical bridge
                graphics.moveTo(n.x, n.y); graphics.lineTo(s.x, s.y);
            } else { // Horizontal bridge
                graphics.moveTo(w.x, w.y); graphics.lineTo(e.x, e.y);
            }
            graphics.stroke();

            // Ré-appliquer le bitume par dessus
            graphics.stroke({ width: roadWidth - 2, color: 0x555555, cap: 'butt' });
            graphics.stroke();

            // Piliers (en mode High Detail)
            if (isHigh) {
                graphics.rect(-4, 0, 8, 20).fill({ color: 0x221100 });
            }
        }
    }

    static clearAll(container: PIXI.Container) {
        roadCache.forEach(g => {
            container.removeChild(g);
            g.destroy();
        });
        roadCache.clear();
    }
}