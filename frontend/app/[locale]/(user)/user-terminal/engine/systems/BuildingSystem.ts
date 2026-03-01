import { MapEngine } from '../MapEngine';
// ✅ AJOUT DE BuildingType
import { ZoneType, BuildingType, BUILDING_COSTS, PlayerResources, BuildingStatus, BUILDING_SPECS } from '../types';
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

        // ----------------------------------------------------------------
        // PRÉ-CALCUL : DÉMOGRAPHIE & SERVICES ACTIFS (Desirability Check)
        // ----------------------------------------------------------------
        const activeServices = new Set<BuildingType>();
        let totalEducatedRes = 0;
        let totalRes = 0;

        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const b = engine.buildingLayer[i];
            if (!b || b.state !== 'ACTIVE') continue;

            // Enregistrer qu'un service est actif (s'il a accès à l'eau et l'élec)
            if ((b.statusFlags & BuildingStatus.NO_POWER) === 0 &&
                (b.statusFlags & BuildingStatus.NO_WATER) === 0) {
                activeServices.add(b.type);
            }

            // Statistique d'éducation
            if (b.type === BuildingType.RESIDENTIAL) {
                totalRes++;
                if (b.level >= 2) totalEducatedRes++;
            }
        }

        const highEducationRatio = totalRes > 0 ? (totalEducatedRes / totalRes) : 0;
        const hasPolice = activeServices.has(BuildingType.POLICE_STATION);
        const hasClinic = activeServices.has(BuildingType.CLINIC);
        const hasSchool = activeServices.has(BuildingType.SCHOOL);
        const hasCulture = activeServices.has(BuildingType.PARK) ||
            activeServices.has(BuildingType.MUSEUM) ||
            activeServices.has(BuildingType.THEATER as any);

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
        this.processRange(engine, startIdx, endIdx, hasPolice, hasClinic, hasSchool, hasCulture, highEducationRatio);

        // Traitement du reste (bouclage)
        if (overflow > 0) {
            this.processRange(engine, 0, overflow, hasPolice, hasClinic, hasSchool, hasCulture, highEducationRatio);
        }
    }

    private static processRange(
        engine: MapEngine,
        start: number,
        end: number,
        hasPolice: boolean,
        hasClinic: boolean,
        hasSchool: boolean,
        hasCulture: boolean,
        highEducationRatio: number
    ) {
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
                    }

                    // ✅ AUTO-NIVEAU UP ORGANIC POUR TOUTES LES ZONES (Mission 2 & 3)
                    const isZone = building.type === BuildingType.RESIDENTIAL ||
                        building.type === BuildingType.COMMERCIAL ||
                        building.type === BuildingType.INDUSTRIAL;

                    if (isZone) {
                        const specs = BUILDING_SPECS[building.type];
                        const maxLevel = specs?.maxLevel || 1;

                        if (building.level < maxLevel) {
                            const noWater = (building.statusFlags & BuildingStatus.NO_WATER) !== 0;
                            const noPower = (building.statusFlags & BuildingStatus.NO_POWER) !== 0;

                            if (!noWater && !noPower) {
                                // 1. Vérification de l'Arbre de Désirabilité (Desirability Tree)
                                let canEvolve = false;
                                const desirability = this.calculateDesirability(engine, idx);

                                if (building.type === BuildingType.RESIDENTIAL || building.type === BuildingType.COMMERCIAL) {
                                    if (building.level === 1) {
                                        canEvolve = hasPolice || hasClinic; // Vers Lvl 2: Police ou Santé
                                    } else if (building.level === 2) {
                                        canEvolve = (hasPolice || hasClinic) && hasSchool && hasCulture; // Vers Lvl 3: + Éducation + Culture
                                    }

                                    // MISSION 4: Bloquer l'évolution si c'est trop moche (Usines/Mines à proximité)
                                    if (desirability < 20) {
                                        canEvolve = false;
                                    }
                                } else if (building.type === BuildingType.INDUSTRIAL) {
                                    if (building.level === 1) {
                                        canEvolve = hasPolice; // Vers Lvl 2: Police
                                    } else if (building.level === 2) {
                                        canEvolve = hasPolice && hasSchool && (highEducationRatio > 0.20); // Vers Lvl 3: Main d'œuvre qualifiée > 20%
                                    }
                                    // Les industries aiment se regrouper et s'en fichent de la mocheté, on ne bloque pas avec < 20
                                }

                                // 2. Évolution (0.5% par tick si désirable) -> ~200 ticks moy.
                                if (canEvolve && Math.random() < 0.005) {
                                    building.level++;
                                    building.variant = Math.floor(Math.random() * 2); // Nouveaux A/B Variants !

                                    building.state = 'CONSTRUCTION';
                                    building.constructionTimer = 0;

                                    engine.revision++;
                                    console.log(`✨ Bâtiment ${building.type} a évolué vers le Niveau ${building.level} !`);
                                }
                            }
                        }
                    }
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

        // Hackathon Mode: On retire les coûts stricts en ressources des auto-constructions (Zones)
        // Les citoyens amènent eurs propres matériaux (le joueur a déjà payé 10$ pour zoner)
        engine.buildingLayer[idx] = {
            type: targetType,
            x: idx % GRID_SIZE,
            y: Math.floor(idx / GRID_SIZE),
            variant: Math.floor(Math.random() * 2), // 0=A, 1=B
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

    // ----------------------------------------------------------------
    // MISSION 4 : SYSTÈME DE DÉSIRABILITÉ PAR RAYON
    // ----------------------------------------------------------------
    private static calculateDesirability(map: MapEngine, index: number, radius: number = 4): number {
        const cx = index % GRID_SIZE;
        const cy = Math.floor(index / GRID_SIZE);
        // Score de base (neutre)
        let score = 50;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                // Hors map
                if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;

                const ni = ny * GRID_SIZE + nx;
                const b = map.buildingLayer[ni];

                if (b) {
                    // +10 pour les services / parcs
                    if (b.type === BuildingType.PARK ||
                        b.type === BuildingType.SCHOOL ||
                        b.type === BuildingType.CLINIC ||
                        b.type === BuildingType.CITY_HALL) {
                        score += 10;
                    }

                    // -15 pour l'industrie, extraction, bûcherons
                    if (b.type === BuildingType.INDUSTRIAL ||
                        b.type.includes('MINE') ||
                        b.type.includes('PUMP') ||
                        b.type.includes('LUMBER_HUT') ||
                        b.type === BuildingType.POWER_PLANT) { // Ajout des centrales pour la forme
                        score -= 15;
                    }
                }
            }
        }

        return Math.max(0, Math.min(100, score)); // Clamp 0-100
    }
}