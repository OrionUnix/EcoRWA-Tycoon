import { createWorld, addEntity, IWorld } from 'bitecs';

// Définition du Monde ECS
// On peut étendre IWorld si on a besoin de propriétés globales (delta time, input, etc.)
export interface GameWorld extends IWorld {
    time: {
        delta: number;
        elapsed: number;
    };
    // Placeholder pour d'autres globales (Input, Config...)
}

export const createGameWorld = (): GameWorld => {
    const world = createWorld() as GameWorld;
    world.time = { delta: 0, elapsed: 0 };
    return world;
};

// Singleton ou Instance globale si besoin, 
// mais on préférera souvent passer le 'world' aux systèmes/hooks.
export const globalWorld = createGameWorld(); 
