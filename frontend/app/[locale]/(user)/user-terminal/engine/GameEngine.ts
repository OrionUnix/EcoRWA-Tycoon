import { MapEngine, getMapEngine, regenerateWorld } from './MapEngine';
import { RoadSystem } from './systems/RoadSystem';
import { ZoneSystem } from './systems/ZoneSystem';
import { BuildingSystem } from './systems/BuildingSystem';
import { RoadManager } from './RoadManager';
import { RoadType, ZoneType, LayerType, PlayerResources, CityStats, ResourceSummary } from './types';

/**
 * GameEngine - Orchestrateur Principal
 * 
 * Ce fichier est le "cerveau" du jeu. Il:
 * - Initialise et possède le MapEngine
 * - Délègue les actions aux systèmes spécialisés
 * - Expose une API simple pour GameCanvas.tsx
 */
export class GameEngine {
    private mapEngine: MapEngine;

    constructor() {
        this.mapEngine = getMapEngine();
    }

    // ===========================
    // === GETTERS POUR L'UI ===
    // ===========================

    get revision(): number {
        return this.mapEngine.revision;
    }

    get resources(): PlayerResources {
        return this.mapEngine.resources;
    }

    get stats(): CityStats {
        return this.mapEngine.stats;
    }

    get summary(): ResourceSummary {
        return this.mapEngine.currentSummary;
    }

    get roadLayer() {
        return this.mapEngine.roadLayer;
    }

    get zoningLayer() {
        return this.mapEngine.zoningLayer;
    }

    get buildingLayer() {
        return this.mapEngine.buildingLayer;
    }

    get vehicles() {
        return this.mapEngine.vehicles;
    }

    get biomes() {
        return this.mapEngine.biomes;
    }

    get heightMap() {
        return this.mapEngine.heightMap;
    }

    get resourceMaps() {
        return this.mapEngine.resourceMaps;
    }

    get config() {
        return this.mapEngine.config;
    }

    getLayer(layer: LayerType): Float32Array {
        return this.mapEngine.getLayer(layer);
    }

    // ===========================
    // === ACTIONS DU JOUEUR ===
    // ===========================

    /**
     * Construit des routes sur un chemin
     * @param path - Liste d'indices de tuiles
     * @param roadType - Type de route à construire
     * @returns Coût total de la construction
     */
    handleBuildRoad(path: number[], roadType: RoadType): number {
        let totalCost = 0;

        for (const index of path) {
            const success = RoadSystem.buildRoad(
                index,
                roadType,
                this.mapEngine.roadLayer,
                this.mapEngine.roadGraph,
                this.mapEngine.zoningLayer,
                this.mapEngine.buildingLayer,
                this.mapEngine.getLayer(LayerType.WATER),
                this.mapEngine.heightMap
            );

            if (success) {
                // Appliquer l'impact environnemental
                RoadManager.applyEnvironmentalImpact(this.mapEngine, index);
            }
        }

        this.mapEngine.revision++;
        return totalCost;
    }

    /**
     * Définit des zones sur un chemin
     * @param path - Liste d'indices de tuiles
     * @param zoneType - Type de zone
     */
    handleSetZone(path: number[], zoneType: ZoneType): void {
        for (const index of path) {
            ZoneSystem.setZone(
                index,
                zoneType,
                this.mapEngine.zoningLayer,
                this.mapEngine.buildingLayer,
                this.mapEngine.roadLayer,
                this.mapEngine.getLayer(LayerType.WATER)
            );
        }
    }

    /**
     * Bulldoze (supprime routes et zones) sur un chemin
     */
    handleBulldoze(path: number[]): void {
        for (const index of path) {
            // Supprimer la route via RoadSystem
            RoadSystem.removeRoad(
                index,
                this.mapEngine.roadLayer,
                this.mapEngine.roadGraph
            );

            // Supprimer la zone via ZoneSystem
            ZoneSystem.removeZone(
                index,
                this.mapEngine.zoningLayer,
                this.mapEngine.buildingLayer
            );
        }
        this.mapEngine.revision++;
    }

    /**
     * Vérifie si un chemin de construction est valide
     * @returns { valid: boolean, cost: number }
     */
    validateBuildPath(path: number[]): { valid: boolean; cost: number } {
        let totalCost = 0;
        let isValid = true;

        for (const index of path) {
            const check = RoadManager.checkTile(this.mapEngine, index, null);
            if (!check.valid) {
                isValid = false;
            }
            totalCost += check.cost;
        }

        return { valid: isValid, cost: totalCost };
    }

    /**
     * Génère un chemin de preview pour le drag-to-build
     */
    getPreviewPath(startX: number, startY: number, endX: number, endY: number): number[] {
        return RoadManager.getPreviewPath(startX, startY, endX, endY);
    }

    // ===========================
    // === SIMULATION ===
    // ===========================

    /**
     * Exécute un tick de simulation
     */
    tick(): void {
        this.mapEngine.tick();

        // Simulation des bâtiments via BuildingSystem
        const buildingsChanged = BuildingSystem.updateBuildings(
            this.mapEngine.config,
            this.mapEngine.zoningLayer,
            this.mapEngine.buildingLayer,
            this.mapEngine.roadLayer,
            this.mapEngine.resources
        );

        if (buildingsChanged) {
            this.mapEngine.revision++;
        }

        // Calculer le trafic périodiquement (tous les 60 ticks)
        if (this.mapEngine.revision % 60 === 0) {
            RoadSystem.calculateTraffic(
                this.mapEngine.roadLayer,
                this.mapEngine.buildingLayer
            );
        }
    }

    /**
     * Fait apparaître des véhicules de test
     */
    spawnTraffic(count: number): boolean {
        return this.mapEngine.spawnTraffic(count);
    }

    /**
     * Régénère le monde
     */
    regenerate(): void {
        regenerateWorld();
        this.mapEngine.revision++;
    }

    /**
     * Obtient les statistiques de trafic
     */
    getTrafficStats() {
        return RoadSystem.getTrafficStats(this.mapEngine.roadLayer);
    }
}

// Singleton pour accès global
let gameEngineInstance: GameEngine | null = null;

export function getGameEngine(): GameEngine {
    if (!gameEngineInstance) {
        gameEngineInstance = new GameEngine();
    }
    return gameEngineInstance;
}
