// SSE Transport Adapter for A2UI

import type { TransportAdapter } from './index'
import type { A2UIServerMessage, ActionMessage } from '@a2ui/vue-core'
import { parseMessage } from '@a2ui/vue-core'

export interface SSETransportConfig {
  url: string
  headers?: Record<string, string>
  withCredentials?: boolean
  retryInterval?: number
}

export function createSSETransport(config: SSETransportConfig): TransportAdapter {
  let eventSource: EventSource | null = null
  let messageCallback: ((message: A2UIServerMessage) => void) | null = null
  let errorCallback: ((error: Error) => void) | null = null
  let _connected = false

  return {
    get connected() {
      return _connected
    },

    connect() {
      if (eventSource) {
        eventSource.close()
      }

      eventSource = new EventSource(config.url, {
        withCredentials: config.withCredentials,
      })

      eventSource.onopen = () => {
        _connected = true
      }

      eventSource.onmessage = (event) => {
        try {
          const message = parseMessage(event.data)
          messageCallback?.(message)
        } catch (e) {
          errorCallback?.(e as Error)
        }
      }

      eventSource.onerror = (event) => {
        _connected = false
        if (eventSource?.readyState === EventSource.CLOSED) {
          errorCallback?.(new Error('SSE connection closed'))
        }
      }
    },

    disconnect() {
      eventSource?.close()
      eventSource = null
      _connected = false
    },

    onMessage(callback) {
      messageCallback = callback
    },

    onAction(action: ActionMessage) {
      // SSE is unidirectional; actions must be sent via a separate HTTP request
      fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(action),
        credentials: config.withCredentials ? 'include' : 'same-origin',
      }).catch((err) => {
        errorCallback?.(err)
      })
    },

    onError(callback) {
      errorCallback = callback
    },
  }
}
