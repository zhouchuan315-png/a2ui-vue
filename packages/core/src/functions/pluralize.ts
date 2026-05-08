// A2UI v0.9 Pluralize Function

import type { FunctionImpl } from './index'

export const pluralizeFunction: FunctionImpl = (args) => {
  const { count, zero, one, other } = args
  const n = Number(count) || 0

  if (n === 0 && zero != null) return zero
  if (n === 1 && one != null) return one
  return other ?? ''
}
