/**
 * A2A Transport Adapter 集成测试
 *
 * 测试覆盖：
 * - connect() 流程（Agent Card 获取 → JSON-RPC 客户端创建）
 * - disconnect() 状态清理
 * - sendText() 流式/非流式模式
 * - onAction() 转发
 * - 错误处理与回调
 * - 未连接状态下的操作拒绝
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createA2ATransport } from '../src/transport'
import type { AgentCard } from '../src/types'

/** 创建合法的 Agent Card */
function createAgentCard(overrides?: Partial<AgentCard>): AgentCard {
  return {
    name: 'Test Agent',
    version: '1.0.0',
    url: 'https://agent.example.com',
    authentication: { schemes: ['bearer'] },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'text/markdown'],
    capabilities: { streaming: true },
    ...overrides,
  }
}

/** 创建 JSON-RPC 成功响应 */
function createJsonRpcResponse(result: unknown) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result,
    }),
  }
}

/** 创建 SSE 流式响应 */
function createSSEResponse(events: unknown[]) {
  const encoder = new TextEncoder()
  const lines = events.map(e => `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: e })}\n\n`)
  const chunks = lines.map(line => encoder.encode(line))
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
    ok: true,
    json: vi.fn(), // 非流式响应不需要
    body: { getReader: () => reader },
  }
}

describe('createA2ATransport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('connect() 获取 Agent Card 并建立连接', async () => {
    const card = createAgentCard()
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(card),
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await transport.connect()
    expect(transport.connected).toBe(true)

    transport.disconnect()
  })

  it('connect() 失败时触发 onError', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const onError = vi.fn()

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    transport.onError(onError)

    await expect(transport.connect()).rejects.toThrow()
    expect(transport.connected).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  it('disconnect() 清理状态', async () => {
    const card = createAgentCard()
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(card),
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await transport.connect()
    expect(transport.connected).toBe(true)

    transport.disconnect()
    expect(transport.connected).toBe(false)
  })

  it('未连接时 sendText() 抛出错误', async () => {
    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
    })

    await expect(transport.sendText('Hello')).rejects.toThrow('未连接')
  })

  it('sendText() 流式模式：发送消息并解析 SSE 流', async () => {
    const card = createAgentCard()
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      fetchCallCount++
      // 第一次调用: Agent Card
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      // 第二次调用: SendStreamingMessage
      return createSSEResponse([
        { role: 'agent', parts: [{ type: 'text', text: 'Hello from agent!' }] },
      ])
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: true,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const onMessage = vi.fn()
    transport.onMessage(onMessage)

    await transport.connect()
    await transport.sendText('Hi agent')

    // 等待 SSE 流解析完成
    await vi.waitFor(() => {
      expect(onMessage).toHaveBeenCalled()
    })

    transport.disconnect()
  })

  it('sendText() 非流式模式：发送消息并等待响应', async () => {
    const card = createAgentCard({ capabilities: {} }) // 不支持流式
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      return createJsonRpcResponse({
        role: 'agent',
        parts: [{ type: 'text', text: 'Sync response' }],
      })
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: false,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const onMessage = vi.fn()
    transport.onMessage(onMessage)

    await transport.connect()
    await transport.sendText('Hi agent')

    expect(onMessage).toHaveBeenCalled()
    transport.disconnect()
  })

  it('onAction() 转发 ActionMessage 给 Agent', async () => {
    const card = createAgentCard({ capabilities: {} })
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async () => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      return createJsonRpcResponse({
        role: 'agent',
        parts: [{ type: 'text', text: 'Action processed' }],
      })
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: false,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const onMessage = vi.fn()
    transport.onMessage(onMessage)

    await transport.connect()
    await transport.onAction({
      name: 'button-click',
      surfaceId: 'a2a-session',
      sourceComponentId: 'btn-1',
      timestamp: '2026-05-13T00:00:00Z',
      context: {},
    })

    expect(onMessage).toHaveBeenCalled()
    transport.disconnect()
  })

  it('onTask() 回调在收到 Task 对象时触发', async () => {
    const card = createAgentCard({ capabilities: {} })
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async () => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      return createJsonRpcResponse({
        id: 'task-1',
        status: { state: 'completed' },
      })
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: false,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const onTask = vi.fn()
    transport.onTask(onTask)

    await transport.connect()
    await transport.sendText('Do something')

    expect(onTask).toHaveBeenCalled()
    transport.disconnect()
  })

  it('流式模式下 onError 回调接收 SSE 解析错误', async () => {
    const card = createAgentCard()
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async () => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      // 返回一个在非终态关闭的流
      return createSSEResponse([
        { taskId: 't1', status: { state: 'working' } },
      ])
    })

    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: true,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const onError = vi.fn()
    transport.onError(onError)

    await transport.connect()
    await transport.sendText('Hello')

    // 等待 SSE 流在非终态关闭
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })

    transport.disconnect()
  })

  it('acceptedOutputModes 配置传递给 JSON-RPC 请求', async () => {
    const card = createAgentCard({ capabilities: {} })
    let fetchCallCount = 0
    const fetchFn = vi.fn().mockImplementation(async () => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return { ok: true, json: vi.fn().mockResolvedValue(card) }
      }
      return createJsonRpcResponse({
        role: 'agent',
        parts: [{ type: 'text', text: 'OK' }],
      })
    })

    const customModes = ['application/vnd.a2ui+json', 'text/markdown']
    const transport = createA2ATransport({
      agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
      streaming: false,
      acceptedOutputModes: customModes,
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    transport.onMessage(vi.fn())
    await transport.connect()
    await transport.sendText('Hi')

    // 检查 JSON-RPC 请求中的 acceptedOutputModes
    const rpcCall = fetchFn.mock.calls[1]
    const body = JSON.parse(rpcCall[1].body)
    expect(body.params.configuration.acceptedOutputModes).toEqual(customModes)

    transport.disconnect()
  })
})
