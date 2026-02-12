/**
 * NeedsCalculator - Calculates resource needs based on population
 * 
 * Formulas:
 * - Food: 1 unit per inhabitant
 * - Water: 1 unit per inhabitant  
 * - Electricity: 0.5 units per inhabitant
 * - Jobs: 1 job per inhabitant
 */

export interface CityNeeds {
    food: number;
    water: number;
    electricity: number;
    jobs: number;
}

export class NeedsCalculator {
    /**
     * Multipliers for each need type
     */
    private static readonly NEEDS_MULTIPLIERS = {
        food: 1.0,
        water: 1.0,
        electricity: 0.5,
        jobs: 1.0
    };

    /**
     * Calculate all needs based on current population
     * @param population Total city population
     * @returns Object with calculated needs
     */
    public static calculateNeeds(population: number): CityNeeds {
        return {
            food: Math.ceil(population * this.NEEDS_MULTIPLIERS.food),
            water: Math.ceil(population * this.NEEDS_MULTIPLIERS.water),
            electricity: Math.ceil(population * this.NEEDS_MULTIPLIERS.electricity),
            jobs: Math.ceil(population * this.NEEDS_MULTIPLIERS.jobs)
        };
    }

    /**
     * Calculate a specific need
     * @param population Total city population
     * @param needType Type of need to calculate
     */
    public static calculateNeed(population: number, needType: keyof typeof NeedsCalculator.NEEDS_MULTIPLIERS): number {
        return Math.ceil(population * this.NEEDS_MULTIPLIERS[needType]);
    }

    /**
     * Check if a need is satisfied
     * @param demand How much is needed
     * @param supply How much is available
     * @returns Status: 'OK', 'WARNING', or 'DANGER'
     */
    public static getNeedStatus(demand: number, supply: number): 'OK' | 'WARNING' | 'DANGER' {
        if (supply >= demand) return 'OK';
        if (supply >= demand * 0.7) return 'WARNING';
        return 'DANGER';
    }

    /**
     * Get a color class for the status
     */
    public static getStatusColor(status: 'OK' | 'WARNING' | 'DANGER'): string {
        switch (status) {
            case 'OK': return 'text-green-400';
            case 'WARNING': return 'text-yellow-400';
            case 'DANGER': return 'text-red-400';
        }
    }
}
