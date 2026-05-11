// A2UI v0.9 Client Functions Registry

import type { Scope } from '../data-model'
import { resolvePath, isDynamicValue, resolveLiteral } from '../data-model'
import { validationFunctions } from './validation'
import { formatFunctions } from './format'
import { logicFunctions } from './logic'
import { pluralizeFunction } from './pluralize'

export type FunctionImpl = (args: Record<string, any>, dataModel: any, scope?: Scope) => any

const builtinFunctions: Record<string, FunctionImpl> = {
  ...validationFunctions,
  ...formatFunctions,
  ...logicFunctions,
  pluralize: pluralizeFunction,
  openUrl: (args) => {
    if (args.url) window.open(String(args.url), '_blank')
  },
}

// Resolve function arguments, handling DynamicValue bindings
function resolveArgs(args: Record<string, any> | undefined, dataModel: any, scope?: Scope): Record<string, any> {
  if (!args) return {}
  const resolved: Record<string, any> = {}
  for (const [key, value] of Object.entries(args)) {
    if (isDynamicValue(value)) {
      if ('path' in value && value.path) {
        resolved[key] = resolvePath(value.path, dataModel, scope)
      } else if ('functionCall' in value && value.functionCall) {
        resolved[key] = executeFunction(value.functionCall, dataModel, scope)
      } else {
        resolved[key] = resolveLiteral(value)
      }
    } else if (typeof value === 'object' && value !== null && 'call' in value) {
      // Nested function call
      resolved[key] = executeFunction(value, dataModel, scope)
    } else {
      resolved[key] = value
    }
  }
  return resolved
}

export function executeFunction(
  functionCall: { call: string; args?: Record<string, any> },
  dataModel: any,
  scope?: Scope
): any {
  const impl = builtinFunctions[functionCall.call]
  if (!impl) {
    console.warn(`[A2UI] Unknown function: ${functionCall.call}`)
    return undefined
  }
  const resolvedArgs = resolveArgs(functionCall.args, dataModel, scope)
  return impl(resolvedArgs, dataModel, scope)
}

export function registerFunction(name: string, impl: FunctionImpl): void {
  builtinFunctions[name] = impl
}

export function getFunction(name: string): FunctionImpl | undefined {
  return builtinFunctions[name]
}
