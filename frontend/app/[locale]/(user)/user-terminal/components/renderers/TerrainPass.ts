import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { TerrainTilemap } from '../TerrainTilemap';

// Singleton
const terrainTilemap = new TerrainTilemap();

/**
 * TerrainPass — Gère le tilemap de terrain (sol, biomes)
 * Responsabilité unique : rendu du sol isométrique via TerrainTilemap
 */
export class TerrainPass {

    static render(container: PIXI.Container, engine: MapEngine, viewMode: string) {
        terrainTilemap.render(engine, viewMode);
        const tilemapContainer = terrainTilemap.getContainer();
        tilemapContainer.zIndex = 0;
        if (tilemapContainer.parent !== container) {
            container.addChild(tilemapContainer);
        }
    }

    static clear() {
        terrainTilemap.clear();
    }
}
