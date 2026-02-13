import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';

import { RoadData, RoadType, ROAD_SPECS, Vehicle, TrafficLightState, PriorityType, LayerType, VehicleType } from '../types';

export class TrafficSystem {
    private static MAX_VEHICLES = 300;
    private static SPAWN_RATE = 0.1;


    static update(engine: MapEngine) {
        // 1. Spawn
        const pop = engine.stats.population || 0;
        const targetVehicles = Math.min(this.MAX_VEHICLES, Math.floor(pop / 2) + 5);

        if (engine.vehicles.length < targetVehicles && Math.random() < this.SPAWN_RATE) {
            this.spawnVehicle(engine);
        }

        // 2. Move
        for (let i = engine.vehicles.length - 1; i >= 0; i--) {
            const car = engine.vehicles[i];

            if (car.targetIndex >= car.path.length) {
                engine.vehicles.splice(i, 1);
                continue;
            }

            const targetIdx = car.path[car.targetIndex];
            const tx = targetIdx % GRID_SIZE;
            const ty = Math.floor(targetIdx / GRID_SIZE);

            const dx = tx - car.x;
            const dy = ty - car.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // On récupère la vitesse max de la route actuelle
            const currentRoad = engine.roadLayer[targetIdx];
            // Vitesse par défaut si pas de route (bug ?) ou route de terre
            let roadSpeed = 0.5;

            if (currentRoad && ROAD_SPECS[currentRoad.type]) {
                roadSpeed = ROAD_SPECS[currentRoad.type].speed * 0.1; // Facteur d'échelle
            }

            // Accélération lissée
            const carSpeed = roadSpeed;

            if (dist < carSpeed) {
                car.x = tx;
                car.y = ty;
                car.targetIndex++;
            } else {
                car.x += (dx / dist) * carSpeed;
                car.y += (dy / dist) * carSpeed;
            }

            // --- CALCUL DE L'OFFSET (DÉCALAGE VISUEL) ---
            // Pour que les voitures roulent à droite
            if (dist > 0) {
                // Vecteur normalisé
                const ndx = dx / dist;
                const ndy = dy / dist;

                // Perpendiculaire (Droite)
                const perpX = -ndy;
                const perpY = ndx;

                // Décalage selon le type de route (plus large pour Highway)
                let laneOffset = 0.2;
                if (currentRoad && currentRoad.type === RoadType.HIGHWAY) laneOffset = 0.35;
                if (currentRoad && currentRoad.type === RoadType.AVENUE) laneOffset = 0.25;

                // Petit random pour éviter que les voitures se chevauchent parfaitement
                const variation = (car.id % 3) * 0.05;

                // Injection dans l'objet (cast any pour éviter erreur TS stricte si Vehicle n'a pas offsetX)
                (car as any).offsetX = perpX * (laneOffset + variation);
                (car as any).offsetY = perpY * (laneOffset + variation);

                // --- ROTATION (Calculée à chaque frame pour réactivité) ---
                // 0: UP_RIGHT (dx>0, dy<0)
                // 1: DOWN_RIGHT (dx>0, dy>0)
                // 2: UP_LEFT (dx<0, dy<0)
                // 3: DOWN_LEFT (dx<0, dy>0)
                if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                    if (dx > 0 && dy < 0) car.direction = 0;
                    else if (dx > 0 && dy > 0) car.direction = 1;
                    else if (dx < 0 && dy < 0) car.direction = 2;
                    else car.direction = 3;
                }

                // Animation
                car.frameIndex = (car.frameIndex + 0.2) % 4;
            }
        }
    }

    static spawnVehicle(engine: MapEngine) {
        const roads: number[] = [];
        engine.roadLayer.forEach((r, i) => { if (r) roads.push(i); });

        if (roads.length < 2) return;

        const start = roads[Math.floor(Math.random() * roads.length)];
        const end = roads[Math.floor(Math.random() * roads.length)];

        if (start === end) return;

        const path = engine.roadGraph.findPath(start, end);

        if (path && path.length > 0) {
            const sx = start % GRID_SIZE;
            const sy = Math.floor(start / GRID_SIZE);

            // Random Type
            const types = Object.values(VehicleType).filter(t => typeof t === 'string');
            const type = types[Math.floor(Math.random() * types.length)] as VehicleType;

            // Random Variant (Pour Civilian Car uniquement max 1, sinon 0)
            const variant = (type === VehicleType.CIVILIAN_CAR) ? Math.floor(Math.random() * 2) : 0;

            engine.vehicles.push({
                id: engine.nextVehicleId++,
                x: sx,
                y: sy,
                path: path,
                targetIndex: 0,
                speed: 0,
                offsetX: 0,
                offsetY: 0,
                type: type,
                direction: 1, // Default
                variant: variant,
                frameIndex: 0
            });
        }
    }
}