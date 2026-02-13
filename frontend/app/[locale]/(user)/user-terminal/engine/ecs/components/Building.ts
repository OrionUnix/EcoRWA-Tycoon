import { defineComponent, Types } from 'bitecs';

export const Building = defineComponent({
    typeId: Types.ui8, // Enum BuildingType
    level: Types.ui8,
    status: Types.ui8, // 0=Planned, 1=Construction, 2=Active, 3=Paused
    progress: Types.f32, // 0.0 à 1.0 (Construction)
    variant: Types.ui8, // Variation visuelle
});
