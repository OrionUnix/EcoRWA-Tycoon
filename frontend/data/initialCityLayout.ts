
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

    // 1. Create Roads
    // Main Avenue (Horizontal)
    for (let x = -20; x <= 20; x += GRID_SIZE) {
        addRoad(x, 0);
        addRoad(x, -10);
        addRoad(x, 10);
    }

    // Cross streets (Vertical)
    [-16, -8, 0, 8, 16].forEach(x => {
        for (let z = -10; z <= 10; z += GRID_SIZE) {
            addRoad(x, z);
        }
    });

    // 2. Place Buildings (Mapped to BUILDINGS_DATA IDs)
    // Using 4x4 increment to avoid overlaps for scale 1.5-1.6 buildings

    // Downtown (Center Blocks) - At x=4/-4 and z=4/-4 they are well away from roads at 0/8/-8 and 0/10/-10
    addZone(-4, -4, 'COM', 3); // Eco-Tower
    addZone(4, -4, 'COM', 4);  // Skyline Hub
    addZone(-4, 4, 'COM', 5);  // Hotel Riviera
    addZone(4, 4, 'COM', 2);   // Bistrot Central

    // Spread out fillers
    addZone(-4, -8, 'COM', 105);
    addZone(4, -8, 'COM', 106);
    addZone(-8, -4, 'COM', 107);
    addZone(8, -4, 'COM', 108);

    // Residential (West Loop)
    addZone(-12, -4, 'RES', 1);
    addZone(-12, 4, 'RES', 6);
    addZone(-12, -8, 'RES', 101);
    addZone(-12, 8, 'RES', 102);

    // Industrial (East Loop)
    addZone(12, -4, 'IND', 7);
    addZone(12, 4, 'IND', 8);
    addZone(12, -8, 'IND', 103);
    addZone(12, 8, 'IND', 104);

    // Tech Park
    addZone(0, 14, 'COM', 9);
    addZone(8, 14, 'COM', 11);
    addZone(-8, 14, 'IND', 10);

    // North Residential - Very spaced
    for (let x = -18; x <= 18; x += 6) {
        addZone(x, -14, 'RES', 200 + Math.abs(x));
    }

    // 3. Add River (Far North)
    for (let x = -24; x <= 24; x += RIVER_GRID) {
        addRiver(x, -18);
        addRiver(x, -19);
    }

    // 4. Add Nature
    // Parks in spaces NOT on roads
    addProp(-8, -6, 'tree_oak_dark');
    addProp(8, -6, 'tree_blocks_fall');
    addProp(-8, 6, 'tree_palm');
    addProp(8, 6, 'tree_pineRoundC');
    addProp(0, -7, 'flower_yellowC');
    addProp(0, 7, 'plant_bush');
    addProp(-6, 0, 'stone_small');
    addProp(6, 0, 'stone_small');

    // Forest around river (spacing 4)
    for (let x = -24; x <= 24; x += 4) {
        addProp(x, -15, 'tree_pineRoundC');
        addProp(x + 2, -22, 'tree_blocks_fall');
    }

    // Safety scattered props (middle of blocks)
    [-4, 4, -12, 12].forEach(x => {
        [-2, 2, -12, 8].forEach(z => {
            // Check if there is already a zone there
            if (!INITIAL_CITY_LAYOUT.zones.has(`${x},${z}`)) {
                addProp(x, z, 'plant_bush');
            }
        });
    });
};

initLayout();
