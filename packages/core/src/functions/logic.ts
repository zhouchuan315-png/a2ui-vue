// A2UI v0.9 Logic Functions

import type { FunctionImpl } from './index'

export const logicFunctions: Record<string, FunctionImpl> = {
  and: (args) => {
    const values = args.values ?? args.value ?? []
    if (!Array.isArray(values)) return Boolean(values)
    return values.every(Boolean)
  },

  or: (args) => {
    const values = args.values ?? args.value ?? []
    if (!Array.isArray(values)) return Boolean(values)
    return values.some(Boolean)
  },

  not: (args) => {
    return !Boolean(args.value)
  },
}
