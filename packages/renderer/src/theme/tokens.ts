// A2UI Theme Tokens - user-facing theme configuration

export interface ThemeTokens {
  primaryColor: string
  errorColor?: string
  fontFamily?: string
  iconUrl?: string
  agentDisplayName?: string
}

const defaultTokens: ThemeTokens = {
  primaryColor: '#6366f1',
}

export function resolveThemeTokens(theme?: Partial<ThemeTokens>): ThemeTokens {
  return { ...defaultTokens, ...theme }
}
