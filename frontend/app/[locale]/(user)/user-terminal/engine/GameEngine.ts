import { MapEngine } from './MapEngine';
import { TrafficSystem } from './systems/TrafficSystem';
import { RoadManager } from './RoadManager';
import { ZoneType } from './types';
import { ResourceRenderer } from './ResourceRenderer';
// Singleton pour éviter les re-créations lors du Hot Reload
const globalForGame = globalThis as unknown as { gameEngine: GameEngine | undefined };

export class GameEngine {
    public map: MapEngine;
    public isPaused: boolean = false;
    private tickCount: number = 0;

    constructor() {
        console.log("🚀 GameEngine: Démarrage...");
        this.map = new MapEngine();
        this.map.generateWorld();
    }

    public tick() {
        if (this.isPaused) return;

        // 1. TRAFIC (Vite)
        TrafficSystem.update(this.map);

        // 2. BÂTIMENTS (Moyen)
        // if (this.tickCount % 10 === 0) BuildingSystem.update(this.map);

        // 3. RESSOURCES (Lent)
        if (this.tickCount % 60 === 0) this.map.calculateSummary();

        this.tickCount++;
    }

    public handleInteraction(index: number, mode: string, path: number[] | null, type: any) {

        // --- CONSTRUCTION ROUTE (Drag & Drop) ---
        if (mode === 'BUILD_ROAD' && path && path.length > 0) {
            const { cost, valid } = RoadManager.calculateCost(this.map, path, type);

            // Vérification Argent
            if (this.map.resources.money >= cost) {
                this.map.resources.money -= cost;

                path.forEach(idx => {
                    // 1. AUTO-BULLDOZER (Nettoyage)
                    if (this.map.buildingLayer[idx]) {
                        this.map.buildingLayer[idx] = null;
                    }
                    if (this.map.zoningLayer[idx] !== ZoneType.NONE) {
                        this.map.zoningLayer[idx] = ZoneType.NONE;
                    }

                    // 2. POSE DE LA ROUTE
                    const existing = this.map.roadLayer[idx];
                    if (!existing || existing.type !== type) {
                        const isWater = this.map.getLayer(1)[idx] > 0.3; // 1 = Elevation/Water layer usually
                        const roadData = RoadManager.createRoad(type, isWater, false);

                        this.map.placeRoad(idx, roadData);

                        // 3. IMPACT ENVIRONNEMENT & PATHFINDING
                        RoadManager.applyEnvironmentalImpact(this.map, idx);
                        RoadManager.updateConnections(this.map, idx);
                        // ✅ SUPPRESSION VISUELLE DE L'ARBRE (AJOUT CRUCIAL ICI)
                        ResourceRenderer.removeResourceAt(idx);
                    }
                });

                this.map.calculateSummary();
                this.map.revision++;
            }
        }

        // --- BULLDOZER ---
        else if (mode === 'BULLDOZER') {
            const idx = index;

            if (this.map.roadLayer[idx]) {
                this.map.removeRoad(idx);
                this.map.resources.money += 5; // Remboursement partiel
                RoadManager.updateConnections(this.map, idx); // Update voisins + Pathfinding
            }
            if (this.map.buildingLayer[idx]) {
                this.map.buildingLayer[idx] = null;
                this.map.revision++;
            }
            if (this.map.zoningLayer[idx] !== ZoneType.NONE) {
                this.map.zoningLayer[idx] = ZoneType.NONE;
                this.map.revision++;
            }
        }

        // --- ZONAGE ---
        else if (mode === 'ZONE') {
            const cost = 10;
            if (this.map.resources.money >= cost) {
                this.map.setZone(index, type);
                this.map.resources.money -= cost;
                this.map.revision++;
            }
        }
    }

    // --- Helpers UI ---
    public getStats() { return this.map.stats; }
    public getResources() { return this.map.resources; }

    /**
     * Récupère les infos d'une tuile pour le Tooltip UI
     */
    public getResourceAtTile(index: number, viewMode: string): any {
        if (!this.map || index < 0 || index >= this.map.config.size * this.map.config.size) {
            return null;
        }

        const info: any = {
            biome: this.map.biomes[index],
            elevation: this.map.heightMap[index],
        };

        // Infos Ressources
        if (this.map.resourceMaps) {
            if (this.map.resourceMaps.oil && this.map.resourceMaps.oil[index] > 0) info.oil = this.map.resourceMaps.oil[index];
            if (this.map.resourceMaps.coal && this.map.resourceMaps.coal[index] > 0) info.coal = this.map.resourceMaps.coal[index];
            if (this.map.resourceMaps.iron && this.map.resourceMaps.iron[index] > 0) info.iron = this.map.resourceMaps.iron[index];
            if (this.map.resourceMaps.wood && this.map.resourceMaps.wood[index] > 0) info.wood = this.map.resourceMaps.wood[index];
        }

        // Infos Bâtiments / Routes
        if (this.map.buildingLayer[index]) {
            info.building = this.map.buildingLayer[index];
        }
        if (this.map.roadLayer[index]) {
            info.road = this.map.roadLayer[index];
        }

        // Infos Zones
        if (this.map.zoningLayer[index]) {
            info.zone = this.map.zoningLayer[index];
        }

        return info;
    }

    public spawnTraffic() {
        TrafficSystem.spawnVehicle(this.map);
    }
}

export function getGameEngine(): GameEngine {
    if (!globalForGame.gameEngine) globalForGame.gameEngine = new GameEngine();
    return globalForGame.gameEngine;
}