
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

// Helper to add roads
const addRoad = (x: number, z: number) => {
    INITIAL_CITY_LAYOUT.roadNetwork.set(`${x},${z}`, { x, z });
};

// Helper to add zone
const addZone = (x: number, z: number, type: string, id: number) => {
    INITIAL_CITY_LAYOUT.zones.set(`${x},${z}`, { x, z, type, id });
};

// Helper to add river
const addRiver = (x: number, z: number) => {
    INITIAL_CITY_LAYOUT.riverNetwork.set(`${x},${z}`, { x, z });
};

// Helper to add prop
const addProp = (x: number, z: number, model: string) => {
    INITIAL_CITY_LAYOUT.props.set(`${x},${z}`, { x, z, type: 'NATURE', model });
};

// Initialize Layout
const initLayout = () => {
    const GRID_SIZE = 2; // Road grid size
    const RIVER_GRID = 1;

    // 1. Create a logical grid of 8x8 blocks
    const roadCoordinates = [-16, -8, 0, 8, 16];

    // Vertical Roads
    roadCoordinates.forEach(x => {
        for (let z = -24; z <= 24; z += GRID_SIZE) {
            addRoad(x, z);
        }
    });

    // Horizontal Roads
    roadCoordinates.forEach(z => {
        for (let x = -16; x <= 16; x += GRID_SIZE) {
            addRoad(x, z);
        }
    });

    // 2. Place Buildings strictly adjacent to roads
    // Block [0 to 8] means centers at 2 and 6 hug roads at 0 and 8.

    // Downtown (Block [0,8] x [0,8])
    addZone(2, 2, 'COM', 3); // Hugs road at X=0, Z=0
    addZone(6, 2, 'COM', 4); // Hugs road at X=8, Z=0
    addZone(2, 6, 'COM', 5); // Hugs road at X=0, Z=8
    addZone(6, 6, 'COM', 2); // Hugs road at X=8, Z=8

    // Downtown Fillers (in the same block)
    addZone(4, 2, 'COM', 105);
    addZone(4, 6, 'COM', 106);
    addZone(2, 4, 'COM', 107);
    addZone(6, 4, 'COM', 108);

    // Residential (Block [-8, 0] x [0, 8])
    addZone(-2, 2, 'RES', 1);
    addZone(-6, 2, 'RES', 6);
    addZone(-2, 6, 'RES', 101);
    addZone(-6, 6, 'RES', 102);
    addZone(-4, 4, 'RES', 109);
    addZone(-4, 2, 'RES', 110);

    // Industrial (Block [0, 8] x [-8, 0])
    addZone(2, -2, 'IND', 7);
    addZone(6, -2, 'IND', 8);
    addZone(2, -6, 'IND', 103);
    addZone(6, -6, 'IND', 104);
    addZone(4, -4, 'IND', 113);
    addZone(2, -4, 'IND', 114);

    // Tech Park (Block [-8, 0] x [-8, 0])
    addZone(-2, -2, 'COM', 9);
    addZone(-6, -2, 'COM', 11);
    addZone(-2, -6, 'IND', 10);
    addZone(-6, -6, 'COM', 117);

    // North Residential (Block [-16, 16] x [-16, -8])
    for (let x = -14; x <= 14; x += 4) {
        addZone(x, -10, 'RES', 200 + Math.abs(x));
        addZone(x, -14, 'RES', 300 + Math.abs(x));
    }

    // 3. Add River (Far South for balance)
    for (let x = -24; x <= 24; x += RIVER_GRID) {
        addRiver(x, 20);
        addRiver(x, 21);
    }

    // 4. Add Nature (In the middle of larger blocks or empty areas)
    // Central Parks
    addProp(0, 0, 'tree_oak_dark');
    addProp(8, 0, 'tree_blocks_fall');
    addProp(-8, 0, 'tree_palm');
    addProp(0, 8, 'tree_pineRoundC');

    // Forest around river (spacing 4)
    for (let x = -24; x <= 24; x += 4) {
        addProp(x, 18, 'tree_pineRoundC');
        addProp(x + 2, 23, 'tree_blocks_fall');
    }

    // Block corners decorations
    roadCoordinates.forEach(x => {
        roadCoordinates.forEach(z => {
            if (x === 0 && z === 0) return;
            addProp(x + 1, z + 1, 'plant_bush');
        });
    });
};

initLayout();
