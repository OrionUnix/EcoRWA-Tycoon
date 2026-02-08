import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Protection contre le double-mount de React StrictMode
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || isInitializedRef.current) return;

        const initPixi = async () => {
            isInitializedRef.current = true;
            console.log("🎨 PixiApp: Initialisation...");

            const app = new PIXI.Application();

            // 1. Configuration Robuste
            await app.init({
                resizeTo: containerRef.current!, // S'adapte au div parent
                backgroundColor: 0x111111,       // GRIS FONCÉ (Pas noir, pour voir le canvas)
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            // 2. Attachement au DOM
            if (containerRef.current) {
                // On vide le container au cas où
                while (containerRef.current.firstChild) {
                    containerRef.current.removeChild(containerRef.current.firstChild);
                }
                containerRef.current.appendChild(app.canvas);
            }

            // 3. Configuration de la Caméra (Stage)
            // On centre le monde (0,0) au milieu de l'écran
            app.stage.x = app.screen.width / 2;
            app.stage.y = app.screen.height / 2;

            // On active le tri par profondeur globalement
            app.stage.sortableChildren = true;

            // 4. Sauvegarde des références
            appRef.current = app;
            stageRef.current = app.stage;

            console.log("✅ PixiApp: Prêt ! Dimensions:", app.screen.width, "x", app.screen.height);
            setIsReady(true);
        };

        initPixi();

        // Cleanup
        return () => {
            if (appRef.current) {
                console.log("🗑️ PixiApp: Destruction");
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []);

    return { appRef, stageRef, isReady };
}