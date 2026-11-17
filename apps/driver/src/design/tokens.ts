/**
 * Vagrova Driver App — Design Tokens
 *
 * Tailored for high-contrast outdoor sunlight and night driving:
 * - High-contrast Asphalt dark surfaces (#141719, #1F2326)
 * - Pure Safety Amber (#F2A900) for active CTAs and status
 * - High legibility white (#FFFFFF) for text in sunlight
 * - Large touch targets (min 52px, step button 64px) for one-tap operation
 */

export const colors = {
  // High contrast background
  bgDark: '#141719',
  surfaceDark: '#1F2326',
  surfaceElevated: '#2E3539',

  // Accent & Actions
  safetyAmber: '#F2A900',
  amberPressed: '#C98D00',

  // Status
  weighbridgeGreen: '#2E7D4F',
  greenLight: '#D4EEE0',
  rustRed: '#B3391B',
  redLight: '#F5D5CF',

  // Text
  textHighContrast: '#FFFFFF',
  textSecondary: '#DDD9D1',
  textMuted: '#9A9690',

  // Borders
  borderSubtle: '#2E3539',
  borderNotice: '#F2A900',
};

export const spacing = {
  0: 0, 1: 4, 1.5: 6, 2: 8, 3: 12,
  4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
};

export const radii = {
  button: 4,
  card: 6,
  chip: 3,
  full: 9999,
};

export const touchTargets = {
  min: 48,
  primary: 52,
  stepAction: 64, // Extra large for glove / field use
};

