/** Design tokens mirroring the web app (see CLAUDE.md). */
export const colors = {
  primary:     '#1D9E75',
  primaryDark: '#178A64',
  accent:      '#534AB7',
  warning:     '#BA7517',
  danger:      '#E24B4A',
  success:     '#639922',
  bghBlue:     '#185FA5',

  bg:        '#F9FAFB',
  card:      '#FFFFFF',
  border:    '#E5E7EB',
  borderLt:  '#F3F4F6',

  text:      '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
} as const

export const radius = {
  input: 8,
  card: 12,
  btn: 20,
  pill: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

/** Subtle tint for a colored chip background (hex + alpha). */
export function tint(hex: string, alpha = '14') {
  return hex + alpha // e.g. '#1D9E75' + '14' ≈ 8% opacity
}

export const severityColor = {
  info: colors.accent,
  warning: colors.warning,
  danger: colors.danger,
} as const
