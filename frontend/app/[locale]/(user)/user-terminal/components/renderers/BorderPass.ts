import * as PIXI from 'pixi.js';
import { gridToScreen } from '../../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, CHUNK_SIZE, CHUNKS_PER_SIDE } from '../../engine/config';
import { ChunkManager } from '../../engine/ChunkManager';

/**
 * BorderPass — Dessine la frontière STYLE SIMCITY
 * Approche VECTORIELLE par CHUNK (et non par tuile)
 * Trace de grandes lignes droites blanches continues.
 */
export class BorderPass {

    private static readonly BORDER_COLOR = 0xFFFFFF; // Blanc pur
    private static readonly BORDER_ALPHA = 0.8;
    private static readonly BORDER_WIDTH = 4; // Épais

    static render(g: PIXI.Graphics) {
        // Obtenir l'état des chunks (matrice booléenne)
        // ChunkManager est déjà exporté comme instance singleton
        const unlocked = ChunkManager.unlocked;
        if (!unlocked) return;

        for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
            for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
                // On ne dessine les frontières que pour les chunks DÉBLOQUÉS
                if (!unlocked[cy][cx]) continue;

                // Coordonnées grille (coin haut-gauche du chunk)
                const startX = cx * CHUNK_SIZE;
                const startY = cy * CHUNK_SIZE;

                // Coordonnées grille (coin bas-droit du chunk)
                const endX = startX + CHUNK_SIZE;
                const endY = startY + CHUNK_SIZE;

                // 1. Voisin NORD (cy - 1)
                // Si le voisin est hors map ou verrouillé → dessiner la ligne Nord
                if (cy === 0 || !unlocked[cy - 1][cx]) {
                    // Ligne du point (startX, startY) à (endX, startY)
                    // Dans l'isométrique, c'est le bord "Haut-Droit" visuel du losange global du chunk ?
                    // Non, Nord c'est Y constant (startY), X varie de startX à endX
                    this.drawChunkLine(g, startX, startY, endX, startY);
                }

                // 2. Voisin SUD (cy + 1)
                if (cy === CHUNKS_PER_SIDE - 1 || !unlocked[cy + 1][cx]) {
                    // Y constant (endY), X varie de startX à endX
                    this.drawChunkLine(g, startX, endY, endX, endY);
                }

                // 3. Voisin OUEST (cx - 1)
                if (cx === 0 || !unlocked[cy][cx - 1]) {
                    // X constant (startX), Y varie de startY à endY
                    this.drawChunkLine(g, startX, startY, startX, endY);
                }

                // 4. Voisin EST (cx + 1)
                if (cx === CHUNKS_PER_SIDE - 1 || !unlocked[cy][cx + 1]) {
                    // X constant (endX), Y varie de startY à endY
                    this.drawChunkLine(g, endX, startY, endX, endY);
                }
            }
        }
    }

    /**
     * Trace une ligne isométrique entre deux points de la grille
     * (gridX1, gridY1) -> (gridX2, gridY2)
     */
    private static drawChunkLine(
        g: PIXI.Graphics,
        gX1: number, gY1: number,
        gX2: number, gY2: number
    ) {
        // Conversion grille -> écran (pixels)
        const start = gridToScreen(gX1, gY1);
        const end = gridToScreen(gX2, gY2);

        // Correction d'offset pour que la ligne soit bien SUR le bord de la tuile
        // gridToScreen renvoie le CENTRE de la tuile.
        // Mais nous voulons dessiner sur les BORDS.
        // Avec l'algo actuel, la "frontière" passe techniquement au milieu des tuiles du bord.
        // Pour un rendu SimCity "Chunk Border", c'est acceptable car la propriété est binaire.
        // Mais visuellement, on peut vouloir l'ajuster de +/- TILE_WIDTH/2 ?
        // TEST: Laissons tel quel pour voir, c'est mathématiquement "la grille".

        // Ajustement Y de la caméra/surface
        // Les tuiles sont décalées si on utilise un offset global, mais gridToScreen est la ref.

        g.moveTo(start.x, start.y);
        g.lineTo(end.x, end.y);
        g.stroke({
            width: this.BORDER_WIDTH,
            color: this.BORDER_COLOR,
            alpha: this.BORDER_ALPHA,
            cap: 'round', // Joli rendu aux intersections
            join: 'round'
        });
    }

    static clear() {
        // Rien à faire ici, le Graphics est clear par GameRenderer
    }
}
