import { MapEngine } from './MapEngine';
import { BuildingSystem } from './systems/BuildingSystem';
import { TrafficSystem } from './systems/TrafficSystem';
import { RoadManager } from './RoadManager';
import { ZoneType, RoadType } from './types';

// Définition globale pour le Singleton (Hot-Reload safe)
const globalForGame = globalThis as unknown as {
    gameEngine: GameEngine | undefined;
};

export class GameEngine {
    public map: MapEngine;
    public isPaused: boolean = false;
    private tickCount: number = 0;

    constructor() {
        console.log("🚀 GameEngine: Démarrage...");
        this.map = new MapEngine();
        this.map.generateWorld();
    }

    /**
     * LA BOUCLE PRINCIPALE
     * C'est ici qu'on orchestre tout. On N'APPELLE PAS map.tick() !
     */
    public tick() {
        if (this.isPaused) return;

        // 1. TRAFIC (Rapide - Chaque frame)
        if (TrafficSystem) {
            TrafficSystem.update(this.map);
        }

        // 2. BÂTIMENTS (Moyen - Toutes les 10 frames)
        if (this.tickCount % 10 === 0) {
            BuildingSystem.update(this.map);
        }

        // 3. STATS & RESSOURCES (Lent - Toutes les 60 frames / 1 sec)
        if (this.tickCount % 60 === 0) {
            this.map.calculateSummary();
        }

        this.tickCount++;

        // On signale au MapEngine que des choses ont peut-être changé (pour le rendu)
        // (Optionnel si les sous-systèmes incrémentent déjà revision)
    }

    // --- INTERACTION ---

    public handleInteraction(pathOrIndex: number | number[], mode: string, type: any) {
        if (Array.isArray(pathOrIndex)) {
            if (mode === 'BUILD_ROAD') {
                pathOrIndex.forEach(idx => {
                    const check = RoadManager.checkTile(this.map, idx, type);
                    if (check.valid) {
                        const isWater = this.map.getLayer(1)[idx] > 0.3; // 1 = LayerType.WATER
                        const roadData = RoadManager.createRoad(type, isWater, false);

                        this.map.placeRoad(idx, roadData);
                        RoadManager.updateConnections(this.map, idx);
                    }
                });
            } else if (mode === 'ZONE') {
                pathOrIndex.forEach(idx => this.map.setZone(idx, type));
            } else if (mode === 'BULLDOZER') {
                pathOrIndex.forEach(idx => {
                    this.map.removeZone(idx);
                    this.map.removeRoad(idx);
                });
            }
        }
    }

    // Helpers pour l'UI
    public getStats() { return this.map.stats; }
    public getResources() { return this.map.resources; }
    public getPreviewPath(x1: number, y1: number, x2: number, y2: number) {
        return RoadManager.getPreviewPath(x1, y1, x2, y2);
    }
}

// SINGLETON SÉCURISÉ
export function getGameEngine(): GameEngine {
    if (!globalForGame.gameEngine) {
        globalForGame.gameEngine = new GameEngine();
    }
    return globalForGame.gameEngine;
}