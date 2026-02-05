import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { RoadType, RoadData, ROAD_SPECS, ZoneType, BuildingData, ZONE_COLORS, LayerType, BiomeType } from '../engine/types';
import { RoadManager } from '../engine/RoadManager';

export const COLORS = {
    BG: 0x111111,
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,
    WHITE_MODEL: 0xf5f5f5, WATER_MODEL: 0xb3e5fc,
    OIL: 0xffd700, COAL: 0x212121, IRON: 0xff5722,
    WOOD: 0x43a047, FOOD: 0xff3366, WATER_RES: 0x0000ff,
    GRID_LINES: 0x999999,
    HIGHLIGHT: 0xFFFFFF,
    ROAD_BRIDGE: 0x8B4513,
    ROAD_PREVIEW_VALID: 0x00FF00,
    ROAD_PREVIEW_INVALID: 0xFF0000
};

export class GameRenderer {

    static renderStaticLayer(g: PIXI.Graphics, engine: MapEngine, viewMode: string, showGrid: boolean) {
        g.clear();

        const biomes = engine.biomes;
        const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
        const water = engine.getLayer(LayerType.WATER);
        const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);

                // 1. TERRAIN
                let fillColor = 0x000000;
                let strokeAlpha = 0;
                const biome = biomes[i];

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
                } else {
                    // Vue Calques
                    fillColor = COLORS.WHITE_MODEL;
                    if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.WATER_MODEL;
                    strokeAlpha = 0.15;
                    if (viewMode === 'OIL' && oil[i] > 0.01) fillColor = COLORS.OIL;
                    else if (viewMode === 'COAL' && coal[i] > 0.01) fillColor = COLORS.COAL;
                    else if (viewMode === 'IRON' && iron[i] > 0.01) fillColor = COLORS.IRON;
                    else if (viewMode === 'WOOD' && wood[i] > 0.01) fillColor = COLORS.WOOD;
                    else if (viewMode === 'WATER' && water[i] > 0.01) fillColor = COLORS.WATER_RES;
                    else if (viewMode === 'FOOD' && (fish[i] > 0.01 || animals[i] > 0.01)) fillColor = COLORS.FOOD;
                }

                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: fillColor });
                if (strokeAlpha > 0) g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });

                // 2. ZONAGE
                const zone = engine.zoningLayer[i];
                if (zone !== ZoneType.NONE) {
                    const zColor = ZONE_COLORS[zone];
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });
                    g.stroke({ width: 2, color: zColor, alpha: 0.8 });
                }

                // 3. ROUTES
                if (engine.roadLayer && engine.roadLayer[i]) {
                    this.drawRoadTile(g, engine.roadLayer[i]!, pos.x, pos.y, i);
                }

                // 4. BATIMENTS
                const building = engine.buildingLayer[i];
                if (building) {
                    this.drawBuilding(g, building, pos.x, pos.y);
                }
            }
        }
    }

    private static drawRoadTile(g: PIXI.Graphics, road: RoadData, cx: number, cy: number, index: number) {
        const specs = ROAD_SPECS[road.type];
        if (!specs) return;

        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

        const drawLine = (width: number, color: number, alpha: number = 1) => {
            g.beginPath();
            if (road.connections.n) { g.moveTo(cx, cy); g.lineTo(cx + n_dx, cy + n_dy); }
            if (road.connections.s) { g.moveTo(cx, cy); g.lineTo(cx + s_dx, cy + s_dy); }
            if (road.connections.e) { g.moveTo(cx, cy); g.lineTo(cx + e_dx, cy + e_dy); }
            if (road.connections.w) { g.moveTo(cx, cy); g.lineTo(cx + w_dx, cy + w_dy); }
            g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
        };

        const baseWidth = specs.width;
        const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : specs.color;

        // Base de la route
        if (road.isBridge) {
            drawLine(baseWidth + 4, 0x5D4037, 1); // Bord du pont foncé
            drawLine(baseWidth, baseColor, 1);     // Dessus du pont

            // DESSIN DES PILIERS (Astuce simple)
            // On dessine un rectangle vertical sous la route pour simuler un pilier dans l'eau
            g.beginFill(0x5D4037);
            g.drawRect(cx - 4, cy, 8, 15); // Pilier qui descend
            g.endFill();
        } else {
            drawLine(baseWidth, baseColor, 1);
        }

        // --- DÉTAILS SPÉCIFIQUES ---

        // AUTOROUTE : Lignes blanches sur fond noir
        if (road.type === RoadType.HIGHWAY) {
            drawLine(2, 0xFFFFFF, 1); // Ligne centrale blanche
            drawLine(baseWidth - 4, 0xFFFFFF, 0.5); // Lignes de bord
        }
        // AVENUE : Bande Verte
        else if (road.type === RoadType.AVENUE) {
            drawLine(10, 0x00FF00, 1); // Vert Fluo pour être visible
            drawLine(12, 0xFFFFFF, 0.5); // Bordure blanche
        }
        // ASPHALTE : Ligne Jaune
        else if (road.type === RoadType.ASPHALT) {
            drawLine(1, 0xFFD700, 0.8);
        }
        // TERRE : Pas de marquage, juste marron (déjà dessiné par baseColor)

        // --- DÉCORATIONS (Props) ---
        const seed = (index * 9301 + 49297) % 233280;

        // Lampadaires (Sauf Terre et Autoroute)
        if ((road.type === RoadType.ASPHALT || road.type === RoadType.AVENUE) && (seed % 100) < 50) {
            const h = 12;
            g.moveTo(cx + 8, cy).lineTo(cx + 8, cy - h).stroke({ width: 1, color: 0x999999 });
            g.circle(cx + 8, cy - h, 2).fill({ color: 0xFFFF00 }); // Lumière Jaune
        }

        // Arbres (Seulement Avenue)
        if (road.type === RoadType.AVENUE && (seed % 100) < 60) {
            g.circle(cx, cy - 5, 4).fill({ color: 0x2E7D32 }); // Arbre au centre
        }
    }

    private static drawBuilding(g: PIXI.Graphics, building: BuildingData, cx: number, cy: number) {
        const bHeight = building.level * 8 + 5;
        const bWidth = TILE_WIDTH * 0.5;
        const bColor = ZONE_COLORS[building.type];

        if (building.state === 'CONSTRUCTION') {
            g.stroke({ width: 2, color: 0xFFFF00 });
            g.rect(cx - bWidth / 2, cy - bHeight / 2, bWidth, bHeight / 2).stroke();
        } else {
            // Volume simple
            g.beginPath();
            g.rect(cx - bWidth / 2, cy - bHeight, bWidth, bHeight);
            g.fill({ color: bColor });
            g.stroke({ width: 1, color: 0xFFFFFF });
        }
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean) {
        g.clear();

        // Véhicules
        engine.updateVehicles();
        engine.vehicles.forEach(car => {
            const screenPos = gridToScreen(car.x, car.y);
            g.circle(screenPos.x, screenPos.y, 3).fill({ color: car.color });
        });

        // Curseur
        const hl = gridToScreen(cursorPos.x, cursorPos.y);
        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });

        // Preview
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);

                let color = COLORS.ROAD_PREVIEW_VALID;
                const check = RoadManager.checkTile(engine, idx, null);

                if (currentMode === 'BULLDOZER') color = 0xFF0000;
                else if (!check.valid) color = COLORS.ROAD_PREVIEW_INVALID; // Rouge si invalide (eau)
                else if (check.isBridge) color = COLORS.ROAD_BRIDGE;

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