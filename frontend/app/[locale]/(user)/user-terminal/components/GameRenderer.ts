import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { RoadData, ROAD_SPECS, ZoneType, BuildingData, ZONE_COLORS, LayerType, BiomeType, RoadType } from '../engine/types';

export const COLORS = {
    // ... (couleurs existantes inchangées)
    BG: 0x111111,
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,
    WHITE_MODEL: 0xf5f5f5, WATER_MODEL: 0xb3e5fc,
    OIL: 0xffd700, COAL: 0x212121, IRON: 0xff5722,
    WOOD: 0x43a047, FOOD: 0xff3366, WATER_RES: 0x0000ff,

    // NOUVELLES COULEURS
    GROUNDWATER_LOW: 0xBBDEFB,  // Bleu très clair
    GROUNDWATER_HIGH: 0x0D47A1, // Bleu très foncé
    FISH: 0xFF4081, // Rose
    ANIMAL: 0x8D6E63, // Marron
    GRID_LINES: 0x999999,
    HIGHLIGHT: 0xFFFFFF,
    ROAD_BRIDGE: 0x8B4513,
    ROAD_PREVIEW_VALID: 0x00FF00,
    ROAD_PREVIEW_INVALID: 0xFF0000
};

export class GameRenderer {

    static renderStaticLayer(g: PIXI.Graphics, engine: MapEngine, viewMode: string, showGrid: boolean) {
        g.clear();
        g.rect(0, 0, 2000, 2000).fill({ color: 0x222222 });

        if (!engine || !engine.biomes) return;

        const biomes = engine.biomes;
        const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
        const moistureMap = engine.moistureMap; // ✅ Accès à l'humidité (nappe phréatique)
        const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);

                // --- 1. TERRAIN & RESSOURCES ---
                let fillColor = 0x000000;
                let strokeAlpha = 0;
                const biome = biomes[i];

