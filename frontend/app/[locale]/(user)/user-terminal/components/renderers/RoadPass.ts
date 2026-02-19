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

        const roadContainer = this.roadRenderer.getContainer();
        roadContainer.zIndex = 0.5; // Au dessus du tilemap (0), en dessous des objets (1+)
        if (roadContainer.parent !== container) {
            container.addChild(roadContainer);
        }

        try {
            this.roadRenderer.render(engine);
            // DEBUG: Verify road rendering
            const cacheSize = (this.roadRenderer as any).roadCache?.size || 0;
            if (cacheSize > 0) {
                console.log(`🛣️ [RoadPass] ${cacheSize} routes rendues, container children: ${roadContainer.children.length}`);
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
