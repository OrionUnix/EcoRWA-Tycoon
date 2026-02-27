import { defineSystem, defineQuery, addEntity, addComponent, removeComponent, hasComponent, IWorld } from 'bitecs';
import { GameWorld } from '../world';
import { Building } from '../components/Building';
import { Position } from '../components/Position';
import { Worker, WorkerState, WorkerType } from '../components/Worker';
import { MoveTo } from '../components/MoveTo';
import { Renderable } from '../components/Renderable';
import { BuildingType } from '../../types';
import { GRID_SIZE } from '../../config';
import { getGameEngine } from '../../GameEngine'; // Pour accéder à la map (Biomes/Ressources)

// Configuration
const WORKER_SPEED = 0.015; // Vitesse de déplacement (cases par tick)
const GATHER_TIME = 2.0; // Temps de récolte en secondes

export const createWorkerSystem = (world: GameWorld) => {
    // Queries
    const buildingQuery = defineQuery([Building, Position]);
    const workerQuery = defineQuery([Worker, Position, Renderable]);
    const movingQuery = defineQuery([MoveTo, Position]);

    return defineSystem((w: IWorld) => {
        const gameWorld = w as GameWorld;
        const dt = gameWorld.time.delta;
        const elapsed = gameWorld.time.elapsed / 1000; // en secondes

        // 1. GESTION DES DÉPLACEMENTS (Système séparé idéalement, mais intégré pour simplicité)
        const movingEntities = movingQuery(w);
        for (let i = 0; i < movingEntities.length; i++) {
            const eid = movingEntities[i];

            const dx = MoveTo.targetX[eid] - Position.x[eid];
            const dy = MoveTo.targetY[eid] - Position.y[eid];
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Vitesse adaptée au delta time (approx 60fps)
            // WORKER_SPEED est par tick fixe, si dt varie on devrait multiplier
            // Ici on assume dt ~ 1.0

            if (dist < WORKER_SPEED) {
                // Arrivé !
                Position.x[eid] = MoveTo.targetX[eid];
                Position.y[eid] = MoveTo.targetY[eid];
                removeComponent(w, MoveTo, eid); // Stop movement
            } else {
                // On avance
                const ratio = WORKER_SPEED / dist;
                Position.x[eid] += dx * ratio;
                Position.y[eid] += dy * ratio;
            }
        }

        // 2. LOGIQUE DES TRAVAILLEURS
        const workers = workerQuery(w);
        const engine = getGameEngine();

        // 🏗️ Building Map Cache (Optimisation)
        const buildings = buildingQuery(w);
        const buildingPosMap = new Map<number, { x: number, y: number }>();
        for (let i = 0; i < buildings.length; i++) {
            const bid = buildings[i];
            buildingPosMap.set(bid, { x: Position.x[bid], y: Position.y[bid] });
        }

        for (let i = 0; i < workers.length; i++) {
            const eid = workers[i];
            const state = Worker.state[eid];

            // A. IDLE -> Chercher Ressource DANS LE RADIUS DU BÂTIMENT
            if (state === WorkerState.IDLE) {
                const homeId = Worker.homeBuildingId[eid];
                const homePos = buildingPosMap.get(homeId);

                if (homePos) {
                    // Recherche autour de la MAISON, pas du travailleur
                    const target = findNearestResource(engine, homePos.x, homePos.y, Worker.type[eid]);
                    if (target) {
                        Worker.targetResourceId[eid] = target.index;
                        Worker.state[eid] = WorkerState.MOVING_TO_RESOURCE;

                        addComponent(w, MoveTo, eid);
                        MoveTo.targetX[eid] = target.x;
                        MoveTo.targetY[eid] = target.y;
                        MoveTo.speed[eid] = WORKER_SPEED;
                    }
                }
            }
            // B. EN MOUVEMENT
            else if (state === WorkerState.MOVING_TO_RESOURCE) {
                if (!hasComponent(w, MoveTo, eid)) {
                    Worker.state[eid] = WorkerState.GATHERING;
                    Worker.timer[eid] = GATHER_TIME;
                }
            }
            // C. RÉCOLTE
            else if (state === WorkerState.GATHERING) {
                Worker.timer[eid] -= 0.016;
                if (Worker.timer[eid] <= 0) {
                    Worker.state[eid] = WorkerState.MOVING_HOME;

                    // ✅ DÉPLÉTION DE LA RESSOURCE SUR LA CARTE
                    const rIndex = Worker.targetResourceId[eid];
                    // Quantité récoltée (ex: 5 tonnes)
                    const AMOUNT_MINED = 5;

                    if (engine.map.resourceMaps) {
                        const type = Worker.type[eid];

                        if (type === WorkerType.HUNTER) {
                            // Décroissance Animaux (Un chasseur rapporte 40)
                            if (engine.map.resourceMaps.animals && engine.map.resourceMaps.animals[rIndex] > 0) {
                                engine.map.resourceMaps.animals[rIndex] = Math.max(0, engine.map.resourceMaps.animals[rIndex] - 40);
                            }
                        }
                        else if (type === WorkerType.FISHERMAN) {
                            // Décroissance Poissons (Un pêcheur rapporte 50)
                            if (engine.map.resourceMaps.fish && engine.map.resourceMaps.fish[rIndex] > 0) {
                                engine.map.resourceMaps.fish[rIndex] = Math.max(0, engine.map.resourceMaps.fish[rIndex] - 50);
                            }
                        }
                        else if (type === WorkerType.LUMBERJACK) {
                            // Décroissance Bois (Un bûcheron rapporte 40)
                            if (engine.map.resourceMaps.wood && engine.map.resourceMaps.wood[rIndex] > 0) {
                                engine.map.resourceMaps.wood[rIndex] = Math.max(0, engine.map.resourceMaps.wood[rIndex] - 40);

                                // Si plus de bois, on enlève la forêt visuellement (Biome -> Plains)
                                // et on trigger un update du Render
                                if (engine.map.resourceMaps.wood[rIndex] <= 0) {
                                    engine.map.biomes[rIndex] = 3; // PLAINS
                                }
                            }
                        }
                    }

                    // Retour Maison via Cache
                    const homeId = Worker.homeBuildingId[eid];
                    const homePos = buildingPosMap.get(homeId);

                    if (homePos) {
                        addComponent(w, MoveTo, eid);
                        // ✅ Offset pseudo-aléatoire stable pour ne pas qu'ils se superposent au centre du bâtiment
                        const angle = eid * 1.618;
                        const radius = 0.6;
                        MoveTo.targetX[eid] = homePos.x + 0.5 + Math.cos(angle) * radius;
                        MoveTo.targetY[eid] = homePos.y + 0.5 + Math.sin(angle) * radius;
                        MoveTo.speed[eid] = WORKER_SPEED;
                    } else {
                        // Maison détruite ? On tue le worker (ou idle)
                        Worker.state[eid] = WorkerState.IDLE;
                    }
                }
            }
            // D. RETOUR MAISON
            else if (state === WorkerState.MOVING_HOME) {
                if (!hasComponent(w, MoveTo, eid)) {
                    Worker.state[eid] = WorkerState.DEPOSITING;
                    Worker.timer[eid] = 1.0;
                }
            }
            // E. DÉPÔT
            else if (state === WorkerState.DEPOSITING) {
                Worker.timer[eid] -= 0.016;
                if (Worker.timer[eid] <= 0) {
                    Worker.state[eid] = WorkerState.IDLE;
                }
            }
        }

        // 3. SPAWN DES TRAVAILLEURS (Toutes les 1s check)
        // On utilise un timer global stocké quelque part ou modulo
        if (Math.round(elapsed * 60) % 60 === 0) { // Approx 1x par sec
            const buildings = buildingQuery(w);

            for (let i = 0; i < buildings.length; i++) {
                const bid = buildings[i];
                const typeId = Building.typeId[bid]; // Attention il faut mapper l'enum

                // On doit mapper l'ID type du building vers WorkerType
                // BuildingType est string dans Types.ts mais ui8 dans ECS... 
                // Il faut une map de conversion.
                // Simplification: On va assumer que Building.typeId est correct (stocké à la création)

                // On cheche si un worker existe déjà pour ce building
                let hasWorker = false;
                for (let k = 0; k < workers.length; k++) {
                    if (Worker.homeBuildingId[workers[k]] === bid) {
                        hasWorker = true;
                        break;
                    }
                }

                if (!hasWorker) {
                    // Check type et spawn
                    // On a besoin du "vrai" type string pour savoir
                    // TODO: Passer le type string dans le composant ou une map externe
                    // Pour l'instant on ne peut pas savoir le type exact via ECS seul si on a juste un ui8
                    // On va utiliser engine.buildingLayer pour récupérer le vrai type via coords

                    const bx = Math.floor(Position.x[bid]);
                    const by = Math.floor(Position.y[bid]);
                    const idx = by * GRID_SIZE + bx;
                    const bData = engine.map.buildingLayer[idx];

                    if (bData && bData.statusFlags !== 0) { // Si construit
                        let wType = -1;
                        if (bData.type === BuildingType.HUNTER_HUT) wType = WorkerType.HUNTER;
                        else if (bData.type === BuildingType.FISHERMAN) wType = WorkerType.FISHERMAN;
                        else if (bData.type === BuildingType.LUMBER_HUT) wType = WorkerType.LUMBERJACK;

                        if (wType !== -1) {
                            // Spawn Worker
                            const wid = addEntity(w);
                            addComponent(w, Position, wid);
                            addComponent(w, Renderable, wid);
                            addComponent(w, Worker, wid);

                            // ✅ Spawn avec offset
                            const angle = wid * 1.618;
                            const radius = 0.6;
                            Position.x[wid] = bx + 0.5 + Math.cos(angle) * radius;
                            Position.y[wid] = by + 0.5 + Math.sin(angle) * radius;

                            Worker.type[wid] = wType;
                            Worker.homeBuildingId[wid] = bid;
                            Worker.state[wid] = WorkerState.IDLE;

                            Renderable.scale[wid] = 1.0;
                            Renderable.visible[wid] = 1;
                            Renderable.layer[wid] = 3; // Unit layer

                            console.log(`👷 Spawn Worker ${wType} pour Bâtiment ${bid}`);
                        }
                    }
                }
            }
        }

        return w;
    });
};

