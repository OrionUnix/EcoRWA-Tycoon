import { MapEngine, getMapEngine, resetMapEngine } from './MapEngine';
import { TrafficSystem } from './systems/TrafficSystem';
import { BuildingSystem } from './systems/BuildingSystem';
import { PopulationManager } from './systems/PopulationManager';
import { NeedsCalculator } from './systems/NeedsCalculator';
import { JobSystem } from './systems/JobSystem';
import { ResourceSystem } from './systems/ResourceSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { EconomySystem } from './systems/EconomySystem';
import { HappinessSystem } from './systems/HappinessSystem';
import { RWABuildingSpawner } from './RWABuildingSpawner'; // ✅ Bridge React↔PixiJS
import { SaveSystem } from './systems/SaveSystem';         // ✅ Sauvegarde persistante
import { BUILDING_SPECS, BuildingType } from './types';

// Singleton pour éviter les re-créations lors du Hot Reload
const globalForGame = globalThis as unknown as { gameEngine: GameEngine | undefined };

export class GameEngine {
    // ✅ [FIX ARCHITECTUREL] map est un GETTER DYNAMIQUE, pas une propriété stockée.
    // Toujours lire depuis le singleton getMapEngine() pour garantir que le renderer
    // voit la même instance que useGameBoot, même après un resetMapEngine().
    public get map(): MapEngine { return getMapEngine(); }
    public isPaused: boolean = false;
    public speed: number = 1; // 1x, 2x, 4x
    private tickCount: number = 0;

    // ✅ NOUVEAU : Timer d'économie basé sur le temps réel
    public economyTimer: number = 0;
    public readonly REAL_SECONDS_PER_GAME_HOUR = 10; // 10 secondes réelles = 1 heure de jeu = 1 versement

    // ✅ NOUVEAU : Persistance de la caméra
    public lastCameraPosition: { x: number, y: number } | null = null;
    public lastZoom: number = 1.0;
    public currentRwaPayload: any = null; // Payload pour le placement manuel RWA

