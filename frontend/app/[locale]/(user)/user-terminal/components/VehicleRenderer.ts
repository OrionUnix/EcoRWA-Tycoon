import * as PIXI from 'pixi.js';
import { VehicleAssets } from '../engine/VehicleAssets';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, SURFACE_Y_OFFSET } from '../engine/config';

export const VEHICLE_SCALE = 0.3; // Constante modifiable pour l'échelle globale des véhicules

const globalForVehicles = globalThis as unknown as { vehicleCache: Map<number, PIXI.Sprite> };
if (!globalForVehicles.vehicleCache) {
    globalForVehicles.vehicleCache = new Map<number, PIXI.Sprite>();
}
const vehicleCache = globalForVehicles.vehicleCache;

export class VehicleRenderer {

    static drawVehicles(container: PIXI.Container, engine: MapEngine, zoomLevel: number) {
        if (!engine.vehicles) return;

        // DEBUG: Vérifier le nombre de véhicules
        // Removed console log to avoid spam

        // 1. Mark all as unused (to detect deletions)
        const activeIds = new Set<number>();

        engine.vehicles.forEach(car => {
            activeIds.add(car.id);
            let sprite = vehicleCache.get(car.id);

            // CREATE or RESET if destroyed
            if (!sprite || sprite.destroyed) {
                sprite = new PIXI.Sprite();
                sprite.anchor.set(0.5, 0.7); // Anchor at bottom centerish
                // ✅ FORCE SCALE (Fix Gigantic Cars)
                sprite.scale.set(VEHICLE_SCALE);
                container.addChild(sprite);
                vehicleCache.set(car.id, sprite);
            }

            // UPDATE
            if (sprite && !sprite.destroyed) {
                // Ensure parent is correct (fix for re-mount/reload)
                if (sprite.parent !== container) {
                    container.addChild(sprite);
                }

                const screenPos = gridToScreen(car.x, car.y);
                const px = screenPos.x + (car.offsetX || 0) * TILE_WIDTH;
                const py = screenPos.y + (car.offsetY || 0) * TILE_HEIGHT;

                sprite.x = px;
                sprite.y = py + (SURFACE_Y_OFFSET); // ✅ Correction Verticale

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

                if (texture) { // ✅ Correction TS : retrait de .valid
                    sprite.texture = texture;
                    sprite.tint = 0xFFFFFF; // Reset tint
                } else {
                    // 🚨 FALLBACK VISUALIZATION (Carré Rouge si pas de texture)
                    // console.warn(`🚗 Texture manquante pour véhicule ${car.id}, utilisation fallback.`);
                    sprite.texture = PIXI.Texture.WHITE;
                    sprite.tint = 0xFF0000;
                    sprite.width = 16;
                    sprite.height = 16;
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
