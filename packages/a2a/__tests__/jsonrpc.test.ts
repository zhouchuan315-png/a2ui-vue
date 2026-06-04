/**
 * JSON-RPC Client 单元测试
 *
 * 测试覆盖：
 * - 请求构建与发送
 * - 响应解析（成功/错误）
 * - HTTP 错误处理
 * - 网络错误处理
 * - 认证头注入
 * - 请求 ID 自增
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJsonRpcClient } from '../src/jsonrpc'
import { JsonRpcError } from '../src/errors'

/** 创建 mock fetch 响应 */
function mockFetchSuccess(result: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result,
    }),
  })
}

function mockFetchError(rpcCode: number, message: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      error: { code: rpcCode, message },
    }),
  })
}

function mockFetchHttpError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
  })
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error('Network failure'))
}

describe('createJsonRpcClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功发送请求并解析结果', async () => {
    const result = { role: 'agent', parts: [{ type: 'text', text: 'Hello' }] }
    const fetchFn = mockFetchSuccess(result)

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const response = await client.sendMessage([
      { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
    ])

    expect(response).toEqual(result)
    expect(fetchFn).toHaveBeenCalledOnce()

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://agent.example.com/rpc')

    const body = JSON.parse(init.body)
    expect(body.jsonrpc).toBe('2.0')
    expect(body.method).toBe('SendMessage')
    expect(body.id).toBe(1)
  })

  it('JSON-RPC 错误响应抛出 JsonRpcError', async () => {
    const fetchFn = mockFetchError(-32600, 'Invalid Request')

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await expect(
      client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }]),
    ).rejects.toThrow(JsonRpcError)
  })

  it('HTTP 错误抛出 JsonRpcError', async () => {
    const fetchFn = mockFetchHttpError(500)

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await expect(
      client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }]),
    ).rejects.toThrow('500')
  })

  it('网络错误抛出 JsonRpcError', async () => {
    const fetchFn = mockFetchNetworkError()

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await expect(
      client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }]),
    ).rejects.toThrow(JsonRpcError)
  })

  it('请求 ID 自增', async () => {
    const fetchFn = mockFetchSuccess({ ok: true })

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: '1' }] }])
    await client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: '2' }] }])
    await client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: '3' }] }])

    const ids = fetchFn.mock.calls.map((call: any) => JSON.parse(call[1].body).id)
    expect(ids).toEqual([1, 2, 3])
  })

  it('注入认证头', async () => {
    const fetchFn = mockFetchSuccess({ ok: true })

    createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
      getAuthHeaders: () => ({ Authorization: 'Bearer token123' }),
    })

    // getAuthHeaders 在 connect 时不会调用，发送请求时才调用
    // 需要调用 sendMessage 来触发
    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
      getAuthHeaders: () => ({ Authorization: 'Bearer token123' }),
    })

    await client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }])

    const [, init] = fetchFn.mock.calls[0]
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer token123',
    })
  })

  it('异步获取认证头', async () => {
    const fetchFn = mockFetchSuccess({ ok: true })

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
      getAuthHeaders: async () => ({ Authorization: 'Bearer async-token' }),
    })

    await client.sendMessage([{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }])

    const [, init] = fetchFn.mock.calls[0]
    expect(init.headers).toMatchObject({ Authorization: 'Bearer async-token' })
  })

  it('getTask 操作使用正确方法名', async () => {
    const fetchFn = mockFetchSuccess({ id: 'task-1', status: { state: 'completed' } })

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await client.getTask('task-1')

    const body = JSON.parse(fetchFn.mock.calls[0][1].body)
    expect(body.method).toBe('GetTask')
    expect(body.params).toEqual({ taskId: 'task-1' })
  })

  it('cancelTask 操作使用正确方法名', async () => {
    const fetchFn = mockFetchSuccess({ id: 'task-1', status: { state: 'canceled' } })

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    await client.cancelTask('task-1')

    const body = JSON.parse(fetchFn.mock.calls[0][1].body)
    expect(body.method).toBe('CancelTask')
    expect(body.params).toEqual({ taskId: 'task-1' })
  })

  it('sendStreamingMessage 返回原始 Response', async () => {
    const mockResponse = {
      ok: true,
      body: { getReader: vi.fn() },
    }
    const fetchFn = vi.fn().mockResolvedValue(mockResponse)

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const response = await client.sendStreamingMessage([
      { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
    ])

    expect(response).toBe(mockResponse)

    const [, init] = fetchFn.mock.calls[0]
    expect(init.headers).toMatchObject({ Accept: 'text/event-stream' })

    const body = JSON.parse(init.body)
    expect(body.method).toBe('SendStreamingMessage')
  })

  it('subscribeToTask 返回原始 Response', async () => {
    const mockResponse = {
      ok: true,
      body: { getReader: vi.fn() },
    }
    const fetchFn = vi.fn().mockResolvedValue(mockResponse)

    const client = createJsonRpcClient({
      endpointUrl: 'https://agent.example.com/rpc',
      fetchImpl: fetchFn as unknown as typeof fetch,
    })

    const response = await client.subscribeToTask('task-1')
    expect(response).toBe(mockResponse)

    const body = JSON.parse(fetchFn.mock.calls[0][1].body)
    expect(body.method).toBe('SubscribeToTask')
    expect(body.params).toEqual({ taskId: 'task-1' })
  })
})
