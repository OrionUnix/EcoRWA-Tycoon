import { create } from 'zustand';
import { DORA_TUTORIAL_STEPS, TutorialAction } from '../components/ui/npcs/TutorialScript';

interface TutorialState {
    isActive: boolean;
    isVisible: boolean;
    currentStepIndex: number;
    errorKey: string | null;
    startTutorial: () => void;
    stopTutorial: () => void;
    nextStep: (keepHidden?: boolean) => void;
    advanceTutorial: (actionCompleted: TutorialAction) => void;
    failAction: (errorKey: string) => void;
    setVisibility: (visible: boolean) => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
    isActive: false,
    isVisible: true,
    currentStepIndex: 0,
    errorKey: null,

    startTutorial: () => set({ isActive: true, isVisible: true, currentStepIndex: 0, errorKey: null }),

    stopTutorial: () => set({ isActive: false, isVisible: false, currentStepIndex: 0, errorKey: null }),

    nextStep: (keepHidden = false) => set((state) => {
        if (state.currentStepIndex < DORA_TUTORIAL_STEPS.length - 1) {
            return {
                currentStepIndex: state.currentStepIndex + 1,
                isVisible: !keepHidden,
                errorKey: null
            };
        }
        return { isActive: false, isVisible: false, currentStepIndex: 0 };
    }),

    advanceTutorial: (actionCompleted: TutorialAction) => {
        const state = get();
        if (!state.isActive) return;

        const currentStep = DORA_TUTORIAL_STEPS[state.currentStepIndex];

        if (currentStep.waitForAction === actionCompleted) {
            // Si c'est l'étape de sélection, on passe à l'étape suivante mais on reste masqué
            if (actionCompleted === 'SELECT_ROAD_TOOL') {
                get().nextStep(true); // Passer à l'étape suivante en restant caché
            } else {
                get().nextStep(false);
            }
        }
    },

    failAction: (errorKey: string) => {
        set({ isVisible: true, errorKey });
    },

    setVisibility: (visible: boolean) => {
        set({ isVisible: visible });
    }
}));
