import { MapEngine } from './MapEngine';
import { TrafficSystem } from './systems/TrafficSystem';
import { RoadManager } from './RoadManager';
import { ZoneType } from './types';

// Singleton
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
                        const isWater = this.map.getLayer(1)[idx] > 0.3;
                        const roadData = RoadManager.createRoad(type, isWater, false);

                        this.map.placeRoad(idx, roadData);

                        // 3. IMPACT ENVIRONNEMENT & PATHFINDING
                        RoadManager.applyEnvironmentalImpact(this.map, idx);
                        RoadManager.updateConnections(this.map, idx);
                    }
                });

                this.map.calculateSummary();
                this.map.revision++;
            }
        }

        // --- BULLDOZER ---
        else if (mode === 'BULLDOZER') {
            const idx = index; // Ici index est simple
            // Si c'est un path (drag bulldozer), il faudrait une boucle, mais restons simple pour l'instant

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

    // Helpers UI
    public getStats() { return this.map.stats; }
    public getResources() { return this.map.resources; }

    // Pour l'input
    public spawnTraffic() {
        TrafficSystem.spawnVehicle(this.map);
    }
}

export function getGameEngine(): GameEngine {
    if (!globalForGame.gameEngine) globalForGame.gameEngine = new GameEngine();
    return globalForGame.gameEngine;
}