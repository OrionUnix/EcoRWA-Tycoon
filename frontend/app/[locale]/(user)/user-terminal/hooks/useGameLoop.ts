import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../components/GameRenderer';
// ✅ Import de sécurité (même si pas utilisé directement ici, utile pour le chargement)
import { ResourceAssets } from '../engine/ResourceAssets';
import { VehicleRenderer } from '../components/VehicleRenderer';
import { ParticleSystem } from '../engine/systems/ParticleSystem'; // ✅ Import
import { BuildingType } from '../engine/types'; // ✅ Import BuildingType

export function useGameLoop(
    appRef: React.MutableRefObject<PIXI.Application | null>,
    terrainContainerRef: React.MutableRefObject<PIXI.Container | null>,
    staticGRef: React.MutableRefObject<PIXI.Graphics | null>,

    uiGRef: React.MutableRefObject<PIXI.Graphics | null>,
    isReady: boolean,
    isReloading: boolean, // ✅ NOUVEAU : Bloque la boucle si rechargement
    viewMode: string,
    cursorPos: { x: number, y: number },
    previewPathRef: React.MutableRefObject<number[]>,
    isValidBuildRef: React.MutableRefObject<boolean>,
    setFps: (fps: number) => void,
    setResources: (res: any) => void,
    setStats: (stats: any) => void,
    selectedBuildingType: React.MutableRefObject<BuildingType>, // ✅ Ajout
    updateECS?: (delta: number, elapsed: number) => void // ✅ NOUVEAU: Callback ECS
) {
    const lastRevRef = useRef(-2);
    const lastViewModeRef = useRef('FORCE_INIT');
    const lastZoomRef = useRef(1);

    // ✅ EFFET 1 : GESTION DU RESIZE (Redimensionnement)
    // Cet effet gère uniquement la taille du canvas quand la fenêtre change
    useEffect(() => {
        const app = appRef.current;
        if (!app || !app.renderer) return;

        const handleResize = () => {
            // On cherche le canvas HTML pour trouver son parent
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

        // Appel initial après un court délai pour laisser le DOM se monter
        setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isReady]); // On le lance quand isReady change (donc quand app est créé)


    // ✅ EFFET 2 : LA BOUCLE DE JEU (GAMELOOP)
    useEffect(() => {
        if (!isReady || !appRef.current) return;

        const app = appRef.current;
        const engine = getGameEngine();

        // Chargement des Assets (Atlas + Routes + Bâtiments)
        ResourceAssets.load(); // Au cas où
        import('../engine/AtlasManager').then(m => m.AtlasManager.load().then(() => {
            import('../engine/BuildingAssets').then(m => m.BuildingAssets.load());
        }));

        console.log("🎬 GameLoop: Running with Resource Support.");

        const tick = (ticker: PIXI.Ticker) => {
            // ✅ SÉCURITÉ : Arrêt immédiat si l'app ou les refs sont détruites
            if (!app || (app.renderer as any)?.destroyed || !terrainContainerRef.current || !staticGRef.current || !uiGRef.current) {
                return;
            }
            if (terrainContainerRef.current.destroyed || staticGRef.current.destroyed || uiGRef.current.destroyed) {
                return;
            }

            // 0. MISE À JOUR ECS
            if (updateECS) {
                // ticker.deltaTime est en frames corrigées (1 = 60fps), 
                // ticker.lastTime est en ms
                const delta = ticker.deltaTime;
                const elapsed = ticker.lastTime;
                updateECS(delta, elapsed);
            }

            // 1. LOGIQUE DU MOTEUR (Trafic, etc.)
            // engine.tick() gère le déplacement des camions/voitures
            // Note: engine est un singleton, donc c'est bien la même instance partagée
            // Si ta classe GameEngine a une méthode update() ou tick(), appelle-la ici.
            if (engine['tick']) (engine as any).tick();


            // 2. RENDU
            const currentZoom = staticGRef.current.parent?.scale.x || 1.0;
            const mapData = engine.map; // mapData est l'instance de MapEngine

            if (mapData) {
                // Détection de changement pour redessiner la couche statique (Lourde)
                const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.1;

                // LOD (Level of Detail) : On redessine si on passe un seuil de zoom
                const lodCrossed =
                    (currentZoom < 0.6 && lastZoomRef.current >= 0.6) ||
                    (currentZoom >= 0.6 && lastZoomRef.current < 0.6) ||
                    (currentZoom > 1.2 && lastZoomRef.current <= 1.2) ||
                    (currentZoom <= 1.2 && lastZoomRef.current > 1.2);

                const shouldRenderStatic =
                    mapData.revision !== lastRevRef.current ||
                    viewMode !== lastViewModeRef.current ||
                    zoomChanged ||
                    lodCrossed;

                if (shouldRenderStatic) {
                    // ✅ RENDU STATIQUE (Sol + Arbres + Routes + Bâtiments)
                    const success = GameRenderer.renderStaticLayer(
                        terrainContainerRef.current,
                        staticGRef.current,
                        mapData,
                        viewMode,
                        false, // showGrid (tu peux passer une prop si tu veux)
                        currentZoom
                    );

                    // ✅ PROTECTION RACE CONDITION
                    // On ne valide la révision QUE si le rendu a réussi (Assets chargés)
                    // Sinon, shouldRenderStatic restera true à la prochaine frame
                    if (success) {
                        lastRevRef.current = mapData.revision;
                        lastViewModeRef.current = viewMode;
                        lastZoomRef.current = currentZoom;
                    }
                }

                // ✅ RENDU DYNAMIQUE (Curseur, Preview, Véhicules)
                // On passe le graphics UI (uiGRef) pour dessiner par-dessus tout
                GameRenderer.renderDynamicLayer(
                    uiGRef.current,
                    mapData,
                    cursorPos,
                    previewPathRef.current,
                    viewMode, // currentMode
                    isValidBuildRef.current,
                    currentZoom,
                    selectedBuildingType.current // ✅ Ajout
                );

                // ✅ RENDU VÉHICULES (Sprites)
                // Doit être fait à chaque frame pour l'animation et le mouvement
                // Maintenant on dessine dans le terrainContainer pour le tri Z (Occlusion)
                if (terrainContainerRef.current) {
                    VehicleRenderer.drawVehicles(terrainContainerRef.current, mapData, currentZoom);
                }

                // ✅ SYSTÈME DE PARTICULES
                // Initialisation si nécessaire (Idempotent)
                if (terrainContainerRef.current) {
                    // On pourrait le faire ailleurs, mais ici on est sûr d'avoir le conteneur
                    // ParticleSystem.init vérifie s'il est déjà init ou pas
                    // Mais ParticleSystem.init(container) réinitialise tout...
                    // On va le faire une fois via un flag ou dans UserTerminalClient ?
                    // Plus simple : On l'update juste ici. L'init doit être fait ailleurs.
                    // ParticleSystem.update();
                }
            }

            // 3. MISE À JOUR UI (React States)
            // On ne met à jour React que toutes les 30 frames pour ne pas tuer les perfs
            // app.ticker.lastTime est en millisecondes, on utilise un compteur simple

            // Note: Une façon simple de limiter les updates UI
            if (Math.random() < 0.05) { // ~3 fois par seconde (à 60fps)
                setFps(Math.round(app.ticker.FPS));

                // Mise à jour des ressources (Argent, Bois, etc.)
                if (mapData && mapData.resources) {
                    setResources({ ...mapData.resources });
                }

                // Mise à jour des stats (Population, Energie...)
                if (mapData && mapData.stats) {
                    setStats({ ...mapData.stats });
                }
            }
        };

        // Ajout à la boucle Pixi
        app.ticker.add(tick);

        // Nettoyage
        return () => {
            if (app.ticker) {
                app.ticker.remove(tick);
            }
        };
    }, [isReady, viewMode, cursorPos, updateECS]); // ✅ updateECS ajouté aux dépendances
}