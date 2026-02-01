
import { ZONE_TYPES } from '@/components/editor/config/zoneAssets';

export interface ZoneData {
    x: number;
    z: number;
    type: string;
    id: number;
    buildingId?: number; // 🆕 ID du bâtiment depuis core-buildings.json
}

export const INITIAL_CITY_LAYOUT = {
    roadNetwork: new Map<string, { x: number, z: number }>(),
    riverNetwork: new Map<string, { x: number, z: number }>(),
    zones: new Map<string, ZoneData>(),
    props: new Map<string, { x: number, z: number, type: string, model: string }>()
};

const addRoad = (x: number, z: number) => {
    INITIAL_CITY_LAYOUT.roadNetwork.set(`${x},${z}`, { x, z });
};

const addZone = (x: number, z: number, type: string, id: number, buildingId?: number) => {
    INITIAL_CITY_LAYOUT.zones.set(`${x},${z}`, { x, z, type, id, buildingId });
};

const initLayout = () => {
    // 1. ROADS - Grid principal
    const mainRoads = [-10, 0, 10];

    mainRoads.forEach(x => {
        for (let z = -20; z <= 20; z += 2) {
            addRoad(x, z);
        }
    });

    mainRoads.forEach(z => {
        for (let x = -20; x <= 20; x += 2) {
            addRoad(x, z);
        }
    });

    // 2. TEST BUILDINGS - Coordonnées manuelles
    // Format: addZone(x, z, type, uniqueId, buildingId from core-buildings.json)

    // Building 1: Loft Saint-Germain (id:1) à [15, 15]
    addZone(15, 15, 'RES', 1, 1);

    // Building 2: Bistrot Central (id:2) à [-15, 10]
    addZone(-15, 10, 'COM', 2, 2);

    // Building 3: Eco-Tower 2030 (id:3) à [15, -15]
    addZone(15, -15, 'MIXED', 3, 3);

    // Building 4: Loft Saint-Germain (id:1) à [-15, -10]
    addZone(-15, -10, 'RES', 4, 1);

    // Building 5: Bistrot Central (id:2) à [0, 15]
    addZone(0, 15, 'COM', 5, 2);

    // Building 6: Eco-Tower 2030 (id:3) à [0, -15]
    addZone(0, -15, 'MIXED', 6, 3);
};

initLayout();
