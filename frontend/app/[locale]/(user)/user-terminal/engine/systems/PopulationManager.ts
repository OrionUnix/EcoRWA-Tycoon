import { MapEngine } from '../MapEngine';
import { ZoneType, ZoneData, BUILDING_SPECS } from '../types';

/**
 * PopulationManager - Event-driven population tracking system
 * 
 * Performance: O(1) for all operations (no iteration through zones)
 * Updates population cache only when zones are created/upgraded/removed
 */
export class PopulationManager {
    private static totalPopulation: number = 0;
    private static totalJobs: number = 0;

    // Capacités de production (Max théorique sans travailleurs)
    private static totalWaterCapacity: number = 0;
    private static totalEnergyCapacity: number = 0;
    private static totalFoodCapacity: number = 0;

    /**
     * Population per zone level for residential zones
     */
    private static readonly POPULATION_BY_LEVEL: Record<number, number> = {
        1: 4,  // Level 1: 4 Inhabitants -> 40$/h
        2: 10, // Level 2: 10 Inhabitants -> 100$/h
        3: 25, // Level 3: 25 Inhabitants -> 250$/h
        4: 60  // Level 4/High: 60 Inhabitants -> 600$/h
    };

    /**
     * Jobs per zone level for Commercial/Industrial
     */
    private static readonly JOBS_BY_LEVEL: Record<number, number> = {
        1: 5,
        2: 12,
        3: 30,
        4: 80
    };

    /**
     * Initialize the population manager by scanning existing zones
     * Called once when the game engine starts
     */
    public static initialize(engine: MapEngine): void {
        console.log('👥 PopulationManager: Initializing...');
        this.recalculateGlobalStats(engine);
    }

    /**
     * ✅ RECALCUL GLOBAL (Anti-ville fantôme)
     * Recalcule toutes les stats à partir des couches de données brutes
     */
    public static recalculateGlobalStats(engine: MapEngine): void {
        this.totalPopulation = 0;
        this.totalJobs = 0;
        this.totalWaterCapacity = 0;
        this.totalEnergyCapacity = 0;
        this.totalFoodCapacity = 0;

        // 1. Scan des zones (R/C/I)
        for (let i = 0; i < engine.zoningLayer.length; i++) {
            const zoneData = engine.zoningLayer[i];
            if (zoneData) {
                if (zoneData.type === ZoneType.RESIDENTIAL) {
                    // On recalcule la population basée sur le niveau actuel pour être sûr
                    const cap = this.getCapacityForLevel(ZoneType.RESIDENTIAL, zoneData.level);
                    zoneData.population = cap; // On synchronise l'objet zone
                    this.totalPopulation += cap;
                } else if (zoneData.type === ZoneType.COMMERCIAL || zoneData.type === ZoneType.INDUSTRIAL) {
                    const jobs = this.getCapacityForLevel(zoneData.type, zoneData.level);
                    zoneData.population = jobs;
                    this.totalJobs += jobs;
                }
            }
        }

        // 2. Scan des bâtiments de service
        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (building) {
                const specs = BUILDING_SPECS[building.type];
                if (specs) {
                    if (specs.workersNeeded) {
                        this.totalJobs += specs.workersNeeded;
                    }
                    if (specs.production) {
                        this.addProduction(specs.production);
                    }
                }
            }
        }

