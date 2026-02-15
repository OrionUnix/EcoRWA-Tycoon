import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, BUILDING_SPECS, ZoneType } from '../types';
import { PopulationManager } from './PopulationManager';
// import { BuildingSystem } from './BuildingSystem'; // Circular dependency if BuildingSystem imports JobSystem? No, BuildingSystem imports types.
import { BuildingSystem } from './BuildingSystem';

/**
 * Système de gestion des emplois et des travailleurs
 */
export class JobSystem {

    /**
     * Mise à jour du système d'emplois
     */
    static update(engine: MapEngine): void {

        let availableWorkers = PopulationManager.getTotalPopulation();

        // Tracking global stats for this tick
        let tickJobsRequired = 0;
        let tickJobsAssigned = 0;

        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building) continue;

            // Only commercial, industrial, and service buildings need workers
            // ✅ Revert: On autorise l'affectation même en construction pour éviter de bloquer le chômage trop longtemps
            // if (building.state !== 'ACTIVE') continue;

            const specs = BUILDING_SPECS[building.type];
            if (!specs) continue;

            let jobsNeeded = 0;

            // 1. Determine Jobs Needed
            if (specs.workersNeeded) {
                // Service buildings (Power, Water, etc.)
                jobsNeeded = specs.workersNeeded;
            } else if (building.type === BuildingType.COMMERCIAL || building.type === BuildingType.INDUSTRIAL) {
                // Zone-based jobs (using zone population as proxy for job capacity)
                const zoneData = engine.zoningLayer[i];
                if (zoneData) {
                    jobsNeeded = zoneData.population;
                }
            }

            if (jobsNeeded <= 0) {
                // Ensure residential or others have 0 assigned
                building.jobsAssigned = 0;
                continue;
            }

            tickJobsRequired += jobsNeeded;

            // 2. Check Road Access
            // Use BuildingSystem helper
            if (!BuildingSystem.hasRoadAccess(engine, i)) {
                console.warn(`JobSystem: Building ${building.type} at ${i} has NO ROAD ACCESS -> 0 jobs`);
                building.jobsAssigned = 0;
                building.statusFlags = JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS);
                continue;
            }

            // 3. Assign Workers
            const assigned = Math.min(availableWorkers, jobsNeeded);
            building.jobsAssigned = assigned;
            availableWorkers -= assigned;
            tickJobsAssigned += assigned;

            // 4. Update Status
            // If the building has significantly fewer workers than needed -> Inactive/Warning
            if (assigned < jobsNeeded) {
                // Partially staffed or empty
                // We can use a flag to show the warning
                building.statusFlags = JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS);
            } else {
                building.statusFlags = JobSystem.removeFlag(building.statusFlags, BuildingStatus.NO_JOBS);
            }
        }

        // 5. Update Engine Stats
        engine.stats.jobs = tickJobsRequired; // Available slots
        // engine.stats.workers is Total Population (potential workers)
        engine.stats.workers = PopulationManager.getTotalPopulation();
        // Unemployed = People who didn't find a job
        engine.stats.unemployed = Math.max(0, engine.stats.workers - tickJobsAssigned);
    }

    private static addFlag(status: number, flag: BuildingStatus): number {
        return status | flag;
    }

    private static removeFlag(status: number, flag: BuildingStatus): number {
        return status & ~flag;
    }
}
