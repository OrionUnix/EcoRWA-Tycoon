import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { RoadRenderer } from '../RoadRenderer';

/**
 * RoadPass — Gère le RoadRenderer et son conteneur
 * Responsabilité unique : rendu des routes (lifecycle + Z-index)
 */
export class RoadPass {
    private static roadRenderer: RoadRenderer | null = null;

    static render(container: PIXI.Container, engine: MapEngine) {
        if (!this.roadRenderer) {
            this.roadRenderer = new RoadRenderer();
        }

        try {
            this.roadRenderer.render(engine, container);
            // DEBUG: Verify road rendering
            const cacheSize = (this.roadRenderer as any).roadCache?.size || 0;
            if (cacheSize > 0) {
                console.log(`🛣️ [RoadPass] ${cacheSize} routes rendues dans le container: ${container.label}`);
            }
        } catch (error) {
            console.error("🚨 [RoadPass] RoadRenderer error:", error);
        }
    }

    static clear() {
        if (this.roadRenderer) {
            this.roadRenderer.destroy();
            this.roadRenderer = null;
        }
    }
}
