// src/app/[locale]/(user)/user-terminal/engine/isometric.ts
import { TILE_WIDTH, TILE_HEIGHT } from './config';

// Convertit Grille -> Écran (Centre de la tuile)
export function gridToScreen(x: number, y: number) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// Convertit Écran -> Grille
export function screenToGrid(screenX: number, screenY: number) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Formule mathématique inversée exacte (Iso ratio 2:1)
    // On DOIT utiliser Math.floor() car (0,0) est situé au TOP VERTEX du losange.
    // L'utilisation de Math.round décalait la zone de hit d'un demi-losange en bas.
    const gridX = Math.floor((screenX / halfW + screenY / halfH) / 2);
    const gridY = Math.floor((screenY / halfH - screenX / halfW) / 2);

    return {
        x: gridX,
        y: gridY
    };
}