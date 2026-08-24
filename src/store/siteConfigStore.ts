import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { SiteConfig } from '../config/siteConfig.schema';
import { meuSiteConfig } from '../config/sites/meu-site';

interface SiteConfigState {
  config: SiteConfig | null;
  isLoading: boolean;
  error: string | null;
  loadConfig: (siteId: string) => Promise<void>;
  updateConfig: (siteId: string, updates: Partial<SiteConfig>) => Promise<void>;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 0, 85';
}

function applyThemeVars(colors: SiteConfig['theme']['colors']) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-primary-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--theme-secondary', colors.secondary);
  root.style.setProperty('--theme-bg', colors.bg);
  root.style.setProperty('--theme-text', colors.text);
  root.style.setProperty('--theme-text-secondary', colors.textSecondary);
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-card-bg', colors.cardBg);
  root.style.setProperty('--theme-card-border', colors.cardBorder);
}

export const useSiteConfigStore = create<SiteConfigState>((set, get) => ({
  config: null,
  isLoading: true,
  error: null,

  loadConfig: async (siteId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Dev mock: VITE_USE_MOCK_DATA=true bypasses Firestore
      if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        setTimeout(() => {
          applyThemeVars(meuSiteConfig.theme.colors);
          set({ config: meuSiteConfig, isLoading: false });
        }, 500);
        return;
      }

      // Real Firestore read
      const docRef = doc(db, 'sites', siteId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SiteConfig;
        if (data.theme?.colors) {
          applyThemeVars(data.theme.colors);
        }
        set({ config: data, isLoading: false });
      } else {
        // Fallback to local mock when Firestore doc doesn't exist yet
        console.warn(`Site '${siteId}' not found in Firestore — using local mock.`);
        applyThemeVars(meuSiteConfig.theme.colors);
        set({ config: meuSiteConfig, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateConfig: async (siteId: string, updates: Partial<SiteConfig>) => {
    const { config } = get();
    if (!config) return;

    // Real Firestore write (skipped in mock mode)
    if (import.meta.env.VITE_USE_MOCK_DATA !== 'true') {
      try {
        const { updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'sites', siteId);
        await updateDoc(docRef, updates as Record<string, unknown>);
      } catch (err: any) {
        console.error('Erro ao atualizar Firestore:', err);
        throw new Error('Falha ao salvar as configurações.');
      }
    }

    const newConfig = { ...config, ...updates };

    // Re-inject CSS vars if theme colors changed
    if (updates.theme?.colors) {
      applyThemeVars(updates.theme.colors);
    }

    set({ config: newConfig });
  },
}));
