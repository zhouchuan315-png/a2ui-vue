/**
 * A2A v1 Protocol TypeScript Types
 *
 * 定义了 A2A v1.0 协议中与本集成层相关的类型子集。
 * 包括：Agent Card、Message、Task、Artifact、JSON-RPC 请求/响应等。
 *
 * 参考规范: https://a2a-protocol.org/dev/specification/
 */

// ─── Agent Card ───

/** Agent Card 中声明的认证方案 */
export interface AgentCardAuthentication {
  schemes: string[]
  credentials?: string
}

/** Agent Card 中声明的协议绑定端点 */
export interface AgentCardEndpoint {
  url: string
  transport: 'JSONRPC' | 'REST' | 'GRPC'
}

/** Agent Card 中声明的能力集 */
export interface AgentCardCapabilities {
  streaming?: boolean
  pushNotifications?: boolean
  stateTransitionHistory?: boolean
  extensions?: Array<{
    uri: string
    description?: string
  }>
}

/**
 * Agent Card — 由远程 A2A Agent 通过 /.well-known/agent-card.json 暴露
 *
 * 包含 agent 的元数据：名称、描述、认证方式、协议绑定、能力集等。
 * 客户端在首次通信前必须获取并验证此卡片。
 */
export interface AgentCard {
  name: string
  description?: string
  version: string
  url: string
  documentationUrl?: string
  provider?: {
    organization: string
    url?: string
  }
  authentication: AgentCardAuthentication
  defaultInputModes: string[]
  defaultOutputModes: string[]
  capabilities: AgentCardCapabilities
  endpoints?: AgentCardEndpoint[]
}

// ─── Message Parts ───

/** 文本类型 part，支持 plain 和 markdown 两种格式 */
export interface A2ATextPart {
  type: 'text'
  text: string
  mimeType?: 'text/plain' | 'text/markdown'
}

/** 数据类型 part，用于传递结构化 JSON 数据 */
export interface A2ADataPart {
  type: 'data'
  data: Record<string, unknown>
  mimeType?: string
}

/** 文件类型 part，支持内联 base64 或远程 URI 引用 */
export interface A2AFilePart {
  type: 'file'
  file: {
    name?: string
    mimeType?: string
    /** base64 编码的文件内容（内联模式） */
    data?: string
    /** 远程文件 URI（引用模式） */
    uri?: string
  }
}

/** A2A Message 中的 part 联合类型 */
export type A2APart = A2ATextPart | A2ADataPart | A2AFilePart

// ─── Message ───

/**
 * A2A Message — 单条对话消息
 *
 * role 表示消息来源（user 或 agent），
 * parts 包含消息的具体内容（文本、数据、文件等）。
 */
export interface A2AMessage {
  role: 'user' | 'agent'
  contextId?: string
  taskId?: string
  parts: A2APart[]
  messageId?: string
  metadata?: Record<string, unknown>
}

// ─── Task ───

/** A2A Task 的状态枚举 */
export type A2ATaskState =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'rejected'

/**
 * A2A Task — 表示一个长期运行的任务
 *
 * 任务由服务端创建，客户端通过 taskId 进行追踪。
 * 状态转换通过 TaskStatusUpdateEvent 推送。
 */
export interface A2ATask {
  id: string
  contextId?: string
  status: {
    state: A2ATaskState
    message?: A2AMessage
    timestamp?: string
  }
  artifacts?: A2AArtifact[]
  history?: A2AMessage[]
  metadata?: Record<string, unknown>
}

// ─── Artifact ───

/**
 * A2A Artifact — 任务产出的结果数据
 *
 * 每个 artifact 有唯一 ID，支持增量更新。
 * parts 中包含具体的输出内容。
 */
export interface A2AArtifact {
  artifactId: string
  name?: string
  description?: string
  parts: A2APart[]
  metadata?: Record<string, unknown>
}

// ─── Streaming Events ───

/** 任务状态更新事件（SSE 推送） */
export interface A2ATaskStatusUpdateEvent {
  taskId: string
  contextId?: string
  status: {
    state: A2ATaskState
    message?: A2AMessage
    timestamp?: string
  }
}

