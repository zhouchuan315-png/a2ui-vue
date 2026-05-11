import { describe, expect, it } from 'vitest'
import { generateCSSVariables } from '../src/theme/design-tokens'
import { resolveThemeTokens } from '../src/theme/tokens'

describe('theme tokens', () => {
  it('generates isolated A2UI CSS variables from theme tokens', () => {
    const cssVars = generateCSSVariables(resolveThemeTokens({ primaryColor: '#336699' }))

    expect(cssVars['--a2-color-primary']).toBe('#336699')
    expect(cssVars['--a2-color-primary-hover']).toBe('#295c8f')
    expect(cssVars['--a2-color-primary-focus']).toBe('rgba(51, 102, 153, 0.15)')
    expect(Object.keys(cssVars).every((key) => key.startsWith('--a2-'))).toBe(true)
  })
})
