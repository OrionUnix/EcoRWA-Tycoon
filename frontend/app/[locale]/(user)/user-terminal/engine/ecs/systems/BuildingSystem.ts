import { defineSystem, defineQuery, IWorld } from 'bitecs';
import { GameWorld } from '../world';
import { Building } from '../components/Building';

export const createBuildingSystem = (world: GameWorld) => {
    // Query pour trouver tous les bâtiments
    const buildingQuery = defineQuery([Building]);

    return defineSystem((w: IWorld) => {
        const gameWorld = w as GameWorld;
        const dt = gameWorld.time.delta; // Temps écoulé en ms (si disponible) ou frames

        const entities = buildingQuery(w);

        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            const status = Building.status[eid];

            // SI EN CONSTRUCTION (Status = 1)
            if (status === 1) {
                // Avancer la construction
                Building.progress[eid] += 0.01; // Avance de 1% par tick (exemple)

                if (Building.progress[eid] >= 1.0) {
                    Building.progress[eid] = 1.0;
                    Building.status[eid] = 2; // ACTIVE
                    console.log(`🏗️ Bâtiment ${eid} terminé !`);
                }
            }
        }
        return w;
    });
};
