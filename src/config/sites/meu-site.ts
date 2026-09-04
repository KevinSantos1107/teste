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
      bg: '#07050f',                     // Roxo noturno profundo
      primary: '#9d4edd',                // Roxo neon (tema meteoro = padrão)
      secondary: '#e0aaff',              // Lilás claro
      accent: '#c77dff',                 // Violeta médio
      text: '#ffffff',                   // Branco puro
      textSecondary: '#a1a1aa',          // Cinza claro
      cardBg: 'rgba(15, 10, 30, 0.4)',   // Vidro roxo escuro
      cardBorder: 'rgba(157, 78, 221, 0.4)', // Borda roxa translúcida
    },
  },
  features: {
    enableTimeline: true,
    enableGames: true,
    enableMusic: true,
    enableAlbum: true,
  },
};
