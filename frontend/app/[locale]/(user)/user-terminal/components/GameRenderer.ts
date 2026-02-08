import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { ZoneType, ZONE_COLORS, BiomeType } from '../engine/types';
import { getBiomeTexture } from '../engine/BiomeAssets';

// ✅ IMPORT CORRECT DES FICHIERS QUE VOUS VENEZ DE CRÉER
import { RoadRenderer } from './RoadRenderer';
import { BuildingRenderer } from './BuildingRenderer';

export const COLORS = {
    DEEP_OCEAN: 0x000080, OCEAN: 0x29b6f6, BEACH: 0xffcc66,
    PLAINS: 0x81c784, PLAINS_VAR: 0x66bb6a,
    FOREST: 0x2e7d32, MOUNTAIN: 0x8d6e63,
    DESERT: 0xe6c288, SNOW: 0xffffff,
    GRID_LINES: 0x999999,
    HIGHLIGHT: 0xFFFFFF,
    ROAD_BRIDGE: 0x8B4513,
    ROAD_PREVIEW_VALID: 0x00FF00,
    ROAD_PREVIEW_INVALID: 0xFF0000,
    OIL: 0xffd700, COAL: 0x212121, IRON: 0xff5722, WOOD: 0x43a047,
    FOOD: 0xff3366
};

const LOD_THRESHOLD_LOW = 0.6;
const LOD_THRESHOLD_HIGH = 1.2;

const spriteCache = new Map<number, PIXI.Sprite>();

export class GameRenderer {

    static renderStaticLayer(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ) {
        g.clear();

        // ⚠️ Pas de g.rect() ici pour le fond, c'est géré par usePixiApp !

        if (!engine || !engine.biomes) return;

        const biomes = engine.biomes;
        const isHighDetail = zoomLevel > LOD_THRESHOLD_HIGH;
        const isLowDetail = zoomLevel < LOD_THRESHOLD_LOW;

        container.sortableChildren = true;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);
                const biome = biomes[i];

                // --- 1. TERRAIN (SPRITES) ---
                let hasSprite = false;

                if (viewMode === 'ALL' || true) {
                    let sprite = spriteCache.get(i);
                    if (!sprite) {
                        const texture = getBiomeTexture(biome, x, y);
                        if (texture) {
                            sprite = new PIXI.Sprite(texture);
                            // ANCRAGE STANDARD : Tout le monde au même niveau
                            sprite.anchor.set(0.5, 0.75);
                            sprite.width = TILE_WIDTH + 2;
                            const ratio = texture.height / texture.width;
                            sprite.height = sprite.width * ratio;
                            container.addChild(sprite);
                            spriteCache.set(i, sprite);
                        }
                    }

                    if (sprite) {
                        sprite.visible = true;
                        sprite.x = pos.x;
                        sprite.y = pos.y;
                        sprite.zIndex = x + y; // Tri par profondeur essentiel
                        hasSprite = true;
                    }
                } else {
                    const s = spriteCache.get(i);
                    if (s) s.visible = false;
                }

                // --- 2. FALLBACK (Si pas d'image) ---
                if (!hasSprite) {
                    let fillColor = 0xFF00FF;
                    if (biome === BiomeType.OCEAN) fillColor = COLORS.OCEAN;
                    else if (biome === BiomeType.DESERT) fillColor = COLORS.DESERT;
                    else if (biome === BiomeType.FOREST) fillColor = COLORS.FOREST;
                    else if (biome === BiomeType.PLAINS) fillColor = COLORS.PLAINS;
                    else if (biome === BiomeType.MOUNTAIN) fillColor = COLORS.MOUNTAIN;
                    else if (biome === BiomeType.BEACH) fillColor = COLORS.BEACH;
                    else if (biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.DEEP_OCEAN;
                    else if (biome === BiomeType.SNOW) fillColor = COLORS.SNOW;

                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.closePath();
                    g.fill({ color: fillColor });
                }

                // --- 3. OVERLAYS (Ressources) ---
                if (viewMode !== 'ALL') {
                    let overlayColor = -1;
                    if (viewMode === 'OIL' && engine.resourceMaps.oil[i] > 0.1) overlayColor = COLORS.OIL;
                    if (viewMode === 'COAL' && engine.resourceMaps.coal[i] > 0.1) overlayColor = COLORS.COAL;
                    if (viewMode === 'IRON' && engine.resourceMaps.iron[i] > 0.1) overlayColor = COLORS.IRON;
                    if (viewMode === 'WOOD' && engine.resourceMaps.wood[i] > 0.1) overlayColor = COLORS.WOOD;

                    if (overlayColor !== -1) {
                        g.beginPath();
                        g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                        g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                        g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                        g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                        g.closePath();
                        g.fill({ color: overlayColor, alpha: 0.6 });
                        g.stroke({ width: 2, color: overlayColor, alpha: 0.9 });
                    }
                }

                // --- 4. ROUTES & BATIMENTS ---

                // Grille
                if (showGrid && !isLowDetail) {
                    g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: 0.1 });
                }

                // Zones
                const zone = engine.zoningLayer[i];
                if (zone !== ZoneType.NONE) {
                    const zColor = ZONE_COLORS[zone] || 0xFF00FF;
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });
                }

                // ✅ APPEL AUX NOUVEAUX RENDERERS
                if (engine.roadLayer && engine.roadLayer[i]) {
                    RoadRenderer.drawTile(g, engine.roadLayer[i]!, pos.x, pos.y, isHighDetail, isLowDetail);
                }

                if (engine.buildingLayer && engine.buildingLayer[i]) {
                    BuildingRenderer.drawTile(g, engine.buildingLayer[i]!, pos.x, pos.y, isHighDetail, isLowDetail);
                }
            }
        }
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean, zoomLevel: number) {
        g.clear();

        // 1. VÉHICULES
        const isLow = zoomLevel < LOD_THRESHOLD_LOW;
        if (engine.vehicles && !isLow) {
            engine.vehicles.forEach(car => {
                const screenPos = gridToScreen(car.x, car.y);
                const offX = car.offsetX || 0;
                const offY = car.offsetY || 0;
                const px = screenPos.x + offX * TILE_WIDTH;
                const py = screenPos.y + offY * TILE_HEIGHT;

                g.rect(px - 3, py - 3, 6, 6).fill({ color: car.color || 0xFFFFFF });
            });
        }

        // 2. CURSEUR
        const hl = gridToScreen(cursorPos.x, cursorPos.y);
        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });

        // 3. PREVIEW
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);
                const color = isValidBuild ? COLORS.ROAD_PREVIEW_VALID : COLORS.ROAD_PREVIEW_INVALID;
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