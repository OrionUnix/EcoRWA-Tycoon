
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

    // Downtown (Center)
    addZone(-2, -2, 'COM', 3); // Eco-Tower (Mixed)
    addZone(2, -2, 'COM', 4);  // Skyline Hub (Office)
    addZone(-2, 2, 'COM', 5);  // Hotel Riviera
    addZone(2, 2, 'COM', 2);   // Bistrot Central

    // Downtown Filler
    addZone(0, -2, 'COM', 105);
    addZone(0, 2, 'COM', 106);
    addZone(2, 0, 'COM', 107);
    addZone(-2, 0, 'COM', 108);

    // Residential (West Loop)
    addZone(-10, -2, 'RES', 1); // Loft St Germain
    addZone(-10, 2, 'RES', 6);  // Residence Pixel
    addZone(-12, -4, 'RES', 101);
    addZone(-12, 4, 'RES', 102);
    addZone(-14, -2, 'RES', 109);
    addZone(-14, 2, 'RES', 110);
    addZone(-6, -2, 'RES', 111);
    addZone(-6, 2, 'RES', 112);

    // Industrial (East Loop)
    addZone(10, -2, 'IND', 7);  // Warehouse
    addZone(10, 2, 'IND', 8);   // Data Center
    addZone(12, -4, 'IND', 103);
    addZone(12, 4, 'IND', 104);
    addZone(14, -2, 'IND', 113);
    addZone(14, 2, 'IND', 114);
    addZone(6, -2, 'IND', 115);
    addZone(6, 2, 'IND', 116);

    // South Commercial / Tech Park
    addZone(0, 12, 'COM', 9);   // Mall
    addZone(4, 12, 'COM', 11);  // Creative Studio
    addZone(-4, 12, 'IND', 10); // Agrictulture (Greenhouse)
    addZone(8, 12, 'COM', 117);
    addZone(-8, 12, 'COM', 118);
    addZone(12, 12, 'IND', 119);
    addZone(-12, 12, 'IND', 120);

    // North Residential
    for (let x = -16; x <= 16; x += 4) {
        addZone(x, -12, 'RES', 200 + x);
    }

    // 3. Add River (Far North)
    for (let x = -24; x <= 24; x += RIVER_GRID) {
        addRiver(x, -18);
        addRiver(x, -19);
    }

    // 4. Add Nature
    // Central Park Area
    addProp(-4, 4, 'tree_oak_dark');
    addProp(4, 4, 'tree_blocks_fall');
    addProp(-4, -4, 'tree_palm');
    addProp(4, -4, 'tree_pineRoundC');
    addProp(0, 4, 'flower_yellowC');
    addProp(0, -4, 'plant_bush');

    // Forest around river
    for (let x = -24; x <= 24; x += 3) {
        addProp(x, -16, 'tree_pineRoundC');
        addProp(x + 1, -21, 'tree_blocks_fall');
    }

    // Scattered trees
    [-18, -4, 4, 18].forEach(x => {
        [-8, 8].forEach(z => {
            addProp(x, z, 'tree_oak_dark');
        });
    });
};

initLayout();
