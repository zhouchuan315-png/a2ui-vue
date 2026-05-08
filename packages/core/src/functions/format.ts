// A2UI v0.9 Format Functions

import type { FunctionImpl } from './index'
import { isDynamicValue, resolvePath } from '../data-model'

export const formatFunctions: Record<string, FunctionImpl> = {
  formatString: (args, dataModel, scope) => {
    const template = String(args.template ?? args.value ?? '')

    return template.replace(/\$\{(.*?)\}/g, (_, expr: string) => {
      // Handle escaped \${  → literal ${
      if (expr.startsWith('{')) return '${' + expr.slice(1)

      // Data binding: /absolute/path or relative/path
      if (!expr.includes('(')) {
        const value = resolvePath(expr.trim(), dataModel, scope)
        return value != null ? String(value) : ''
      }

      // Function call: funcName(args)
      // Simple recursive resolution would need the function registry
      // For now, resolve as path if it doesn't match function pattern
      return ''
    })
  },

  formatNumber: (args) => {
    const { value, precision, grouping } = args
    if (value == null) return ''
    const num = Number(value)
    if (isNaN(num)) return ''

    return num.toLocaleString(undefined, {
      minimumFractionDigits: precision ?? 0,
      maximumFractionDigits: precision ?? 0,
      useGrouping: grouping !== false,
    })
  },

  formatCurrency: (args) => {
    const { value, currency, precision } = args
    if (value == null) return ''
    const num = Number(value)
    if (isNaN(num)) return ''

    return num.toLocaleString(undefined, {
      style: 'currency',
      currency: currency ?? 'USD',
      minimumFractionDigits: precision ?? 2,
      maximumFractionDigits: precision ?? 2,
    })
  },

  formatDate: (args) => {
    const { value, format } = args
    if (value == null) return ''

    const date = new Date(value)
    if (isNaN(date.getTime())) return ''

    // Simple format tokens: yyyy, MM, dd, HH, mm, ss
    const tokens: Record<string, string> = {
      yyyy: String(date.getFullYear()),
      MM: String(date.getMonth() + 1).padStart(2, '0'),
      dd: String(date.getDate()).padStart(2, '0'),
      HH: String(date.getHours()).padStart(2, '0'),
      mm: String(date.getMinutes()).padStart(2, '0'),
      ss: String(date.getSeconds()).padStart(2, '0'),
    }

    let result = format ?? 'yyyy-MM-dd'
    for (const [token, replacement] of Object.entries(tokens)) {
      result = result.replace(token, replacement)
    }
    return result
  },
}
