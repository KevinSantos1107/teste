export interface SiteConfig {
  id: string;
  couple: {
    partner1: {
      name: string;
      photoUrl?: string;
    };
    partner2: {
      name: string;
      photoUrl?: string;
    };
  };
  relationship: {
    startDate: string; // ISO format e.g., '2025-10-27'
  };
  theme: {
    colors: {
      bg: string;
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      textSecondary: string;
      cardBg: string;
      cardBorder: string;
    };
    font?: {
      heading: string;
      body: string;
    };
  };
  features: {
    enableTimeline: boolean;
    enableMap: boolean;
    enableGames: boolean;
    enableMusic: boolean;
    enableAlbum: boolean;
  };
}
