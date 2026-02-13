import { MapEngine } from '../MapEngine';
// ✅ AJOUT DE BuildingType
import { ZoneType, BuildingType, BUILDING_COSTS, PlayerResources, BuildingStatus } from '../types';
import { GRID_SIZE } from '../config';
import { ResidentialRules } from '../rules/ResidentialRules';

export class BuildingSystem {

    /**
     * Vérifie si une tuile a accès à la route
     */
    static hasRoadAccess(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1,
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1
        ];

        return neighbors.some(n => n !== -1 && engine.roadLayer[n] !== null);
    }

    /**
     * Tente de consommer des ressources
     */
    /**
     * Tente de consommer des ressources (Helper)
     */
    static tryConsumeResources(engine: MapEngine, cost: Partial<PlayerResources>): boolean {
        // Vérification
        if ((cost.wood || 0) > engine.resources.wood) return false;
        if ((cost.concrete || 0) > engine.resources.concrete) return false;
        if ((cost.glass || 0) > engine.resources.glass) return false;
        if ((cost.steel || 0) > engine.resources.steel) return false;
        if ((cost.money || 0) > engine.resources.money) return false;
        if ((cost.stone || 0) > engine.resources.stone) return false; // Ajout pierre

        // Consommation
        engine.resources.wood -= (cost.wood || 0);
        engine.resources.concrete -= (cost.concrete || 0);
        engine.resources.glass -= (cost.glass || 0);
        engine.resources.steel -= (cost.steel || 0);
        engine.resources.money -= (cost.money || 0);
        engine.resources.stone -= (cost.stone || 0);

        return true;
    }

    /**
     * Mise à jour du système de bâtiments (Staggered)
     * @param engine Moteur
     * @param currentTick Tick actuel de la simulation (pour le staggering)
     */
    static update(engine: MapEngine, currentTick: number) {

        // 1. Calcul du Job Pool Global (Offre / Demande)
        // Optimisation : On pourrait le calculer moins souvent, mais c'est des additions simples
        // Workers = Somme population (simplifié)
        // Jobs = Somme capacités (Commercial + Industriel)
        // 1. Calcul du Job Pool Global (Désormais géré par JobSystem et GameEngine stats)
        // On garde juste la structure
        // const totalWorkers = engine.stats.population;
        // const totalJobs = engine.stats.jobsCommercial + engine.stats.jobsIndustrial;
        // const jobRatio = totalWorkers > 0 ? totalJobs / totalWorkers : 1;

        // 2. Staggering : On traite une portion de la carte à chaque tick
        // 10000 cases / 60 ticks = ~166 cases par tick pour tout couvrir en 1 seconde
        // On prend large : 200 cases par tick
        const BATCH_SIZE = 200;
        const totalCells = engine.config.totalCells;

        const startIdx = (currentTick * BATCH_SIZE) % totalCells;
        let endIdx = startIdx + BATCH_SIZE;

        // Gestion du bouclage si on dépasse la fin du tableau
        const overflow = endIdx > totalCells ? endIdx - totalCells : 0;
        if (endIdx > totalCells) endIdx = totalCells;

        // Traitement du premier segment
        this.processRange(engine, startIdx, endIdx);

        // Traitement du reste (bouclage)
        if (overflow > 0) {
            this.processRange(engine, 0, overflow);
        }
    }

    private static processRange(engine: MapEngine, start: number, end: number) {
        for (let idx = start; idx < end; idx++) {
            const building = engine.buildingLayer[idx];
            const zoneData = engine.zoningLayer[idx];

            // ----------------------------------------------------------------
            // LOGIQUE 1 : CONSTRUCTION AUTOMATIQUE SUR ZONE VIDE
            // ----------------------------------------------------------------
            if (!building && zoneData && !engine.roadLayer[idx]) {
                this.tryAutoConstruct(engine, idx, zoneData.type);
            }

            // ----------------------------------------------------------------
            // LOGIQUE 2 : SIMULATION & ÉVOLUTION (Bâtiments existants)
            // ----------------------------------------------------------------
            else if (building) {
                if (building.state === 'CONSTRUCTION') {
                    // Construction (rapide)
                    building.constructionTimer++;
                    if (building.constructionTimer > 20) {
                        building.state = 'ACTIVE';
                        engine.revision++;
                    }
                }
                else if (building.state === 'ACTIVE') {
                    // Simulation Résidentielle
                    if (building.type === BuildingType.RESIDENTIAL) {
                        ResidentialRules.update(building, engine);
                        // ResidentialRules s'occupe de l'évolution via tryEvolve
                    }

                    // TODO: Simulation Commerciale / Industrielle simplifiée ici si besoin
                }
            }
        }
    }

    private static tryAutoConstruct(engine: MapEngine, idx: number, zoneType: ZoneType) {
        if (!this.hasRoadAccess(engine, idx)) return;

        let targetType: BuildingType;
        switch (zoneType) {
            case ZoneType.RESIDENTIAL: targetType = BuildingType.RESIDENTIAL; break;
            case ZoneType.COMMERCIAL: targetType = BuildingType.COMMERCIAL; break;
            case ZoneType.INDUSTRIAL: targetType = BuildingType.INDUSTRIAL; break;
            default: return;
        }

        // Mapping simple pour les coûts initiaux (Niveau 1)
        // const costConfig = BUILDING_COSTS[zoneType]?.[1];
        // FIX: Utiliser BUILDING_SPECS pour le coût de base si BUILDING_COSTS est complexe
        // Ou assumer coût 0 pour auto-build résidentiel/commercial (croissance organique)
        // Pour l'instant on garde la logique de coût, mais on log si ça fail

        const costConfig = BUILDING_COSTS[zoneType]?.[1];

        if (costConfig) {
            if (this.tryConsumeResources(engine, costConfig)) {
                engine.buildingLayer[idx] = {
                    type: targetType,
                    x: idx % GRID_SIZE,
                    y: Math.floor(idx / GRID_SIZE),
                    variant: Math.floor(Math.random() * 3),
                    level: 1,
                    state: 'CONSTRUCTION',
                    constructionTimer: 0,
                    pollution: 0,
                    happiness: 100,
                    statusFlags: 0,
                    stability: 0, // NEW
                    jobsAssigned: 0 // NEW
                };
                engine.revision++;
            }
        }
    }
}