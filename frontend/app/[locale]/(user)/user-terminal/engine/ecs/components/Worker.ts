import { defineComponent, Types } from 'bitecs';

// États du travailleur
export enum WorkerState {
    IDLE = 0,
    MOVING_TO_RESOURCE = 1,
    GATHERING = 2,
    MOVING_HOME = 3,
    DEPOSITING = 4
}

// Type de travailleur
export enum WorkerType {
    HUNTER = 0,
    FISHERMAN = 1,
    LUMBERJACK = 2
}

export const Worker = defineComponent({
    state: Types.ui8,
    type: Types.ui8,
    homeBuildingId: Types.ui32,
    targetResourceId: Types.i32, // Peut être -1 si pas de cible
    timer: Types.f32 // Pour le temps de récolte
});
