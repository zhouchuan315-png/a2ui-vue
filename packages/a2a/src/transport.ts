/**
 * A2A Transport Adapter — 核心传输适配器
 *
 * 将 A2A 协议的完整生命周期（发现、连接、消息收流、动作转发）
 * 封装为一个 TransportAdapter 兼容的接口。
 *
 * 工作流程：
 * 1. connect() — 获取 Agent Card，验证能力，建立会话
 * 2. sendText() — 发送用户消息，启动流式/非流式通信
 * 3. onAction() — 将 Renderer 的用户交互转发给 Agent
 * 4. SSE 事件 → Mapper → A2UIServerMessage → Renderer
 *
 * 线程安全：所有状态变更通过闭包管理，无需额外锁机制。
 */

import type {
  A2ATransportConfig,
  A2ATransportAdapter,
  A2ASendOptions,
  A2ATask,
  AgentCard,
  A2AStreamingEvent,
} from './types'
import type { A2UIServerMessage, ActionMessage } from '@nine1ie/a2ui-vue-core'
import { fetchAgentCard, selectEndpoint, supportsStreaming } from './agent-card'
import { createJsonRpcClient, type JsonRpcClient } from './jsonrpc'
import { parseSSEStream } from './stream'
import {
  createSessionState,
  mapStreamingEvent,
  mapActionToA2AMessage,
  extractCreateSurface,
  type A2ASessionState,
} from './mapper'

/** 默认的 accepted output modes */
const DEFAULT_OUTPUT_MODES = [
  'application/vnd.a2ui+json',
  'application/json',
  'text/markdown',
  'text/plain',
  'image/png',
  'image/jpeg',
]

/**
 * 创建 A2A Transport 适配器
 *
 * 这是整个 A2A 集成层的主入口。返回的适配器对象实现了
 * A2ATransportAdapter 接口，与现有 TransportAdapter 对齐。
 *
 * @example
 * ```typescript
 * const transport = createA2ATransport({
 *   agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
 *   streaming: true,
 * })
 *
 * transport.onMessage((msg) => renderer.processMessage(msg))
 * await transport.connect()
 * await transport.sendText('Hello')
 * ```
 */
