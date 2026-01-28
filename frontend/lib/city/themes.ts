export interface CityTheme {
  name: string;
  sky: {
    top: string;
    bottom: string;
  };
  ground: string;
  road: string;
  building: {
    primary: string[];
    secondary: string[];
  };
  lighting: {
    ambient: number;
    directional: number;
    sunColor: string;
  };
  fog: {
    color: string;
    near: number;
    far: number;
  };
}

export const THEMES: Record<'light' | 'dark', CityTheme> = {
  light: {
    name: 'Light',
    sky: {
      top: '#87ceeb',
      bottom: '#e0f2fe',
    },
    ground: '#10b981',
    road: '#71717a',
    building: {
      primary: ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'],
      secondary: ['#64748b', '#94a3b8'],
    },
    lighting: {
      ambient: 0.6,
      directional: 1.2,
      sunColor: '#ffffff',
    },
    fog: {
      color: '#87ceeb',
      near: 30,
      far: 60,
    },
  },
  dark: {
    name: 'Dark',
    sky: {
      top: '#0f172a',
      bottom: '#1e1b4b',
    },
    ground: '#059669',
    road: '#27272a',
    building: {
      primary: ['#8B5CF6', '#F59E0B', '#10B981', '#6366f1'],
      secondary: ['#1e293b', '#334155'],
    },
    lighting: {
      ambient: 0.3,
      directional: 0.6,
      sunColor: '#a78bfa',
    },
    fog: {
      color: '#0f172a',
      near: 20,
      far: 50,
    },
  },
};