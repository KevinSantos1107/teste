import { create } from 'zustand';

interface ThemeState {
  activeTheme: 'meteors' | 'hearts' | 'aurora' | 'snow';
  toggleTheme: () => void;
}

const THEMES = {
  meteors: {
    primary: '#9d4edd',
    primaryRgb: '157, 78, 221',
    secondary: '#e0aaff',
    accent: '#c77dff',
  },
  hearts: {
    primary: '#ff0055',
    primaryRgb: '255, 0, 85',
    secondary: '#ff4d94',
    accent: '#ff2a7a',
  },
  aurora: {
    primary: '#00ffc8',
    primaryRgb: '0, 255, 200',
    secondary: '#a855f7',
    accent: '#22d3ee',
  },
  snow: {
    primary: '#00f0ff',
    primaryRgb: '0, 240, 255',
    secondary: '#ffffff',
    accent: '#4a90e2',
  },
} as const;

const THEME_ORDER: Array<keyof typeof THEMES> = ['meteors', 'hearts', 'aurora', 'snow'];

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeTheme: 'meteors',
  toggleTheme: () => {
    const current = get().activeTheme;
    const idx = THEME_ORDER.indexOf(current);
    const nextTheme = THEME_ORDER[(idx + 1) % THEME_ORDER.length];

    // Apply CSS variables
    const t = THEMES[nextTheme];
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', t.primary);
    root.style.setProperty('--theme-primary-rgb', t.primaryRgb);
    root.style.setProperty('--theme-secondary', t.secondary);
    root.style.setProperty('--theme-accent', t.accent);

    set({ activeTheme: nextTheme });
  },
}));
