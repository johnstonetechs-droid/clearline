/**
 * ClearWire brand tokens.
 *
 * Source of truth: the website's Design System v1.0 palette, mirrored here
 * so the native app stays visually in sync. Raw palette + role-based tokens
 * both exported — use roles for general styling, palette for damage-type
 * accents and map markers (APWA 811 colors).
 */

// Raw palette — mirrors const T in src/App.jsx (Design System v1.0).
export const palette = {
  navy900: '#0A1628',
  navy800: '#0F2040',
  navy700: '#162952',
  blue700: '#1A4ED8',
  blue600: '#2563EB',
  blue400: '#3B82F6',
  white: '#FFFFFF',
  offwhite: '#F0F4F8',

  // APWA 811 damage-type colors
  telecom: '#EA580C',
  electric: '#DC2626',
  water: '#2563EB',

  // Status
  green: '#059669',
  amber: '#D97706',
  red: '#DC2626',

  // Neutrals (on dark surface)
  n900: '#1E2D3D',
  n800: '#2D3F52',
  n600: '#4A6080',
  n400: '#7A94AE',
  n200: '#B0C4D4',
  n100: '#E2EBF0',
  n50: '#F0F4F8',
} as const;

// APWA damage-category → color. Use for chips, pins, and pill colors.
export const APWA_COLORS = {
  downed_line: palette.electric,
  leaning_pole: palette.telecom,
  tree_on_wire: palette.telecom,
  transformer: palette.electric,
  vegetation: palette.green,
  other: palette.n400,
} as const;

export const T = {
  // Surfaces
  bg: palette.navy900,
  surface: palette.navy800,
  surfaceAlt: palette.navy700,

  // Text
  text: palette.white,
  textMuted: palette.n200,
  textDim: palette.n400,

  // Brand / actions
  primary: palette.blue600,
  primaryDark: palette.blue700,
  primaryLight: palette.blue400,
  accent: palette.telecom,

  // Status
  success: palette.green,
  warning: palette.amber,
  danger: palette.electric,

  // Structure
  border: palette.n600,

  // Spacing (4pt grid)
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Type scale — matches website's type rhythm
  font: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },

  // Radii
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 999,
  },
} as const;

export type BrandTokens = typeof T;
export type Palette = typeof palette;
