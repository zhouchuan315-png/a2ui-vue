// A2UI Data Model - JSON Pointer resolution + Dynamic* value binding

import type { DynamicValue, DynamicString, DynamicNumber, DynamicBoolean } from './types/protocol'

// ─── JSON Pointer (RFC 6901) ───

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

export function getByPointer(obj: any, pointer: string): any {
  if (!pointer || pointer === '/') return obj

  const parts = pointer.split('/').filter(Boolean)
  let current = obj

  for (const part of parts) {
    if (current == null) return undefined
    current = current[decodePointerSegment(part)]
  }

  return current
}

export function setByPointer(obj: any, pointer: string, value: any): void {
  if (!pointer || pointer === '/') return

  const parts = pointer.split('/').filter(Boolean)
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null) return
    const decoded = decodePointerSegment(parts[i])
    if (typeof current[decoded] !== 'object' || current[decoded] === null) {
      current[decoded] = {}
    }
    current = current[decoded]
  }

  if (current != null) {
    const lastKey = decodePointerSegment(parts[parts.length - 1])
    current[lastKey] = value
  }
}

export function deleteByPointer(obj: any, pointer: string): void {
  if (!pointer || pointer === '/') return

  const parts = pointer.split('/').filter(Boolean)
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null) return
    current = current[decodePointerSegment(parts[i])]
  }

  if (current != null) {
    const lastKey = decodePointerSegment(parts[parts.length - 1])
    if (Array.isArray(current)) {
      current.splice(Number(lastKey), 1)
    } else {
      delete current[lastKey]
    }
  }
}

// ─── Deep Merge (for updateDataModel upsert semantics) ───

export function deepMerge(target: any, source: any): any {
  if (source === undefined) return target
  if (typeof source !== 'object' || source === null) return source
  if (typeof target !== 'object' || target === null) return structuredClone(source)

  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] === undefined) {
      delete result[key]
    } else {
      result[key] = deepMerge(target[key], source[key])
    }
  }
  return result
}

// ─── Scope (for template rendering with relative paths) ───

export interface Scope {
  currentItem: any
  index: number
  parent?: Scope
}

// ─── Resolve Dynamic* values ───

export function isDynamicValue(value: any): value is DynamicValue {
  if (typeof value !== 'object' || value === null) return false
  return (
    'literalString' in value ||
    'literalNumber' in value ||
    'literalBoolean' in value ||
    'literalArray' in value ||
    'path' in value ||
    'functionCall' in value
  )
}

export function resolvePath(path: string, dataModel: any, scope?: Scope): any {
  // Absolute path (starts with /)
  if (path.startsWith('/')) {
    return getByPointer(dataModel, path)
  }

  // Relative path — resolve against current scope
  let current: Scope | undefined = scope
  const parts = path.split('/')
  let result: any = undefined

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      // First segment resolves against currentItem
      result = current?.currentItem?.[parts[0]]
      current = current?.parent
    } else {
      result = result?.[parts[i]]
    }
  }

  return result
}

export function setPath(path: string, dataModel: any, value: any, scope?: Scope): void {
  if (path.startsWith('/')) {
    setByPointer(dataModel, path, value)
    return
  }

  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return

  let current = scope?.currentItem ?? dataModel
  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null) return
    const key = parts[i]
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key]
  }

  if (current != null) {
    current[parts[parts.length - 1]] = value
  }
}

export function resolveLiteral(dynamic: DynamicValue): any {
  if ('literalString' in dynamic) return dynamic.literalString
  if ('literalNumber' in dynamic) return dynamic.literalNumber
  if ('literalBoolean' in dynamic) return dynamic.literalBoolean
  if ('literalArray' in dynamic) return dynamic.literalArray
  return undefined
}
