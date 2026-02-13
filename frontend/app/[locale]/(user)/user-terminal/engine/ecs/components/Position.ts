import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({
    x: Types.f32,
    y: Types.f32,
    z: Types.f32, // Utile pour le tri isométrique ou l'altitude
    isoX: Types.f32, // Coordonnée Isométrique (Screen X)
    isoY: Types.f32  // Coordonnée Isométrique (Screen Y)
});
