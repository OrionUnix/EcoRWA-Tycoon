import { GAME_ICONS } from '@/hooks/ui/useGameIcons';

export type TutorialAction = 'SELECT_ROAD_TOOL' | 'BUILD_ROAD' | 'BUILD_ROAD_CONNECTED' | 'SELECT_ZONE_TOOL' | 'BUILD_ZONE' | 'SELECT_RESIDENTIAL' | 'BUILD_RESIDENTIAL' | 'OPEN_RWA_PANEL' | 'BUILD_BASIC_RESOURCES';

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
        waitForAction: 'SELECT_ROAD_TOOL'
    },
    {
        id: "step_connect_road",
        textKey: "step_connect_road",
        waitForAction: 'BUILD_ROAD_CONNECTED'
    },
    {
        id: "step_resources",
        textKey: "step_resources",
        iconName: "stone",
        waitForAction: 'BUILD_BASIC_RESOURCES'
    },
    {
        id: "step_water_explain",
        textKey: "step_water_explain",
        iconName: "water"
    },
    {
        id: "step_select_zone",
        textKey: "step_select_zone",
        iconName: "residential",
        waitForAction: 'SELECT_ZONE_TOOL'
    },
    {
        id: "step_build_zone",
        textKey: "step_build_zone",
        waitForAction: 'BUILD_ZONE'
    },
    {
        id: "step_finish",
        textKey: "step_finish",
        iconName: "happy"
    }
];
