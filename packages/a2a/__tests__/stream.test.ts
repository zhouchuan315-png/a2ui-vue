/**
 * SSE Stream Parser 单元测试
 *
 * 测试覆盖：
 * - SSE data 帧解析
 * - JSON-RPC 响应提取
 * - 裸 JSON 事件解析
 * - 流正常结束
 * - 流异常关闭（非终态）
 * - 错误帧处理
 * - 多行 data 帧
 * - 边界情况（空流、无 data 帧）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseSSEStream, extractJsonRpcResult, isTerminalState } from '../src/stream'
import type { A2ATaskState } from '../src/types'

/** 创建一个包含 SSE 流的 mock Response */
function createSSEResponse(lines: string[]): Response {
  const encoder = new TextEncoder()
  const chunks = lines.map(line => encoder.encode(line + '\n'))
  let chunkIndex = 0

  const reader = {
    read: vi.fn().mockImplementation(async () => {
      if (chunkIndex < chunks.length) {
        return { done: false, value: chunks[chunkIndex++] }
      }
      return { done: true, value: undefined }
    }),
    cancel: vi.fn().mockResolvedValue(undefined),
  }

  return {
    body: {
      getReader: () => reader,
    },
  } as unknown as Response
}

describe('isTerminalState', () => {
  const terminalStates: A2ATaskState[] = ['completed', 'failed', 'canceled', 'rejected']
  const nonTerminalStates: A2ATaskState[] = ['submitted', 'working', 'input-required']

  it.each(terminalStates)('状态 "%s" 是终态', (state) => {
    expect(isTerminalState(state)).toBe(true)
  })

  it.each(nonTerminalStates)('状态 "%s" 不是终态', (state) => {
    expect(isTerminalState(state)).toBe(false)
  })
})

describe('extractJsonRpcResult', () => {
  it('从 JSON-RPC 成功响应中提取 result', () => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: { role: 'agent', parts: [{ type: 'text', text: 'Hello' }] },
    })
    const result = extractJsonRpcResult(data)
    expect(result).toEqual({ role: 'agent', parts: [{ type: 'text', text: 'Hello' }] })
  })

  it('从 JSON-RPC 错误响应中返回 null', () => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32600, message: 'Invalid Request' },
    })
    expect(extractJsonRpcResult(data)).toBeNull()
  })

  it('非 JSON 字符串返回 null', () => {
    expect(extractJsonRpcResult('not json')).toBeNull()
  })

  it('裸 JSON 对象返回 null（无 result 字段）', () => {
    expect(extractJsonRpcResult('{"foo":"bar"}')).toBeNull()
  })
})

describe('parseSSEStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('解析单个 SSE data 帧', async () => {
    const event = { role: 'agent', parts: [{ type: 'text', text: 'Hello' }] }
    const response = createSSEResponse([
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: event })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    // 等待异步读取完成
    await vi.waitFor(() => {
      expect(onEvent).toHaveBeenCalledOnce()
    })

    expect(onEvent).toHaveBeenCalledWith(event)
  })

  it('解析多个 SSE data 帧', async () => {
    const event1 = { role: 'agent', parts: [{ type: 'text', text: 'First' }] }
    const event2 = { taskId: 't1', status: { state: 'working' } }
    const response = createSSEResponse([
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: event1 })}`,
      '',
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 2, result: event2 })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    await vi.waitFor(() => {
      expect(onEvent).toHaveBeenCalledTimes(2)
    })

    expect(onEvent).toHaveBeenNthCalledWith(1, event1)
    expect(onEvent).toHaveBeenNthCalledWith(2, event2)
  })

  it('流正常结束时调用 onDone', async () => {
    const event = { taskId: 't1', status: { state: 'completed' } }
    const response = createSSEResponse([
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: event })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    await vi.waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    expect(onError).not.toHaveBeenCalled()
  })

  it('流在非终态关闭时报告错误', async () => {
    const event = { taskId: 't1', status: { state: 'working' } }
    const response = createSSEResponse([
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: event })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledOnce()
    })

    expect(onError.mock.calls[0][0].message).toContain('非终态')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('JSON-RPC 错误帧触发 onError', async () => {
    const response = createSSEResponse([
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32600, message: 'Invalid' } })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledOnce()
    })

    expect(onError.mock.calls[0][0].message).toContain('JSON-RPC 流错误')
  })

  it('裸 JSON 事件（非 JSON-RPC 包装）也能解析', async () => {
    const event = { role: 'agent', parts: [{ type: 'text', text: 'Raw' }] }
    const response = createSSEResponse([
      `data: ${JSON.stringify(event)}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    // 等待异步读取完成
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(onEvent).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith(event)
  })

  it('Response body 不可读时立即报错', () => {
    const response = { body: null } as unknown as Response

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toContain('不可读')
  })

  it('返回清理函数可以提前终止流', async () => {
    // 创建一个永远不结束的流
    let resolveRead: any
    const reader = {
      read: vi.fn().mockImplementation(() => new Promise(resolve => { resolveRead = resolve })),
      cancel: vi.fn().mockResolvedValue(undefined),
    }

    const response = {
      body: { getReader: () => reader },
    } as unknown as Response

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    const cleanup = parseSSEStream(response, { onEvent, onDone, onError })

    // 调用清理函数
    cleanup()

    expect(reader.cancel).toHaveBeenCalledOnce()
  })

  it('忽略非 data: 开头的 SSE 行', async () => {
    const event = { role: 'agent', parts: [{ type: 'text', text: 'Hello' }] }
    const response = createSSEResponse([
      'event: message',
      'id: 12345',
      'retry: 3000',
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: event })}`,
      '',
    ])

    const onEvent = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    parseSSEStream(response, { onEvent, onDone, onError })

    await vi.waitFor(() => {
      expect(onEvent).toHaveBeenCalledOnce()
    })

    expect(onEvent).toHaveBeenCalledWith(event)
  })
})
