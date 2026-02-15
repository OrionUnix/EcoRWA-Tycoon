import * as PIXI from 'pixi.js';
import { defineQuery } from 'bitecs';
import { globalWorld } from './ecs/world'; // Removed GameWorld type if not used
import { Position } from './ecs/components/Position';
import { Renderable } from './ecs/components/Renderable';
import { Worker, WorkerType } from './ecs/components/Worker';
import { gridToScreen } from './isometric';
import { TILE_WIDTH, TILE_HEIGHT, SURFACE_Y_OFFSET } from './config';

const WORKER_COLORS: { [key: number]: number } = {
    [WorkerType.HUNTER]: 0x8B4513, // Brown
    [WorkerType.FISHERMAN]: 0x1E90FF, // Blue
    [WorkerType.LUMBERJACK]: 0xB22222 // FireBrick
};

export class WorkerRenderer {
    private static spriteCache: Map<number, PIXI.Graphics> = new Map();
    private static query = defineQuery([Worker, Position, Renderable]);

    static render(container: PIXI.Container, zoomLevel: number) {
        if (!globalWorld) return;

        const entities = this.query(globalWorld);
        const currentIds = new Set<number>();

        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            currentIds.add(eid);

            let sprite = this.spriteCache.get(eid);
            const wx = Position.x[eid];
            const wy = Position.y[eid];

            // Création si inexistant
            if (!sprite) {
                sprite = new PIXI.Graphics();
                const type = Worker.type[eid];
                const color = WORKER_COLORS[type] || 0xFFFFFF;

                // Dessin simple (Petit bonhomme)
                sprite.rect(-4, -8, 8, 8); // Base 8x8
                sprite.fill({ color: color });

                container.addChild(sprite);
                this.spriteCache.set(eid, sprite);
            }

            // Mise à jour Position
            const screenPos = gridToScreen(wx, wy);

            sprite.x = screenPos.x;
            sprite.y = screenPos.y + SURFACE_Y_OFFSET;

            // Z-Index: S'insère entre le sol et les bâtiments
            // Véhicules sont à x+y+0.6
            // Workers sont à x+y+0.7 pour être légèrement au-dessus si collision
            sprite.zIndex = Math.floor(wx) + Math.floor(wy) + 0.7;
        }

        // Nettoyage des sprites orphelins (Entités détruites)
        for (const [eid, sprite] of this.spriteCache.entries()) {
            if (!currentIds.has(eid)) {
                sprite.destroy();
                this.spriteCache.delete(eid);
            }
        }
    }

    static clear() {
        for (const sprite of this.spriteCache.values()) {
            sprite.destroy();
        }
        this.spriteCache.clear();
    }
}
