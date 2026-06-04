/**
 * JSON-RPC Client — A2A JSON-RPC over HTTP 客户端
 *
 * 负责构建 JSON-RPC 2.0 请求并发送到 A2A Agent 端点。
 * 支持所有 A2A v1 操作：SendMessage、SendStreamingMessage、
 * GetTask、CancelTask、SubscribeToTask。
 *
 * 关键设计：
 * - 请求 ID 自增，确保唯一性
 * - 不预设 taskId（A2A v1 任务由服务端创建）
 * - 保留 contextId 以维持会话上下文
 */

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  SendMessageParams,
  SendStreamingMessageParams,
  GetTaskParams,
  CancelTaskParams,
  SubscribeToTaskParams,
  A2AMessage,
  A2ATask,
} from './types'
import { JsonRpcError } from './errors'

/** JSON-RPC 客户端配置 */
export interface JsonRpcClientConfig {
  /** 目标端点 URL */
  endpointUrl: string
  /** 获取认证头的回调 */
  getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>
  /** 自定义 fetch 实现 */
  fetchImpl?: typeof fetch
}

/**
 * 创建 JSON-RPC 客户端
 *
 * 返回一组操作函数，每个函数对应一个 A2A v1 操作。
 * 客户端内部管理请求 ID 和错误处理。
 */
export function createJsonRpcClient(config: JsonRpcClientConfig) {
  let requestId = 0
  const fetchFn = config.fetchImpl ?? globalThis.fetch

  /** 生成下一个请求 ID */
  function nextId(): number {
    return ++requestId
  }

  /** 获取当前认证头 */
  async function getHeaders(): Promise<Record<string, string>> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (config.getAuthHeaders) {
      const auth = await config.getAuthHeaders()
      return { ...base, ...auth }
    }
    return base
  }

  /**
   * 发送 JSON-RPC 请求并解析响应
   *
   * 如果服务端返回 JSON-RPC 错误响应，会抛出 JsonRpcError。
   */
  async function sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: nextId(),
      method,
      params,
    }

    const headers = await getHeaders()

    let response: Response
    try {
      response = await fetchFn(config.endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
    } catch (err) {
      throw new JsonRpcError(
        `JSON-RPC 请求失败: ${method}`,
        undefined,
        undefined,
        err as Error,
      )
    }

    if (!response.ok) {
      throw new JsonRpcError(
        `JSON-RPC HTTP 错误: ${response.status} ${response.statusText}`,
      )
    }

    let jsonRpcResponse: JsonRpcResponse
    try {
      jsonRpcResponse = await response.json() as JsonRpcResponse
    } catch (err) {
      throw new JsonRpcError('JSON-RPC 响应解析失败', undefined, undefined, err as Error)
    }

    if ('error' in jsonRpcResponse) {
      const errResp = jsonRpcResponse as JsonRpcErrorResponse
      throw new JsonRpcError(
        `JSON-RPC 错误 [${errResp.error.code}]: ${errResp.error.message}`,
        errResp.error.code,
        errResp.error.data,
      )
    }

    return (jsonRpcResponse as JsonRpcSuccessResponse).result as T
  }

  return {
    /**
     * SendMessage — 发送消息并等待完整响应
     *
     * 根据 A2A v1 规范，此操作返回直接 Message 或 Task 对象。
     */
    async sendMessage(
      messages: A2AMessage[],
      acceptedOutputModes?: string[],
      blocking = true,
    ): Promise<A2AMessage | A2ATask> {
      const params: SendMessageParams = {
        messages,
        configuration: {
          acceptedOutputModes,
          blocking,
        },
      }
      return sendRequest<A2AMessage | A2ATask>('SendMessage', params as unknown as Record<string, unknown>)
    },

    /**
     * SendStreamingMessage — 发送消息并返回 SSE 流的 Response 对象
     *
     * 调用方需要自行解析 SSE 流。返回原始 Response 以允许流式读取。
     */
    async sendStreamingMessage(
      messages: A2AMessage[],
      acceptedOutputModes?: string[],
    ): Promise<Response> {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: nextId(),
        method: 'SendStreamingMessage',
        params: {
          messages,
          configuration: {
            acceptedOutputModes,
          },
        } as unknown as Record<string, unknown>,
      }

      const headers = await getHeaders()

      let response: Response
      try {
        response = await fetchFn(config.endpointUrl, {
          method: 'POST',
          headers: {
            ...headers,
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(request),
        })
      } catch (err) {
        throw new JsonRpcError(
          'SendStreamingMessage 请求失败',
          undefined,
          undefined,
          err as Error,
        )
      }

      if (!response.ok) {
        throw new JsonRpcError(
          `SendStreamingMessage HTTP 错误: ${response.status} ${response.statusText}`,
        )
      }

      return response
    },

    /**
     * GetTask — 获取任务当前状态
     */
    async getTask(taskId: string, historyLength?: number): Promise<A2ATask> {
      const params: GetTaskParams = { taskId, historyLength }
      return sendRequest<A2ATask>('GetTask', params as unknown as Record<string, unknown>)
    },

    /**
     * CancelTask — 取消一个正在运行的任务
     */
    async cancelTask(taskId: string): Promise<A2ATask> {
      const params: CancelTaskParams = { taskId }
      return sendRequest<A2ATask>('CancelTask', params as unknown as Record<string, unknown>)
    },

    /**
     * SubscribeToTask — 订阅任务更新（用于断线重连）
     *
     * 返回 SSE Response 对象，调用方自行解析事件流。
     */
    async subscribeToTask(taskId: string): Promise<Response> {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: nextId(),
        method: 'SubscribeToTask',
        params: { taskId } as unknown as Record<string, unknown>,
      }

      const headers = await getHeaders()

      let response: Response
      try {
        response = await fetchFn(config.endpointUrl, {
          method: 'POST',
          headers: {
            ...headers,
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(request),
        })
      } catch (err) {
        throw new JsonRpcError(
          'SubscribeToTask 请求失败',
          undefined,
          undefined,
          err as Error,
        )
      }

      if (!response.ok) {
        throw new JsonRpcError(
          `SubscribeToTask HTTP 错误: ${response.status} ${response.statusText}`,
        )
      }

      return response
    },

    /** 当前请求 ID 计数器（只读） */
    get requestId() {
      return requestId
    },
  }
}

export type JsonRpcClient = ReturnType<typeof createJsonRpcClient>
