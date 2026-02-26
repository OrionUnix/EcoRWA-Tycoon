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

        const roadContainer = new PIXI.Container();
        roadContainer.zIndex = 20;
        roadContainer.label = "roadContainer";
        roadContainer.sortableChildren = true;

        const buildingContainer = new PIXI.Container();
        buildingContainer.zIndex = 30;
        buildingContainer.label = "buildingContainer";
        buildingContainer.sortableChildren = true;

        const vehicleContainer = new PIXI.Container();
        vehicleContainer.zIndex = 40;
        vehicleContainer.label = "vehicleContainer";
        vehicleContainer.sortableChildren = true;

        const fxContainer = new PIXI.Container();
        fxContainer.zIndex = 100;
        fxContainer.label = "fxContainer";
        fxContainer.sortableChildren = true;

        terrain.addChild(terrainContainer, zoneContainer, roadContainer, buildingContainer, vehicleContainer, fxContainer);

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

        if (engine.lastCameraPosition) {
            console.log("🔄 Restauration de la caméra...", engine.lastCameraPosition);
            viewport.moveCenter(engine.lastCameraPosition.x, engine.lastCameraPosition.y);
            viewport.setZoom(engine.lastZoom);
        } else {
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
    }
};
