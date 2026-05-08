// A2UI Design Token System
// All CSS variables use the --a2-* prefix for style isolation

import type { ThemeTokens } from './tokens'

export function generateCSSVariables(tokens: ThemeTokens): Record<string, string> {
  const p = tokens.primaryColor
  // Derive primary-hover: slightly darker
  const pHover = adjustBrightness(p, -10)
  // Derive primary-focus: 15% opacity
  const pFocus = hexToRgba(p, 0.15)

  return {
    // ─── Typography ───
    '--a2-font-family': tokens.fontFamily ?? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    '--a2-line-height': '1.5',

    '--a2-font-size-xs': '0.75rem',    // 12px
    '--a2-font-size-sm': '0.8125rem',  // 13px
    '--a2-font-size-base': '0.875rem', // 14px
    '--a2-font-size-lg': '1rem',       // 16px
    '--a2-font-size-xl': '1.125rem',   // 18px
    '--a2-font-size-2xl': '1.25rem',   // 20px
    '--a2-font-size-3xl': '1.5rem',    // 24px
    '--a2-font-size-4xl': '2rem',      // 32px

    '--a2-font-weight-normal': '400',
    '--a2-font-weight-medium': '500',
    '--a2-font-weight-semibold': '600',
    '--a2-font-weight-bold': '700',

    // ─── Colors: Primary ───
    '--a2-color-primary': p,
    '--a2-color-primary-hover': pHover,
    '--a2-color-primary-focus': pFocus,

    // ─── Colors: Semantic ───
    '--a2-color-error': tokens.errorColor ?? '#ef4444',
    '--a2-color-error-focus': hexToRgba(tokens.errorColor ?? '#ef4444', 0.15),

    // ─── Colors: Text ───
    '--a2-text-primary': '#1e293b',
    '--a2-text-secondary': '#475569',
    '--a2-text-muted': '#94a3b8',
    '--a2-text-inverse': '#ffffff',
    '--a2-text-disabled': '#cbd5e1',

    // ─── Colors: Background ───
    '--a2-bg-page': '#f8fafc',
    '--a2-bg-surface': '#ffffff',
    '--a2-bg-elevated': '#ffffff',
    '--a2-bg-muted': '#f1f5f9',
    '--a2-bg-hover': '#f1f5f9',
    '--a2-bg-overlay': 'rgba(0, 0, 0, 0.5)',

    // ─── Border ───
    '--a2-border-default': '#e2e8f0',
    '--a2-border-focus': p,

    // ─── Border Radius ───
    '--a2-radius-sm': '4px',
    '--a2-radius-base': '8px',
    '--a2-radius-lg': '12px',
    '--a2-radius-full': '9999px',

    // ─── Shadows ───
    '--a2-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--a2-shadow-base': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    '--a2-shadow-lg': '0 10px 25px rgba(0, 0, 0, 0.15)',
    '--a2-shadow-xl': '0 20px 50px rgba(0, 0, 0, 0.25)',
    '--a2-shadow-focus': `0 0 0 3px ${pFocus}`,

    // ─── Spacing ───
    '--a2-space-1': '4px',
    '--a2-space-2': '8px',
    '--a2-space-3': '12px',
    '--a2-space-4': '16px',
    '--a2-space-5': '20px',
    '--a2-space-6': '24px',
    '--a2-space-8': '32px',

    // ─── Transition ───
    '--a2-transition-fast': '150ms ease',
    '--a2-transition-base': '200ms ease',
  }
}

// ─── Helpers ───

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function adjustBrightness(hex: string, percent: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + percent))
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + percent))
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + percent))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
