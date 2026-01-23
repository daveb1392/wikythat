/**
 * Centralized logo configuration
 * Update paths here to change logos across the entire app
 */

export const LOGOS = {
  wikithat: {
    main: '/logo_wikithat.jpg',
    favicon: '/favicon_wikithat.jpg',
  },
  wikipedia: {
    icon: '/wikipedia_icon1.png',
    logo: '/wikipedia_logo1.png',
  },
  grokipedia: {
    icon: '/grok_icon.png',
    logo: '/grokipedia_logo.png',
  },
} as const;

// Sizes
export const LOGO_SIZES = {
  header: { width: 180, height: 50 },
  icon: { width: 40, height: 40 },
  iconSmall: { width: 24, height: 24 },
} as const;
