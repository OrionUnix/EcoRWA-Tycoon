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

    const THRESHOLD = 0.01;

    // Helper pour assigner les données
    const setRes = (val: number, cap: number, key: string, unit: string, t: number) => {
        value = val;
        amount = Math.floor(val * cap);
        resourceKey = key;
        unitKey = unit;
        tech = t;
    };

    // 1. Logique Prioritaire : Si on est dans un mode spécifique, on ne montre QUE ça
    if (viewMode === 'OIL' && oil[index] > THRESHOLD) setRes(oil[index], MAX_CAPACITY.OIL, 'oil', 'barrel', 3);
    else if (viewMode === 'COAL' && coal[index] > THRESHOLD) setRes(coal[index], MAX_CAPACITY.COAL, 'coal', 'ton', 2);
    else if (viewMode === 'IRON' && iron[index] > THRESHOLD) setRes(iron[index], MAX_CAPACITY.IRON, 'iron', 'ton', 3);
    else if (viewMode === 'WOOD' && wood[index] > THRESHOLD) setRes(wood[index], MAX_CAPACITY.WOOD, 'wood', 'm3', 1);
    else if (viewMode === 'WATER' && water[index] > 0) setRes(water[index], MAX_CAPACITY.WATER, 'water', 'liter', 1);
    else if (viewMode === 'FOOD') {
        if (fish[index] > THRESHOLD) setRes(fish[index], MAX_CAPACITY.FISH, 'fish', 'unit', 1);
        else if (animals[index] > THRESHOLD) setRes(animals[index], MAX_CAPACITY.GAME, 'game', 'head', 1);
    }

    // 2. Logique 'ALL' (Satellite) ou 'BUILD_ROAD' ou 'BULLDOZER' : On montre ce qu'il y a de plus important sur la tuile
    else if (viewMode === 'ALL' || viewMode === 'BUILD_ROAD' || viewMode === 'BULLDOZER') {
        // Priorité d'affichage
        if (oil[index] > THRESHOLD) setRes(oil[index], MAX_CAPACITY.OIL, 'oil', 'barrel', 3);
        else if (coal[index] > THRESHOLD) setRes(coal[index], MAX_CAPACITY.COAL, 'coal', 'ton', 2);
        else if (iron[index] > THRESHOLD) setRes(iron[index], MAX_CAPACITY.IRON, 'iron', 'ton', 3);
        else if (wood[index] > THRESHOLD) setRes(wood[index], MAX_CAPACITY.WOOD, 'wood', 'm3', 1);
        else if (water[index] > 0) setRes(water[index], MAX_CAPACITY.WATER, 'water', 'liter', 1);
        else if (fish[index] > THRESHOLD) setRes(fish[index], MAX_CAPACITY.FISH, 'fish', 'unit', 1);
        else if (animals[index] > THRESHOLD) setRes(animals[index], MAX_CAPACITY.GAME, 'game', 'head', 1);
    }

    if (!resourceKey) return null;

    return { value, amount, resourceKey, unitKey, techReq: tech };
}