import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { BuildingType } from '../engine/types';
import { ResourceAssets } from '../engine/ResourceAssets';
import { WorkerRenderer } from '../engine/WorkerRenderer';

// ═══════════════════════════════════════
// RENDER PASSES (Responsabilité unique)
// ═══════════════════════════════════════
import { TerrainPass } from './renderers/TerrainPass';
import { RoadPass } from './renderers/RoadPass';
import { EntityPass } from './renderers/EntityPass';
import { CursorPass } from './renderers/CursorPass';
import { BorderPass } from './renderers/BorderPass';

/**
 * GameRenderer — Chef d'orchestre du rendu
 * Délègue à des Passes spécialisées dans l'ordre Z correct.
 * Ne contient AUCUNE logique de dessin.
 */
export class GameRenderer {

    static renderStaticLayer(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ): boolean {
        // Sécurité
        if (container.destroyed || g.destroyed) return false;
        if (!ResourceAssets.isReady || ResourceAssets.forestFrames.length === 0) return false;

        container.sortableChildren = true;
        g.clear();
        if (!engine || !engine.biomes) return false;

        // Rendu dans l'ordre Z
        TerrainPass.render(container, engine, viewMode);    // z=0 : Sol
        RoadPass.render(container, engine);                  // z=0.5 : Routes
        EntityPass.render(container, g, engine, viewMode, showGrid, zoomLevel); // z=1+ : Entités
        BorderPass.render(g);                                // Frontière brillante
        WorkerRenderer.render(container, zoomLevel);         // z=2+ : Workers

        return true;
    }

    static renderDynamicLayer(
        g: PIXI.Graphics,
        engine: MapEngine,
        cursorPos: { x: number; y: number },
        previewPath: number[],
        currentMode: string,
        isValidBuild: boolean,
        zoomLevel: number,
        buildingType?: BuildingType
    ) {
        CursorPass.render(g, engine, cursorPos, previewPath, currentMode, isValidBuild, zoomLevel, buildingType);
    }
}

/**
 * Reset complet du rendu (appelé lors de la régénération du monde)
 */
export const resetGameRenderer = () => {
    TerrainPass.clear();
    RoadPass.clear();
    WorkerRenderer.clear();
};