import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { BuildingType } from '../engine/types';
import { ResourceAssets } from '../engine/ResourceAssets';
import { WorkerRenderer } from '../engine/WorkerRenderer';
import { RawResourceIconRenderer } from '../engine/RawResourceIconRenderer';

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
        zoomLevel: number,
        activeResourceLayer?: string | null,
    ): boolean {
        // Sécurité
        if (container.destroyed || g.destroyed) return false;
        if (!ResourceAssets.isReady || ResourceAssets.forestFrames.length === 0) return false;

        container.sortableChildren = true;
        g.clear();
        if (!engine || !engine.biomes) return false;

        // Récupération dynamique des couches Z-Order créées dans UserTerminalClient
        const terrainLayer = (container.getChildByLabel('terrainContainer') as PIXI.Container) || container;
        const roadLayer = (container.getChildByLabel('roadContainer') as PIXI.Container) || container;
        const vehicleLayer = (container.getChildByLabel('vehicleContainer') as PIXI.Container) || container;
        const resourceLayer = (container.getChildByLabel('resourceContainer') as PIXI.Container) || container;
        const buildingLayer = (container.getChildByLabel('buildingContainer') as PIXI.Container) || container;
        const zoneLayer = (container.getChildByLabel('zoneContainer') as PIXI.Graphics);

        if (zoneLayer) {
            zoneLayer.clear();
        }

        // Rendu réparti dans les conteneurs spécialisés
        TerrainPass.render(terrainLayer, engine, viewMode);  // Sol -> terrainContainer (zIndex 0)
        RoadPass.render(roadLayer, engine);                  // Routes -> roadContainer (zIndex 20)
        EntityPass.render(container, g, engine, viewMode, showGrid, zoomLevel); // Reste (Bâtiments, Arbres, Zones)
        BorderPass.render(g);                                // Frontière brillante -> vectorLayer (zIndex 150)
        WorkerRenderer.render(buildingLayer);                // Workers -> buildingContainer (Pour tri Z-Index avec Bâtiments)

        // ✅ Icônes ressources souterraines (actif seulement quand DataLayer 'resource' on)
        RawResourceIconRenderer.render(resourceLayer, engine, activeResourceLayer ?? null);

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