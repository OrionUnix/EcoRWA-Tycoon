import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { RoadData, ROAD_SPECS, ZoneType, BuildingData, ZONE_COLORS, LayerType, BiomeType, RoadType } from '../engine/types';

export const COLORS = {
    BG: 0x111111,
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,
    WHITE_MODEL: 0xf5f5f5, WATER_MODEL: 0xb3e5fc,
    OIL: 0xffd700, COAL: 0x212121, IRON: 0xff5722,
    WOOD: 0x43a047, FOOD: 0xff3366, WATER_RES: 0x0000ff,
    GROUNDWATER_LOW: 0xBBDEFB, GROUNDWATER_HIGH: 0x0D47A1,
    FISH: 0xFF4081, ANIMAL: 0x8D6E63,
    GRID_LINES: 0x999999,
    HIGHLIGHT: 0xFFFFFF,
    ROAD_BRIDGE: 0x8B4513,
    ROAD_PREVIEW_VALID: 0x00FF00,
    ROAD_PREVIEW_INVALID: 0xFF0000
};

// Seuils de Zoom pour le LOD
const LOD_THRESHOLD_LOW = 0.6;  // En dessous de 0.6 = Vue Carte (Très loin)
const LOD_THRESHOLD_HIGH = 1.2; // Au dessus de 1.2 = Vue Détail (Très près)

export class GameRenderer {

