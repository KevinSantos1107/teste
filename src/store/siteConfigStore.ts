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

const THEME_CACHE_KEY = 're_theme_cache';


// Aplica apenas variáveis estruturais de UI — NÃO toca em primary/secondary/accent
// As cores do tema são responsabilidade exclusiva do useThemeStore
function applyThemeVars(colors: SiteConfig['theme']['colors']) {
  const root = document.documentElement;
  root.style.setProperty('--theme-bg',             colors.bg            || '#0d0d14');
  root.style.setProperty('--theme-text',           colors.text          || '#f1f0fb');
  root.style.setProperty('--theme-text-secondary', colors.textSecondary || '#a9a9c8');
  root.style.setProperty('--theme-card-bg',        colors.cardBg        || '#1a1a2e');
  root.style.setProperty('--theme-card-border',    colors.cardBorder    || '#2d2d4a');
}

function applyVarsFromObj(colors: SiteConfig['theme']['colors']) {
  const root = document.documentElement;
  // Apenas variáveis estruturais (mesmo princípio)
  root.style.setProperty('--theme-bg',             colors.bg            || '#0d0d14');
  root.style.setProperty('--theme-text',           colors.text          || '#f1f0fb');
  root.style.setProperty('--theme-text-secondary', colors.textSecondary || '#a9a9c8');
  root.style.setProperty('--theme-card-bg',        colors.cardBg        || '#1a1a2e');
  root.style.setProperty('--theme-card-border',    colors.cardBorder    || '#2d2d4a');
}

// Restaura apenas as vars estruturais do cache — as cores do tema vêm do useThemeStore
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyVarsFromObj(JSON.parse(cached) as SiteConfig['theme']['colors']);
} catch (e) {}

export const useSiteConfigStore = create<SiteConfigState>((set, get) => ({
  config: null,
  isLoading: true,
  error: null,

  loadConfig: async (siteId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        setTimeout(() => {
          applyThemeVars(meuSiteConfig.theme.colors);
          set({ config: meuSiteConfig, isLoading: false });
        }, 500);
        return;
      }
      const docRef = doc(db, 'sites', siteId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteConfig;
        if (data.theme?.colors) applyThemeVars(data.theme.colors);
        set({ config: data, isLoading: false });
      } else {
        console.warn(`Site '${siteId}' nao encontrado no Firestore - usando mock local.`);
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
    if (import.meta.env.VITE_USE_MOCK_DATA !== 'true') {
      try {
        const { updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'sites', siteId);
        await updateDoc(docRef, updates as Record<string, unknown>);
      } catch (err: any) {
        console.error('Erro ao atualizar Firestore:', err);
        throw new Error('Falha ao salvar as configuracoes.');
      }
    }
    const newConfig = { ...config, ...updates };
    if (updates.theme?.colors) applyThemeVars(updates.theme.colors);
    set({ config: newConfig });
  },
}));
