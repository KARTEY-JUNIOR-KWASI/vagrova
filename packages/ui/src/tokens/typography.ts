/**
 * Vagrova Design Tokens — Typography
 *
 * Headings  : Archivo Semi-Condensed Bold — sturdy, condensed grotesque
 * Body / UI : IBM Plex Sans — clear numerals, legible at small sizes
 * Codes     : IBM Plex Mono — job numbers, quote numbers, plate numbers
 *             look like stamped identifiers
 *
 * Minimum body size: 16 px on mobile (never smaller).
 */

export const fontFamilies = {
  heading: '"Archivo", "Barlow Condensed", system-ui, sans-serif',
  body: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", "Courier New", monospace',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

/** Type scale — desktop (rem) */
export const fontSizes = {
  xs: '0.75rem',   // 12px — captions, helper text
  sm: '0.875rem',  // 14px — table cells, secondary labels
  base: '1rem',    // 16px — minimum body
  md: '1.125rem',  // 18px — body emphasis
  lg: '1.25rem',   // 20px — subheadings, card titles
  xl: '1.5rem',    // 24px — section headings
  '2xl': '2rem',   // 32px — page headings
  '3xl': '2.5rem', // 40px — hero headings
} as const;

/** Mobile type scale (px) — for React Native */
export const fontSizesPx = {
  xs: 12,
  sm: 14,
  base: 16,   // hard minimum on mobile
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const lineHeights = {
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.65',
} as const;

export const letterSpacings = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.04em',
  wider: '0.08em',   // used on status chips and plate numbers
  widest: '0.12em',  // used on STAMPED labels (QUOTE, PAID, DELIVERED)
} as const;

/**
 * Semantic text styles — reference these in components, not raw tokens.
 *
 * Usage: apply fontFamily, fontSize, fontWeight, lineHeight together.
 */
export const textStyles = {
  /** Page / screen heading */
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    textTransform: 'none' as const,
  },
  /** Section heading */
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  /** Card title / subheading */
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
  },
  /** Standard body */
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  /** Emphasis body */
  bodyStrong: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
  },
  /** Small — table rows, secondary labels */
  small: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  /** Caption — helper text, timestamps */
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.relaxed,
  },
  /** Button label */
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacings.wide,
    lineHeight: lineHeights.tight,
  },
  /** Job / Quote / Plate numbers — looks like a stamped identifier */
  identifier: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wider,
  },
  /** STAMPED STATUS labels (QUOTE, PAID, DELIVERED) */
  stamp: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase' as const,
  },
} as const;

