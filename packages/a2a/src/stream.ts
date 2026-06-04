/**
 * SSE Stream Parser — Server-Sent Events 流解析器
 *
 * 负责解析 A2A SendStreamingMessage 和 SubscribeToTask 返回的
 * text/event-stream 数据。每个 SSE data 帧包含一个 JSON-RPC 响应，
 * 其 result 字段可能是 Message、Task、TaskStatusUpdateEvent 或
 * TaskArtifactUpdateEvent。
 *
 * 完成判定规则（遵循 A2A v1 规范）：
 * - 不依赖 pre-v1 的 final 标志
 * - 当 task 状态变为终态（completed/failed/canceled/rejected）时视为完成
 * - 流关闭时，如果最新 task 状态非终态，报告为可恢复的连接错误
 */

import type {
  A2AStreamingEvent,
  A2ATaskState,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
} from './types'
import { StreamParseError } from './errors'

/** 终态集合 — 这些状态表示任务已完成，流可以结束 */
const TERMINAL_STATES: ReadonlySet<A2ATaskState> = new Set([
  'completed',
  'failed',
  'canceled',
  'rejected',
])

/** 检查任务状态是否为终态 */
export function isTerminalState(state: A2ATaskState): boolean {
  return TERMINAL_STATES.has(state)
}

/** 流解析器回调接口 */
export interface StreamParserCallbacks {
  /** 收到一个解析后的 A2A 事件 */
  onEvent: (event: A2AStreamingEvent) => void
  /** 流正常结束 */
  onDone: () => void
  /** 流解析过程中发生错误 */
  onError: (error: Error) => void
}

/**
 * 解析 SSE 流
 *
 * 从 Fetch Response 的 body ReadableStream 中读取 SSE 数据帧，
 * 解析每个 data 帧中的 JSON-RPC 响应，并提取 A2A 事件。
 *
 * SSE 格式：
 * ```
 * data: {"jsonrpc":"2.0","id":1,"result":{...}}
 *
 * data: {"jsonrpc":"2.0","id":1,"result":{...}}
 * ```
 *
 * @param response - Fetch Response 对象（包含 SSE 流）
 * @param callbacks - 事件回调
 * @returns 清理函数，用于提前终止流解析
 */
export function parseSSEStream(
  response: Response,
  callbacks: StreamParserCallbacks,
): () => void {
  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError(new StreamParseError('Response body 不可读'))
    return () => {}
  }
  // reader 在此处保证非空，后续闭包中使用时 TypeScript 需要类型收窄
  const streamReader = reader

  const decoder = new TextDecoder()
  let buffer = ''
  let cancelled = false
  let latestTaskState: A2ATaskState | null = null

  /** 清理函数：取消读取 */
  function cleanup() {
    cancelled = true
    streamReader.cancel().catch(() => {})
  }

  async function read() {
    try {
      while (!cancelled) {
        const { done, value } = await streamReader.read()

        if (done) {
          // 流关闭 — 先处理缓冲区中剩余的数据
          if (buffer.trim()) {
            processEventData(buffer.trim())
            buffer = ''
          }

          // 检查是否在终态关闭
          if (latestTaskState && !isTerminalState(latestTaskState)) {
            callbacks.onError(
              new StreamParseError(
                `流在非终态 "${latestTaskState}" 下关闭，可能需要通过 SubscribeToTask 重连`,
              ),
            )
          } else {
            callbacks.onDone()
          }
          return
        }

        // 将二进制数据解码为文本并追加到缓冲区
        buffer += decoder.decode(value, { stream: true })

        // 按行处理缓冲区
        const lines = buffer.split('\n')
        // 保留最后一个可能不完整的行
        buffer = lines.pop() ?? ''

        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            // 提取 data: 后面的内容（去掉前导空格）
            currentData = line.slice(5).trimStart()
          } else if (line === '' && currentData) {
            // 空行表示一个完整事件的结束，解析 data
            processEventData(currentData)
            currentData = ''
          }
          // 忽略 event:、id:、retry: 等其他 SSE 字段
        }

        // 处理没有尾部空行的情况
        if (currentData) {
          processEventData(currentData)
          currentData = ''
        }
      }
    } catch (err) {
      if (!cancelled) {
        callbacks.onError(
          new StreamParseError('流读取异常', err as Error),
        )
      }
    }
  }

  /** 处理单个 SSE data 帧 */
  function processEventData(data: string) {
    // 尝试解析为 JSON-RPC 响应
    let parsed: JsonRpcResponse
    try {
      parsed = JSON.parse(data) as JsonRpcResponse
    } catch {
      // 如果不是合法 JSON，尝试作为裸 JSON 解析（某些实现不包装 JSON-RPC）
      try {
        const rawEvent = JSON.parse(data) as A2AStreamingEvent
        dispatchEvent(rawEvent)
      } catch {
        // 忽略无法解析的帧
      }
      return
    }

    // 检查是否为 JSON-RPC 错误响应
    if ('error' in parsed) {
      callbacks.onError(
        new StreamParseError(
          `JSON-RPC 流错误 [${parsed.error.code}]: ${parsed.error.message}`,
        ),
      )
      return
    }

    // 提取 result 并作为 A2A 事件分发
    const result = (parsed as JsonRpcSuccessResponse).result
    if (result && typeof result === 'object') {
      dispatchEvent(result as A2AStreamingEvent)
    } else if (typeof parsed === 'object' && parsed !== null && !('jsonrpc' in parsed)) {
      // 裸 JSON 对象（非 JSON-RPC 包装），直接作为 A2A 事件分发
      dispatchEvent(parsed as A2AStreamingEvent)
    }
  }

  /** 分发解析后的 A2A 事件 */
  function dispatchEvent(event: A2AStreamingEvent) {
    // 跟踪 task 状态变化
    const eventAny = event as unknown as Record<string, unknown>
    if ('status' in event && typeof eventAny.status === 'object' && eventAny.status !== null && 'state' in (eventAny.status as Record<string, unknown>)) {
      const statusObj = eventAny.status as { state: A2ATaskState }
      latestTaskState = statusObj.state
    }
    if ('state' in event && typeof eventAny.state === 'string') {
      // 直接的 status update event
      const statusEvent = event as { state: A2ATaskState }
      latestTaskState = statusEvent.state
    }

    callbacks.onEvent(event)
  }

  // 启动异步读取
  read()

  return cleanup
}

/**
 * 从 SSE data 字符串中提取 JSON-RPC result
 *
 * 用于手动处理 SSE 数据帧的场景。
 */
export function extractJsonRpcResult(data: string): unknown | null {
  try {
    const parsed = JSON.parse(data) as JsonRpcResponse
    if ('result' in parsed) {
      return (parsed as JsonRpcSuccessResponse).result
    }
    return null
  } catch {
    return null
  }
}
