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

            // ✅ [FIX RACE CONDITION] AssetLoader NE génère PLUS le monde.
            // La génération est la responsabilité exclusive de useGameBoot,
            // qui s'assure que le mapSeed est injecté AVANT tout appel à generateWorld().
            // AssetLoader signale juste que les textures sont prêtes.
            setSummary(null); // Le résumé sera calculé par useGameBoot après la génération.
            setAssetsLoaded(true);
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