        console.log(`📊 Recalcul effectué: Pop ${this.totalPopulation}, Jobs ${this.totalJobs}`);
    }

    private static addProduction(production: { type: string, amount: number }) {
        if (production.type === 'WATER') this.totalWaterCapacity += production.amount;
        if (production.type === 'ENERGY') this.totalEnergyCapacity += production.amount;
        if (production.type === 'FOOD') this.totalFoodCapacity += production.amount;
    }

    private static removeProduction(production: { type: string, amount: number }) {
        if (production.type === 'WATER') this.totalWaterCapacity -= production.amount;
        if (production.type === 'ENERGY') this.totalEnergyCapacity -= production.amount;
        if (production.type === 'FOOD') this.totalFoodCapacity -= production.amount;
    }

    /**
     * Called when a new zone is placed
     * Updates the cached population value
     */
    public static onZonePlaced(zoneData: ZoneData): void {
        if (zoneData.type === ZoneType.RESIDENTIAL) {
            const populationGain = zoneData.population;
            this.totalPopulation += populationGain;
            console.log(`👥 PopulationManager: +${populationGain} habitants (Total: ${this.totalPopulation})`);
        } else if (zoneData.type === ZoneType.COMMERCIAL || zoneData.type === ZoneType.INDUSTRIAL) {
            const jobGain = zoneData.population; // "Population" field represents occupants/jobs
            this.totalJobs += jobGain;
            console.log(`💼 PopulationManager: +${jobGain} jobs (Total: ${this.totalJobs})`);
        }
    }

    /**
     * Called when a zone is upgraded to a new level
     * Updates the cached population value
     */
    public static onZoneUpgraded(zoneData: ZoneData, oldLevel: number, newLevel: number): void {
        if (zoneData.type === ZoneType.RESIDENTIAL) {
            const oldPopulation = this.POPULATION_BY_LEVEL[oldLevel] || 0;
            const newPopulation = this.POPULATION_BY_LEVEL[newLevel] || 0;
            const populationChange = newPopulation - oldPopulation;

            this.totalPopulation += populationChange;
            console.log(`👥 PopulationManager: Zone upgraded L${oldLevel}→L${newLevel}, ${populationChange > 0 ? '+' : ''}${populationChange} habitants (Total: ${this.totalPopulation})`);
        } else if (zoneData.type === ZoneType.COMMERCIAL || zoneData.type === ZoneType.INDUSTRIAL) {
            const oldJobs = this.JOBS_BY_LEVEL[oldLevel] || 0;
            const newJobs = this.JOBS_BY_LEVEL[newLevel] || 0;
            const jobChange = newJobs - oldJobs;

            this.totalJobs += jobChange;
            console.log(`💼 PopulationManager: Job Zone upgraded L${oldLevel}→L${newLevel}, ${jobChange} jobs`);
        }
    }

    /**
     * Called when a zone is removed (bulldozed)
     * Updates the cached population value
     */
    public static onZoneRemoved(zoneData: ZoneData): void {
        if (zoneData.type === ZoneType.RESIDENTIAL) {
            const populationLoss = zoneData.population;
            this.totalPopulation -= populationLoss;
            console.log(`👥 PopulationManager: -${populationLoss} habitants (Total: ${this.totalPopulation})`);
        } else if (zoneData.type === ZoneType.COMMERCIAL || zoneData.type === ZoneType.INDUSTRIAL) {
            const jobLoss = zoneData.population;
            this.totalJobs -= jobLoss;
            console.log(`💼 PopulationManager: -${jobLoss} jobs`);
        }
    }

    // --- Service Buildings Handlers ---

    public static onBuildingPlaced(specs: any): void {
        if (specs.workersNeeded) {
            this.totalJobs += specs.workersNeeded;
            console.log(`💼 PopulationManager: +${specs.workersNeeded} service jobs (Total: ${this.totalJobs})`);
        }
        if (specs.production) {
            this.addProduction(specs.production);
        }
    }

    public static onBuildingRemoved(specs: any): void {
        if (specs.workersNeeded) {
            this.totalJobs -= specs.workersNeeded;
            console.log(`💼 PopulationManager: -${specs.workersNeeded} service jobs (Total: ${this.totalJobs})`);
        }
        if (specs.production) {
            this.removeProduction(specs.production);
        }
    }

    /**
     * Called when a building is upgraded
     * Adds the difference in production/jobs
     */
    public static onBuildingUpgraded(specs: any, oldLevel: number, newLevel: number): void {
        // Hypothèse : La production et les jobs scalent linéairement avec le niveau
        // Lvl 1 -> Lvl 2 = +1x Base
        const multiplierDiff = newLevel - oldLevel;

        if (specs.workersNeeded) {
            const addedJobs = specs.workersNeeded * multiplierDiff;
            this.totalJobs += addedJobs;
            console.log(`💼 PopulationManager: +${addedJobs} service jobs (Upgrade L${oldLevel}->L${newLevel})`);
        }

        if (specs.production) {
            // On ajoute la différence de production
            this.addProduction({
                type: specs.production.type,
                amount: specs.production.amount * multiplierDiff
            });
        }
    }

    /**
     * Get the current total population (O(1) - uses cached value)
     */
    public static getTotalPopulation(): number {
        return this.totalPopulation;
    }

    public static getTotalJobs(): number {
        return this.totalJobs;
    }

    public static getProductionCapacity() {
        return {
            water: this.totalWaterCapacity,
            energy: this.totalEnergyCapacity,
            food: this.totalFoodCapacity
        };
    }

    /**
     * Get the population/jobs for a specific area level
     */
    public static getCapacityForLevel(type: ZoneType, level: number): number {
        if (type === ZoneType.RESIDENTIAL) return this.POPULATION_BY_LEVEL[level] || 0;
        return this.JOBS_BY_LEVEL[level] || 0;
    }

    /**
     * Reset the population manager (useful for testing or map regeneration)
     */
    public static reset(): void {
        this.totalPopulation = 0;
        this.totalJobs = 0;
        this.totalWaterCapacity = 0;
        this.totalEnergyCapacity = 0;
        this.totalFoodCapacity = 0;
        console.log('👥 PopulationManager: Reset');
    }
}
