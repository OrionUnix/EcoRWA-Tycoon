/**
 * useGameBoot.ts
 *
 * 🔒 HOOK DE DÉMARRAGE VERROUILLÉ — BOOT FLOW SÉQUENTIEL GARANTI
 *
 * Ce hook est l'unique point d'entrée qui orchestre dans le bon ordre :
 *
 *   A → Wallet connecté (wagmi)
 *   B → await SaveSystem.loadFromCloud(walletAddress)
 *   C → Extraction du mapSeed (depuis sauvegarde ou génération d'une seed stable)
 *   D → engine.mapSeed = seed  → injection avant toute génération
 *   E → engine.generateWorld() → génération déterministe
 *   F → setIsReady(true)       → PixiJS peut maintenant dessiner
 *
 * GARANTIE : Aucun pixel n'est rendu avant que la seed soit injectée.
 * GARANTIE : Le moteur graphique reste en état "vide" jusqu'à la fin de F.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getMapEngine, resetMapEngine } from '../engine/MapEngine';
import { SaveSystem } from '../engine/systems/SaveSystem';
import { getGameEngine } from '../engine/GameEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BootPhase =
    | 'idle'            // Avant tout (pas de wallet et/ou pas de Pixi)
    | 'loading_save'    // Chargement de la sauvegarde cloud en cours
    | 'preloading_assets' // Chargement des textures lourdes 512x512 et atlas
    | 'generating'      // Génération du monde avec la seed correcte
    | 'restoring'       // Injection des bâtiments/routes/chunks sauvegardés
    | 'ready'           // ✅ Jeu prêt à être rendu
    | 'error';          // ❌ Erreur irrécupérable

export interface BootState {
    phase: BootPhase;
    error: string | null;
    /** true uniquement quand phase === 'ready' — utilisé comme gate pour useGameLoop */
    isReady: boolean;
    /** true si le joueur n'avait aucune sauvegarde (première connexion) */
    isNewGame: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param walletAddress  - Adresse wallet depuis wagmi (`useAccount().address`). Peut être `undefined`.
 * @param preloadAssets  - Fonction fournie par UserTerminalClient, exécutant AssetLoader.initAssets.
 */
