import { MapEngine } from './MapEngine';
import { TrafficSystem } from './systems/TrafficSystem';
import { BuildingSystem } from './systems/BuildingSystem';
import { PopulationManager } from './systems/PopulationManager';
import { NeedsCalculator } from './systems/NeedsCalculator';
import { JobSystem } from './systems/JobSystem';
import { ResourceSystem } from './systems/ResourceSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { FAKE_WALLET_ADDRESS } from './constants'; // ✅ Import Fake Wallet
import { BUILDING_SPECS } from './types';
// ✅ ECS Imports
// ✅ ECS Imports
// ECS logic moved to InteractionSystem

// Singleton pour éviter les re-créations lors du Hot Reload
const globalForGame = globalThis as unknown as { gameEngine: GameEngine | undefined };

export class GameEngine {
    public map: MapEngine;
    public isPaused: boolean = false;
    public speed: number = 1; // 1x, 2x, 4x
    private tickCount: number = 0;

    // ✅ NOUVEAU : Persistance de la caméra
    public lastCameraPosition: { x: number, y: number } | null = null;
    public lastZoom: number = 1.0;

    constructor() {
        console.log("🚀 GameEngine: Démarrage...");
        this.map = new MapEngine();
        this.map.generateWorld(FAKE_WALLET_ADDRESS); // ✅ Seed Injection

        // Initialize population tracking
        PopulationManager.initialize(this.map);
    }

    // ✅ NOUVEAU : Méthode pour sauver l'état
    public saveCameraState(x: number, y: number, zoom: number) {
        this.lastCameraPosition = { x, y };
        this.lastZoom = zoom;
    }

    public togglePause() { this.isPaused = !this.isPaused; }
    public setSpeed(s: number) { this.speed = s; }

    // ✅ Nouvelle méthode de simulation (1 pas de temps)
    public simulationStep() {
        // 1. TRAFIC (Vite)
        TrafficSystem.update(this.map);

        // 2. POPULATION & NEEDS (Every 30 ticks)
        if (this.tickCount % 30 === 0) {
            const population = PopulationManager.getTotalPopulation();
            const jobs = PopulationManager.getTotalJobs();
            const capacity = PopulationManager.getProductionCapacity();

            this.map.stats.population = population;
            this.map.stats.jobs = jobs; // ✅ Fix: Update stats for UI

            let workerEfficiency = 0;
            if (jobs > 0) {
                workerEfficiency = Math.min(1.0, this.map.stats.workers / jobs);
            } else {

                workerEfficiency = 1.0;
            }

            // PRODUCTION RÉELLE
            this.map.stats.water.produced = Math.floor(capacity.water * workerEfficiency);
            this.map.stats.energy.produced = Math.floor(capacity.energy * workerEfficiency);
            this.map.stats.food.produced = Math.floor(capacity.food * workerEfficiency);

            const needs = NeedsCalculator.calculateNeeds(population);
            this.map.stats.needs = needs;
        }

        // 3. EVOLUTION DES BATIMENTS (Nouveau)
        BuildingSystem.update(this.map, this.tickCount);

        // 4. JOBS (Nouveau JobSystem)
        if (this.tickCount % 10 === 0) {
            JobSystem.update(this.map);
        }

        // 5. RESSOURCES (Mining / Oil) - Update every second (60 ticks)
        if (this.tickCount % 60 === 0) {
            ResourceSystem.update(this.map);
            this.map.calculateSummary(); // Also update visual map summary
        }

        this.tickCount++;
    }

    public tick() {
        if (this.isPaused) return;

        // On exécute la boucle X fois selon la vitesse
        for (let i = 0; i < this.speed; i++) {
            this.simulationStep();
        }
    }

    public handleInteraction(index: number, mode: string, path: number[] | null, type: any) {
        InteractionSystem.handleInteraction(this.map, index, mode, path, type);
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
            biome: this.map.biomes[index], // ✅ Renvoie l'enum (number) pour traduction côté UI
            elevation: this.map.heightMap[index],
        };

        // Infos Ressources (regroupées dans un objet 'resources')
        const resources: any = {};

        if (this.map.resourceMaps) {
            // Ressources minérales
            if (this.map.resourceMaps.oil && this.map.resourceMaps.oil[index] > 0)
                resources.oil = this.map.resourceMaps.oil[index];
            if (this.map.resourceMaps.coal && this.map.resourceMaps.coal[index] > 0)
                resources.coal = this.map.resourceMaps.coal[index];
            if (this.map.resourceMaps.iron && this.map.resourceMaps.iron[index] > 0)
                resources.iron = this.map.resourceMaps.iron[index];
            if (this.map.resourceMaps.wood && this.map.resourceMaps.wood[index] > 0)
                resources.wood = this.map.resourceMaps.wood[index];

            // ✅ Nouvelles ressources
            if (this.map.resourceMaps.gold && this.map.resourceMaps.gold[index] > 0)
                resources.gold = this.map.resourceMaps.gold[index];
            if (this.map.resourceMaps.silver && this.map.resourceMaps.silver[index] > 0)
                resources.silver = this.map.resourceMaps.silver[index];
            if (this.map.resourceMaps.stone && this.map.resourceMaps.stone[index] > 0)
                resources.stone = this.map.resourceMaps.stone[index];

            // ✅ Ressources vivantes (gibier et poisson)
            if (this.map.resourceMaps.animals && this.map.resourceMaps.animals[index] > 0)
                resources.gibier = this.map.resourceMaps.animals[index];
            if (this.map.resourceMaps.fish && this.map.resourceMaps.fish[index] > 0)
                resources.poisson = this.map.resourceMaps.fish[index];
        }

        // Ajouter les ressources seulement si au moins une existe
        if (Object.keys(resources).length > 0) {
            info.resources = resources;
        }



        // ... (existing imports)

        // Infos Bâtiments / Routes
        if (this.map.buildingLayer[index]) {
            const b = this.map.buildingLayer[index];
            const specs = BUILDING_SPECS[b.type];
            // On enrichit l'objet pour l'UI (qui a besoin de production / workersNeeded)
            info.building = {
                ...b,
                production: specs?.production,
                workersNeeded: specs?.workersNeeded
            };
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