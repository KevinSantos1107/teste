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
const CONFIG_CACHE_KEY = 're_config_cache';
const LOAD_TIMEOUT_MS = 8000;

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

function saveConfigCache(config: SiteConfig) {
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
    if (config.theme?.colors) {
      localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(config.theme.colors));
    }
  } catch { /* ignora erros de quota */ }
}

function loadConfigCache(): SiteConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SiteConfig;
  } catch {
    return null;
  }
}

// Restaura apenas as vars estruturais do cache — as cores do tema vêm do useThemeStore
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyThemeVars(JSON.parse(cached) as SiteConfig['theme']['colors']);
} catch {}

let currentLoadId = 0;

export const useSiteConfigStore = create<SiteConfigState>((set, get) => ({
  // Inicia sem config e com isLoading=true para que nenhum dado de 'meu-site'
  // vaze para outros sites antes do Firestore responder.
  config: null,
  isLoading: true,
  error: null,

  loadConfig: async (siteId: string) => {
    const loadId = ++currentLoadId;

    // Em modo mock/dev usa a config local imediatamente, sem Firestore
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true' || (import.meta.env.DEV && import.meta.env.MODE !== 'test')) {
      applyThemeVars(meuSiteConfig.theme.colors);
      saveConfigCache(meuSiteConfig);
      set({ config: meuSiteConfig, isLoading: false, error: null });
      return;
    }

    // Aplica cache da sessão anterior para evitar flash enquanto Firestore responde
    const cached = loadConfigCache();
    if (cached) {
      if (cached.theme?.colors) applyThemeVars(cached.theme.colors);
      // Mantém isLoading=true: o Firestore ainda vai confirmar/atualizar
      set({ config: cached, error: null });
    }

    // Timeout de segurança para nunca ficar em splash infinito: libera a UI (isLoading=false)
    const timeoutId = setTimeout(() => {
      if (loadId !== currentLoadId) return;
      const { config } = get();
      if (!config) {
        // Sem cache e sem Firestore ainda → libera UI com mensagem de erro
        set({
          isLoading: false,
          error: 'Tempo esgotado ao carregar configurações. Verifique sua conexão.',
        });
      } else {
        // Tem cache → libera UI mantendo a navegação ativa
        set({ isLoading: false });
      }
    }, LOAD_TIMEOUT_MS);

    try {
      const docRef = doc(db, 'sites', siteId);
      const docSnap = await getDoc(docRef);

      // Se uma nova chamada a loadConfig foi iniciada nesse meio tempo, ignora esta
      if (loadId !== currentLoadId) {
        clearTimeout(timeoutId);
        return;
      }

      clearTimeout(timeoutId);

      if (docSnap.exists()) {
        const data = docSnap.data() as SiteConfig;
        if (data.theme?.colors) applyThemeVars(data.theme.colors);
        saveConfigCache(data);
        // Atualiza a config com dados frescos do servidor, limpa qualquer erro e mantém isLoading=false
        set({ config: data, isLoading: false, error: null });
      } else {
        // Documento não existe: usa cache se disponível, senão erro
        const currentConfig = get().config;
        if (currentConfig) {
          set({ isLoading: false, error: null });
        } else {
          set({
            isLoading: false,
            error: 'Configuração do site não encontrada no servidor.',
          });
        }
      }
    } catch (err: unknown) {
      if (loadId !== currentLoadId) {
        clearTimeout(timeoutId);
        return;
      }

      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      const currentConfig = get().config;
      if (currentConfig) {
        // Falha de rede mas tem cache: usa o cache em silêncio
        console.warn('siteConfigStore: Firestore indisponível, usando cache local.', msg);
        set({ isLoading: false, error: null });
      } else {
        // Sem cache e sem Firestore: mostra erro
        set({
          isLoading: false,
          error: 'Erro ao carregar configurações: ' + msg,
        });
      }
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
      } catch (err: unknown) {
        console.error('Erro ao atualizar Firestore:', err);
        throw new Error('Falha ao salvar as configuracoes.');
      }
    }
    const newConfig = { ...config, ...updates };
    if (updates.theme?.colors) applyThemeVars(updates.theme.colors);
    saveConfigCache(newConfig);
    set({ config: newConfig });
  },
}));
