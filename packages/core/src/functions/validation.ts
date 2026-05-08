// A2UI v0.9 Validation Functions

import type { FunctionImpl } from './index'

export const validationFunctions: Record<string, FunctionImpl> = {
  required: (args) => {
    const value = args.value
    return value != null && value !== ''
  },

  regex: (args) => {
    const { value, pattern } = args
    if (value == null || !pattern) return false
    return new RegExp(pattern).test(String(value))
  },

  length: (args) => {
    const { value, min, max } = args
    if (value == null) return false
    const len = String(value).length
    if (min != null && len < min) return false
    if (max != null && len > max) return false
    return true
  },

  numeric: (args) => {
    const { value, min, max } = args
    if (value == null) return false
    const num = Number(value)
    if (isNaN(num)) return false
    if (min != null && num < min) return false
    if (max != null && num > max) return false
    return true
  },

  email: (args) => {
    const { value } = args
    if (value == null) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
  },
}