    // ✅ AJOUT DU PARAMÈTRE 'zoomLevel'
    static renderStaticLayer(g: PIXI.Graphics, engine: MapEngine, viewMode: string, showGrid: boolean, zoomLevel: number) {
        g.clear();

        // Optimisation : Si très dézoomé, on ne dessine pas le fond gris immense, juste le noir par défaut du canvas
        if (zoomLevel > LOD_THRESHOLD_LOW) {
            g.rect(0, 0, 2000, 2000).fill({ color: 0x222222 });
        }

        if (!engine || !engine.biomes) return;

        const biomes = engine.biomes;
        const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
        const moistureMap = engine.moistureMap;
        const getVariation = (idx: number) => (Math.sin(idx * 999) > 0.5);

        // Détermine le niveau de détail actuel
        const isHighDetail = zoomLevel > LOD_THRESHOLD_HIGH;
        const isLowDetail = zoomLevel < LOD_THRESHOLD_LOW;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                // Culling basique (Optimisation future possible ici : ne pas dessiner si hors écran)
                // Pour l'instant on se concentre sur le LOD graphique.

                const pos = gridToScreen(x, y);

                // --- 1. TERRAIN ---
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

                    // LOD: On n'affiche la grille que si on est assez près
                    if (showGrid && !isLowDetail) strokeAlpha = 0.1;

                } else {
                    // Mode Inspection (Simplifié pour les perfs en Low Detail)
                    fillColor = COLORS.WHITE_MODEL;
                    strokeAlpha = 0.1;
                    if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.WATER_MODEL;

                    // Logique calques...
                    if (viewMode === 'OIL' && oil[i] > 0.1) fillColor = COLORS.OIL;
                    else if (viewMode === 'COAL' && coal[i] > 0.1) fillColor = COLORS.COAL;
                    else if (viewMode === 'IRON' && iron[i] > 0.1) fillColor = COLORS.IRON;
                    else if (viewMode === 'WOOD' && (wood[i] > 0.1 || biome === BiomeType.FOREST)) fillColor = COLORS.WOOD;
                    else if (viewMode === 'FOOD' && (fish[i] > 0.1 || animals[i] > 0.1)) fillColor = (fish[i] > 0.1 ? COLORS.FISH : COLORS.ANIMAL);
                    else if (viewMode === 'GROUNDWATER' && biome !== BiomeType.OCEAN) {
                        const m = moistureMap[i];
                        if (m > 0.3) fillColor = m > 0.7 ? COLORS.GROUNDWATER_HIGH : COLORS.GROUNDWATER_LOW;
                    }
                }

                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: fillColor });

                // LOD: Pas de contours de cases en vue éloignée (énorme gain de FPS)
                if (strokeAlpha > 0 && !isLowDetail) {
                    g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: strokeAlpha });
                }

                // --- 2. ZONES ---
                const zone = engine.zoningLayer[i];
                if (zone !== ZoneType.NONE) {
                    const zColor = ZONE_COLORS[zone] || 0xFF00FF;
                    // En Low Detail, on dessine juste un carré plat sans contour
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });

                    if (!isLowDetail) {
                        g.stroke({ width: 2, color: zColor, alpha: 0.8 });
                    }
                }

                // --- 3. ROUTES ---
                if (engine.roadLayer && engine.roadLayer[i]) {
                    this.drawRoadTile(g, engine.roadLayer[i]!, pos.x, pos.y, isHighDetail, isLowDetail);
                }

                // --- 4. BÂTIMENTS ---
                const building = engine.buildingLayer[i];
                if (building) {
                    this.drawBuilding(g, building, pos.x, pos.y, isHighDetail, isLowDetail);
                }
            }
        }
    }

    // ✅ LOD APPLIQUÉ AUX ROUTES
    private static drawRoadTile(g: PIXI.Graphics, road: RoadData, cx: number, cy: number, isHigh: boolean, isLow: boolean) {
        const specs = ROAD_SPECS[road.type];
        if (!specs) return;

        const baseWidth = specs.width || 8;
        const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : (specs.color || 0x555555);

        // En LOW detail (vue satellite), on dessine juste des traits simples
        if (isLow) {
            // Dessin ultra simplifié (juste un cercle ou un trait sans jointures complexes)
            g.circle(cx, cy, baseWidth / 2).fill({ color: baseColor });
            return;
        }

        // Géométrie
        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

        const drawLine = (width: number, color: number, alpha: number = 1) => {
            const conns = road.connections || { n: false, s: false, e: false, w: false };
            const hasConnections = conns.n || conns.s || conns.e || conns.w;

            if (!hasConnections) {
                g.circle(cx, cy, width / 1.5).fill({ color: color, alpha });
            } else {
                g.beginPath();
                if (conns.n) { g.moveTo(cx, cy); g.lineTo(cx + n_dx, cy + n_dy); }
                if (conns.s) { g.moveTo(cx, cy); g.lineTo(cx + s_dx, cy + s_dy); }
                if (conns.e) { g.moveTo(cx, cy); g.lineTo(cx + e_dx, cy + e_dy); }
                if (conns.w) { g.moveTo(cx, cy); g.lineTo(cx + w_dx, cy + w_dy); }
                g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
                g.circle(cx, cy, width / 2.2).fill({ color: color, alpha });
            }
        };

        // 1. Base
        if (road.isBridge) {
            // On ne dessine les piliers qu'en mode High ou Normal, pas en Low
            drawLine(baseWidth + 4, 0x5D4037, 1);
            if (isHigh) {
                g.beginFill(0x5D4037);
                g.drawRect(cx - 4, cy, 8, 15);
                g.endFill();
            }
        }
        drawLine(baseWidth, baseColor, 1);

        // 2. Détails (Marquage au sol) - SEULEMENT EN HIGH DETAIL
        if (isHigh) {
            if (road.type === RoadType.HIGHWAY) drawLine(2, 0xFFFFFF, 1);
            else if (road.type === RoadType.AVENUE) drawLine(baseWidth * 0.8, 0x00FF00, 0.2);
            else if (road.type === RoadType.ASPHALT) g.circle(cx, cy, 2).fill({ color: 0xFFD700 });
        }
    }

    // ✅ LOD APPLIQUÉ AUX BÂTIMENTS
    private static drawBuilding(g: PIXI.Graphics, building: BuildingData, cx: number, cy: number, isHigh: boolean, isLow: boolean) {
        const bHeight = building.level * 8 + 5;
        const bWidth = TILE_WIDTH * 0.5;
        const bColor = ZONE_COLORS[building.type] || 0xFFFFFF;

        if (building.state === 'CONSTRUCTION') {
            // En Low, juste un carré jaune
            if (isLow) {
                g.rect(cx - bWidth / 2, cy - bHeight / 2, bWidth, bHeight / 2).fill({ color: 0xAAAA00 });
            } else {
                g.stroke({ width: 2, color: 0xFFFF00 });
                g.rect(cx - bWidth / 2, cy - bHeight / 2, bWidth, bHeight / 2).stroke();
            }
        } else {
            // Volume
            g.beginPath();
            g.rect(cx - bWidth / 2, cy - bHeight, bWidth, bHeight);
            g.fill({ color: bColor });

            // Les contours blancs des bâtiments coûtent cher en GPU
            // On ne les dessine qu'en mode Normal ou High
            if (!isLow) {
                g.stroke({ width: 1, color: 0xFFFFFF });
            }

            // En mode High, on pourrait ajouter des fenêtres ici
            if (isHigh && building.level > 1) {
                g.rect(cx - 2, cy - bHeight + 4, 4, 4).fill({ color: 0x000000, alpha: 0.5 }); // Fenêtre fake
            }
        }
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean, zoomLevel: number) {
        g.clear();

        // LOD sur les véhicules : Si très loin, on les cache ou on fait des petits points
        const isLow = zoomLevel < LOD_THRESHOLD_LOW;

        if (engine.vehicles && !isLow) {
            engine.vehicles.forEach(car => {
                const screenPos = gridToScreen(car.x, car.y);
                const offX = car.offsetX || 0;
                const offY = car.offsetY || 0;
                // Si zoom moyen, simple rond. Si zoom high, on pourrait dessiner un sprite.
                g.circle(screenPos.x + offX * TILE_WIDTH, screenPos.y + offY * TILE_HEIGHT, 3).fill({ color: car.color || 0xFFFFFF });
            });
        }

        // Le curseur et le preview doivent toujours être visibles
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