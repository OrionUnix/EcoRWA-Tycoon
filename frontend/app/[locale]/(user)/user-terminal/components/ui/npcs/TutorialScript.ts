import { GAME_ICONS } from '@/hooks/ui/useGameIcons';

export type TutorialAction = 'SELECT_ROAD_TOOL' | 'BUILD_ROAD' | 'SELECT_RESIDENTIAL' | 'BUILD_RESIDENTIAL' | 'OPEN_RWA_PANEL';

export interface TutorialStep {
    id: string;
    textKey: string;      // The i18n key in doratuto.json
    iconName?: keyof typeof GAME_ICONS;
    waitForAction?: TutorialAction;
}

export const DORA_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "step_welcome",
        textKey: "step_welcome",
        iconName: "money"
    },
    {
        id: "step_population",
        textKey: "step_population",
        iconName: "population"
    },
    {
        id: "step_select_road",
        textKey: "step_select_road",
        iconName: "road_dirt",
        waitForAction: 'SELECT_ROAD_TOOL' // App needs to call advanceTutorial('SELECT_ROAD_TOOL')
    },
    {
        id: "step_build_road",
        textKey: "step_build_road",
        waitForAction: 'BUILD_ROAD'
    },
    {
        id: "step_finish",
        textKey: "step_finish",
        iconName: "happy"
    }
];
