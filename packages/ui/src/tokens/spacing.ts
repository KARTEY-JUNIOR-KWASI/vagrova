/**
 * Vagrova Design Tokens — Spacing, Radius, Shadows, Motion
 */

// ─── Spacing scale (rem) ──────────────────────────────────────────────────────
// 4px base unit. Used for padding, margin, gap.
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  //  2px
  1: '0.25rem',     //  4px
  1.5: '0.375rem',  //  6px
  2: '0.5rem',      //  8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

/** Spacing in pixels — for React Native */
export const spacingPx = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────
// Tight, industrial — no pill buttons, no oversized rounded cards.
export const radii = {
  none: '0',
  sm: '2px',
  /** Buttons and inputs */
  button: '4px',
  /** Cards */
  card: '6px',
  /** Tags / chips */
  chip: '3px',
  full: '9999px',  // used ONLY for avatar photos
} as const;

/** Radii in pixels — for React Native */
export const radiiPx = {
  none: 0,
  sm: 2,
  button: 4,
  card: 6,
  chip: 3,
  full: 9999,
} as const;

// ─── Borders ──────────────────────────────────────────────────────────────────
export const borders = {
  /** Standard card border — thin, printed-form feel */
  card: '1px solid #DDD9D1',
  /** Input border */
  input: '1px solid #BCB8B1',
  /** Input focus */
  inputFocus: '1px solid #FFC600',
  /** Divider line */
  divider: '1px solid #DDD9D1',
  /** Ruled line inside consignment note */
  ruled: '1px solid #BCB8B1',
  /** Status chip left edge — colored per status, 3px wide */
  chipEdge: '3px solid',
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Almost no shadow — use ruled lines and dividers instead.
export const shadows = {
  none: 'none',
  /** Barely-there card lift */
  card: '0 1px 3px rgba(31, 35, 38, 0.08)',
  /** Dropdown / popover */
  popover: '0 4px 16px rgba(31, 35, 38, 0.14)',
  /** Modal */
  modal: '0 8px 32px rgba(31, 35, 38, 0.20)',
} as const;

// ─── Z-index ──────────────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;

// ─── Touch targets ────────────────────────────────────────────────────────────
// Accessibility: 48 px minimum. Primary buttons: 52 px.
export const touchTargets = {
  min: 48,
  primary: 52,
  large: 64,  // driver app step button
} as const;

// ─── Motion ──────────────────────────────────────────────────────────────────
// Purposeful only. No bouncing, no confetti, no looping decoration.
export const transitions = {
  instant: '100ms ease',
  fast: '150ms ease',
  base: '200ms ease',
  /** Used for step slides — slides in the direction of travel */
  slide: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
  /** Stamp effect on delivery confirmation */
  stamp: '300ms cubic-bezier(0.68, -0.55, 0.27, 1.55)',
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────────────────
export const breakpoints = {
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

