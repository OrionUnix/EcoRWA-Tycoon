import { LayerType } from '../engine/types';

export interface ResourceInfo {
    value: number;        // La valeur brute (0-1) pour la jauge
    amount: number;       // Le vrai nombre (ex: 5000)
    resourceKey: string;  // La clé de traduction 'resources.oil'
    unitKey: string;      // La clé de traduction 'units.barrel'
    techReq: number;      // Niveau technologique requis
}

// CAPACITÉS MAXIMALES PAR TUILE (Pour le réalisme)
const MAX_CAPACITY = {
    OIL: 2000000, // 2 millions de barils
    COAL: 500000, // 500k tonnes
    IRON: 300000, // 300k tonnes
    WOOD: 5000,   // 5000 m3
    FISH: 2000,   // 2000 unités
    GAME: 500,    // 500 têtes
    WATER: 10000000 // 10 millions de litres
};

export function getResourceAtTile(
    engine: any,
    index: number,
    viewMode: string
): ResourceInfo | null {

    // On récupère les valeurs brutes du moteur
    const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
    const water = engine.getLayer(LayerType.WATER);

    let value = 0;
    let amount = 0;
    let resourceKey = '';
    let unitKey = '';
    let tech = 0;

    // Logique de priorité d'affichage selon le mode de vue
    if (viewMode === 'OIL' && oil[index] > 0) {
        value = oil[index];
        amount = Math.floor(value * MAX_CAPACITY.OIL);
        resourceKey = 'oil';
        unitKey = 'barrel';
        tech = 3; // Forage profond
    }
    else if (viewMode === 'COAL' && coal[index] > 0) {
        value = coal[index];
        amount = Math.floor(value * MAX_CAPACITY.COAL);
        resourceKey = 'coal';
        unitKey = 'ton';
        tech = 2;
    }
    else if (viewMode === 'IRON' && iron[index] > 0) {
        value = iron[index];
        amount = Math.floor(value * MAX_CAPACITY.IRON);
        resourceKey = 'iron';
        unitKey = 'ton';
        tech = 3;
    }
    else if (viewMode === 'WOOD' && wood[index] > 0) {
        value = wood[index];
        amount = Math.floor(value * MAX_CAPACITY.WOOD);
        resourceKey = 'wood';
        unitKey = 'm3';
        tech = 1;
    }
    else if (viewMode === 'FOOD') {
        // En mode nourriture, on regarde ce qu'il y a
        if (fish[index] > 0) {
            value = fish[index];
            amount = Math.floor(value * MAX_CAPACITY.FISH);
            resourceKey = 'fish';
            unitKey = 'unit';
            tech = 1;
        } else if (animals[index] > 0) {
            value = animals[index];
            amount = Math.floor(value * MAX_CAPACITY.GAME);
            resourceKey = 'game';
            unitKey = 'head';
            tech = 1;
        }
    }
    else if (viewMode === 'WATER' && water[index] > 0) {
        value = water[index];
        amount = Math.floor(value * MAX_CAPACITY.WATER);
        resourceKey = 'water';
        unitKey = 'liter';
        tech = 1;
    }

    // Si rien trouvé
    if (value <= 0.05) return null;

    return { value, amount, resourceKey, unitKey, techReq: tech };
}