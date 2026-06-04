/**
 * A2A Protocol Error Types
 *
 * 定义了 A2A 集成层中所有可能的错误类型。
 * 每个错误类都包含一个 code 字段，方便调用方进行错误分类和处理。
 */

/** A2A 协议基础错误类，所有 A2A 相关错误继承此类 */
export class A2AError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'A2AError'
  }
}

/** Agent Card 获取或解析失败 */
export class AgentCardError extends A2AError {
  constructor(message: string, cause?: Error) {
    super(message, 'AGENT_CARD_ERROR', cause)
    this.name = 'AgentCardError'
  }
}

/** Agent Card 验证失败（缺少必填字段或字段值不合法） */
export class AgentCardValidationError extends A2AError {
  constructor(message: string) {
    super(message, 'AGENT_CARD_VALIDATION_ERROR')
    this.name = 'AgentCardValidationError'
  }
}

/** JSON-RPC 请求失败（服务端返回错误响应或网络异常） */
export class JsonRpcError extends A2AError {
  constructor(
    message: string,
    public readonly rpcCode?: number,
    public readonly rpcData?: unknown,
    cause?: Error,
  ) {
    super(message, 'JSONRPC_ERROR', cause)
    this.name = 'JsonRpcError'
  }
}

/** SSE 流解析错误（格式不合法或连接中断） */
export class StreamParseError extends A2AError {
  constructor(message: string, cause?: Error) {
    super(message, 'STREAM_PARSE_ERROR', cause)
    this.name = 'StreamParseError'
  }
}

/** 映射错误：A2A 对象转换为 A2UI 消息时失败 */
export class MapperError extends A2AError {
  constructor(message: string, cause?: Error) {
    super(message, 'MAPPER_ERROR', cause)
    this.name = 'MapperError'
  }
}
