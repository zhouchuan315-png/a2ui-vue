import { describe, it, expect } from 'vitest'
import { executeFunction, registerFunction } from '../src/functions'

describe('executeFunction', () => {
  describe('validation functions', () => {
    it('required - passes for non-empty', () => {
      expect(executeFunction({ call: 'required', args: { value: 'hello' } }, {})).toBe(true)
    })

    it('required - fails for empty string', () => {
      expect(executeFunction({ call: 'required', args: { value: '' } }, {})).toBe(false)
    })

    it('required - fails for null', () => {
      expect(executeFunction({ call: 'required', args: { value: null } }, {})).toBe(false)
    })

    it('email - validates correct email', () => {
      expect(executeFunction({ call: 'email', args: { value: 'a@b.com' } }, {})).toBe(true)
    })

    it('email - rejects invalid email', () => {
      expect(executeFunction({ call: 'email', args: { value: 'not-email' } }, {})).toBe(false)
    })

    it('regex - matches pattern', () => {
      expect(executeFunction({ call: 'regex', args: { value: 'abc123', pattern: '^[a-z]+\\d+$' } }, {})).toBe(true)
    })

    it('length - checks min/max', () => {
      expect(executeFunction({ call: 'length', args: { value: 'hi', min: 1, max: 5 } }, {})).toBe(true)
      expect(executeFunction({ call: 'length', args: { value: 'hi', min: 3 } }, {})).toBe(false)
    })

    it('numeric - checks range', () => {
      expect(executeFunction({ call: 'numeric', args: { value: 5, min: 0, max: 10 } }, {})).toBe(true)
      expect(executeFunction({ call: 'numeric', args: { value: 15, max: 10 } }, {})).toBe(false)
    })
  })

  describe('format functions', () => {
    it('formatNumber - formats with precision', () => {
      const result = executeFunction({ call: 'formatNumber', args: { value: 1234.5, precision: 2 } }, {})
      expect(result).toContain('1')
      expect(result).toContain('234')
    })

    it('formatDate - formats date', () => {
      const result = executeFunction(
        { call: 'formatDate', args: { value: '2025-12-03T10:30:00Z', format: 'yyyy-MM-dd' } },
        {},
      )
      expect(result).toMatch(/2025-12-0[23]/)
    })

    it('pluralize - handles count', () => {
      expect(executeFunction({ call: 'pluralize', args: { count: 0, zero: 'none', one: 'one', other: 'many' } }, {})).toBe('none')
      expect(executeFunction({ call: 'pluralize', args: { count: 1, one: 'one', other: 'many' } }, {})).toBe('one')
      expect(executeFunction({ call: 'pluralize', args: { count: 5, other: 'many' } }, {})).toBe('many')
    })
  })

  describe('logic functions', () => {
    it('and - returns true when all truthy', () => {
      expect(executeFunction({ call: 'and', args: { values: [true, true, true] } }, {})).toBe(true)
      expect(executeFunction({ call: 'and', args: { values: [true, false, true] } }, {})).toBe(false)
    })

    it('or - returns true when any truthy', () => {
      expect(executeFunction({ call: 'or', args: { values: [false, true, false] } }, {})).toBe(true)
      expect(executeFunction({ call: 'or', args: { values: [false, false] } }, {})).toBe(false)
    })

    it('not - inverts boolean', () => {
      expect(executeFunction({ call: 'not', args: { value: true } }, {})).toBe(false)
      expect(executeFunction({ call: 'not', args: { value: false } }, {})).toBe(true)
    })
  })

  describe('custom function registration', () => {
    it('registers and calls custom function', () => {
      registerFunction('double', (args) => Number(args.value) * 2)
      expect(executeFunction({ call: 'double', args: { value: 5 } }, {})).toBe(10)
    })
  })
})
