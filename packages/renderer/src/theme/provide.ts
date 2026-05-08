// Theme provider - generates CSS variables and provides them via Vue DI

import { inject, provide, computed, type InjectionKey, type Ref } from 'vue'
import { resolveThemeTokens, type ThemeTokens } from './tokens'
import { generateCSSVariables } from './design-tokens'

export const THEME_KEY: InjectionKey<Ref<ThemeTokens>> = Symbol('a2ui:theme')
export const CSS_VARS_KEY: InjectionKey<Ref<Record<string, string>>> = Symbol('a2ui:cssVars')

export function provideTheme(theme?: Partial<ThemeTokens>) {
  const tokens = computed(() => resolveThemeTokens(theme))
  const cssVars = computed(() => generateCSSVariables(tokens.value))

  provide(THEME_KEY, tokens)
  provide(CSS_VARS_KEY, cssVars)

  return { tokens, cssVars }
}

export function useTheme(): Ref<ThemeTokens> {
  return inject(THEME_KEY) ?? computed(() => resolveThemeTokens())
}

export function useCSSVars(): Ref<Record<string, string>> {
  return inject(CSS_VARS_KEY) ?? computed(() => generateCSSVariables(resolveThemeTokens()))
}
