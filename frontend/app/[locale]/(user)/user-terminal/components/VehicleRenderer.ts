import * as PIXI from 'pixi.js';
import { VehicleAssets } from '../engine/VehicleAssets';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT } from '../engine/config';

const vehicleCache = new Map<number, PIXI.Sprite>();

export class VehicleRenderer {

    static drawVehicles(container: PIXI.Container, engine: MapEngine, zoomLevel: number) {
        if (!engine.vehicles) return;

        // 1. Mark all as unused (to detect deletions)
        const activeIds = new Set<number>();

        engine.vehicles.forEach(car => {
            activeIds.add(car.id);
            let sprite = vehicleCache.get(car.id);

            // CREATE
            if (!sprite) {
                sprite = new PIXI.Sprite();
                sprite.anchor.set(0.5, 0.7); // Anchor at bottom centerish
                const scale = 0.5; // Adjust based on visual preference
                sprite.scale.set(scale);
                container.addChild(sprite);
                vehicleCache.set(car.id, sprite);
            }

            // UPDATE
            if (sprite) {
                const screenPos = gridToScreen(car.x, car.y);
                const px = screenPos.x + (car.offsetX || 0) * TILE_WIDTH;
                const py = screenPos.y + (car.offsetY || 0) * TILE_HEIGHT;

                sprite.x = px;
                sprite.y = py;

                // Z-Index Sorting
                // Car Z should be roughly x + y + small offset to sit above roads
                sprite.zIndex = car.x + car.y + 0.6; // 0.6 > Road(0.1) and Resource(0.5)

                // Texture Update (Animation)
                const texture = VehicleAssets.getTexture(
                    car.type,
                    car.direction || 1, // Default DOWN_RIGHT
                    Math.floor(car.frameIndex || 0),
                    car.variant || 0 // ✅ Support Variant
                );

                if (texture) {
                    sprite.texture = texture;
                    // Reset anchor/scale if texture dimensions vary? 
                    // Assuming all are 128x128 from VehicleAssets
                }
            }
        });

        // 2. Cleanup destroyed/despawned vehicles
        vehicleCache.forEach((sprite, id) => {
            if (!activeIds.has(id)) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.destroy();
                vehicleCache.delete(id);
            }
        });
    }

    static clearAll() {
        vehicleCache.forEach(sprite => {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        });
        vehicleCache.clear();
    }
}
