import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSiteConfigStore } from './siteConfigStore';
import { getDoc } from 'firebase/firestore';
import type { SiteConfig } from '../config/siteConfig.schema';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _coll, id) => ({ id })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe('siteConfigStore - loadConfig e Resposta Tardia pós-Timeout', () => {
  const mockServerConfig: SiteConfig = {
    id: 'meu-site',
    couple: {
      partner1: { name: 'Kevin Atualizado', playerId: 'kevin', gender: 'M' },
      partner2: { name: 'Iara', playerId: 'iara', gender: 'F' },
    },
    relationship: {
      startDate: '2021-06-12',
    },
    theme: {
      colors: {
        bg: '#05050A',
        primary: '#9d4edd',
        secondary: '#e0aaff',
        accent: '#c77dff',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        cardBg: '#111122',
        cardBorder: '#222244',
      },
    },
    features: {
      enableTimeline: true,
      enableGames: true,
      enableMusic: true,
      enableAlbum: true,
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useSiteConfigStore.setState({
      config: null,
      isLoading: true,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve liberar a UI após timeout de 8s e aceitar a resposta tardia do getDoc', async () => {
    // Cria uma promise que controlamos manualmente para simular resposta tardia
    let resolveGetDoc!: (val: unknown) => void;
    const delayedPromise = new Promise((resolve) => {
      resolveGetDoc = resolve;
    });

    vi.mocked(getDoc).mockReturnValue(delayedPromise as never);

    // Inicia o carregamento
    const loadPromise = useSiteConfigStore.getState().loadConfig('meu-site');

    // Inicialmente está carregando
    expect(useSiteConfigStore.getState().isLoading).toBe(true);
    expect(useSiteConfigStore.getState().config).toBeNull();

    // Avança 8000ms para disparar o timeout de segurança
    vi.advanceTimersByTime(8000);

    // UI deve ser liberada com isLoading=false e mensagem de timeout (já que não havia cache)
    expect(useSiteConfigStore.getState().isLoading).toBe(false);
    expect(useSiteConfigStore.getState().error).toContain('Tempo esgotado');
    expect(useSiteConfigStore.getState().config).toBeNull();

    // Agora simula o Firestore finalmente respondendo 2 segundos depois (t = 10s)
    resolveGetDoc({
      exists: () => true,
      data: () => mockServerConfig,
    });

    // Espera a resolução da promise tardia
    await loadPromise;

    // A resposta tardia NÃO deve ser descartada: deve atualizar a config, limpar o erro e manter isLoading=false
    const state = useSiteConfigStore.getState();
    expect(state.config).toEqual(mockServerConfig);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();

    // Cache no localStorage deve ter sido atualizado com a resposta tardia
    const savedCache = localStorage.getItem('re_config_cache');
    expect(savedCache).toBeTruthy();
    expect(JSON.parse(savedCache!).couple.partner1.name).toBe('Kevin Atualizado');
  });

  it('deve usar cache anterior durante timeout e atualizar quando a resposta tardia chegar', async () => {
    const cachedConfig: SiteConfig = {
      ...mockServerConfig,
      couple: {
        ...mockServerConfig.couple,
        partner1: { ...mockServerConfig.couple.partner1, name: 'Kevin Antigo em Cache' },
      },
    };
    localStorage.setItem('re_config_cache', JSON.stringify(cachedConfig));

    let resolveGetDoc!: (val: unknown) => void;
    const delayedPromise = new Promise((resolve) => {
      resolveGetDoc = resolve;
    });

    vi.mocked(getDoc).mockReturnValue(delayedPromise as never);

    const loadPromise = useSiteConfigStore.getState().loadConfig('meu-site');

    // Aplica o cache imediatamente
    expect(useSiteConfigStore.getState().config?.couple.partner1.name).toBe('Kevin Antigo em Cache');
    expect(useSiteConfigStore.getState().isLoading).toBe(true);

    // Avança 8000ms
    vi.advanceTimersByTime(8000);

    // Como tinha cache, libera a UI sem erro
    expect(useSiteConfigStore.getState().isLoading).toBe(false);
    expect(useSiteConfigStore.getState().error).toBeNull();
    expect(useSiteConfigStore.getState().config?.couple.partner1.name).toBe('Kevin Antigo em Cache');

    // Resposta do servidor chega tardiamente com dados novos
    resolveGetDoc({
      exists: () => true,
      data: () => mockServerConfig,
    });

    await loadPromise;

    // Atualiza com os novos dados do servidor
    expect(useSiteConfigStore.getState().config?.couple.partner1.name).toBe('Kevin Atualizado');
    expect(useSiteConfigStore.getState().isLoading).toBe(false);
    expect(useSiteConfigStore.getState().error).toBeNull();
  });
});