export function useGameBoot(
    walletAddress: string | undefined | null,
    preloadAssets?: () => Promise<void>
): BootState {
    const [phase, setPhase] = useState<BootPhase>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isNewGame, setIsNewGame] = useState(false);

    // Évite les doubles exécutions en StrictMode React (Le Mutex ! 🛡️) et les re-renders
    const hasBootedRef = useRef(false);
    const currentWalletRef = useRef<string | undefined | null>(undefined);

    const boot = useCallback(async (wallet: string, preloader: () => Promise<void>) => {
        // Guard : si déjà démarré pour ce wallet, ne pas rebooter
        if (hasBootedRef.current && currentWalletRef.current === wallet) {
            console.log(`🔒 [useGameBoot] Boot déjà effectué pour ${wallet.substring(0, 8)}...`);
            return;
        }

        // Si un moteur existait (changement de wallet), on repart de zéro
        if (currentWalletRef.current && currentWalletRef.current !== wallet) {
            console.log(`🔄 [useGameBoot] Changement de wallet — Réinitialisation du moteur...`);
            resetMapEngine();
            hasBootedRef.current = false;
        }

        hasBootedRef.current = true;
        currentWalletRef.current = wallet;

        try {
            // ─────────────────────────────────────────────────────────────
            // ÉTAPE B : Chargement de la sauvegarde (avec timeout de sécurité)
            // ─────────────────────────────────────────────────────────────
            setPhase('loading_save');
            console.log(`📂 [useGameBoot] Chargement de la sauvegarde pour ${wallet.substring(0, 10)}...`);

            // ✅ TIMEOUT DE SÉCURITÉ : Si Firebase ne répond pas en 5s, on continue sans sauvegarde.
            // Cela évite que l'écran reste bloqué indéfiniment sur "Chargement...".
            const loadWithTimeout = (ms: number): Promise<any | null> => {
                const timeout = new Promise<null>((resolve) => {
                    setTimeout(() => {
                        console.warn(`⏱️ [useGameBoot] Timeout Firebase (${ms}ms) — Démarrage sans sauvegarde.`);
                        resolve(null);
                    }, ms);
                });
                return Promise.race([SaveSystem.loadFromCloud(wallet), timeout]);
            };

            const saveData = await loadWithTimeout(5000);

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE C : Extraction du mapSeed
            // La seed DOIT être déterminée ici, avant tout appel au moteur.
            // ─────────────────────────────────────────────────────────────
            let resolvedSeed: string;

            if (saveData && saveData.seed) {
                // ✅ Joueur connu : on restaure la seed de sa carte existante
                resolvedSeed = saveData.seed;
                setIsNewGame(false);
                console.log(`🔑 [useGameBoot] Seed restaurée depuis la sauvegarde : ${resolvedSeed.substring(0, 20)}...`);
            } else {
                // ✅ Nouveau joueur : la seed est dérivée de l'adresse wallet
                // CRITIQUE : On N'UTILISE PAS Math.random() ici.
                // L'adresse wallet est unique et déterministe pour ce joueur.
                resolvedSeed = wallet.toLowerCase();
                setIsNewGame(true);
                console.log(`✨ [useGameBoot] Nouvelle partie — Seed depuis identifiant : ${resolvedSeed.substring(0, 20)}...`);
            }

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE D : Injection du seed dans le moteur AVANT génération
            // ─────────────────────────────────────────────────────────────
            setPhase('generating');

            // getMapEngine() crée l'instance (allocation mémoire seule)
            // Le constructeur NE génère plus le monde (race condition fixée)
            const engine = getMapEngine();
            engine.mapSeed = resolvedSeed; // ← Injection atomique

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE D : PRÉCHARGEMENT EXPLICITE DES TEXTURES (PIXI.Assets)
            // ─────────────────────────────────────────────────────────────
            setPhase('preloading_assets');
            console.log(`🖼️ [useGameBoot] Démarrage du préchargement lourd des assets...`);
            await preloader();
            console.log(`🖼️ [useGameBoot] Préchargement terminé !`);

            console.log(`🌍 [useGameBoot] Génération du monde avec seed : "${resolvedSeed.substring(0, 20)}..."`);

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE E : Génération du monde (maintenant déterministe)
            // ─────────────────────────────────────────────────────────────
            engine.generateWorld(wallet);
            console.log(`✅ [useGameBoot] Monde généré.`);

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE E.bis : Restauration des données joueur
            // (Bâtiments, routes, zones, économie, balances RWA)
            // ─────────────────────────────────────────────────────────────
            setPhase('restoring');

            if (saveData) {
                const restored = SaveSystem.restoreIntoEngine(engine, saveData);
                if (!restored) {
                    console.warn('⚠️ [useGameBoot] Restauration partielle — sauvegarde potentiellement corrompue.');
                }
            }

            // Initialise le système de sauvegarde et active l'auto-save
            // SaveSystem.initialize() lie le moteur aux événements de mutation (ex: city_mutated)
            SaveSystem.initialize(engine);
            SaveSystem.setWalletConnected(true);

            // Le GameEngine est un singleton qui accède déjà à la map via getMapEngine().
            // On s'assure juste qu'il est instancié pour démarrer ses systèmes internes.
            getGameEngine();

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE F : Autorisation du rendu
            // ─────────────────────────────────────────────────────────────
            setPhase('ready');
            console.log('🚀 [useGameBoot] Boot complet — Rendu autorisé.');

        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ [useGameBoot] Erreur critique pendant le boot :`, err);
            setError(msg);
            setPhase('error');
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Déclencheur : réagir à la connexion/déconnexion du wallet
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // 🛑 ON BLOQUE TOUT TANT QUE PIXI N'EST PAS MONTÉ (preloadAssets undefined)
        if (!preloadAssets) return;

        // 🛑 ON BLOQUE SI L'IDENTIFIANT EST EXPLICITEMENT NULL (Start Screen en cours)
        if (walletAddress === null) return;

        if (walletAddress) {
            // WALLET CONNECTÉ → Démarrer le flux de boot séquentiel complet
            boot(walletAddress, preloadAssets);
        } else {
            // PAS DE WALLET → Mode Démo : génération sans Firebase
            if (!hasBootedRef.current) {
                hasBootedRef.current = true;
                currentWalletRef.current = undefined; // undefined = demo
                setIsNewGame(true);

                const engine = getMapEngine();
                engine.mapSeed = 'DEMO_MAP_FIXED_SEED';

                // Exécution séquentielle pour le mode démo (Async wrapper)
                (async () => {
                    try {
                        setPhase('preloading_assets');
                        await preloadAssets();

                        setPhase('generating');
                        engine.generateWorld('DEMO');
                        getGameEngine(); // Initialiser le GameEngine singleton
                        setPhase('ready');
                        console.log('🎮 [useGameBoot] Mode Démo prêt.');
                    } catch (e) {
                        setError(String(e));
                        setPhase('error');
                    }
                })();
            } else if (phase === 'ready') {
                SaveSystem.setWalletConnected(false);
                console.log('👋 [useGameBoot] Mode démo sans sauvegarde — auto-save désactivé.');
            }
        }
    }, [walletAddress, boot, preloadAssets]);

    return {
        phase,
        error,
        isReady: phase === 'ready',
        isNewGame,
    };
}
