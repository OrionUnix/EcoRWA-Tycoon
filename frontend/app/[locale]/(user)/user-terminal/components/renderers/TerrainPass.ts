import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { TerrainTilemap } from '../TerrainTilemap';
import { loadGroundTextures, isGroundTexturesReady } from '../../engine/BiomeAssets';

// ═══════════════════════════════════════════════════════════
// TERRAIN PASS v2
// ═══════════════════════════════════════════════════════════
// Responsabilité : déclencher le chargement async des textures PNG
// et fournir les bounds du viewport au TerrainTilemap pour le culling.
// ═══════════════════════════════════════════════════════════

const terrainTilemap = new TerrainTilemap();

// Guard : on ne lance le chargement qu'une seule fois
let textureLoadStarted = false;

function startGroundTextureLoading(): void {
    if (textureLoadStarted || isGroundTexturesReady()) return;
    textureLoadStarted = true;
    loadGroundTextures().then(ok => {
        if (ok) {
            // Force le prochain render à reconstruire les chunks avec les vrais PNGs
            terrainTilemap.clear();
        }
    });
}

/**
 * TerrainPass — Gère le tilemap de terrain (sol, biomes).
 * Responsabilité unique : rendu du sol isométrique via TerrainTilemap.
 */
export class TerrainPass {

    static render(
        container: PIXI.Container,
        engine: MapEngine,
        viewMode: string,
        viewBounds?: PIXI.Rectangle,
    ): void {
        // Lance le chargement des textures PNG en arrière-plan si pas encore fait
        startGroundTextureLoading();

        // Calcule les bounds du viewport en espace monde si non fournis
        // (l'appelant — GameRenderer — peut les passer directement)
        const bounds = viewBounds ?? TerrainPass._getWorldBounds(container);

        terrainTilemap.render(engine, viewMode, bounds);
        const tilemapContainer = terrainTilemap.getContainer();
        tilemapContainer.zIndex = 0;

        if (tilemapContainer.parent !== container) {
            container.addChild(tilemapContainer);
        }
    }

    static clear(): void {
        terrainTilemap.clear();
    }

    /**
     * Helper : calcule le rectangle viewport en coordonnées monde via pixi-viewport.
     * Utilise getVisibleBounds() du Viewport exposé sur globalThis.__pixiViewport.
     * Fail-safe : retourne un rectangle infini (= pas de culling) si pas dispo.
     */
    private static _getWorldBounds(_container: PIXI.Container): PIXI.Rectangle {
        try {
            const vp = (globalThis as any).__pixiViewport;
            if (!vp || typeof vp.getVisibleBounds !== 'function') {
                return new PIXI.Rectangle(-999999, -999999, 1999998, 1999998);
            }

            const vpBounds: PIXI.Rectangle = vp.getVisibleBounds();
            const CULL_MARGIN = 256;
            return new PIXI.Rectangle(
                vpBounds.x - CULL_MARGIN,
                vpBounds.y - CULL_MARGIN,
                vpBounds.width + CULL_MARGIN * 2,
                vpBounds.height + CULL_MARGIN * 2,
            );
        } catch {
            return new PIXI.Rectangle(-999999, -999999, 1999998, 1999998);
        }
    }
}
