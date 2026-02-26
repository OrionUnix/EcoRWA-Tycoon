import * as PIXI from 'pixi.js';
import { VehicleType } from './VehicleAssets';

export class ProceduralVehicles {

    /**
     * Génère un sprite de véhicule isométrique
     */
    static generateVehicle(app: PIXI.Application, type: VehicleType, color: number): PIXI.Texture {
        const g = new PIXI.Graphics();

        // Dimensions de base (Voxel style)
        const w = 24;
        const l = 40;
        const h = 16;

        // Couleur
        g.fill({ color: color });

        // Ombre portée
        g.ellipse(0, 10, 20, 10);
        g.fill({ color: 0x000000, alpha: 0.3 });

        // Corps principal
        g.roundRect(-16, -16, 32, 20, 4);
        g.fill({ color: color });

        // Toit / Vitres
        g.roundRect(-12, -22, 24, 12, 2);
        g.fill({ color: 0xDDF3F5 }); // Vitre bleutée

        // Roues
        g.circle(-14, 4, 5);
        g.fill({ color: 0x111111 });
        g.circle(14, 4, 5);
        g.fill({ color: 0x111111 });

        // Détails selon type
        if (type === VehicleType.POLICE_CRUISER) {
            // Gyrophare
            g.rect(-2, -24, 4, 2);
            g.fill({ color: 0xFF0000 }); // Rouge
        }

        // Dimensions texture (un peu plus large pour l'ombre)
        const texW = 48;
        const texH = 48;
        // On centre le graphics
        g.x = texW / 2;
        g.y = texH / 2;

        const texture = PIXI.RenderTexture.create({ width: texW, height: texH });
        app.renderer.render({ container: g, target: texture });
        g.destroy();
        return texture;
    }
}
