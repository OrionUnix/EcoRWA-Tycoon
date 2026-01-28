
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
    INITIAL_CITY_LAYOUT.props.set(`${x},${z}`, { x, z, type: 'NATURE', model });
};

const initLayout = () => {
    const GRID_STEP = 4; // Road every 4 units

    // 1. COMPACT ROAD GRID (-8 to 8)
    const coords = [-8, -4, 0, 4, 8];

    // Vertical Roads
    coords.forEach(x => {
        for (let z = -10; z <= 10; z += 2) {
            addRoad(x, z);
        }
    });

    // Horizontal Roads
    coords.forEach(z => {
        for (let x = -8; x <= 8; x += 2) {
            addRoad(x, z);
        }
    });

    // 2. PRECISE BUILDING PLACEMENT (Distance 2 from road center)
    // Between road 0 and road 4 -> Place at 2.
    // Between road 0 and road -4 -> Place at -2.

    const blockCenters = [-6, -2, 2, 6];

    // Downtown (COM)
    addZone(2, 2, 'COM', 1);
    addZone(2, 6, 'COM', 2);
    addZone(6, 2, 'COM', 3);
    addZone(6, 6, 'COM', 4);

    // Residential (RES)
    addZone(-2, 2, 'RES', 5);
    addZone(-2, 6, 'RES', 6);
    addZone(-6, 2, 'RES', 101);
    addZone(-6, 6, 'RES', 102);

    // Industrial (IND)
    addZone(2, -2, 'IND', 7);
    addZone(2, -6, 'IND', 8);
    addZone(6, -2, 'IND', 103);
    addZone(6, -6, 'IND', 104);

    // Mix/Tech
    addZone(-2, -2, 'COM', 9);
    addZone(-2, -6, 'IND', 10);
    addZone(-6, -2, 'RES', 11);
    addZone(-6, -6, 'COM', 117);

    // 3. NATURE (Far corners only to avoid roads)
    addProp(10, 10, 'tree_oak_dark');
    addProp(-10, 10, 'tree_blocks_fall');
    addProp(10, -10, 'tree_palm');
    addProp(-10, -10, 'tree_pineRoundC');

    // Some small bushes at intersections but far from path
    coords.forEach(x => {
        coords.forEach(z => {
            if (Math.abs(x) > 6 || Math.abs(z) > 6) {
                addProp(x + 1.2, z + 1.2, 'plant_bush');
            }
        });
    });
};

initLayout();
