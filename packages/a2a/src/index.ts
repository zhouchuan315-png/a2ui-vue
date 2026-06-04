/**
 * @nine1ie/a2ui-vue-a2a
 *
 * A2A (Agent2Agent) 协议适配器，用于连接远程 A2A Agent 并在
 * A2UI Vue Renderer 中渲染其输出。
 *
 * 主要入口：createA2ATransport()
 *
 * @example
 * ```typescript
 * import { createA2ATransport } from '@nine1ie/a2ui-vue-a2a'
 *
 * const transport = createA2ATransport({
 *   agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
 *   streaming: true,
 * })
 *
 * transport.onMessage((message) => {
 *   rendererRef.value?.processMessage(message)
 * })
 *
 * await transport.connect()
 * await transport.sendText('Hello, Agent!')
 * ```
 */

// ─── 核心入口 ───
export { createA2ATransport } from './transport'

// ─── Agent Card 发现 ───
export {
  resolveAgentCardUrl,
  fetchAgentCard,
  validateAgentCard,
  selectEndpoint,
  supportsOutputMode,
  supportsStreaming,
} from './agent-card'

// ─── JSON-RPC 客户端 ───
export { createJsonRpcClient, type JsonRpcClient, type JsonRpcClientConfig } from './jsonrpc'

// ─── SSE 流解析 ───
export { parseSSEStream, extractJsonRpcResult, isTerminalState, type StreamParserCallbacks } from './stream'

// ─── A2A to A2UI 映射 ───
export {
  createSessionState,
  resolveSurfaceId,
  mapCreateSurface,
  mapPart,
  mapMessageToComponents,
  mapArtifactToComponents,
  mapTaskStatusToComponents,
  mapStreamingEvent,
  mapActionToA2AMessage,
  extractCreateSurface,
  type A2ASessionState,
} from './mapper'

// ─── 错误类型 ───
export {
  A2AError,
  AgentCardError,
  AgentCardValidationError,
  JsonRpcError,
  StreamParseError,
  MapperError,
} from './errors'

// ─── 类型定义 ───
export type {
  // Agent Card
  AgentCard,
  AgentCardAuthentication,
  AgentCardEndpoint,
  AgentCardCapabilities,
  // Message
  A2AMessage,
  A2APart,
  A2ATextPart,
  A2ADataPart,
  A2AFilePart,
  // Task & Artifact
  A2ATask,
  A2ATaskState,
  A2AArtifact,
  // Streaming
  A2ATaskStatusUpdateEvent,
  A2ATaskArtifactUpdateEvent,
  A2AStreamingEvent,
  // JSON-RPC
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  // Operations
  SendMessageParams,
  SendStreamingMessageParams,
  GetTaskParams,
  CancelTaskParams,
  SubscribeToTaskParams,
  // Transport
  A2ATransportConfig,
  A2ATransportAdapter,
  A2ASendOptions,
} from './types'
