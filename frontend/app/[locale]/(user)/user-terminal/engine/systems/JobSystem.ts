import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, BUILDING_SPECS, ZoneType } from '../types';
import { PopulationManager } from './PopulationManager';
import { BuildingSystem } from './BuildingSystem';

/**
 * ✅ MISSION 5 : Système d'emplois avec deux passes distinctes
 *
 * PASSE 1 — Services (workersNeeded) : Police, École, Centrale, etc.
 *   Ces bâtiments absorbent des travailleurs pour fonctionner.
 *
 * PASSE 2 — Production (maxWorkers) : Bûcheron, Chasseur, Mines, Puits...
 *   Ces bâtiments produisent à un ratio proportionnel (jobsAssigned / maxWorkers).
 *   La production réelle est calculée dans ResourceSystem.ts et EconomySystem.ts.
 *
 * @debt HACKATHON : Affectation FIFO (ordre de construction = ordre de priorité).
 * TODO NEXT : Trier par priorité FOOD > WATER > WOOD > MINING, ou faire une
 * distribution proportionnelle (50% des workers = tous les bâtiments à 50%).
 */
export class JobSystem {

    static update(engine: MapEngine): void {
        let availableWorkers = PopulationManager.getTotalPopulation();
        let tickJobsRequired = 0;
        let tickJobsAssigned = 0;

        // ── PASSE 1 : Bâtiments de SERVICE (workersNeeded) ────────────────────
        // Police, École, Centrale élec, Pompe à eau, Mairie, etc.
        // Ces bâtiments consomment des travailleurs mais ne produisent pas de ressources.
        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building) continue;

            const specs = BUILDING_SPECS[building.type];
            if (!specs) continue;

            // On ignore les bâtiments de production dans cette passe
            if (specs.maxWorkers !== undefined) continue;

            let jobsNeeded = 0;

            if (specs.workersNeeded) {
                jobsNeeded = specs.workersNeeded;
            } else if (building.type === BuildingType.COMMERCIAL || building.type === BuildingType.INDUSTRIAL) {
                const zoneData = engine.zoningLayer[i];
                if (zoneData) jobsNeeded = zoneData.population;
            }

            if (jobsNeeded <= 0) {
                building.jobsAssigned = 0;
                continue;
            }

            tickJobsRequired += jobsNeeded;

            if (!BuildingSystem.hasRoadAccess(engine, i)) {
                building.jobsAssigned = 0;
                building.statusFlags = JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS);
                continue;
            }

            const assigned = Math.min(availableWorkers, jobsNeeded);
            building.jobsAssigned = assigned;
            availableWorkers -= assigned;
            tickJobsAssigned += assigned;

            building.statusFlags = assigned < jobsNeeded
                ? JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS)
                : JobSystem.removeFlag(building.statusFlags, BuildingStatus.NO_JOBS);
        }

        // ── PASSE 2 : Bâtiments de PRODUCTION (maxWorkers) ───────────────────
        // Bûcheron, Chasseur, Pêcheur, Mines, Puits de pétrole...
        // @debt FIFO : Les bâtiments construits en premier sont servis en premier.
        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building) continue;

            const specs = BUILDING_SPECS[building.type];
            if (!specs || specs.maxWorkers === undefined) continue;

            // Bâtiments de production uniquement (state ACTIVE pour produire)
            const maxW = specs.maxWorkers;
            tickJobsRequired += maxW;

            if (!BuildingSystem.hasRoadAccess(engine, i)) {
                building.jobsAssigned = 0;
                building.statusFlags = JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS);
                continue;
            }

            const assigned = Math.min(availableWorkers, maxW);
            building.jobsAssigned = assigned;
            availableWorkers -= assigned;
            tickJobsAssigned += assigned;

            // Avertissement si sous-staffé (production réduite)
            building.statusFlags = assigned < maxW
                ? JobSystem.addFlag(building.statusFlags, BuildingStatus.NO_JOBS)
                : JobSystem.removeFlag(building.statusFlags, BuildingStatus.NO_JOBS);
        }

        // ── Mise à jour des stats globales ────────────────────────────────────
        engine.stats.jobs = tickJobsRequired;
        engine.stats.workers = PopulationManager.getTotalPopulation();
        engine.stats.unemployed = Math.max(0, engine.stats.workers - tickJobsAssigned);
    }

    /**
     * Calcule le ratio d'emploi d'un bâtiment de production (0.0 → 1.0).
     * Utilisable dans les tooltips de l'UI.
     */
    static getProductionRatio(building: { jobsAssigned: number }, maxWorkers: number): number {
        if (maxWorkers <= 0) return 1;
        return Math.min(1, building.jobsAssigned / maxWorkers);
    }

    private static addFlag(status: number, flag: BuildingStatus): number {
        return status | flag;
    }

    private static removeFlag(status: number, flag: BuildingStatus): number {
        return status & ~flag;
    }
}