    constructor() {
        console.log("🚀 GameEngine: Démarrage...");
        // ✅ NE PAS créer de new MapEngine() ici.
        // La carte est gérée par le singleton getMapEngine() + useGameBoot.
        // Le getter `map` ci-dessus garantit l'accès à la bonne instance.

        // Initialiser les systèmes qui dépendent de la map
        // (ils liront getMapEngine() au moment où ils en auront besoin)
        PopulationManager.initialize(getMapEngine());

        // ✅ Bridge React↔PixiJS : écoute les achats RWA pour spawner sur la map
        if (typeof window !== 'undefined') {
            RWABuildingSpawner.initialize(getMapEngine());

            // ═════════════════════════════════════════════════════════════════════
            // L'initialisation se fait désormais via le bouton "Jouer" (SIWE Auth)
            // dans UserTerminalClient.tsx. On ne charge plus automatiquement le local.
            // ═════════════════════════════════════════════════════════════════════
            // Initialize save system map reference
            SaveSystem.initialize(getMapEngine());
        }
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

        // (Economy est maintenant gérée dans tick() de façon tempo-réelle indépendante du frame rate)

        // 3. POPULATION & NEEDS (Every 30 ticks)
        if (this.tickCount % 30 === 0) {
            // ... (Population logic unchanged)
            const population = PopulationManager.getTotalPopulation();
            const jobs = PopulationManager.getTotalJobs();
            const capacity = PopulationManager.getProductionCapacity();

            this.map.stats.population = population;
            this.map.stats.jobs = jobs;

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

        // 4. EVOLUTION DES BATIMENTS
        BuildingSystem.update(this.map, this.tickCount);

        // 5. JOBS
        if (this.tickCount % 10 === 0) {
            JobSystem.update(this.map);
        }

        // ✅ HAPPINESS & INFLUENCE (Every 30 ticks, same as population)
        if (this.tickCount % 30 === 0) {
            HappinessSystem.update(this.map);
        }

        // 6. RESSOURCES
        if (this.tickCount % 60 === 0) {
            ResourceSystem.update(this.map);
            this.map.calculateSummary();
        }

        this.tickCount++;
    }

    public tick(deltaSec: number = 0) {
        if (this.isPaused) return;

        // ✅ GESTION ÉCONOMIQUE SUR LE TEMPS RÉEL
        // Le temps avance proportionnellement à la vitesse du jeu
        this.economyTimer += deltaSec * this.speed;

        if (this.economyTimer >= this.REAL_SECONDS_PER_GAME_HOUR) {
            EconomySystem.update(this.map);
            this.economyTimer -= this.REAL_SECONDS_PER_GAME_HOUR;
        }

        // ✅ SIMULATION DES AUTRES SYSTÈMES (Trafic, Évolution...)
        // On exécute la boucle X fois selon la vitesse
        for (let i = 0; i < this.speed; i++) {
            this.simulationStep();
        }
    }

    public handleInteraction(index: number, mode: string, path: number[] | null, type: any): { success: boolean, placedType?: string } {
        return InteractionSystem.handleInteraction(this.map, index, mode, path, type);
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

        // Infos Ressources (regroupées dans un objet 'resources')
        const resources: any = {};

        if (this.map.resourceMaps) {
            // ✅ RESSOURCES (Surface & Sous-sol)
            // On mappe les clés techniques vers les clés d'affichage
            const MAP_TO_DISPLAY: Record<string, string> = {
                'oil': 'oil', 'coal': 'coal', 'iron': 'iron',
                'gold': 'gold', 'silver': 'silver', 'stone': 'stone',
                'wood': 'wood', 'animals': 'gibier', 'fish': 'fish'
            };

            for (const [mapKey, displayKey] of Object.entries(MAP_TO_DISPLAY)) {
                // @ts-ignore
                if (this.map.resourceMaps[mapKey] && this.map.resourceMaps[mapKey][index] > 0) {
                    // @ts-ignore
                    resources[displayKey] = this.map.resourceMaps[mapKey][index];
                }
            }
        }

        // Ajouter les ressources seulement si au moins une existe
        if (Object.keys(resources).length > 0) {
            info.resources = resources;
        }

        // Infos Bâtiments / Routes
        if (this.map.buildingLayer[index]) {
            const b = this.map.buildingLayer[index];
            const specs = BUILDING_SPECS[b.type];
            // On enrichit l'objet pour l'UI
            info.building = {
                ...b,
                production: specs?.production,
                workersNeeded: specs?.workersNeeded,
                maintenance: specs?.maintenance, // ✅ Cout Entretien
                activeContracts: b.activeContracts // ✅ Contrats (Marché)
            };
        }
        if (this.map.roadLayer[index]) {
            info.road = this.map.roadLayer[index];
        }

        // Infos Zones
        if (this.map.zoningLayer[index]) {
            const z = this.map.zoningLayer[index];
            const tax = EconomySystem.getTaxEstimate(z);

            // ✅ DONNÉES RÉSIDENTIELLES DÉTAILLÉES
            let residentialInfo = null;
            if (z.type === 'RESIDENTIAL' && this.map.buildingLayer[index]) {
                const b = this.map.buildingLayer[index];
                const maxPop = PopulationManager.getCapacityForLevel(z.type, z.level);

                // Calcul Emploi
                // Si le flag NO_JOBS est présent, on estime que 50% sont au chômage (simulation)
                // Sinon 100% emploi
                const hasJobIssue = (b.statusFlags & 8) !== 0; // 8 = NO_JOBS
                const employed = hasJobIssue ? Math.floor(z.population * 0.5) : z.population;

                residentialInfo = {
                    maxPop,
                    employed,
                    unemployed: z.population - employed,
                    needs: {
                        water: (b.statusFlags & 1) === 0, // 1 = NO_WATER
                        power: (b.statusFlags & 2) === 0, // 2 = NO_POWER
                        food: (b.statusFlags & 4) === 0,  // 4 = NO_FOOD
                        jobs: !hasJobIssue,
                        goods: (b.statusFlags & 64) === 0 // 64 = NO_GOODS (Checking flag defined in types)
                    },
                    happiness: Math.floor(b.happiness)
                };
            }

            info.zone = {
                ...z,
                taxEstimate: tax,
                residential: residentialInfo // ✅ Attaché à l'objet zone
            };
        }

        // ... (Preview Yield logic unchanged)
        if (viewMode && viewMode.startsWith('BUILD_')) {
            const bType = viewMode.replace('BUILD_', '') as import('./types').BuildingType;
            if (Object.values(BUILDING_SPECS).some(s => s.type === bType)) {
                const { BuildingManager } = require('./BuildingManager');
                const yieldData = BuildingManager.calculatePotentialYield(this.map, index, bType);
                if (yieldData.amount > 0) {
                    info.potentialYield = yieldData;
                }
            }
        }

        return info;
    }

    public spawnTraffic() {
        TrafficSystem.spawnVehicle(this.map);
    }

    /**
     * Sauvegarde la ville sur le Cloud (Firestore)
     * @param address Adresse du wallet du joueur
     */
    public async saveCity(address: string) {
        if (!address) return;
        console.log("💾 [GameEngine] Sauvegarde manuelle demandée...");
        const result = await SaveSystem.saveToCloud(this.map, address);
        if (result) {
            SaveSystem.clearDirty();
        }
        return result;
    }

    /**
     * Réinitialise complètement l'état du moteur (ex: à la déconnexion)
     */
    public resetGame() {
        console.log("🧹 [GameEngine] Réinitialisation du jeu...");
        this.tickCount = 0;

        // Réinitialiser le singleton MapEngine (useGameBoot en créera un nouveau lors du prochain login)
        resetMapEngine();

        // Ré-initialiser les systèmes dépendants
        PopulationManager.initialize(getMapEngine());
        SaveSystem.initialize(getMapEngine());
        if (typeof window !== 'undefined') {
            RWABuildingSpawner.initialize(getMapEngine());
        }

        console.log("✨ [GameEngine] Jeu réinitialisé avec succès.");
    }
}

export function getGameEngine(): GameEngine {
    if (!globalForGame.gameEngine) globalForGame.gameEngine = new GameEngine();
    return globalForGame.gameEngine;
}