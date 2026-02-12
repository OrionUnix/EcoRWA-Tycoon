import { MapEngine } from '../MapEngine';
import { ZoneType, ZoneData } from '../types';

/**
 * PopulationManager - Event-driven population tracking system
 * 
 * Performance: O(1) for all operations (no iteration through zones)
 * Updates population cache only when zones are created/upgraded/removed
 */
export class PopulationManager {
    private static totalPopulation: number = 0;

    /**
     * Population per zone level for residential zones
     */
    private static readonly POPULATION_BY_LEVEL: Record<number, number> = {
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
        this.totalPopulation = 0;

        // Scan all zones to build initial population cache
        for (let i = 0; i < engine.zoningLayer.length; i++) {
            const zoneData = engine.zoningLayer[i];
            if (zoneData && zoneData.type === ZoneType.RESIDENTIAL) {
                this.totalPopulation += zoneData.population;
            }
        }

        console.log(`👥 PopulationManager: Initialized with ${this.totalPopulation} inhabitants`);
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
        }
    }

    /**
     * Get the current total population (O(1) - uses cached value)
     */
    public static getTotalPopulation(): number {
        return this.totalPopulation;
    }

    /**
     * Get the population for a specific zone level
     */
    public static getPopulationForLevel(level: number): number {
        return this.POPULATION_BY_LEVEL[level] || 0;
    }

    /**
     * Reset the population manager (useful for testing or map regeneration)
     */
    public static reset(): void {
        this.totalPopulation = 0;
        console.log('👥 PopulationManager: Reset');
    }
}
