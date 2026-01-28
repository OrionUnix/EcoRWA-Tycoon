
import { ZONE_TYPES } from '@/components/editor/config/zoneAssets';

export interface ZoneData {
    x: number;
    z: number;
    type: string;
    id: number;
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

const addZone = (x: number, z: number, type: string, id: number) => {
    INITIAL_CITY_LAYOUT.zones.set(`${x},${z}`, { x, z, type, id });
};

const addProp = (x: number, z: number, model: string) => {
    const key = `${x},${z}`;
    if (!INITIAL_CITY_LAYOUT.props.has(key)) {
        INITIAL_CITY_LAYOUT.props.set(key, { x, z, type: 'NATURE', model });
    }
};

const initLayout = () => {
    // 1. FIXED ROAD GRID (Matching User ASCII step)
    const roadX = [-10, -5, 0, 5, 10];
    const roadZ = [-10, -6, -2, 2, 6, 10];

    roadX.forEach(x => {
        for (let z = -12; z <= 12; z += 2) addRoad(x, z);
    });
    roadZ.forEach(z => {
        for (let x = -12; x <= 12; x += 2) addRoad(x, z);
    });

    // 2. BUILDINGS (Step-aware to hug nearest road)
    const zCenters = [-8, -4, 0, 4, 8];
    const xCenters = [-8, -3, 2, 7];

    // Specific mapping to ensure types match BUILDINGS_DATA
    // Central row (z=0) must contain COM or MIXED buildings
    // Row -8: 1, 6, 10, 3 (Mixed)
    // Row -4: 5, 4, 8, 7
    // Row 0: 2 (Bistrot), 9 (Galerie), 11 (Studio), 12 (Empty/Loop)
    // Row 4: ...

    let currentId = 1;

    zCenters.forEach(z => {
        xCenters.forEach(x => {
            let type = 'RES';
            let id = currentId;

            if (z === 0) {
                type = 'COM';
                // Pick specific IDs for the COM row
                const comIds = [2, 9, 11, 3];
                const index = xCenters.indexOf(x);
                id = comIds[index] || currentId + 20;
            } else {
                type = 'RES';
                // Ensure IDs 2, 9, 11, 3 are not repeated in residential rows
                id = currentId;
                if (id === 2 || id === 3 || id === 9 || id === 11) {
                    id += 15; // Move to a unique range
                }
            }

            addZone(x, z, type, id);
            currentId++;

            // Nature & Props density
            if (type === 'COM') {
                addProp(x + 1, z, 'stone_smallH');
            } else {
                addProp(x - 1, z - 1, 'tree_oak_dark');
            }
        });
    });

    // Decorative boundaries
    addProp(-12, 0, 'tree_blocks_fall');
    addProp(12, 0, 'tree_palm');
};

initLayout();
