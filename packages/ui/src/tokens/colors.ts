/**
 * Vagrova Design Tokens — Colors
 *
 * Palette:
 * - #0D6D78 (Deep Harbor Teal) — Primary brand anchor, dark cards, headings, nav pills
 * - #EBF2F3 (Mist Ice)         — Soft surface, card backgrounds, form containers
 * - #FFC600 (Safety Gold)      — Primary CTAs, active highlights, badges
 * - #82CDE7 (Sky Cyan)         — Secondary light accent, progress highlights, info pills
 * - #43AEC5 (Coastal Teal)     — Interactive secondary accent, borders, icons
 */

export const colors = {
  // ─── Brand ───────────────────────────────────────────────────────────────
  /** Primary dark brand anchor (#0D6D78) */
  asphalt: '#0D6D78',
  harborTeal: '#0D6D78',

  /** Primary high-visibility CTA & highlight (#FFC600) */
  safetyAmber: '#FFC600',
  gold: '#FFC600',

  /** Secondary interactive coastal teal (#43AEC5) */
  coastalTeal: '#43AEC5',

  /** Secondary light sky cyan (#82CDE7) */
  skyCyan: '#82CDE7',

  // ─── Surfaces ────────────────────────────────────────────────────────────
  /** App & soft container background (#EBF2F3) */
  waybillPaper: '#EBF2F3',
  mistIce: '#EBF2F3',

  /** Crisp card & modal background */
  roadWhite: '#FFFFFF',

  // ─── Semantic ────────────────────────────────────────────────────────────
  /** Confirmed, delivered, paid */
  weighbridgeGreen: '#1E825A',

  /** Error, overdue, rejected */
  rustRed: '#C0392B',

  /** Muted teal-slate text & secondary labels */
  gravelGrey: '#4B6B70',

  // ─── Gold scale (for hover / pressed states) ─────────────────────────────
  amberLight: '#FFE066',
  amberDark: '#E0AE00',

  // ─── Teal scale (sidebar, dark sheets, active states) ────────────────────
  asphaltLight: '#43AEC5',
  asphaltDark: '#084D55',

  // ─── Green / Red scales ──────────────────────────────────────────────────
  greenLight: '#D4F0E5',
  greenDark: '#13573C',
  redLight: '#FADBD8',
  redDark: '#87241B',

  // ─── Harmonized Cool Neutrals ────────────────────────────────────────────
  grey100: '#EBF2F3',
  grey200: '#CFE0E3',
  grey300: '#82CDE7',
  grey400: '#6A949B',
  grey500: '#4B6B70',
  grey600: '#2E565C',
  grey700: '#165D66',
  grey800: '#0D6D78',

  // ─── Transparent overlays ────────────────────────────────────────────────
  overlayDark: 'rgba(13, 109, 120, 0.65)',
  overlayLight: 'rgba(235, 242, 243, 0.88)',
} as const;

export type ColorKey = keyof typeof colors;
