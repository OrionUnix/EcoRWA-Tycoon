export const GRID_SIZE = 96;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// Chunk System (Cities: Skylines style — "Island in void")
export const CHUNK_SIZE = 32;
export const CHUNKS_PER_SIDE = GRID_SIZE / CHUNK_SIZE; // 3

// Configuration de l'affichage
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const TILE_DEPTH = 4;
export const SURFACE_Y_OFFSET = 2; // ✅ Léger offset positif pour l'ancrage
export const RESOURCE_SCALE = 1.5; // ✅ Echelle Arbres/Ressources
export const VEHICLE_SCALE = 1.1;  // ✅ Echelle Véhicules (Plus petite selon demande)
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