import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';
// ✅ Import de sécurité (même si pas utilisé directement ici, utile pour le chargement)
import { ResourceAssets } from '../engine/ResourceAssets';
import { VehicleRenderer } from '../components/VehicleRenderer';
import { WorkerRenderer } from '../engine/WorkerRenderer';
import { ParticleSystem } from '../engine/systems/ParticleSystem'; // ✅ Import
import { BuildingType } from '../engine/types'; // ✅ Import BuildingType

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    terrainContainerRef: React.MutableRefObject<PIXI.Container | null>,
    staticGRef: React.MutableRefObject<PIXI.Graphics | null>,
    uiGRef: React.MutableRefObject<PIXI.Graphics | null>,
    isReady: boolean,
    isReloading: boolean,
    viewMode: string,
    cursorPos: { x: number, y: number },
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    setFps: (fps: number) => void,
    setResources: (res: any) => void,
    setStats: (stats: any) => void,
    selectedBuildingType: React.MutableRefObject<BuildingType>,
    updateECS?: (delta: number, elapsed: number) => void,
    activeResourceLayer?: string | null,
) {
    const lastRevRef = useRef(-2);
    const lastViewModeRef = useRef('FORCE_INIT');
    const lastZoomRef = useRef(1);

    // ✅ REFS FOR DYNAMIC VALUES (Prevents re-running useEffect)
    const viewModeRef = useRef(viewMode);
    const cursorPosRef = useRef(cursorPos);
    const isReloadingRef = useRef(isReloading);
    const updateECSRef = useRef(updateECS);

    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
    useEffect(() => { cursorPosRef.current = cursorPos; }, [cursorPos]);
    useEffect(() => { isReloadingRef.current = isReloading; }, [isReloading]);
    useEffect(() => { updateECSRef.current = updateECS; }, [updateECS]);

    // DataLayer resource ref (mis à jour sans re-mount du ticker)
    const activeResourceLayerRef = useRef(activeResourceLayer ?? null);
    useEffect(() => { activeResourceLayerRef.current = activeResourceLayer ?? null; }, [activeResourceLayer]);

    // ✅ EFFET 1 : GESTION DU RESIZE
    useEffect(() => {
        const app = appRef.current;
        if (!app || !app.renderer) return;

        const handleResize = () => {
            const canvas = app.canvas as HTMLCanvasElement;
            const parent = canvas?.parentElement;

            if (parent) {
                const width = parent.clientWidth;
                const height = parent.clientHeight;
                app.renderer.resize(width, height);
                app.render();
            }
        };

        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isReady]);


    // ✅ EFFET 2 : LA BOUCLE DE JEU (GAMELOOP)
    useEffect(() => {
        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine();

        // Chargement des Assets
        ResourceAssets.load();
        import('../engine/BuildingAssets').then(m => m.BuildingAssets.load());

        console.log("🎬 GameLoop: Running Loop Setup.");

        const tick = (ticker: PIXI.Ticker) => {
            if (isReloadingRef.current) return;

            if (!app || (app.renderer as any)?.destroyed || !terrainContainerRef.current || !staticGRef.current || !uiGRef.current) {
                return;
            }
            if (terrainContainerRef.current.destroyed || staticGRef.current.destroyed || uiGRef.current.destroyed) {
                return;
            }

            // 0. MISE À JOUR ECS
            if (updateECSRef.current) {
                updateECSRef.current(ticker.deltaTime, ticker.lastTime);
            }

            // 1. LOGIQUE DU MOTEUR (Trafic, Economy, etc.)
            const deltaSec = ticker.deltaMS / 1000; // Temps réel écoulé entre 2 frames
            if (engine['tick']) (engine as any).tick(deltaSec);

            // 2. RENDU
            const currentZoom = staticGRef.current.parent?.scale.x || 1.0;
            const mapData = engine.map;

            if (mapData) {
                const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.1;
                const lodCrossed =
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                const shouldRenderStatic =
                    mapData.revision !== lastRevRef.current ||
                    viewModeRef.current !== lastViewModeRef.current ||
                    zoomChanged ||
                    lodCrossed;

                if (shouldRenderStatic) {
                    const success = GameRenderer.renderStaticLayer(
                        terrainContainerRef.current,
                        staticGRef.current,
                        mapData,
                        viewModeRef.current,
                        false,
                        currentZoom,
                        activeResourceLayerRef.current,
                    );

                    if (success) {
                        lastRevRef.current = mapData.revision;
                        lastViewModeRef.current = viewModeRef.current;
                        lastZoomRef.current = currentZoom;
                    }
                }

                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    mapData,
                    cursorPosRef.current,
                    previewPathRef.current,
                    viewModeRef.current,
                    isValidBuildRef.current,
                    currentZoom,
                    selectedBuildingType.current
                );

                if (terrainContainerRef.current) {
                    const objectLayer = (terrainContainerRef.current.getChildByLabel('worldEntityContainer') as PIXI.Container) || terrainContainerRef.current;

                    // ✅ Rendu unifié dans le même calque pour le Z-Sort global
                    VehicleRenderer.drawVehicles(objectLayer, mapData, currentZoom);
                    WorkerRenderer.render(objectLayer);

                    // ✅ Tri Isométrique Conditionnel (Z-Sort)
                    // On ne trie QUE si la carte a changé (bâtiments) ou s'il y a du mouvement (TODO: flag précis)
                    const needsResort = mapData.revision !== lastRevRef.current;

                    if (objectLayer.children && needsResort) {
                        objectLayer.children.sort((a, b) => {
                            return a.zIndex - b.zIndex || (a.y + a.x / 100) - (b.y + b.x / 100);
                        });
                    }
                }
            }

            // 3. MISE À JOUR UI (React States) throttled
            if (Math.random() < 0.05) {
                setFps(Math.round(app.ticker.FPS));
                if (mapData && mapData.resources) {
                    setResources({ ...mapData.resources });
                }
                if (mapData && mapData.stats) {
                    setStats({ ...mapData.stats });
                }
            }
        };

        // Ajout explicite à la boucle Pixi
        app.ticker.add(tick);

        // Nettoyage strict garanti de ne se lancer qu'une seule fois au démontage (ou changement isReady)
        return () => {
            console.log("🛑 GameLoop: Cleaning up TICKER");
            if (app.ticker) {
                app.ticker.remove(tick);
            }
        };
    }, [isReady]); // ✅ Dépendance Unique: isReady
}