export function createA2ATransport(config: A2ATransportConfig): A2ATransportAdapter {
  // ─── 内部状态 ───
  let _connected = false
  let _agentCard: AgentCard | null = null
  let _jsonRpcClient: JsonRpcClient | null = null
  let _sessionState: A2ASessionState = createSessionState()
  let _currentStreamCleanup: (() => void) | null = null

  // ─── 回调注册 ───
  let _messageCallback: ((message: A2UIServerMessage) => void) | null = null
  let _taskCallback: ((task: A2ATask) => void) | null = null
  let _errorCallback: ((error: Error) => void) | null = null

  // ─── 配置处理 ───
  const outputModes = config.acceptedOutputModes ?? DEFAULT_OUTPUT_MODES
  const streamingEnabled = config.streaming !== false

  /** 发送消息到回调 */
  function emitMessage(message: A2UIServerMessage) {
    _messageCallback?.(message)
  }

  /** 发送错误到回调 */
  function emitError(error: Error) {
    _errorCallback?.(error)
  }

  /** 发送任务状态到回调 */
  function emitTask(task: A2ATask) {
    _taskCallback?.(task)
  }

  /** 处理流事件：映射并分发 A2UI 消息 */
  function handleStreamingEvent(event: A2AStreamingEvent) {
    try {
      // 首次收到事件时，检查是否需要创建 surface
      if (!_sessionState.taskId && _agentCard) {
        const createSurfaceMsgs = extractCreateSurface(event, _sessionState, _agentCard)
        for (const msg of createSurfaceMsgs) {
          emitMessage(msg)
        }
      }

      // 映射流事件为 A2UI 消息
      if (_agentCard) {
        const a2uiMessages = mapStreamingEvent(event, _sessionState, _agentCard)
        for (const msg of a2uiMessages) {
          emitMessage(msg)
        }
      }

      // 如果是 Task 对象，触发任务回调
      if ('status' in event && 'id' in event) {
        emitTask(event as A2ATask)
      }
    } catch (err) {
      emitError(err as Error)
    }
  }

  return {
    get connected() {
      return _connected
    },

    /**
     * 建立连接
     *
     * 1. 获取并验证 Agent Card
     * 2. 创建 JSON-RPC 客户端
     * 3. 标记连接状态
     */
    async connect(): Promise<void> {
      try {
        // 获取认证头
        const authHeaders = config.getAuthHeaders
          ? await config.getAuthHeaders()
          : undefined

        // 获取并验证 Agent Card
        _agentCard = await fetchAgentCard(config, authHeaders)

        // 选择端点
        const endpoint = selectEndpoint(
          _agentCard,
          config.preferredBinding ?? 'JSONRPC',
        )
        const endpointUrl = endpoint?.url ?? _agentCard.url

        // 创建 JSON-RPC 客户端
        _jsonRpcClient = createJsonRpcClient({
          endpointUrl,
          getAuthHeaders: config.getAuthHeaders,
          fetchImpl: config.fetchImpl,
        })

        // 重置会话状态
        _sessionState = createSessionState()
        _connected = true
      } catch (err) {
        emitError(err as Error)
        throw err
      }
    },

    /**
     * 断开连接
     *
     * 清理所有状态，取消进行中的流。
     */
    disconnect() {
      // 取消进行中的流
      _currentStreamCleanup?.()
      _currentStreamCleanup = null

      _connected = false
      _agentCard = null
      _jsonRpcClient = null
      _sessionState = createSessionState()
    },

    /**
     * 发送文本消息
     *
     * 根据配置和 Agent 能力选择流式或非流式模式：
     * - 流式：调用 SendStreamingMessage，解析 SSE 流
     * - 非流式：调用 SendMessage，等待完整响应
     */
    async sendText(text: string, options?: A2ASendOptions): Promise<void> {
      if (!_connected || !_jsonRpcClient || !_agentCard) {
        throw new Error('Transport 未连接，请先调用 connect()')
      }

      // 构造 A2A Message
      const message = {
        role: 'user' as const,
        contextId: _sessionState.contextId,
        taskId: _sessionState.taskId,
        parts: [
          {
            type: 'text' as const,
            text,
            mimeType: 'text/plain' as const,
          },
        ],
      }

      const modes = options?.acceptedOutputModes ?? outputModes
      const useStreaming = streamingEnabled && supportsStreaming(_agentCard)

      if (useStreaming) {
        // ─── 流式模式 ───
        try {
          const response = await _jsonRpcClient.sendStreamingMessage(
            [message],
            modes,
          )

          // 取消之前的流（如果有）
          _currentStreamCleanup?.()

          // 启动 SSE 流解析
          _currentStreamCleanup = parseSSEStream(response, {
            onEvent: handleStreamingEvent,
            onDone() {
              _currentStreamCleanup = null
            },
            onError(error) {
              emitError(error)
              _currentStreamCleanup = null
            },
          })
        } catch (err) {
          emitError(err as Error)
          throw err
        }
      } else {
        // ─── 非流式模式 ───
        try {
          const result = await _jsonRpcClient.sendMessage(
            [message],
            modes,
            options?.blocking ?? true,
          )

          // 首次响应时创建 surface
          if (!_sessionState.taskId && _agentCard) {
            const createSurfaceMsgs = extractCreateSurface(
              result as A2AStreamingEvent,
              _sessionState,
              _agentCard,
            )
            for (const msg of createSurfaceMsgs) {
              emitMessage(msg)
            }
          }

          // 映射响应
          const a2uiMessages = mapStreamingEvent(
            result as A2AStreamingEvent,
            _sessionState,
            _agentCard,
          )
          for (const msg of a2uiMessages) {
            emitMessage(msg)
          }

          // 如果是 Task，触发回调
          if ('status' in result && 'id' in result) {
            emitTask(result as A2ATask)
          }
        } catch (err) {
          emitError(err as Error)
          throw err
        }
      }
    },

    /**
     * 转发 A2UI Action 给 A2A Agent
     *
     * 当 Renderer 中的用户交互触发 ActionMessage 时，
     * 将其转换为 A2A follow-up 消息并发送。
     */
    async onAction(action: ActionMessage): Promise<void> {
      if (!_connected || !_jsonRpcClient || !_agentCard) {
        emitError(new Error('Transport 未连接，无法转发 Action'))
        return
      }

      try {
        const a2aMessage = mapActionToA2AMessage(action, _sessionState)
        const modes = outputModes
        const useStreaming = streamingEnabled && supportsStreaming(_agentCard)

        if (useStreaming) {
          const response = await _jsonRpcClient.sendStreamingMessage(
            [a2aMessage],
            modes,
          )

          _currentStreamCleanup?.()
          _currentStreamCleanup = parseSSEStream(response, {
            onEvent: handleStreamingEvent,
            onDone() {
              _currentStreamCleanup = null
            },
            onError(error) {
              emitError(error)
              _currentStreamCleanup = null
            },
          })
        } else {
          const result = await _jsonRpcClient.sendMessage([a2aMessage], modes)

          const a2uiMessages = mapStreamingEvent(
            result as A2AStreamingEvent,
            _sessionState,
            _agentCard,
          )
          for (const msg of a2uiMessages) {
            emitMessage(msg)
          }

          if ('status' in result && 'id' in result) {
            emitTask(result as A2ATask)
          }
        }
      } catch (err) {
        emitError(err as Error)
      }
    },

    onMessage(callback) {
      _messageCallback = callback
    },

    onTask(callback) {
      _taskCallback = callback
    },

    onError(callback) {
      _errorCallback = callback
    },
  }
}
