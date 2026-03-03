export const GRID_SIZE = 96;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// ═══════════════════════════════════════════════════
// Ground Texture Constants (512×512 PNG → 128×64 tile)
// ═══════════════════════════════════════════════════
// Visual tile size cible (indépendant de TILE_WIDTH/HEIGHT de la grille)
export const GROUND_VISUAL_WIDTH = 128;  // px de large visuel
export const GROUND_TILE_SOURCE_SIZE = 512; // taille des PNGs sources
// Diagonale d'un carré 512px tourné à 45° → 512 * √2 ≈ 724.07 px
// On échelonne pour que cette diagonale = GROUND_VISUAL_WIDTH
export const GROUND_SCALE_X = GROUND_VISUAL_WIDTH / (GROUND_TILE_SOURCE_SIZE * Math.SQRT2); // ≈ 0.1768
// Pour l'isométrique 2:1, le skew ±atan(0.5) + rotation PI/4 produit le losange parfait
// Le scale Y sera le même (uniforme) — le cisaillement se charge de l'écrasement
export const GROUND_SCALE_Y = GROUND_SCALE_X; // Uniforme ! Skew gère l'isométrique
export const ISO_SKEW = Math.atan(0.5); // ≈ 0.463647 rad = 26.565°

// Chunk System (Cities: Skylines style — "Island in void")
export const CHUNK_SIZE = 32;
export const CHUNKS_PER_SIDE = GRID_SIZE / CHUNK_SIZE; // 3

// Configuration de l'affichage
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const TILE_DEPTH = 4;
export const SURFACE_Y_OFFSET = 2;
export const RESOURCE_SCALE = 1.5;
export const VEHICLE_SCALE = 1.1;
export const CURSOR_DEPTH_OFFSET = 0;

// Zoom par défaut (Réduit pour voir plus de carte)
export const INITIAL_ZOOM = 1.0;

export const RESOURCE_CAPACITY = {
    OIL: 250000, COAL: 50000, IRON: 40000,
    WOOD: 5000, FISH: 15000, ANIMALS: 500, WATER: 1000000,
};

export const RESOURCE_UNITS = {
    OIL: 'bbl', COAL: 't', IRON: 't', WOOD: 'm³', FISH: 'u', ANIMALS: 'têtes', WATER: 'L'
};