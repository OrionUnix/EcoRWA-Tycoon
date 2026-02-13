import { defineSystem, IWorld } from 'bitecs';
import { GameWorld } from '../world';

export const createTimeSystem = (world: GameWorld) => {
    return defineSystem((w: IWorld) => {
        const gameWorld = w as GameWorld;
        // Ici on pourrait gérer des entités liées au temps (ex: cycle jour/nuit, buffs, cooldowns)
        // Pour l'instant on ne fait rien de spécial sur les entités, 
        // mais le système est en place pour la boucle ECS.

        // Exemple: console.log(`Delta: ${gameWorld.time.delta}`);
        return w;
    });
};
