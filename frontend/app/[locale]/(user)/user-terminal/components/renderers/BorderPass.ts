import * as PIXI from 'pixi.js';
import { gridToScreen } from '../../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE, CHUNKS_PER_SIDE } from '../../engine/config';
import { ChunkManager } from '../../engine/ChunkManager';

export class BorderPass {
    private static readonly BORDER_COLOR = 0xFFFFFF;
    private static readonly BORDER_ALPHA = 0.6;
    private static readonly BORDER_WIDTH = 3; // Un peu plus épais pour le style

    static render(g: PIXI.Graphics) {
        const unlocked = ChunkManager.unlocked;
        if (!unlocked) return;

        g.clear();

        // 1. MISE EN CACHE DES POINTS AVEC CORRECTION D'OFFSET
        // On calcule les coins réels (intersections des grilles)
        const points: PIXI.Point[][] = [];
        for (let cy = 0; cy <= CHUNKS_PER_SIDE; cy++) {
            points[cy] = [];
            for (let cx = 0; cx <= CHUNKS_PER_SIDE; cx++) {
                // On utilise les coordonnées de grille pures
                const screenPos = gridToScreen(cx * CHUNK_SIZE, cy * CHUNK_SIZE);

                // CORRECTION VISUELLE : 
                // gridToScreen renvoie le centre de la tuile (x, y).
                // Pour être sur le BORD HAUT du losange, on remonte de TILE_HEIGHT / 2.
                points[cy][cx] = new PIXI.Point(screenPos.x, screenPos.y - (TILE_HEIGHT / 2));
            }
        }

        // 2. FUSION DES LIGNES HORIZONTALES (NORD/SUD)
        for (let cy = 0; cy <= CHUNKS_PER_SIDE; cy++) {
            let startCx = -1;
            for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
                const isBottomEdge = cy === CHUNKS_PER_SIDE;
                const isTopEdge = cy === 0;

                const current = !isBottomEdge && unlocked[cy][cx];
                const above = !isTopEdge && unlocked[cy - 1][cx];

                // On dessine si l'état change entre deux chunks verticaux
                if (current !== above) {
                    if (startCx === -1) startCx = cx;
                } else if (startCx !== -1) {
                    this.drawLine(g, points[cy][startCx], points[cy][cx]);
                    startCx = -1;
                }
            }
            if (startCx !== -1) this.drawLine(g, points[cy][startCx], points[cy][CHUNKS_PER_SIDE]);
        }

        // 3. FUSION DES LIGNES VERTICALES (OUEST/EST)
        for (let cx = 0; cx <= CHUNKS_PER_SIDE; cx++) {
            let startCy = -1;
            for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
                const isRightEdge = cx === CHUNKS_PER_SIDE;
                const isLeftEdge = cx === 0;

                const current = !isRightEdge && unlocked[cy][cx];
                const left = !isLeftEdge && unlocked[cy][cx - 1];

                if (current !== left) {
                    if (startCy === -1) startCy = cy;
                } else if (startCy !== -1) {
                    this.drawLine(g, points[startCy][cx], points[cy][cx]);
                    startCy = -1;
                }
            }
            if (startCy !== -1) this.drawLine(g, points[startCy][cx], points[CHUNKS_PER_SIDE][cx]);
        }

        // 4. UN SEUL STROKE POUR TOUT LE RENDU
        g.stroke({
            width: this.BORDER_WIDTH,
            color: this.BORDER_COLOR,
            alpha: this.BORDER_ALPHA,
            cap: 'round',
            join: 'round'
        });
    }

    private static drawLine(g: PIXI.Graphics, p1: PIXI.Point, p2: PIXI.Point) {
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
    }
}