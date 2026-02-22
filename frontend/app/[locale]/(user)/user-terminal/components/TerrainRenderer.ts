import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { COLORS } from '../engine/constants';
import { LayerType } from '../engine/types';

export class TerrainRenderer {

    static drawOverlays(
        g: PIXI.Graphics,
        engine: MapEngine,
        biome: number,
        i: number,
        pos: { x: number, y: number },
        viewMode: string
    ) {
        // =================================================================
        // OVERLAYS (Calques Ressources + Simulation) - VECTORIEL
        // =================================================================
        if (viewMode === 'ALL' || viewMode === 'NAVIGATE') return;

        let overlayColor = -1;
        let overlayAlpha = 0.6;

        // ══════════════════════════════════════
        // SECTION 1: NATURAL RESOURCES (from resourceMaps)
        // ══════════════════════════════════════
        if ((viewMode === 'OIL' || viewMode === 'BUILD_OIL_PUMP' || viewMode === 'BUILD_OIL_RIG') && engine.resourceMaps.oil[i] > 0.1) {
            overlayColor = COLORS.OIL;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.oil[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'COAL' || viewMode === 'BUILD_MINE') && engine.resourceMaps.coal[i] > 0.1) {
            overlayColor = COLORS.COAL;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.coal[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'IRON' || viewMode === 'BUILD_MINE') && engine.resourceMaps.iron[i] > 0.1) {
            overlayColor = COLORS.IRON;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.iron[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'WOOD' || viewMode === 'BUILD_LUMBER_HUT') && engine.resourceMaps.wood[i] > 0.1) {
            overlayColor = COLORS.WOOD;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.wood[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'GOLD' || viewMode === 'BUILD_MINE') && engine.resourceMaps.gold[i] > 0.1) {
            overlayColor = COLORS.GOLD;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.gold[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'SILVER' || viewMode === 'BUILD_MINE') && engine.resourceMaps.silver[i] > 0.1) {
            overlayColor = COLORS.SILVER;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.silver[i] * 0.6, 0.9);
        }
        else if ((viewMode === 'STONE' || viewMode === 'BUILD_MINE') && engine.resourceMaps.stone[i] > 0.1) {
            overlayColor = COLORS.STONE;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.stone[i] * 0.6, 0.9);
        }
        else if (viewMode === 'FOOD' && engine.resourceMaps.food[i] > 0.1) {
            overlayColor = COLORS.FOOD;
            overlayAlpha = Math.min(0.3 + engine.resourceMaps.food[i] * 0.6, 0.9);
        }
        // Animals (also used for Hunter Hut placement)
        else if ((viewMode === 'ANIMALS' || viewMode === 'BUILD_HUNTER_HUT') &&
            (engine.resourceMaps.animals[i] > 0.1 || biome === 4)) { // 4 = FOREST
            overlayColor = COLORS.ANIMALS;
            overlayAlpha = 0.5;
        }
        // Fish (also used for Fisherman placement)
        else if ((viewMode === 'FISH' || viewMode === 'BUILD_FISHERMAN') &&
            engine.resourceMaps.fish[i] > 0.1) {
            overlayColor = COLORS.FISH;
            overlayAlpha = 0.5;
        }

        // ══════════════════════════════════════
        // SECTION 2: SIMULATION LAYERS
        // ══════════════════════════════════════

        // WATER NETWORK — highlight tiles near water-producing buildings
        else if (viewMode === 'WATER_NET') {
            const hasWaterBuilding = TerrainRenderer.hasNearbyBuilding(engine, i, ['WATER_PUMP', 'WATER_TOWER']);
            if (hasWaterBuilding) {
                overlayColor = COLORS.WATER_NET;
                overlayAlpha = 0.45;
            }
        }

        // POWER NETWORK — highlight tiles near power-producing buildings
        else if (viewMode === 'POWER_NET') {
            const hasPowerBuilding = TerrainRenderer.hasNearbyBuilding(engine, i, ['COAL_PLANT', 'SOLAR_PLANT', 'WIND_TURBINE', 'OIL_PLANT']);
            if (hasPowerBuilding) {
                overlayColor = COLORS.POWER_NET;
                overlayAlpha = 0.45;
            }
        }

        // SEWAGE — highlight areas with high density (need sewage)
        else if (viewMode === 'SEWAGE') {
            const hasBuilding = engine.buildingLayer[i] !== null;
            if (hasBuilding) {
                overlayColor = COLORS.SEWAGE;
                overlayAlpha = 0.35;
            }
        }

        // POLLUTION — highlight industrial zones and high-traffic roads
        else if (viewMode === 'POLLUTION') {
            const building = engine.buildingLayer[i];
            const hasRoad = engine.roadLayer[i] !== null;
            const isIndustrial = engine.zoningLayer[i]?.type === 'INDUSTRIAL';

            if (isIndustrial || (building && (
                building.type.includes('MINE') ||
                building.type.includes('PLANT') ||
                building.type.includes('OIL')
            ))) {
                overlayColor = COLORS.POLLUTION;
                overlayAlpha = 0.6;
            } else if (hasRoad) {
                overlayColor = COLORS.POLLUTION;
                overlayAlpha = 0.2;
            }
        }

        // TRAFFIC — highlight roads, alpha based on density
        else if (viewMode === 'TRAFFIC') {
            const road = engine.roadLayer[i];
            if (road) {
                overlayColor = COLORS.TRAFFIC;
                overlayAlpha = 0.4;
            }
        }

        // HAPPINESS — green for residential zones, alpha varies by zone density
        else if (viewMode === 'HAPPINESS') {
            const zone = engine.zoningLayer[i];
            const building = engine.buildingLayer[i];
            if (zone?.type === 'RESIDENTIAL' || building) {
                overlayColor = COLORS.HAPPINESS;
                overlayAlpha = building ? 0.5 : 0.25;
            }
        }

        // JOBS — blue for commercial/industrial zones
        else if (viewMode === 'JOBS') {
            const zone = engine.zoningLayer[i];
            const isWorkzone = zone?.type === 'COMMERCIAL' || zone?.type === 'INDUSTRIAL';
            if (isWorkzone) {
                overlayColor = COLORS.JOBS;
                overlayAlpha = 0.45;
            }
        }

        // GROUNDWATER — natural water from the water layer
        else if (viewMode === 'WATER_LAYER' || viewMode === 'BUILD_WATER_PUMP') {
            const waterValue = engine.layers[LayerType.WATER]?.[i] || 0;
            if (waterValue > 0.05) {
                overlayColor = COLORS.WATER_LAYER;
                overlayAlpha = Math.min(0.2 + waterValue * 0.5, 0.7);
            }
        }

        // LAND VALUE — highlight developed areas (near roads, buildings)
        else if (viewMode === 'LAND_VALUE') {
            const hasRoad = engine.roadLayer[i] !== null;
            const hasBuilding = engine.buildingLayer[i] !== null;
            const hasZone = engine.zoningLayer[i] !== null;
            if (hasBuilding) {
                overlayColor = COLORS.LAND_VALUE;
                overlayAlpha = 0.55;
            } else if (hasRoad || hasZone) {
                overlayColor = COLORS.LAND_VALUE;
                overlayAlpha = 0.25;
            }
        }

        // RWA ECONOMY — highlight extraction and trade zones
        else if (viewMode === 'RWA_ECONOMY') {
            const building = engine.buildingLayer[i];
            if (building && (
                building.type.includes('MINE') ||
                building.type.includes('PUMP') ||
                building.type.includes('LUMBER') ||
                building.type.includes('HUNTER')
            )) {
                overlayColor = COLORS.RWA_ECONOMY;
                overlayAlpha = 0.55;
            }
        }

        // ══════════════════════════════════════
        // DRAW THE OVERLAY TILE
        // ══════════════════════════════════════
        if (overlayColor !== -1) {
            g.beginPath();
            g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
            g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
            g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
            g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
            g.closePath();
            g.fill({ color: overlayColor, alpha: overlayAlpha });
            g.stroke({ width: 1, color: overlayColor, alpha: Math.min(overlayAlpha + 0.2, 1.0) });
        }
    }

    // ═══════════════════════════════════════
    // HELPER: Check if a tile is near a specific building type (within radius)
    // ═══════════════════════════════════════
    private static hasNearbyBuilding(engine: MapEngine, cellIndex: number, buildingTypes: string[], radius: number = 12): boolean {
        const x = cellIndex % GRID_SIZE;
        const y = Math.floor(cellIndex / GRID_SIZE);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
                const ni = ny * GRID_SIZE + nx;
                const building = engine.buildingLayer[ni];
                if (building && buildingTypes.some(t => building.type.includes(t))) {
                    return true;
                }
            }
        }
        return false;
    }
}