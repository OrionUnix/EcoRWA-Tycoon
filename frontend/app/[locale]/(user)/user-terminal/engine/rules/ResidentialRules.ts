import { MapEngine } from '../MapEngine';
import { BuildingData, BuildingStatus, BuildingType, ZoneType } from '../types';
import { GRID_SIZE } from '../config';

/**
 * Règles de simulation pour les zones résidentielles
 */
export class ResidentialRules {

    // Constants pour le bonheur
    private static readonly HAPPINESS_MAX = 100;
    private static readonly PENALTY_NO_WATER = 40;
    private static readonly PENALTY_NO_FOOD = 40;
    private static readonly PENALTY_NO_POWER = 20;
    private static readonly PENALTY_NO_JOB = 10;
    private static readonly PENALTY_NO_COMMERCIAL = 15; // ✅ Malus si pas de commerce proche
    private static readonly BONUS_PARK = 10;

    // Seuil d'évolution
    private static readonly EVOLUTION_THRESHOLD = 30; // 30 ticks positifs
    private static readonly REGRESSION_THRESHOLD = -30; // 30 ticks négatifs
    private static readonly EVOLUTION_COOLDOWN = 300; // 300 ticks d'attente

    // Inertie du bonheur (Lerp factor)
    private static readonly HAPPINESS_LERP = 0.1;

    /**
     * Helpers Bitflags
     */
    static hasFlag(status: number, flag: BuildingStatus): boolean {
        return (status & flag) === flag;
    }

    static addFlag(status: number, flag: BuildingStatus): number {
        return status | flag;
    }

    static removeFlag(status: number, flag: BuildingStatus): number {
        return status & ~flag;
    }

    /**
     * Mise à jour complète d'un bâtiment résidentiel
     * @param building Le bâtiment à mettre à jour
     * @param engine Le moteur du jeu
     * Mise à jour complète d'un bâtiment résidentiel
     * @param building Le bâtiment à mettre à jour
     * @param engine Le moteur du jeu
     */
    static update(building: BuildingData, engine: MapEngine): void {
        const index = building.y * GRID_SIZE + building.x;

        // 1. Si Abandonné, on ne verifie que la possibilité de réhabilitation (via parcs/services proches qui remontent le bonheur théorique)
        // Mais pour simplifier : un bâtiment abandonné ne "consomme" rien, mais son bonheur est calculé pour voir s'il peut revivre.

        let newStatus = building.statusFlags;

        // Reset des flags de besoins pour recalcul (sauf ABANDONED qui est persistant via logique de stabilité)
        // On garde ABANDONED s'il y est
        const isAbandoned = this.hasFlag(newStatus, BuildingStatus.ABANDONED);
        newStatus = isAbandoned ? BuildingStatus.ABANDONED : 0;

        // Si abandonné, on skip la conso de ressources ?
        // Pour l'instant, on calcule tout pour permettre la "réparation" automatique si les conditions s'améliorent.

        // Eau (Layer 1 = Water/Elevation, check logic specific to your game)
        // Supposons qu'on vérifie l'accès à l'eau potable via canalisations ou château d'eau
        // Pour l'instant, disons que si water.produced > water.consumed globalement, c'est OK
        // Ou check proximité (simple)
        if (engine.stats.water.produced <= engine.stats.water.consumed) {
            newStatus = this.addFlag(newStatus, BuildingStatus.NO_WATER);
        }

        // Électricité
        if (engine.stats.energy.produced <= engine.stats.energy.consumed) {
            newStatus = this.addFlag(newStatus, BuildingStatus.NO_POWER);
        }

        // Nourriture (Stock global + Source active requise)
        const hasFoodStock = engine.stats.food.produced > 0 || engine.resources.food > 0;
        if (!hasFoodStock) {
            newStatus = this.addFlag(newStatus, BuildingStatus.NO_FOOD);
        }

        // Travail (Basé sur le taux de chômage réel)
        const totalWorkers = engine.stats.workers;
        const unemployed = engine.stats.unemployed;
        const unemploymentRate = totalWorkers > 0 ? unemployed / totalWorkers : 0;

        // Si chômage élevé, chance d'être sans emploi
        // On rend la chance un peu plus faible que le taux brut pour ne pas punir tout le monde instantanément
        // Ex: 20% chômage -> 20% chance d'avoir le flag NO_JOBS
        if (Math.random() < unemploymentRate) {
            newStatus = this.addFlag(newStatus, BuildingStatus.NO_JOBS);
        }

        building.statusFlags = newStatus;

        // 2. Calcul du Bonheur Cible
        let targetHappiness = 100;

        if (this.hasFlag(newStatus, BuildingStatus.NO_WATER)) targetHappiness -= this.PENALTY_NO_WATER;
        if (this.hasFlag(newStatus, BuildingStatus.NO_FOOD)) targetHappiness -= this.PENALTY_NO_FOOD;
        if (this.hasFlag(newStatus, BuildingStatus.NO_POWER)) targetHappiness -= this.PENALTY_NO_POWER;
        if (this.hasFlag(newStatus, BuildingStatus.NO_JOBS)) targetHappiness -= this.PENALTY_NO_JOB;

        // Pollution (Proximité Industrielle) et Environnement
        const pollutionPenalty = this.calculatePollutionImpact(engine, index) * 10;
        targetHappiness -= pollutionPenalty;

        // ✅ Proximité Commerciale
        if (!this.hasCommercialNearby(engine, index)) {
            targetHappiness -= this.PENALTY_NO_COMMERCIAL;
        }

        // Bonus Parc
        if (this.hasParkNearby(engine, index)) {
            targetHappiness += this.BONUS_PARK;
        }

        // Clamp
        if (targetHappiness < 0) targetHappiness = 0;
        if (targetHappiness > 100) targetHappiness = 100;

        // 3. Application du Bonheur (Lissage / Hystérésis)
        building.happiness += (targetHappiness - building.happiness) * this.HAPPINESS_LERP;

        // 4. Stabilité et Évolution
        this.updateStabilityAndEvolution(building, engine);
    }

