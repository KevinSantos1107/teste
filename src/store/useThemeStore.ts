import { create } from 'zustand';

interface ThemeState {
  activeTheme: 'meteors' | 'hearts';
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
} as const;

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeTheme: 'meteors',
  toggleTheme: () => {
    const nextTheme = get().activeTheme === 'meteors' ? 'hearts' : 'meteors';
    
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
