/**
 * Vagrova Customer App — Design Tokens (React Native)
 *
 * Native mirror of the shared design system.
 * Uses pixel values and StyleSheet-compatible properties.
 */

export const colors = {
  asphalt: '#1F2326',
  safetyAmber: '#F2A900',
  waybillPaper: '#F5F2EB',
  roadWhite: '#FFFFFF',
  weighbridgeGreen: '#2E7D4F',
  rustRed: '#B3391B',
  gravelGrey: '#6B7075',
  amberLight: '#FDD87A',
  greenLight: '#D4EEE0',
  redLight: '#F5D5CF',
  grey100: '#F0EDE8',
  grey200: '#DDD9D1',
  grey300: '#BCB8B1',
  grey600: '#4A4F53',
};

export const fonts = {
  heading: 'Archivo-Bold',       // loaded via expo-font
  headingSemi: 'Archivo-SemiBold',
  body: 'IBMPlexSans-Regular',
  bodyMedium: 'IBMPlexSans-Medium',
  bodySemiBold: 'IBMPlexSans-SemiBold',
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',
  monoBold: 'IBMPlexMono-Bold',
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

/** Minimum touch target: 48px. Primary buttons: 52px. */
export const touchTargets = { min: 48, primary: 52 };

