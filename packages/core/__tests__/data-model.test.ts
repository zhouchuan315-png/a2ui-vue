import { describe, it, expect } from 'vitest'
import {
  getByPointer,
  setByPointer,
  deleteByPointer,
  deepMerge,
  isDynamicValue,
  resolveLiteral,
} from '../src/data-model'

describe('getByPointer', () => {
  it('returns root for empty or / path', () => {
    const obj = { a: 1 }
    expect(getByPointer(obj, '')).toBe(obj)
    expect(getByPointer(obj, '/')).toBe(obj)
  })

  it('resolves nested path', () => {
    const obj = { user: { name: 'Alice', address: { city: 'Beijing' } } }
    expect(getByPointer(obj, '/user/name')).toBe('Alice')
    expect(getByPointer(obj, '/user/address/city')).toBe('Beijing')
  })

  it('resolves array index', () => {
    const obj = { items: ['a', 'b', 'c'] }
    expect(getByPointer(obj, '/items/1')).toBe('b')
  })

  it('returns undefined for missing path', () => {
    const obj = { a: 1 }
    expect(getByPointer(obj, '/b')).toBeUndefined()
    expect(getByPointer(obj, '/a/b')).toBeUndefined()
  })

  it('handles RFC 6901 escaping', () => {
    const obj = { 'a/b': 1, 'c~d': 2 }
    expect(getByPointer(obj, '/a~1b')).toBe(1)
    expect(getByPointer(obj, '/c~0d')).toBe(2)
  })
})

describe('setByPointer', () => {
  it('sets nested value', () => {
    const obj: any = { user: { name: '' } }
    setByPointer(obj, '/user/name', 'Bob')
    expect(obj.user.name).toBe('Bob')
  })

  it('sets array element', () => {
    const obj: any = { items: ['a', 'b'] }
    setByPointer(obj, '/items/1', 'B')
    expect(obj.items[1]).toBe('B')
  })

  it('does nothing for root path', () => {
    const obj: any = { a: 1 }
    setByPointer(obj, '/', 'ignored')
    expect(obj.a).toBe(1)
  })
})

describe('deleteByPointer', () => {
  it('deletes a key', () => {
    const obj: any = { a: 1, b: 2 }
    deleteByPointer(obj, '/a')
    expect(obj.a).toBeUndefined()
    expect(obj.b).toBe(2)
  })
})

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const target = { a: 1, b: { c: 2, d: 3 } }
    const source = { b: { c: 10, e: 4 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: { c: 10, d: 3, e: 4 } })
  })

  it('overrides primitives', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 })
  })

  it('handles null source', () => {
    expect(deepMerge({ a: 1 }, null)).toBeNull()
  })
})

describe('isDynamicValue', () => {
  it('detects literalString', () => {
    expect(isDynamicValue({ literalString: 'hi' })).toBe(true)
  })

  it('detects path', () => {
    expect(isDynamicValue({ path: '/name' })).toBe(true)
  })

  it('detects functionCall', () => {
    expect(isDynamicValue({ functionCall: { call: 'required' } })).toBe(true)
  })

  it('rejects plain values', () => {
    expect(isDynamicValue('hello')).toBe(false)
    expect(isDynamicValue(42)).toBe(false)
    expect(isDynamicValue(null)).toBe(false)
  })
})

describe('resolveLiteral', () => {
  it('resolves literalString', () => {
    expect(resolveLiteral({ literalString: 'hello' })).toBe('hello')
  })

  it('resolves literalNumber', () => {
    expect(resolveLiteral({ literalNumber: 42 })).toBe(42)
  })

  it('resolves literalBoolean', () => {
    expect(resolveLiteral({ literalBoolean: true })).toBe(true)
  })

  it('resolves literalArray', () => {
    expect(resolveLiteral({ literalArray: ['a', 'b'] })).toEqual(['a', 'b'])
  })
})
