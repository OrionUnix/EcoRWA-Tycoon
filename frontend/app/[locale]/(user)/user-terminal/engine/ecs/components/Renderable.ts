import { defineComponent, Types } from 'bitecs';

export const Renderable = defineComponent({
    spriteId: Types.ui32, // ID vers une texture ou un asset
    scale: Types.f32,
    visible: Types.ui8,   // 0 ou 1
    layer: Types.ui8      // 0=Terrain, 1=Decal, 2=Building, 3=Unit, 4=UI
});