    private static calculatePollutionImpact(engine: MapEngine, index: number): number {
        // Recherche zone industrielle proche
        // Rayon 3 cases
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const radius = 3;
        let maxImpact = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const nIdx = ny * GRID_SIZE + nx;
                    // Vérifie Bâtiment Industriel ou Zone Industrielle
                    const isIndustrial =
                        (engine.buildingLayer[nIdx]?.type === BuildingType.INDUSTRIAL) ||
                        (engine.zoningLayer[nIdx]?.type === ZoneType.INDUSTRIAL);

                    if (isIndustrial) {
                        const dist = Math.max(Math.abs(dx), Math.abs(dy));
                        // Dist 1 (collé) = 3 impact
                        // Dist 2 = 2 impact
                        // Dist 3 = 1 impact
                        const impact = 4 - dist;
                        if (impact > maxImpact) maxImpact = impact;
                    }
                }
            }
        }
        return maxImpact;
    }

    private static hasCommercialNearby(engine: MapEngine, index: number): boolean {
        // Rayon 10 pour les commerces (assez large)
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const radius = 10;

        // Optimisation : On pourrait scanner en spirale ou juste checker un bounding box
        // Pour l'instant, scan simple
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const nIdx = ny * GRID_SIZE + nx;
                    // Check Zone ou Bâtiment
                    if (engine.buildingLayer[nIdx]?.type === BuildingType.COMMERCIAL ||
                        engine.zoningLayer[nIdx]?.type === ZoneType.COMMERCIAL) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static hasParkNearby(engine: MapEngine, index: number): boolean {
        // Rayon 5 pour les parcs
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const radius = 5;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nIdx = (y + dy) * GRID_SIZE + (x + dx);
                if (nIdx >= 0 && nIdx < engine.config.totalCells) { // Simple bounds check
                    if (engine.buildingLayer[nIdx]?.type === BuildingType.PARK) return true;
                }
            }
        }
        return false;
    }

    private static updateStabilityAndEvolution(building: BuildingData, engine: MapEngine): void {
        // Gestion du Cooldown
        if (building.evolutionCooldown && building.evolutionCooldown > 0) {
            building.evolutionCooldown--;
        }

        // Si bonheur élevé et besoins comblés -> Stabilité monte
        if (building.happiness > 70 && building.statusFlags === 0) {
            building.stability += 1;
        }
        // Si malheureux ou besoins manquants -> Stabilité descend
        else if (building.happiness < 40 || building.statusFlags !== 0) {
            building.stability -= 1;
        }

        // Clamp Stabilité
        if (building.stability > 100) building.stability = 100;
        if (building.stability < -100) building.stability = -100;

        // L'ÉVOLUTION est désormais gérée organiquement dans BuildingSystem.ts
        // afin d'unifier les zones (Résidentielle, Commerciale, Industrielle).
        // On ne fait donc plus de this.tryEvolve() ici.

        // RÉGRESSION (Abandon)
        if (building.stability < this.REGRESSION_THRESHOLD) {
            // Si la stabilité est critique (< -30), le bâtiment devient abandonné
            // Il ne consomme plus de ressources mais reste visible comme "ruine"
            // Pour le réhabiliter, il faudra remonter le bonheur ou le détruire
            building.statusFlags = this.addFlag(building.statusFlags, BuildingStatus.ABANDONED);
            // On reset la stabilité pour éviter un flicker immédiat, mais on laisse le flag
            building.stability = -50;
        } else {
            // Si la stabilité remonte, on peut "réparer" l'abandon
            if (building.stability > 0 && this.hasFlag(building.statusFlags, BuildingStatus.ABANDONED)) {
                building.statusFlags = this.removeFlag(building.statusFlags, BuildingStatus.ABANDONED);
            }
        }
    }

    private static hasFoodSource(engine: MapEngine): boolean {
        // Vérifie si au moins un bâtiment de production de nourriture existe et a des travailleurs
        // C'est une vérification simple pour l'instant (Global check)
        // On pourrait optimiser en cachant ce résultat dans GameEngine

        // On parcourt les bâtiments pour trouver un FISHERMAN ou HUNTER_HUT actif
        // Note: Ceci peut être coûteux si fait à chaque tick pour chaque maison.
        // Mieux vaut utiliser les stats globales du moteur si elles sont fiables.
        // Si engine.stats.food.produced > 0, c'est qu'il y a une source active.
        return engine.stats.food.produced > 0;
    }

    private static tryEvolve(building: BuildingData, engine: MapEngine): void {
        // Coûts d'évolution (Exemple simple)
        // L1 -> L2 : 50 Bois
        // L2 -> L3 : 50 Pierre
        let costWood = 0;
        let costStone = 0;

        if (building.level === 1) costWood = 50;
        else if (building.level === 2) costStone = 50;

        // Safe Threshold (Buffer de sécurité pour le joueur)
        const SAFE_BUFFER = 100;

        if (engine.resources.wood >= costWood + SAFE_BUFFER &&
            engine.resources.stone >= costStone + SAFE_BUFFER) {

            // Consommer
            engine.resources.wood -= costWood;
            engine.resources.stone -= costStone;

            // Level Up
            building.level++;
            building.stability = 0; // Reset stabilité après évolution
            building.evolutionCooldown = this.EVOLUTION_COOLDOWN; // Set Cooldown
            building.variant = Math.floor(Math.random() * 3); // Nouvelle apparence

            // Effet visuel ou notification console
            // console.log(`Upgraded building to L${building.level}`);
            engine.revision++;
        }
    }
}
