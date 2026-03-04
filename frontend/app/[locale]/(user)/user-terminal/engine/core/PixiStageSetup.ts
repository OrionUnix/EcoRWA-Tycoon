import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { getGameEngine } from '../GameEngine';
import { GRID_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../config';

export const PixiStageSetup = {
    setupLayers(viewport: Viewport) {
        viewport.sortableChildren = true;

        const terrain = new PIXI.Container();
        terrain.sortableChildren = true;
        terrain.zIndex = 1;
        terrain.label = "worldContainer";

        const terrainContainer = new PIXI.Container();
        terrainContainer.zIndex = 0;
        terrainContainer.label = "terrainContainer";
        terrainContainer.sortableChildren = true;

        const zoneContainer = new PIXI.Graphics();
        zoneContainer.zIndex = 10;
        zoneContainer.label = "zoneContainer";

        const worldEntityContainer = new PIXI.Container();
        worldEntityContainer.zIndex = 30;
        worldEntityContainer.label = "worldEntityContainer";
        worldEntityContainer.sortableChildren = true;

        const fxContainer = new PIXI.Container();
        fxContainer.zIndex = 100;
        fxContainer.label = 'fxContainer';
        fxContainer.sortableChildren = true;

        terrain.addChild(terrainContainer, zoneContainer, worldEntityContainer, fxContainer);

        const vectorLayer = new PIXI.Graphics();
        vectorLayer.zIndex = 150;

        const uiLayer = new PIXI.Graphics();
        uiLayer.zIndex = 200;

        viewport.addChild(terrain);
        viewport.addChild(vectorLayer);
        viewport.addChild(uiLayer);

        return { terrain, terrainContainer, vectorLayer, uiLayer };
    },

    positionCamera(viewport: Viewport) {
        const engine = getGameEngine();

        // ✅ BLINDÉ : Vérification stricte avant d'appliquer les données de caméra
        // Si une coordonnée est NaN ou undefined, le viewport PixiJS s'effondre silencieusement.
        const cam = engine.lastCameraPosition;
        const zoom = engine.lastZoom;
        const cameraIsValid =
            cam !== null &&
            cam !== undefined &&
            typeof cam.x === 'number' && !isNaN(cam.x) && isFinite(cam.x) &&
            typeof cam.y === 'number' && !isNaN(cam.y) && isFinite(cam.y) &&
            typeof zoom === 'number' && !isNaN(zoom) && zoom > 0;

        if (cameraIsValid) {
            console.log("🔄 Restauration de la caméra...", cam);
            try {
                viewport.moveCenter(cam!.x, cam!.y);
                viewport.setZoom(zoom);
            } catch (e) {
                console.warn("⚠️ Erreur lors de la restauration de caméra, retour au centre.", e);
                // Laisse le bloc else s'exécuter pour le centrage par défaut
                engine.lastCameraPosition = null;
                PixiStageSetup.positionCamera(viewport); // Rappel récursif (une seule fois car lastCameraPosition = null)
                return;
            }
        } else {
            if (cam !== null && cam !== undefined) {
                console.warn("⚠️ Données caméra invalides (NaN détecté), ignorées.", cam);
                engine.lastCameraPosition = null; // Purge pour ne pas recommencer
            }

            viewport.resize(window.innerWidth, window.innerHeight);

            const midTileX = GRID_SIZE / 2;
            const midTileY = GRID_SIZE / 2;

            const isoPixelX = (midTileX - midTileY) * (TILE_WIDTH / 2);
            const isoPixelY = (midTileX + midTileY) * (TILE_HEIGHT / 2);

            console.log(`📍 Centrage RADICAL: WorldCenter=(${isoPixelX}, ${isoPixelY}) Screen=(${window.innerWidth}, ${window.innerHeight})`);

            viewport.moveCenter(isoPixelX, isoPixelY);
            viewport.setZoom(1.0);

            viewport.off('moved');
            viewport.on('moved', () => {
                const center = viewport.center;
                getGameEngine().saveCameraState(center.x, center.y, viewport.scaled);
            });
        }

        // ✅ [FIX MATH/PIXEL-PERFECT] = Anti-Sliding & Anti-Tearing
        // Intercepter TOUS les mouvements de caméra (pan/zoom)
        // et forcer webGL à dessiner sur des pixels entiers au lieu de fractions.
        // This handler is added regardless of whether camera state was restored or initialized.
        viewport.on('moved', () => {
            viewport.x = Math.round(viewport.x);
            viewport.y = Math.round(viewport.y);
        });
    }
};
