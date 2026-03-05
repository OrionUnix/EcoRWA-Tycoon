import { create } from 'zustand';
import { DORA_TUTORIAL_STEPS, TutorialAction } from '../components/ui/npcs/TutorialScript';

interface TutorialState {
    isActive: boolean;
    currentStepIndex: number;
    startTutorial: () => void;
    stopTutorial: () => void;
    nextStep: () => void;
    advanceTutorial: (actionCompleted: TutorialAction) => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
    isActive: false,
    currentStepIndex: 0,

    startTutorial: () => set({ isActive: true, currentStepIndex: 0 }),

    stopTutorial: () => set({ isActive: false, currentStepIndex: 0 }),

    nextStep: () => set((state) => {
        if (state.currentStepIndex < DORA_TUTORIAL_STEPS.length - 1) {
            return { currentStepIndex: state.currentStepIndex + 1 };
        }
        // Si on est à la dernière étape, on arrête le tuto
        return { isActive: false, currentStepIndex: 0 };
    }),

    advanceTutorial: (actionCompleted: TutorialAction) => {
        const state = get();
        if (!state.isActive) return;

        const currentStep = DORA_TUTORIAL_STEPS[state.currentStepIndex];

        // Si l'étape actuelle attend spécifiquement cette action, on avance
        if (currentStep.waitForAction === actionCompleted) {
            get().nextStep();
        }
    }
}));
