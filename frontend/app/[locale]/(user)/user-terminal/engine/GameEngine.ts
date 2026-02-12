import { MapEngine } from './MapEngine';
import { TrafficSystem } from './systems/TrafficSystem';
import { RoadManager } from './RoadManager';
import { BuildingManager } from './BuildingManager';
import { BuildingSystem } from './systems/BuildingSystem';
import { ZoneManager } from './ZoneManager';
import { ZoneType, BuildingType, BUILDING_SPECS, getBiomeName } from './types';
import { ResourceRenderer } from './ResourceRenderer';
import { PopulationManager } from './systems/PopulationManager';
import { NeedsCalculator } from './systems/NeedsCalculator';
// Singleton pour éviter les re-créations lors du Hot Reload
const globalForGame = globalThis as unknown as { gameEngine: GameEngine | undefined };

export class GameEngine {
    public map: MapEngine;
    public isPaused: boolean = false;
    public speed: number = 1; // 1x, 2x, 4x
    private tickCount: number = 0;

    constructor() {
        console.log("🚀 GameEngine: Démarrage...");
        this.map = new MapEngine();
        this.map.generateWorld();

        // Initialize population tracking
        PopulationManager.initialize(this.map);
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
            this.map.stats.jobs = jobs;
            this.map.stats.workers = Math.floor(population * 0.6);
            this.map.stats.unemployed = Math.max(0, this.map.stats.workers - jobs);

            // EFFICACITÉ GLOBALE (Ratio Travailleurs / Jobs)
            // Si jobs > 0, ratio = workers / jobs (max 1.0)
            // Si jobs = 0, ratio = 0 (ou 1 si on veut être gentil au début ?)
            // Disons que si jobs = 0, pas d'industrie donc pas de prod
            let workerEfficiency = 0;
            if (jobs > 0) {
                workerEfficiency = Math.min(1.0, this.map.stats.workers / jobs);
            } else {
                // Si aucun job n'est demandé, on assume que tout fonctionne (ex: éolienne sans worker needed)
                // Mais ici nos bâtiments demandent des workers.
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

        // 4. JOBS (Nouveau stub)
        // JobSystem.update(this.map); // Peut être décommenté quand implémenté

        // 5. RESSOURCES (Lent)
        if (this.tickCount % 60 === 0) this.map.calculateSummary();

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

        // --- CONSTRUCTION ROUTE (Drag & Drop) ---
        if (mode === 'BUILD_ROAD' && path && path.length > 0) {
            const { cost, valid } = RoadManager.calculateCost(this.map, path, type);

            // Vérification Argent
            if (this.map.resources.money >= cost) {
                this.map.resources.money -= cost;

                path.forEach(idx => {
                    // 1. AUTO-BULLDOZER (Nettoyage)
                    if (this.map.buildingLayer[idx]) {
                        const building = this.map.buildingLayer[idx];
                        if (building) {
                            const specs = BUILDING_SPECS[building.type];
                            if (specs) {
                                PopulationManager.onBuildingRemoved(specs);
                            }
                        }
                        this.map.buildingLayer[idx] = null;
                    }
                    if (this.map.zoningLayer[idx] !== null) {
                        const zoneData = this.map.zoningLayer[idx];
                        if (zoneData) {
                            PopulationManager.onZoneRemoved(zoneData);
                        }
                        this.map.zoningLayer[idx] = null;
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
                const building = this.map.buildingLayer[idx];
                if (building) {
                    const specs = BUILDING_SPECS[building.type];
                    if (specs) {
                        PopulationManager.onBuildingRemoved(specs);
                    }
                }
                this.map.buildingLayer[idx] = null;
                this.map.revision++;
            }
            if (this.map.zoningLayer[idx] !== null) {
                const zoneData = this.map.zoningLayer[idx];
                if (zoneData) {
                    PopulationManager.onZoneRemoved(zoneData);
                }
                this.map.zoningLayer[idx] = null;
                this.map.revision++;
            }
        }

        // --- ZONAGE ---
        else if (mode === 'ZONE') {
            const result = ZoneManager.placeZone(this.map, index, type);

            if (result.success) {
                if (result.zoneData) {
                    PopulationManager.onZonePlaced(result.zoneData);
                }
                console.log(`✅ Zone ${type} créée avec succès!`);
            } else {
                console.error(`❌ Zonage impossible: ${result.message}`);
            }
        }

        // --- CONSTRUCTION BUILDING ---
        else if (mode.startsWith('BUILD_')) {
            const buildingTypeStr = mode.replace('BUILD_', '');
            const buildingType = buildingTypeStr as BuildingType;

            // Validation du type de bâtiment
            if (!Object.values(BuildingType).includes(buildingType)) {
                console.error(`❌ Type de bâtiment invalide: ${buildingTypeStr}`);
                return;
            }

            // Tentative de placement
            const result = BuildingManager.placeBuilding(this.map, index, buildingType);

            if (result.success) {
                const specs = BUILDING_SPECS[buildingType];
                console.log(`✅ ${specs.name} construit avec succès!`);
            } else {
                console.error(`❌ Construction impossible: ${result.message}`);
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
            biome: getBiomeName(this.map.biomes[index]), // ✅ Nom lisible au lieu du numéro
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