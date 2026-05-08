// WebSocket Transport Adapter for A2UI

import type { TransportAdapter } from './index'
import type { A2UIServerMessage, ActionMessage } from '@a2ui/vue-core'
import { parseMessage } from '@a2ui/vue-core'

export interface WSTransportConfig {
  url: string
  protocols?: string[]
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function createWSTransport(config: WSTransportConfig): TransportAdapter {
  let ws: WebSocket | null = null
  let messageCallback: ((message: A2UIServerMessage) => void) | null = null
  let errorCallback: ((error: Error) => void) | null = null
  let _connected = false
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const reconnectEnabled = config.reconnect ?? true
  const reconnectInterval = config.reconnectInterval ?? 3000
  const maxReconnectAttempts = config.maxReconnectAttempts ?? 10

  function doConnect() {
    if (ws) {
      ws.close()
    }

    ws = new WebSocket(config.url, config.protocols)

    ws.onopen = () => {
      _connected = true
      reconnectAttempts = 0
    }

    ws.onmessage = (event) => {
      try {
        const message = parseMessage(event.data)
        messageCallback?.(message)
      } catch (e) {
        errorCallback?.(e as Error)
      }
    }

    ws.onerror = () => {
      errorCallback?.(new Error('WebSocket error'))
    }

    ws.onclose = () => {
      _connected = false

      if (reconnectEnabled && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        reconnectTimer = setTimeout(doConnect, reconnectInterval)
      }
    }
  }

  return {
    get connected() {
      return _connected
    },

    connect() {
      doConnect()
    },

    disconnect() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      reconnectAttempts = maxReconnectAttempts // Prevent reconnect
      ws?.close()
      ws = null
      _connected = false
    },

    onMessage(callback) {
      messageCallback = callback
    },

    onAction(action: ActionMessage) {
      if (ws && _connected) {
        ws.send(JSON.stringify(action))
      } else {
        errorCallback?.(new Error('WebSocket not connected'))
      }
    },

    onError(callback) {
      errorCallback = callback
    },
  }
}
