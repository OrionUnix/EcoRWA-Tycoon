import * as PIXI from 'pixi.js';
import { getGameEngine } from '../GameEngine';
import { loadBiomeTextures, clearBiomeTextures } from '../BiomeAssets';
import { ResourceAssets } from '../ResourceAssets';
import { RoadAssets } from '../RoadAssets';
import { VehicleAssets } from '../VehicleAssets';
import { BuildingAssets } from '../BuildingAssets';
import { VehicleRenderer } from '../../components/VehicleRenderer';
import { BuildingRenderer } from '../BuildingRenderer';
import { ResourceRenderer } from '../ResourceRenderer';
import { resetGameRenderer } from '../../components/GameRenderer';

export const AssetLoader = {
    async initAssets(
        app: PIXI.Application | null,
        viewport: any,
        terrainContainer: PIXI.Container | null,
        userWallet: string | undefined,
        setAssetsLoaded: (v: boolean) => void,
        setIsReloading: (v: boolean) => void,
        setSummary: (summary: any) => void
    ) {
        if (viewport) {
            const center = viewport.center;
            getGameEngine().saveCameraState(center.x, center.y, viewport.scaled);
        }

        setIsReloading(true);

        clearBiomeTextures();
        ResourceAssets.clear();
        RoadAssets.clear();
        VehicleAssets.clear();
        VehicleRenderer.clearAll();
        BuildingRenderer.clearCache();

        if (terrainContainer) {
            ResourceRenderer.clearAll(terrainContainer);
        }

        resetGameRenderer();

        try {
            console.log("🚀 AssetLoader: Démarrage du chargement des assets...");
            if (!app) throw new Error("App Pixi non initialisée");

            const { loadStandaloneTreeTextures } = await import('../ResourceRenderer');

            await Promise.all([
                loadBiomeTextures(app),
                ResourceAssets.load(app),
                RoadAssets.load(app),
                VehicleAssets.load(app),
                BuildingAssets.load(),
                loadStandaloneTreeTextures(),
            ]);

            console.log("✅ AssetLoader: Tous les assets sont chargés.");

            const engine = getGameEngine();
            const walletToUse = userWallet || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

            if (engine.map.revision === 0) {
                engine.map.generateWorld(walletToUse);
                engine.map.calculateSummary();
            }

            setSummary(engine.map.currentSummary);
            setAssetsLoaded(true);
            engine.map.revision++;
            setIsReloading(false);

        } catch (err) {
            console.error("❌ AssetLoader: Erreur lors du chargement des assets:", err);
            setIsReloading(false);
        }
    },

    cleanup() {
        clearBiomeTextures();
        BuildingRenderer.clearCache();
    }
};
