import { describe, it, expect } from 'vitest'
import { parseMessage, parseMessageStream, validateMessage, A2UIParseError } from '../src/parser'

describe('parseMessage', () => {
  it('parses createSurface', () => {
    const msg = parseMessage('{"createSurface":{"surfaceId":"s1","catalogId":"cat1"}}')
    expect(msg.createSurface).toEqual({ surfaceId: 's1', catalogId: 'cat1' })
  })

  it('parses updateComponents', () => {
    const msg = parseMessage('{"updateComponents":{"surfaceId":"s1","components":[{"id":"root","component":"Text"}]}}')
    expect(msg.updateComponents?.components).toHaveLength(1)
    expect(msg.updateComponents?.components[0].id).toBe('root')
  })

  it('parses updateDataModel', () => {
    const msg = parseMessage('{"updateDataModel":{"surfaceId":"s1","value":{"name":"test"}}}')
    expect(msg.updateDataModel?.value).toEqual({ name: 'test' })
  })

  it('parses deleteSurface', () => {
    const msg = parseMessage('{"deleteSurface":{"surfaceId":"s1"}}')
    expect(msg.deleteSurface?.surfaceId).toBe('s1')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseMessage('not json')).toThrow(A2UIParseError)
  })

  it('throws on unknown message type', () => {
    expect(() => parseMessage('{"unknown":{}}')).toThrow(A2UIParseError)
  })
})

describe('parseMessageStream', () => {
  it('parses JSONL stream', () => {
    const jsonl = [
      '{"createSurface":{"surfaceId":"s1","catalogId":"cat1"}}',
      '{"updateComponents":{"surfaceId":"s1","components":[]}}',
    ].join('\n')

    const messages = parseMessageStream(jsonl)
    expect(messages).toHaveLength(2)
    expect(messages[0].createSurface).toBeDefined()
    expect(messages[1].updateComponents).toBeDefined()
  })

  it('skips empty lines', () => {
    const jsonl = '{"createSurface":{"surfaceId":"s1","catalogId":"cat1"}}\n\n\n'
    const messages = parseMessageStream(jsonl)
    expect(messages).toHaveLength(1)
  })
})

describe('validateMessage', () => {
  it('validates createSurface requires surfaceId', () => {
    const result = validateMessage({ createSurface: { surfaceId: '', catalogId: 'cat' } })
    expect(result.valid).toBe(false)
    expect(result.errors[0].path).toBe('/createSurface/surfaceId')
  })

  it('validates createSurface requires catalogId', () => {
    const result = validateMessage({ createSurface: { surfaceId: 's1', catalogId: '' } })
    expect(result.valid).toBe(false)
    expect(result.errors[0].path).toBe('/createSurface/catalogId')
  })

  it('passes valid createSurface', () => {
    const result = validateMessage({ createSurface: { surfaceId: 's1', catalogId: 'cat1' } })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates updateComponents requires components array', () => {
    const result = validateMessage({ updateComponents: { surfaceId: 's1', components: 'bad' as any } })
    expect(result.valid).toBe(false)
  })

  it('validates duplicate component ids', () => {
    const result = validateMessage({
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'a', component: 'Text' },
          { id: 'a', component: 'Button' },
        ],
      },
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('Duplicate')
  })

  it('passes valid updateComponents', () => {
    const result = validateMessage({
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column' },
          { id: 'child', component: 'Text' },
        ],
      },
    })
    expect(result.valid).toBe(true)
  })
})