/** 任务产出更新事件（SSE 推送） */
export interface A2ATaskArtifactUpdateEvent {
  taskId: string
  contextId?: string
  artifact: A2AArtifact
}

/** SSE 流中可能推送的事件联合类型 */
export type A2AStreamingEvent =
  | A2AMessage
  | A2ATask
  | A2ATaskStatusUpdateEvent
  | A2ATaskArtifactUpdateEvent

// ─── JSON-RPC ───

/** JSON-RPC 2.0 请求体 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number | string
  method: string
  params?: Record<string, unknown>
}

/** JSON-RPC 2.0 成功响应体 */
export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0'
  id: number | string
  result: unknown
}

/** JSON-RPC 2.0 错误响应体 */
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0'
  id: number | string | null
  error: {
    code: number
    message: string
    data?: unknown
  }
}

/** JSON-RPC 2.0 响应联合类型 */
export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

// ─── A2A Operation Params ───

/** SendMessage 操作参数 */
export interface SendMessageParams {
  messages: A2AMessage[]
  configuration?: {
    acceptedOutputModes?: string[]
    blocking?: boolean
  }
}

/** SendStreamingMessage 操作参数 */
export interface SendStreamingMessageParams {
  messages: A2AMessage[]
  configuration?: {
    acceptedOutputModes?: string[]
  }
}

/** GetTask 操作参数 */
export interface GetTaskParams {
  taskId: string
  historyLength?: number
}

/** CancelTask 操作参数 */
export interface CancelTaskParams {
  taskId: string
}

/** SubscribeToTask 操作参数 */
export interface SubscribeToTaskParams {
  taskId: string
}

// ─── Transport Config ───

/**
 * A2A Transport 配置项
 *
 * 支持两种定位方式：
 * 1. agentCardUrl — 直接指定 Agent Card 的完整 URL
 * 2. agentBaseUrl — 只提供 agent 基础 URL，自动拼接 /.well-known/agent-card.json
 */
export interface A2ATransportConfig {
  /** Agent Card 的完整 URL，优先级高于 agentBaseUrl */
  agentCardUrl?: string
  /** Agent 基础 URL，用于自动发现 Agent Card */
  agentBaseUrl?: string
  /** 首选协议绑定，默认 JSONRPC */
  preferredBinding?: 'JSONRPC' | 'REST'
  /** 是否启用流式输出，默认 true */
  streaming?: boolean
  /** 客户端支持的输出格式列表 */
  acceptedOutputModes?: string[]
  /** 获取认证头信息的回调函数 */
  getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>
  /** 兼容模式：false 表示仅 v1，'0.2' 或 '0.3' 启用旧版兼容 */
  legacyMode?: false | '0.2' | '0.3'
  /** 自定义 fetch 实现（用于测试或 Node.js 环境） */
  fetchImpl?: typeof fetch
}

/**
 * A2A Transport 适配器接口
 *
 * 对外暴露的 API 形态，与现有 TransportAdapter 对齐但增加了 A2A 特有功能。
 */
export interface A2ATransportAdapter {
  /** 建立连接（获取 Agent Card、初始化会话） */
  connect(): Promise<void>
  /** 断开连接 */
  disconnect(): void
  /** 发送文本消息 */
  sendText(text: string, options?: A2ASendOptions): Promise<void>
  /** 将 A2UI 的 ActionMessage 转发给 A2A Agent */
  onAction(action: import('@nine1ie/a2ui-vue-core').ActionMessage): Promise<void>
  /** 注册消息回调（接收映射后的 A2UI 消息） */
  onMessage(callback: (message: import('@nine1ie/a2ui-vue-core').A2UIServerMessage) => void): void
  /** 注册任务状态回调 */
  onTask(callback: (task: A2ATask) => void): void
  /** 注册错误回调 */
  onError(callback: (error: Error) => void): void
  /** 当前连接状态 */
  readonly connected: boolean
}

/** 发送消息时的额外选项 */
export interface A2ASendOptions {
  /** 覆盖默认的 acceptedOutputModes */
  acceptedOutputModes?: string[]
  /** 是否阻塞等待完整响应（非流式场景） */
  blocking?: boolean
}
