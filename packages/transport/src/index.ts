// @nine1ie/a2ui-vue-transport - Transport layer adapters

import type { A2UIServerMessage, ActionMessage } from '@nine1ie/a2ui-vue-core'

export interface TransportAdapter {
  connect(): void
  disconnect(): void
  onMessage(callback: (message: A2UIServerMessage) => void): void
  onAction(action: ActionMessage): void
  onError(callback: (error: Error) => void): void
  readonly connected: boolean
}

export type { A2UIServerMessage, ActionMessage }
