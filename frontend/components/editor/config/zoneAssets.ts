export const ZONE_TYPES = {
    RESIDENTIAL: {
        id: 'RES',
        color: '#22c55e',
        icon: '/assets/models/UI/PNG/home.png',
        path: '/assets/models/suburban/',
         texture: '/assets/models/suburban/Textures/colormap.png',
        models: [
            { file: 'building-type-c.glb', size: 1 },
            { file: 'building-type-h.glb', size: 2 },
            { file: 'building-type-q.glb', size: 2 },
            { file: 'building-type-f.glb', size: 1 },
            { file: 'building-type-t.glb', size: 2 }
        ]
    },
    COMMERCIAL: {
        id: 'COM',
        color: '#3b82f6',
        icon: '/assets/models/UI/PNG/shoppingCart.png',
        path: '/assets/models/commercial/',
        texture: '/assets/models/commercial/Textures/colormap.png',
        models: [
            { file: 'building-a.glb', size: 1 },
            { file: 'building-e.glb', size: 1 },
            { file: 'building-skyscraper-a.glb', size: 2 },
            { file: 'building-skyscraper-b.glb', size: 2 },
            { file: 'building-skyscraper-d.glb', size: 2 },
            { file: 'building-i.glb', size: 1 }
        ]
    },
    INDUSTRIAL: {
        id: 'IND',
        color: '#eab308',
        icon: '/assets/models/UI/PNG/industrial.png',
        path: '/assets/models/industrial/',
        texture: '/assets/models/industrial/Textures/colormap.png',
        models: [
            { file: 'building-a.glb', size: 1 },
            { file: 'building-h.glb', size: 1 },
            { file: 'building-j.glb', size: 2 },
             { file: 'building-r.glb', size: 1 },
            { file: 'building-m.glb', size: 2 },
            { file: 'building-i.glb', size: 1 },
            { file: 'building-g.glb', size: 1 }
        ]
    }
};