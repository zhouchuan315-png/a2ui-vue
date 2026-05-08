// A2UI Theme Tokens

export interface ThemeTokens {
  primaryColor: string
  iconUrl?: string
  agentDisplayName?: string
}

const defaultTokens: ThemeTokens = {
  primaryColor: '#3b82f6',
}

export function resolveThemeTokens(theme?: Partial<ThemeTokens>): ThemeTokens {
  return { ...defaultTokens, ...theme }
}

export function generateCSSVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    '--a2-primary-color': tokens.primaryColor,
  }
}
