import type { SiteConfig } from '../siteConfig.schema';

export const meuSiteConfig: SiteConfig = {
  id: 'meu-site',
  couple: {
    partner1: { name: 'Kevin' }, // Can be replaced later with actual names
    partner2: { name: 'Iara' },
  },
  relationship: {
    startDate: '2025-10-27', // Corrected date as confirmed
  },
  theme: {
    colors: {
      bg: '#0f172a', // slate-900 (dark mode default)
      primary: '#e11d48', // rose-600
      secondary: '#f43f5e', // rose-500
      accent: '#fb7185', // rose-400
      text: '#f8fafc', // slate-50
      textSecondary: '#94a3b8', // slate-400
      cardBg: '#1e293b', // slate-800
      cardBorder: '#334155', // slate-700
    }
  },
  features: {
    enableTimeline: true,
    enableMap: true,
    enableGames: true,
    enableMusic: true,
    enableAlbum: true,
  }
};
