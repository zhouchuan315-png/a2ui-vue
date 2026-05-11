// @a2ui/vue-core - A2UI v0.9 Protocol Core

export * from './types'
export { parseMessage, parseMessageStream, validateMessage, A2UIParseError } from './parser'
export { ComponentRegistry } from './component-registry'
export { SurfaceManager, type SurfaceInstance, type ActionHandler } from './surface'
export {
  getByPointer,
  setByPointer,
  deleteByPointer,
  deepMerge,
  resolvePath,
  setPath,
  isDynamicValue,
  resolveLiteral,
  type Scope,
} from './data-model'
export { executeFunction, registerFunction, getFunction, type FunctionImpl } from './functions'
