import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
    const appRef = useRef<PIXI.Application | null>(null);
    const stageRef = useRef<PIXI.Container | null>(null);
    const [isReady, setIsReady] = useState(false);

    // On utilise un ID unique pour chaque montage
    const mountId = useRef(Math.random());

    useEffect(() => {
        if (!containerRef.current) return;

        console.log(`🔌 [PixiApp ${mountId.current.toFixed(4)}] Montage...`);
        let isMounted = true;
        let app: PIXI.Application | null = null;

        const initPixi = async () => {
            // Si une app existe déjà, on la tue
            if (appRef.current) {
                console.warn("⚠️ Ancienne App détectée, destruction...");
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }

            app = new PIXI.Application();

            await app.init({
                resizeTo: containerRef.current!,
                backgroundColor: 0x111111, // ✅ ON REMET LE GRIS (au lieu de 0xFF0000)
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            if (!isMounted) {
                console.log("🛑 Composant démonté pendant l'init, on annule.");
                app.destroy(true);
                return;
            }

            if (containerRef.current) {
                // Vide le conteneur HTML
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(app.canvas);
            }

            // Centrage Caméra
            app.stage.x = app.screen.width / 2;
            app.stage.y = app.screen.height / 4;
            app.stage.sortableChildren = true;

            appRef.current = app;
            stageRef.current = app.stage;

            console.log(`✅ [PixiApp ${mountId.current.toFixed(4)}] Prêt.`);
            setIsReady(true);
        };

        initPixi();

        return () => {
            console.log(`🗑️ [PixiApp ${mountId.current.toFixed(4)}] Démontage.`);
            isMounted = false;
            setIsReady(false);
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, []);

    return { appRef, stageRef, isReady };
}