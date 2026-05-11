import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSETransport } from '../src/sse'
import { createWSTransport } from '../src/websocket'

class FakeEventSource {
  static CLOSED = 2
  static instances: FakeEventSource[] = []

  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState = 0
  closed = false

  constructor(
    public url: string,
    public options?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this)
  }

  close() {
    this.closed = true
    this.readyState = FakeEventSource.CLOSED
  }
}

class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  sent: string[] = []
  closed = false

  constructor(
    public url: string,
    public protocols?: string[],
  ) {
    FakeWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
    this.onclose?.()
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  FakeEventSource.instances = []
  FakeWebSocket.instances = []
})

describe('createSSETransport', () => {
  it('connects, parses messages, and reports parse errors', () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    const transport = createSSETransport({ url: '/events', withCredentials: true })
    const onMessage = vi.fn()
    const onError = vi.fn()

    transport.onMessage(onMessage)
    transport.onError(onError)
    transport.connect()

    const source = FakeEventSource.instances[0]
    source.onopen?.()
    source.onmessage?.({ data: '{"deleteSurface":{"surfaceId":"s1"}}' })
    source.onmessage?.({ data: 'not json' })

    expect(transport.connected).toBe(true)
    expect(source.url).toBe('/events')
    expect(source.options).toEqual({ withCredentials: true })
    expect(onMessage).toHaveBeenCalledWith({ deleteSurface: { surfaceId: 's1' } })
    expect(onError).toHaveBeenCalledOnce()
  })

  it('posts actions over the configured HTTP endpoint', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('EventSource', FakeEventSource)
    vi.stubGlobal('fetch', fetchMock)
    const transport = createSSETransport({ url: '/events', headers: { Authorization: 'Bearer token' } })

    transport.onAction({
      name: 'submit',
      surfaceId: 's1',
      sourceComponentId: 'btn',
      timestamp: '2026-05-09T00:00:00.000Z',
      context: { ok: true },
    })

    expect(fetchMock).toHaveBeenCalledWith('/events', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      credentials: 'same-origin',
    }))
  })
})

describe('createWSTransport', () => {
  it('connects, sends actions, and parses inbound messages', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const transport = createWSTransport({ url: 'ws://localhost/events', protocols: ['a2ui'], reconnect: false })
    const onMessage = vi.fn()

    transport.onMessage(onMessage)
    transport.connect()

    const socket = FakeWebSocket.instances[0]
    socket.onopen?.()
    transport.onAction({
      name: 'click',
      surfaceId: 's1',
      sourceComponentId: 'btn',
      timestamp: '2026-05-09T00:00:00.000Z',
      context: {},
    })
    socket.onmessage?.({ data: '{"deleteSurface":{"surfaceId":"s1"}}' })

    expect(transport.connected).toBe(true)
    expect(socket.url).toBe('ws://localhost/events')
    expect(socket.protocols).toEqual(['a2ui'])
    expect(JSON.parse(socket.sent[0])).toEqual(expect.objectContaining({ name: 'click' }))
    expect(onMessage).toHaveBeenCalledWith({ deleteSurface: { surfaceId: 's1' } })
  })

  it('reports an error when sending while disconnected', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const transport = createWSTransport({ url: 'ws://localhost/events', reconnect: false })
    const onError = vi.fn()

    transport.onError(onError)
    transport.onAction({
      name: 'click',
      surfaceId: 's1',
      sourceComponentId: 'btn',
      timestamp: '2026-05-09T00:00:00.000Z',
      context: {},
    })

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'WebSocket not connected' }))
  })
})
