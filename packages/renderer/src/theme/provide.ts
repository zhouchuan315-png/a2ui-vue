// Theme provider for Vue dependency injection

import { inject, provide, type InjectionKey, computed, type Ref } from 'vue'
import { resolveThemeTokens, generateCSSVariables, type ThemeTokens } from './tokens'
import type { Theme } from '@a2ui/vue-core'

export const THEME_KEY: InjectionKey<Ref<ThemeTokens>> = Symbol('a2ui:theme')

export function provideTheme(theme?: Theme) {
  const tokens = computed(() => resolveThemeTokens(theme))
  provide(THEME_KEY, tokens)
  return tokens
}

export function useTheme(): Ref<ThemeTokens> {
  const theme = inject(THEME_KEY)
  if (!theme) {
    // Return default theme if not provided
    return computed(() => resolveThemeTokens())
  }
  return theme
}
