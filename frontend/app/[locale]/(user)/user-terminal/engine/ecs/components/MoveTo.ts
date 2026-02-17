import { defineComponent, Types } from 'bitecs';

export const MoveTo = defineComponent({
    targetX: Types.f32,
    targetY: Types.f32,
    speed: Types.f32
});