                // Mode Normal
                if (viewMode === 'ALL' || viewMode === 'BUILD_ROAD' || viewMode === 'BULLDOZER' || viewMode === 'ZONE') {
                    if (biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.DEEP_OCEAN;
                    else if (biome === BiomeType.OCEAN) fillColor = COLORS.OCEAN;
                    else if (biome === BiomeType.BEACH) fillColor = COLORS.BEACH;
                    else if (biome === BiomeType.FOREST) fillColor = COLORS.FOREST;
                    else if (biome === BiomeType.DESERT) fillColor = COLORS.DESERT;
                    else if (biome === BiomeType.MOUNTAIN) fillColor = COLORS.MOUNTAIN;
                    else if (biome === BiomeType.SNOW) fillColor = COLORS.SNOW;
                    else fillColor = getVariation(i) ? COLORS.PLAINS : COLORS.PLAINS_VAR;
                    if (showGrid) strokeAlpha = 0.1;
                }
                // Mode Inspection (Maquette Blanche + Ressources)
                else {
                    fillColor = COLORS.WHITE_MODEL; // Fond blanc par défaut
                    strokeAlpha = 0.1;

                    // Si c'est de l'eau en surface, on la garde bleue en mode maquette pour se repérer
                    if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) {
                        fillColor = COLORS.WATER_MODEL;
                    }

                    // --- VISUALISATION DES CALQUES ---

                    if (viewMode === 'OIL' && oil[i] > 0.1) {
                        fillColor = COLORS.OIL; // Jaune
                    }
                    else if (viewMode === 'COAL' && coal[i] > 0.1) {
                        fillColor = COLORS.COAL; // Noir
                    }
                    else if (viewMode === 'IRON' && iron[i] > 0.1) {
                        fillColor = COLORS.IRON; // Orange rouille
                    }
                    else if (viewMode === 'WOOD') {
                        // On affiche le bois si ressource > 0 OU si c'est une forêt
                        if (wood[i] > 0.1 || biome === BiomeType.FOREST) {
                            fillColor = COLORS.WOOD; // Vert foncé
                        }
                    }
                    else if (viewMode === 'FOOD') {
                        if (fish[i] > 0.1) fillColor = COLORS.FISH; // Poisson (Rose)
                        if (animals[i] > 0.1) fillColor = COLORS.ANIMAL; // Gibier (Marron)
                    }
                    else if (viewMode === 'GROUNDWATER') {
                        // Visualisation de l'humidité du sol
                        const m = moistureMap[i];
                        if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) {
                            fillColor = COLORS.WATER_MODEL; // Océan reste bleu normal
                        } else if (m > 0.3) {
                            // Dégradé de bleu selon la quantité d'eau souterraine
                            // Plus c'est foncé, plus il y a d'eau
                            fillColor = m > 0.7 ? COLORS.GROUNDWATER_HIGH : COLORS.GROUNDWATER_LOW;
                        }
                    }
                }

                // Dessin de la case
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: fillColor });
                if (strokeAlpha > 0) g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });

                // --- 2. ZONES (Transparence) ---
                const zone = engine.zoningLayer[i];
                if (zone !== ZoneType.NONE) {
                    const zColor = ZONE_COLORS[zone] || 0xFF00FF;
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });
                    g.stroke({ width: 2, color: zColor, alpha: 0.8 });
                }

                // --- 3. ROUTES ---
                if (engine.roadLayer && engine.roadLayer[i]) {
                    this.drawRoadTile(g, engine.roadLayer[i]!, pos.x, pos.y, i);
                }

                // --- 4. BÂTIMENTS ---
                const building = engine.buildingLayer[i];
                if (building) {
                    this.drawBuilding(g, building, pos.x, pos.y);
                }
            }
        }
    }

    // ... (Le reste des méthodes drawRoadTile, drawBuilding, renderDynamicLayer restent inchangées)
    // Assurez-vous de garder les méthodes privées existantes !

    private static drawRoadTile(g: PIXI.Graphics, road: RoadData, cx: number, cy: number, index: number) {
        // ... (Reprendre le code de la réponse précédente pour drawRoadTile)
        const specs = ROAD_SPECS[road.type];
        if (!specs) return;
        const baseWidth = specs.width || 8;
        const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : (specs.color || 0x555555);
        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;
        const drawLine = (width: number, color: number, alpha: number = 1) => {
            const conns = road.connections || { n: false, s: false, e: false, w: false };
            const hasConnections = conns.n || conns.s || conns.e || conns.w;
            if (!hasConnections) { g.circle(cx, cy, width / 1.5).fill({ color: color, alpha }); }
            else {
                g.beginPath();
                if (conns.n) { g.moveTo(cx, cy); g.lineTo(cx + n_dx, cy + n_dy); }
                if (conns.s) { g.moveTo(cx, cy); g.lineTo(cx + s_dx, cy + s_dy); }
                if (conns.e) { g.moveTo(cx, cy); g.lineTo(cx + e_dx, cy + e_dy); }
                if (conns.w) { g.moveTo(cx, cy); g.lineTo(cx + w_dx, cy + w_dy); }
                g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
                g.circle(cx, cy, width / 2.2).fill({ color: color, alpha });
            }
        };
        drawLine(baseWidth, baseColor, 1);
        if (road.type === RoadType.HIGHWAY) drawLine(2, 0xFFFFFF, 1);
        else if (road.type === RoadType.AVENUE) drawLine(baseWidth * 0.8, 0x00FF00, 0.2);
    }

    private static drawBuilding(g: PIXI.Graphics, building: BuildingData, cx: number, cy: number) {
        const bHeight = building.level * 8 + 5;
        const bWidth = TILE_WIDTH * 0.5;
        const bColor = ZONE_COLORS[building.type] || 0xFFFFFF;
        if (building.state === 'CONSTRUCTION') {
            g.stroke({ width: 2, color: 0xFFFF00 });
            g.rect(cx - bWidth / 2, cy - bHeight / 2, bWidth, bHeight / 2).stroke();
        } else {
            g.beginPath();
            g.rect(cx - bWidth / 2, cy - bHeight, bWidth, bHeight);
            g.fill({ color: bColor });
            g.stroke({ width: 1, color: 0xFFFFFF });
        }
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean) {
        g.clear();
        if (engine.vehicles) {
            engine.vehicles.forEach(car => {
                const screenPos = gridToScreen(car.x, car.y);
                const offX = (car as any).offsetX || 0;
                const offY = (car as any).offsetY || 0;
                g.circle(screenPos.x + offX * TILE_WIDTH, screenPos.y + offY * TILE_HEIGHT, 3).fill({ color: car.color || 0xFFFFFF });
            });
        }
        const hl = gridToScreen(cursorPos.x, cursorPos.y);
        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);
                let color = COLORS.ROAD_PREVIEW_VALID;
                if (currentMode === 'BULLDOZER') color = 0xFF0000;
                else if (!isValidBuild) color = COLORS.ROAD_PREVIEW_INVALID;
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.fill({ color, alpha: 0.6 });
            }
        }
    }
}