import { LayerType } from '../engine/types';

export interface ResourceInfo {
    value: number;
    amount: number;
    resourceKey: string;
    unitKey: string;
    techReq: number;
}

const MAX_CAPACITY = {
    OIL: 2000000, COAL: 500000, IRON: 300000,
    WOOD: 5000, FISH: 2000, GAME: 500, WATER: 10000000
};

export function getResourceAtTile(
    engine: any,
    index: number,
    viewMode: string
): ResourceInfo | null {

    const { oil, coal, iron, wood, animals, fish } = engine.resourceMaps;
    const water = engine.getLayer(LayerType.WATER);

    let value = 0;
    let amount = 0;
    let resourceKey = '';
    let unitKey = '';
    let tech = 0;

    // Seuil abaissé à 0.01 pour correspondre au visuel
    const THRESHOLD = 0.01;

    if (viewMode === 'OIL' && oil[index] > THRESHOLD) {
        value = oil[index];
        amount = Math.floor(value * MAX_CAPACITY.OIL);
        resourceKey = 'oil'; unitKey = 'barrel'; tech = 3;
    }
    else if (viewMode === 'COAL' && coal[index] > THRESHOLD) {
        value = coal[index];
        amount = Math.floor(value * MAX_CAPACITY.COAL);
        resourceKey = 'coal'; unitKey = 'ton'; tech = 2;
    }
    else if (viewMode === 'IRON' && iron[index] > THRESHOLD) {
        value = iron[index];
        amount = Math.floor(value * MAX_CAPACITY.IRON);
        resourceKey = 'iron'; unitKey = 'ton'; tech = 3;
    }
    else if (viewMode === 'WOOD' && wood[index] > THRESHOLD) {
        value = wood[index];
        amount = Math.floor(value * MAX_CAPACITY.WOOD);
        resourceKey = 'wood'; unitKey = 'm3'; tech = 1;
    }
    else if (viewMode === 'FOOD') {
        if (fish[index] > THRESHOLD) {
            value = fish[index];
            amount = Math.floor(value * MAX_CAPACITY.FISH);
            resourceKey = 'fish'; unitKey = 'unit'; tech = 1;
        } else if (animals[index] > THRESHOLD) {
            value = animals[index];
            amount = Math.floor(value * MAX_CAPACITY.GAME);
            resourceKey = 'game'; unitKey = 'head'; tech = 1;
        }
    }
    else if (viewMode === 'WATER' && water[index] > 0) {
        value = water[index];
        amount = Math.floor(value * MAX_CAPACITY.WATER);
        resourceKey = 'water'; unitKey = 'liter'; tech = 1;
    }

    if (!resourceKey) return null; // Si rien trouvé

    return { value, amount, resourceKey, unitKey, techReq: tech };
}