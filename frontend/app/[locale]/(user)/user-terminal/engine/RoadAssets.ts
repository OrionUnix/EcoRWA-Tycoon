import * as PIXI from 'pixi.js';
import { asset } from '../utils/assetUtils';
import { RoadType } from './types'; // Assure-toi d'importer l'enum RoadType

export class RoadAssets {
    private static _loaded = false;
    public static textures: Map<string, PIXI.Texture> = new Map();

    static async load() {
        if (this._loaded) return;

        // 1. Définition des dossiers pour chaque type de route
        // Clé = RoadType (enum), Valeur = Nom du dossier dans /public/assets/...
        const TYPE_DIRS: Record<string, string> = {
            [RoadType.DIRT]: 'Dirt',         // Dossier "Dirt"
            [RoadType.ASPHALT]: 'asphalt',   // Dossier "asphalt" (minuscule selon ton info)
            [RoadType.AVENUE]: 'Avenue',     // Dossier "Avenue"
            [RoadType.HIGHWAY]: 'Autoroute'  // Dossier "Autoroute"
        };

        // 2. Liste des fichiers communs à tous les dossiers
        const files: Record<string, string> = {
            'roadNS': 'roadNS.png',
            'roadEW': 'roadEW.png',
            'roadNE': 'roadNE.png',
            'roadNW': 'roadNW.png',
            'roadES': 'roadES.png', 
            'roadSW': 'roadSW.png',
            'roadTE': 'crossroadNES.png', 
            'roadTN': 'crossroadNEW.png',
            'roadTS': 'crossroadESW.png',
            'roadTW': 'crossroadNSW.png',
            'crossroad': 'crossroad.png',
            'endN': 'endN.png',
            'endS': 'endS.png',
            'endE': 'endE.png',
            'endW': 'endW.png'
        };

        const promises: Promise<void>[] = [];

        // 3. Boucle sur chaque type de route (Dirt, Asphalt...)
        for (const [type, folderName] of Object.entries(TYPE_DIRS)) {
            
            // Boucle sur chaque fichier (NS, EW...)
            for (const [key, filename] of Object.entries(files)) {
                
                // Chemin : /assets/isometric/Spritesheet/roads/Dirt/roadNS.png
                const path = asset(`/assets/isometric/Spritesheet/roads/${folderName}/${filename}`);
                
                // Clé unique pour le cache : "DIRT_roadNS", "ASPHALT_roadNS", etc.
                const uniqueKey = `${type}_${key}`;

                const p = PIXI.Assets.load(path).then(texture => {
                    if (texture) {
                        this.textures.set(uniqueKey, texture);
                    }
                }).catch(e => {
                    console.warn(`⚠️ Texture manquante : ${folderName}/${filename}`);
                });

                promises.push(p);
            }
        }

        await Promise.all(promises);
        this._loaded = true;
        console.log("✅ All Road Types Loaded");
    }

    /**
     * Récupère une texture spécifique selon le type de route et la forme.
     * ex: getTexture(RoadType.DIRT, 'roadNS')
     */
    static getTexture(type: RoadType, name: string): PIXI.Texture | undefined {
        const key = `${type}_${name}`;
        return this.textures.get(key);
    }
}