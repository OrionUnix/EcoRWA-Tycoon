import { TILE_WIDTH, TILE_HEIGHT } from './config';
export function gridToScreen(x: number, y: number): { x: number, y: number } {
    const screenX = (x - y) * (TILE_WIDTH / 2);
    const screenY = (x + y) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
}

// Conversion Écran -> Grille (pour la souris)
export function screenToGrid(screenX: number, screenY: number): { x: number, y: number } {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Formule inverse de l'isométrique
    const gridY = (screenY / halfH - screenX / halfW) / 2;
    const gridX = (screenY / halfH + screenX / halfW) / 2;

    return { x: Math.floor(gridX), y: Math.floor(gridY) };
}