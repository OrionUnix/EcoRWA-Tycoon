import { MapEngine } from '../MapEngine';
import { RoadManager } from '../RoadManager';
import { BuildingManager } from '../BuildingManager';
import { ZoneManager } from '../ZoneManager';
import { PopulationManager } from './PopulationManager';
import { BuildingType, BUILDING_SPECS, BUILDING_COSTS } from '../types';
import { CHUNK_SIZE } from '../config';
import { ResourceRenderer } from '../ResourceRenderer';
import { WildlifeRenderer } from '../WildlifeRenderer';
import { BuildingRenderer } from '../BuildingRenderer';
import { ChunkManager } from '../ChunkManager';
import { globalWorld } from '../ecs/world';
import { addEntity, addComponent, removeEntity } from 'bitecs';
import { Building } from '../ecs/components/Building';
import { Position } from '../ecs/components/Position';
import { useTutorialStore } from '../../hooks/useTutorialStore';
import { DORA_TUTORIAL_STEPS } from '../../components/ui/npcs/TutorialScript';
import { SaveSystem } from '../systems/SaveSystem';

export class InteractionSystem {
    /**
     * Gère les interactions utilisateur (Click, Drag & Drop)
     */
    static handleInteraction(map: MapEngine, index: number, mode: string, path: number[] | null, type: any): { success: boolean, placedType?: string } {

        // ✅ CHUNK CHECK : Bloque toute interaction sur un chunk verrouillé

        const checkIndex = (mode === 'BUILD_ROAD' && path && path.length > 0) ? path[0] : index;
        const col = checkIndex % map.config.size;
        const row = Math.floor(checkIndex / map.config.size);
        if (!ChunkManager.isTileUnlocked(col, row)) {
            const { cx, cy } = ChunkManager.getChunkCoords(col, row);

            // Collect resources present in this chunk to show in the modal
            const resources: string[] = [];
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const endX = startX + CHUNK_SIZE;
            const endY = startY + CHUNK_SIZE;

            // Simple scan for resources in this chunk
            const foundRes = new Set<string>();
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const idx = y * map.config.size + x;
                    if (map.resourceMaps.coal[idx] > 0.1) foundRes.add('coal');
                    if (map.resourceMaps.iron[idx] > 0.1) foundRes.add('iron');
                    if (map.resourceMaps.gold[idx] > 0.1) foundRes.add('gold');
                    if (map.resourceMaps.wood[idx] > 0.1) foundRes.add('wood');
                    if (map.resourceMaps.stone[idx] > 0.1) foundRes.add('stone');
                    if (map.resourceMaps.silver[idx] > 0.1) foundRes.add('silver');
                    if (map.resourceMaps.oil[idx] > 0.1) foundRes.add('oil');
                }
            }

            window.dispatchEvent(new CustomEvent('open_land_purchase', {
                detail: {
                    id: `${cx}_${cy}`,
                    cx, cy, // Essential for dynamic detection
                    price: ChunkManager.getUnlockCost(cx, cy),
                    resources: Array.from(foundRes)
                }
            }));