// ✅ FIX: On prend MapEngine directement, pas GameEngine
function findNearestResource(map: any, x: number, y: number, type: number): { x: number, y: number, index: number } | null {
    // Si on a reçu GameEngine au lieu de MapEngine, on corrige
    if (map.map) map = map.map;

    // Rayon de recherche (Doit matcher BuildingManager)
    const RADIUS = 5;
    let nearestDist = Infinity;
    let target = null;

    const startX = Math.floor(x);
    const startY = Math.floor(y);

    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
            const cx = startX + dx;
            const cy = startY + dy;

            if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;
            const index = cy * GRID_SIZE + cx;
            const dist = dx * dx + dy * dy;

            if (dist > nearestDist) continue;

            let valid = false;

            if (type === WorkerType.HUNTER) {
                // Chercher Animal ou Forêt
                if (map.resourceMaps.animals && map.resourceMaps.animals[index] > 0) valid = true;
            } else if (type === WorkerType.FISHERMAN) {
                // Chercher Eau (avec Poisson si possible, mais eau suffit pour anim)
                if (map.getLayer(1)[index] > 0.3) valid = true;
            } else if (type === WorkerType.LUMBERJACK) {
                // Chercher Forêt ou Bois
                if (map.biomes[index] === 4) valid = true; // FOREST
                if (map.resourceMaps.wood && map.resourceMaps.wood[index] > 0) valid = true;
            }

            if (valid) {
                nearestDist = dist;
                target = { x: cx + 0.5, y: cy + 0.5, index }; // Centre de la case
            }
        }
    }
    return target;
}
