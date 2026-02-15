import { MapEngine } from '../MapEngine';
import { RoadManager } from '../RoadManager';
import { BuildingManager } from '../BuildingManager';
import { ZoneManager } from '../ZoneManager';
import { PopulationManager } from './PopulationManager';
import { BuildingType, BUILDING_SPECS } from '../types';
import { ResourceRenderer } from '../ResourceRenderer';
import { globalWorld } from '../ecs/world';
import { addEntity, addComponent, removeEntity } from 'bitecs';
import { Building } from '../ecs/components/Building';
import { Position } from '../ecs/components/Position';

export class InteractionSystem {
    /**
     * Gère les interactions utilisateur (Click, Drag & Drop)
     */
    static handleInteraction(map: MapEngine, index: number, mode: string, path: number[] | null, type: any) {

        // --- CONSTRUCTION ROUTE (Drag & Drop) ---
        if (mode === 'BUILD_ROAD' && path && path.length > 0) {
            this.handleRoadConstruction(map, path, type);
        }

        // --- BULLDOZER ---
        else if (mode === 'BULLDOZER') {
            this.handleBulldozer(map, index);
        }

        // --- ZONAGE ---
        else if (mode === 'ZONE') {
            this.handleZoning(map, index, type);
        }

        // --- CONSTRUCTION BUILDING ---
        else if (mode.startsWith('BUILD_')) {
            this.handleBuildingConstruction(map, index, mode);
        }
    }

    private static handleRoadConstruction(map: MapEngine, path: number[], type: any) {
        const { cost, valid } = RoadManager.calculateCost(map, path, type);

        // Vérification Argent
        if (map.resources.money >= cost) {
            map.resources.money -= cost;

            path.forEach(idx => {
                // 1. AUTO-BULLDOZER (Nettoyage)
                if (map.buildingLayer[idx]) {
                    const building = map.buildingLayer[idx];
                    if (building) {
                        const specs = BUILDING_SPECS[building.type];
                        if (specs) {
                            PopulationManager.onBuildingRemoved(specs);
                        }
                    }
                    map.buildingLayer[idx] = null;
                }
                if (map.zoningLayer[idx] !== null) {
                    const zoneData = map.zoningLayer[idx];
                    if (zoneData) {
                        PopulationManager.onZoneRemoved(zoneData);
                    }
                    map.zoningLayer[idx] = null;
                }

                // 2. POSE DE LA ROUTE
                const existing = map.roadLayer[idx];
                if (!existing || existing.type !== type) {
                    const isWater = map.getLayer(1)[idx] > 0.3; // 1 = Elevation/Water layer usually
                    const roadData = RoadManager.createRoad(type, isWater, false);

                    map.placeRoad(idx, roadData);

                    // 3. IMPACT ENVIRONNEMENT & PATHFINDING
                    RoadManager.applyEnvironmentalImpact(map, idx);
                    RoadManager.updateConnections(map, idx);
                    // ✅ SUPPRESSION VISUELLE DE L'ARBRE
                    ResourceRenderer.removeResourceAt(idx);
                }
            });

            map.calculateSummary();
            map.revision++;
        }
    }

    private static handleBulldozer(map: MapEngine, idx: number) {
        if (map.roadLayer[idx]) {
            map.removeRoad(idx);
            map.resources.money += 5; // Remboursement partiel
            RoadManager.updateConnections(map, idx); // Update voisins + Pathfinding
        }
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
        }
        if (map.zoningLayer[idx] !== null) {
            const zoneData = map.zoningLayer[idx];
            if (zoneData) {
                PopulationManager.onZoneRemoved(zoneData);
            }
            map.zoningLayer[idx] = null;
            map.revision++;
        }
    }

    private static handleZoning(map: MapEngine, index: number, type: any) {
        const result = ZoneManager.placeZone(map, index, type);

        if (result.success) {
            if (result.zoneData) {
                PopulationManager.onZonePlaced(result.zoneData);
            }
            console.log(`✅ Zone ${type} créée avec succès!`);
        } else {
            console.error(`❌ Zonage impossible: ${result.message}`);
        }
    }

    private static handleBuildingConstruction(map: MapEngine, index: number, mode: string) {
        const buildingTypeStr = mode.replace('BUILD_', '');
        const buildingType = buildingTypeStr as BuildingType;

        // Validation du type de bâtiment
        if (!Object.values(BuildingType).includes(buildingType)) {
            console.error(`❌ Type de bâtiment invalide: ${buildingTypeStr}`);
            return;
        }

        // Tentative de placement
        const result = BuildingManager.placeBuilding(map, index, buildingType);

        if (result.success) {
            const specs = BUILDING_SPECS[buildingType];
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

        } else {
            console.error(`❌ Construction impossible: ${result.message}`);
        }
    }
}