            return { success: false };
        }

        // --- CONSTRUCTION ROUTE (Drag & Drop) ---
        if (mode === 'BUILD_ROAD' && path && path.length > 0) {
            // Signal au tutoriel que l'outil est bien utilisé (pour le masquer si besoin)
            useTutorialStore.getState().advanceTutorial('SELECT_ROAD_TOOL');

            this.handleRoadConstruction(map, path, type);
            return { success: true, placedType: 'ROAD' };
        }

        // --- BULLDOZER ---
        else if (mode === 'BULLDOZER') {
            this.handleBulldozer(map, index);
            return { success: true, placedType: 'BULLDOZER' };
        }

        // --- ZONAGE ---
        else if (mode === 'ZONE') {
            useTutorialStore.getState().advanceTutorial('SELECT_ZONE_TOOL');
            this.handleZoning(map, index, type);
            return { success: true, placedType: 'ZONE' };
        }

        // --- CONSTRUCTION BUILDING ---
        else if (mode.startsWith('BUILD_')) {
            return this.handleBuildingConstruction(map, index, mode);
        }

        return { success: false };
    }

    private static handleRoadConstruction(map: MapEngine, path: number[], type: any) {
        // --- LOGIQUE TUTORIEL ROAD ADJACENCY ---
        const tutorial = useTutorialStore.getState();
        if (tutorial.isActive) {
            const currentStep = DORA_TUTORIAL_STEPS[tutorial.currentStepIndex];
            if (currentStep.waitForAction === 'BUILD_ROAD_CONNECTED') {
                // Vérifier si AU MOINS UNE tuile du tracé touche une route existante via MapEngine.checkRoadAdjacency
                let isConnected = false;
                for (const idx of path) {
                    if (map.checkRoadAdjacency(idx)) {
                        isConnected = true;
                        break;
                    }
                }

                if (!isConnected) {
                    // ÉCHEC : Dora réapparaît avec erreur
                    tutorial.failAction('error_road_isolated');
                    return;
                }
            }
        }

        const { cost, valid } = RoadManager.calculateCost(map, path, type);

        // Vérification Argent
        if (map.resources.money >= cost) {
            map.resources.money -= cost;

            path.forEach(idx => {
                // 1. 🚜 RÈGLE D'OR : LA ROUTE DÉTRUIT TOUT (Bulldozer automatique)
                // Si un bâtiment ou une zone est sur le chemin, on appelle le bulldozer pour détruire, rembourser et nettoyer l'ECS
                if (map.buildingLayer[idx] || map.zoningLayer[idx]) {
                    this.handleBulldozer(map, idx);
                }

                // 2. 🪓 NETTOYAGE DE LA NATURE (Données + Visuel)
                // On met les données de ressources de surface à 0 pour éviter qu'elles ne repoussent
                if (map.resourceMaps.wood) map.resourceMaps.wood[idx] = 0;
                if (map.resourceMaps.stone) map.resourceMaps.stone[idx] = 0;

                // Suppression visuelle instantanée
                ResourceRenderer.removeResourceAt(idx);
                WildlifeRenderer.removeWildlifeAt(idx, map);

                // 3. 🛣️ POSE DE LA ROUTE
                const existing = map.roadLayer[idx];
                if (!existing || existing.type !== type) {
                    const isWater = map.getLayer(1)[idx] > 0.3; // 1 = Elevation/Water layer usually
                    const roadData = RoadManager.createRoad(type, isWater, false);

                    map.placeRoad(idx, roadData);

                    // 4. IMPACT ENVIRONNEMENT & PATHFINDING
                    RoadManager.applyEnvironmentalImpact(map, idx);
                    RoadManager.updateConnections(map, idx);
                }
            });

            if (tutorial.isActive) {
                const currentStep = DORA_TUTORIAL_STEPS[tutorial.currentStepIndex];
                if (currentStep.waitForAction === 'BUILD_ROAD_CONNECTED') {
                    tutorial.advanceTutorial('BUILD_ROAD_CONNECTED');
                }
            }

            map.calculateSummary();
            map.revision++;
            SaveSystem.markAsDirty(); // 💾 Marquer pour sauvegarde cloud
        }
    }

    private static calculateSalvage(map: MapEngine, idx: number) {
        const building = map.buildingLayer[idx];
        const zone = map.zoningLayer[idx];

        if (building) {
            const specs = BUILDING_SPECS[building.type];
            if (specs) {
                // Rembourse 50% de l'investissement initial
                map.resources.money += Math.floor(specs.cost * 0.5);

                // Bonus spécifique pour les bâtiments d'extraction (Mines, Bois, Pierre)
                if (building.type === BuildingType.MINE || building.type === BuildingType.OIL_PUMP || building.type === BuildingType.OIL_RIG) {
                    map.resources.wood += 20;
                    map.resources.stone += 20;
                } else if (building.type === BuildingType.LUMBER_HUT) {
                    map.resources.wood += 50;
                }
            }
        }

        if (zone) {
            const costConfig = BUILDING_COSTS[zone.type];
            if (costConfig && costConfig[zone.level]) {
                const costs = costConfig[zone.level];

                // Rembourse 50% de toutes les ressources utilisées pour ce niveau
                if (costs.money) map.resources.money += Math.floor(costs.money * 0.5);
                if (costs.wood) map.resources.wood += Math.floor(costs.wood * 0.5);
                if (costs.concrete) map.resources.concrete += Math.floor(costs.concrete * 0.5);
                if (costs.glass) map.resources.glass += Math.floor(costs.glass * 0.5);
                if (costs.steel) map.resources.steel += Math.floor(costs.steel * 0.5);
            }
        }
    }

    private static handleBulldozer(map: MapEngine, idx: number) {
        let destroyedSomething = false;

        // 1. Remboursement (Mission 2)
        this.calculateSalvage(map, idx);

        // 2. Nettoyage Route
        if (map.roadLayer[idx]) {
            map.removeRoad(idx);
            map.resources.money += 5; // Remboursement partiel supplémentaire pour la route
            RoadManager.updateConnections(map, idx); // Update voisins + Pathfinding
            destroyedSomething = true;
        }

        // 3. Nettoyage Bâtiment (Mission 1)
        if (map.buildingLayer[idx]) {
            const building = map.buildingLayer[idx];
            if (building) {
                const specs = BUILDING_SPECS[building.type];
                if (specs) {
                    PopulationManager.onBuildingRemoved(specs);
                }
                // ✅ ECS REMOVAL
                if (building.eid !== undefined) {
                    removeEntity(globalWorld, building.eid);
                    console.log(`🗑️ ECS Entity ${building.eid} removed.`);
                }
            }
            map.buildingLayer[idx] = null;
            map.revision++;
            destroyedSomething = true;
        }

        // 4. Nettoyage Zone (Mission 1)
        if (map.zoningLayer[idx] !== null) {
            const zoneData = map.zoningLayer[idx];
            if (zoneData) {
                PopulationManager.onZoneRemoved(zoneData);
            }
            map.zoningLayer[idx] = null;
            map.revision++;
            destroyedSomething = true;
        }

        // 5. FX de destruction (Mission 3)
        if (destroyedSomething) {
            BuildingRenderer.playDemolitionFX(idx, map);
            // ✅ NOUVEAU: Enlever visuellement le sprite du cache après avoir joué le FX isométrique
            BuildingRenderer.removeBuilding(idx);

            // Forcer une passe système de rafraîchissement global
            map.revision++;
            SaveSystem.markAsDirty(); // 💾 Marquer pour sauvegarde cloud
        }
    }

    private static handleZoning(map: MapEngine, index: number, type: any) {
        const result = ZoneManager.placeZone(map, index, type);

        if (result.success) {
            if (result.zoneData) {
                PopulationManager.onZonePlaced(result.zoneData);
            }
            console.log(`✅ Zone ${type} créée avec succès!`);

            // Succès Tutoriel
            useTutorialStore.getState().advanceTutorial('BUILD_ZONE');
            SaveSystem.markAsDirty(); // 💾 Marquer pour sauvegarde cloud
        } else {
            // ✅ Nettoyage des erreurs : On remonte proprement le message adapté à l'Advisor
            let advisorMessage = result.message || "Impossible de développer cette zone ici.";
            if (result.message === "Doit être relié au réseau routier principal") {
                advisorMessage = "Maire, les nouveaux habitants refuseront de s'installer si cette zone n'est pas reliée au réseau routier principal !";
            }

            window.dispatchEvent(new CustomEvent('show_bob_warning', {
                detail: {
                    title: "Zonage Impossible !",
                    message: advisorMessage
                }
            }));
        }
    }

    private static handleBuildingConstruction(map: MapEngine, index: number, mode: string): { success: boolean, placedType?: string } {
        const buildingTypeStr = mode.replace('BUILD_', '');
        const buildingType = buildingTypeStr as BuildingType;

        // Validation du type de bâtiment
        if (!Object.values(BuildingType).includes(buildingType)) {
            console.error(`❌ Type de bâtiment invalide: ${buildingTypeStr}`);
            return { success: false };
        }

        const specs = BUILDING_SPECS[buildingType];

        // Validation des ressources (Mission 3)
        if (specs.resourceCost) {
            for (const [res, amount] of Object.entries(specs.resourceCost)) {
                if (((map.resources as any)[res] || 0) < amount) {
                    if (res === 'money') {
                        // ✅ MISSION 2 : Remplacer l'erreur native par le système d'Advisor (Nancy)
                        window.dispatchEvent(new CustomEvent('advisor-message', {
                            detail: { id: 'insufficient_funds' }
                        }));
                    } else {
                        console.warn(`❌ Construction impossible: Pas assez de ${res}`);
                    }
                    return { success: false };
                }
            }
        }

        // Tentative de placement
        const result = BuildingManager.placeBuilding(map, index, buildingType);

        if (result.success) {
            // Déduction des ressources (Mission 3)
            if (specs.resourceCost) {
                for (const [res, amount] of Object.entries(specs.resourceCost)) {
                    (map.resources as any)[res] -= amount;
                }
            }
            console.log(`✅ ${specs.name} construit avec succès!`);

            // 🌟 INTÉGRATION ECS 🌟
            const eid = addEntity(globalWorld);
            addComponent(globalWorld, Building, eid);
            addComponent(globalWorld, Position, eid);

            // Initialisation des données ECS
            Building.typeId[eid] = Object.values(BuildingType).indexOf(buildingType);
            Building.status[eid] = 1; // CONSTRUCTION
            Building.progress[eid] = 0.0;

            // Position (Grid coordinates)
            const x = index % map.config.size;
            const y = Math.floor(index / map.config.size);
            Position.x[eid] = x;
            Position.y[eid] = y;

            if (map.buildingLayer[index]) {
                map.buildingLayer[index]!.eid = eid;
            }

            console.log(`⚙️ ECS Entity ${eid} created for Building.`);

            // ✅ MISSION 3 : Vérification tutoriel pour ressources de base (Bois + Mine)
            const tutorial = useTutorialStore.getState();
            if (tutorial.isActive) {
                const currentStep = DORA_TUTORIAL_STEPS[tutorial.currentStepIndex];
                if (currentStep.waitForAction === 'BUILD_BASIC_RESOURCES') {
                    // On vérifie si on a au moins une mine et un camp de bûcherons
                    let hasMine = false;
                    let hasLumber = false;
                    map.buildingLayer.forEach(b => {
                        if (!b) return;
                        if (b.type === BuildingType.MINE) hasMine = true;
                        if (b.type === BuildingType.LUMBER_HUT) hasLumber = true;
                    });

                    if (hasMine && hasLumber) {
                        tutorial.advanceTutorial('BUILD_BASIC_RESOURCES');
                    }
                }
            }

            // ✅ RETOUR SUCCÈS POUR AUTO-DESELECT
            SaveSystem.markAsDirty(); // 💾 Marquer pour sauvegarde cloud
            return { success: true, placedType: buildingType };
        } else {
            // ✅ PLUS DE console.error NI DE throw POUR ÉVITER LE CRASH DE NEXT.JS
            // On délègue le message d'erreur à l'interface utilisateur (Bob / Advisor)

            let advisorMessage = result.message || "Impossible de construire ici.";
            if (result.message === "Doit être relié au réseau routier principal") {
                advisorMessage = "Attention Maire ! Ce bâtiment doit impérativement être relié à l'autoroute principale pour fonctionner.";
            }

            window.dispatchEvent(new CustomEvent('show_bob_warning', {
                detail: {
                    title: "Construction Impossible !",
                    message: advisorMessage
                }
            }));

            return { success: false };
        }
    }
}
