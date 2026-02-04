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

    // Formule mathématique inversée exacte
    const gridX = (screenX / halfW + screenY / halfH) / 2;
    const gridY = (screenY / halfH - screenX / halfW) / 2;

    return {
        x: Math.round(gridX),
        y: Math.round(gridY)
    };
}