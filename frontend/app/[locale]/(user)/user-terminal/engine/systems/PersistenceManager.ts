import { MapEngine } from '../MapEngine';
import { SaveSystem } from './SaveSystem';
import { SaveUtils } from './SaveUtils';
import { PopulationManager } from './PopulationManager';

/**
 * PersistenceManager - Gestionnaire de persistance "intelligent"
 * Gère le dirty checking par hashage et les notifications visuelles de sauvegarde.
 */
export class PersistenceManager {
    private static lastHash: string = "";
    private static isSaving: boolean = false;

    /**
     * Hash ultra-rapide pour le dirty checking
     */
    private static getHash(str: string): string {
        return str.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0).toString(36);
    }

    /**
     * Sérialise l'état actuel du jeu en un payload JSON compressé
     */
    public static serializeGame(engine: MapEngine): any {
        const totalPop = PopulationManager.getTotalPopulation();
        const totalJobs = PopulationManager.getTotalJobs();
        const unemployed = Math.max(0, totalPop - totalJobs);

        return {
            v: 5, // SAVE_VERSION
            ts: Date.now(),
            b: SaveUtils.packBuildings(engine.buildingLayer),
            r: SaveUtils.packRoads(engine.roadLayer),
            z: SaveUtils.packZones(engine.zoningLayer),
            c: SaveUtils.packChunks(),
            res: SaveUtils.packResources(engine.resourceMaps),
            rwa: SaveUtils.packRWA(engine.buildingLayer),
            eco: {
                money: (engine.resources as any).money ?? 0,
                happiness: engine.stats?.happiness ?? 80,
                totalPopulation: totalPop,
                totalJobs: totalJobs,
                unemployed: unemployed
            },
            inventory: {
                wood: engine.resources.wood || 0,
                stone: engine.resources.stone || 0,
                coal: engine.resources.coal || 0,
                iron: engine.resources.iron || 0,
                gold: engine.resources.gold || 0,
                silver: engine.resources.silver || 0,
                oil: engine.resources.oil || 0,
                food: engine.resources.food || 0,
                concrete: engine.resources.concrete || 0,
                glass: engine.resources.glass || 0,
                steel: engine.resources.steel || 0,
                undergroundWater: engine.resources.undergroundWater || 0
            }
        };
    }

    /**
     * Lance une sauvegarde automatique si des changements sont détectés
     */
    public static async autoSave(engine: MapEngine, walletAddress: string, force: boolean = false) {
        if (this.isSaving || !walletAddress) return;

        const saveData = this.serializeGame(engine);
        const currentHash = this.getHash(JSON.stringify(saveData));

        // Dirty Checking
        if (!force && currentHash === this.lastHash) {
            // console.log("✨ [PersistenceManager] Aucun changement détecté, skip auto-save.");
            return;
        }

        this.isSaving = true;
        this.showSaveIndicator(true);

        try {
            console.log("💾 [PersistenceManager] Sauvegarde en cours...");
            const result = await SaveSystem.saveToCloud(engine, walletAddress);
            if (result) {
                this.lastHash = currentHash;
                SaveSystem.clearDirty();
                console.log("✅ [PersistenceManager] Sauvegarde réussie.");
            }
        } catch (e) {
            console.error("❌ [PersistenceManager] Erreur de sauvegarde", e);
        } finally {
            // On laisse l'indicateur visible un peu pour rassurer le joueur
            setTimeout(() => {
                this.isSaving = false;
                this.showSaveIndicator(false);
            }, 2000);
        }
    }

    /**
     * Notifie l'UI via un événement global
     */
    private static showSaveIndicator(show: boolean) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('game-saving', { detail: show }));
        }
    }
}
