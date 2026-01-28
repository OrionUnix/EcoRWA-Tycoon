// On définit le préfixe pour GitHub Pages


const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

// Si c'est GitHub, on met le préfixe. Si c'est ton PC (localhost), on laisse vide.
const BASE_PATH = isGithubPages ? '/EcoRWA-Tycoon' : ''; 

// La fonction reste la même, elle s'adaptera toute seule
const fixPath = (path: string) => `${BASE_PATH}${path}`;

export const ZONE_TYPES = {
    RESIDENTIAL: {
        id: 'RES',
        color: '#22c55e',
        icon: fixPath('/assets/models/UI/PNG/home.png'),
        path: fixPath('/assets/models/suburban/'),
        texture: fixPath('/assets/models/suburban/Textures/colormap.png'),
        models: [
            { file: 'building-type-c.glb', size: 1 },
            { file: 'building-type-h.glb', size: 2 },
            { file: 'building-type-q.glb', size: 2 },
            { file: 'building-type-f.glb', size: 1 },
            { file: 'building-type-t.glb', size: 2 },
            { file: 'building-type-m.glb', size: 2 },
            { file: 'building-type-n.glb', size: 2 },
            { file: 'building-type-o.glb', size: 2 },
            { file: 'building-type-p.glb', size: 2 },
            { file: 'building-type-r.glb', size: 2 },
            { file: 'building-type-s.glb', size: 2 },
            { file: 'building-type-u.glb', size: 2 }
        ]
    },
    COMMERCIAL: {
        id: 'COM',
        color: '#3b82f6',
        icon: fixPath('/assets/models/UI/PNG/shoppingCart.png'),
        path: fixPath('/assets/models/commercial/'),
        texture: fixPath('/assets/models/commercial/Textures/colormap.png'),
        models: [
            { file: 'building-a.glb', size: 1 },
            { file: 'building-e.glb', size: 1 },
            { file: 'building-skyscraper-a.glb', size: 2 },
            { file: 'building-skyscraper-b.glb', size: 2 },
            { file: 'building-skyscraper-d.glb', size: 2 },
            { file: 'building-i.glb', size: 1 },
            { file: 'building-f.glb', size: 1 },
            { file: 'building-g.glb', size: 1 },
            { file: 'building-h.glb', size: 1 },
            { file: 'building-j.glb', size: 2 },
            { file: 'building-k.glb', size: 1 },
            { file: 'building-l.glb', size: 1 },
            { file: 'building-m.glb', size: 2 },
            { file: 'building-skyscraper-e.glb', size: 2 },
            { file: 'low-detail-building-f.glb', size: 2 }
        ]
    },
    INDUSTRIAL: {
        id: 'IND',
        color: '#eab308',
        icon: fixPath('/assets/models/UI/PNG/industrial.png'),
        path: fixPath('/assets/models/industrial/'),
        texture: fixPath('/assets/models/industrial/Textures/colormap.png'),
        models: [
            { file: 'building-a.glb', size: 1 },
            { file: 'building-h.glb', size: 1 },
            { file: 'building-j.glb', size: 2 },
            { file: 'building-r.glb', size: 1 },
            { file: 'building-m.glb', size: 2 },
            { file: 'building-i.glb', size: 1 },
            { file: 'building-g.glb', size: 1 },
            { file: 'building-c.glb', size: 1 },
            { file: 'building-d.glb', size: 1 },
            { file: 'building-f.glb', size: 1 },
            { file: 'building-k.glb', size: 1 },
            { file: 'building-l.glb', size: 1 },
            { file: 'building-n.glb', size: 1 },
            { file: 'building-o.glb', size: 1 },
            { file: 'building-p.glb', size: 1 },
            { file: 'building-q.glb', size: 1 },
            { file: 'building-s.glb', size: 1 },
            { file: 'building-t.glb', size: 1 }
        ]
    },
    NATURE: {
        path: fixPath('/assets/models/nature/'),
        models: [
            { id: 'tree_oak_dark', file: 'tree_oak_dark.glb' },
            { id: 'tree_palm', file: 'tree_palm.glb' },
            { id: 'tree_blocks_fall', file: 'tree_blocks_fall.glb' },
            { id: 'tree_pineRoundC', file: 'tree_pineRoundC.glb' },
            { id: 'rock_tallA', file: 'rock_tallA.glb' },
            { id: 'grass', file: 'grass.glb' },
            { id: 'stone_small', file: 'stone_smallTopB.glb' },
            { id: 'flower_yellowC', file: 'flower_yellowC.glb' },
            { id: 'plant_bush', file: 'plant_bush.glb' }
        ]
    },
    INFRASTRUCTURE: {
        roads: {
            path: fixPath('/assets/models/roads/'),
            models: {
                straight: 'road-straight.glb',
                bend: 'road-bend.glb',
                intersection: 'road-intersection.glb',
                t_junction: 'road-intersection.glb',
                cross: 'road-crossroad.glb',
                end: 'road-end-round.glb',
                crossing: 'road-crossing.glb',
                light: 'light-curved.glb',
                cone: 'construction-cone.glb'
            }
        },
        rivers: {
            path: fixPath('/assets/models/nature/'),
            models: {
                straight: 'ground_riverStraight.glb',
                bend: 'ground_riverBend.glb',
                corner: 'ground_riverCorner.glb',
                cross: 'ground_riverCross.glb',
                split: 'ground_riverSplit.glb',
                end: 'ground_riverEnd.glb'
            }
        }
    },
    VEHICLES: {
        path: fixPath('/assets/models/vehicles/'),
        models: {
            suv: 'suv.glb',
            luxury: 'suv-luxury.glb',
            delivery: 'delivery.glb',
            taxi: 'taxi.glb',
            truck: 'truck.glb',
            box: 'box.glb',
            generic: 'vehicle.glb'
        }
    }
};