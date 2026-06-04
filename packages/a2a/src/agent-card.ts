/**
 * Agent Card Discovery — Agent Card 发现与验证
 *
 * 负责从远程 A2A Agent 获取 Agent Card 并验证其合法性。
 * 支持两种发现方式：
 * 1. 直接 URL：agentCardUrl 完整指定
 * 2. 自动发现：从 agentBaseUrl 拼接 /.well-known/agent-card.json
 *
 * Agent Card 缓存策略：
 * - 使用 HTTP Cache-Control 头进行缓存
 * - 在同一个 transport 实例生命周期内缓存已获取的 card
 */

import type { AgentCard, AgentCardEndpoint, A2ATransportConfig } from './types'
import { AgentCardError, AgentCardValidationError } from './errors'

/** well-known 路径常量 */
const AGENT_CARD_WELL_KNOWN = '/.well-known/agent-card.json'

/**
 * 从配置中解析 Agent Card URL
 *
 * 优先级：agentCardUrl > agentBaseUrl + well-known 路径
 */
export function resolveAgentCardUrl(config: A2ATransportConfig): string {
  if (config.agentCardUrl) {
    return config.agentCardUrl
  }
  if (config.agentBaseUrl) {
    const base = config.agentBaseUrl.endsWith('/')
      ? config.agentBaseUrl.slice(0, -1)
      : config.agentBaseUrl
    return `${base}${AGENT_CARD_WELL_KNOWN}`
  }
  throw new AgentCardError(
    '必须提供 agentCardUrl 或 agentBaseUrl 配置项',
  )
}

/**
 * 获取 Agent Card
 *
 * 从远程服务器获取并验证 Agent Card。
 * 使用传入的 fetchImpl（默认全局 fetch）进行网络请求。
 *
 * @param config - A2A Transport 配置
 * @param authHeaders - 可选的认证头
 * @returns 验证通过的 AgentCard 对象
 */
export async function fetchAgentCard(
  config: A2ATransportConfig,
  authHeaders?: Record<string, string>,
): Promise<AgentCard> {
  const url = resolveAgentCardUrl(config)
  const fetchFn = config.fetchImpl ?? globalThis.fetch

  let response: Response
  try {
    response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders,
      },
    })
  } catch (err) {
    throw new AgentCardError(
      `无法连接到 Agent Card 端点: ${url}`,
      err as Error,
    )
  }

  if (!response.ok) {
    throw new AgentCardError(
      `获取 Agent Card 失败: HTTP ${response.status} ${response.statusText}`,
    )
  }

  let card: AgentCard
  try {
    card = await response.json() as AgentCard
  } catch (err) {
    throw new AgentCardError('Agent Card 响应不是合法的 JSON', err as Error)
  }

  validateAgentCard(card)
  return card
}

/**
 * 验证 Agent Card 的必填字段
 *
 * 根据 A2A v1 规范，以下字段为必填：
 * - name: Agent 名称
 * - version: Card 版本号
 * - url: Agent 端点 URL
 * - authentication: 认证配置
 * - defaultInputModes / defaultOutputModes: 输入输出格式
 * - capabilities: 能力声明
 */
export function validateAgentCard(card: AgentCard): void {
  const errors: string[] = []

  if (!card.name || typeof card.name !== 'string') {
    errors.push('缺少必填字段: name')
  }
  if (!card.version || typeof card.version !== 'string') {
    errors.push('缺少必填字段: version')
  }
  if (!card.url || typeof card.url !== 'string') {
    errors.push('缺少必填字段: url')
  }
  if (!card.authentication || !Array.isArray(card.authentication.schemes)) {
    errors.push('缺少必填字段: authentication.schemes')
  }
  if (!Array.isArray(card.defaultInputModes)) {
    errors.push('缺少必填字段: defaultInputModes')
  }
  if (!Array.isArray(card.defaultOutputModes)) {
    errors.push('缺少必填字段: defaultOutputModes')
  }
  if (!card.capabilities || typeof card.capabilities !== 'object') {
    errors.push('缺少必填字段: capabilities')
  }

  if (errors.length > 0) {
    throw new AgentCardValidationError(
      `Agent Card 验证失败:\n${errors.join('\n')}`,
    )
  }
}

/**
 * 从 Agent Card 中选择最佳的协议绑定端点
 *
 * 按照 preferredBinding 优先级选择，如果没有匹配则返回第一个端点。
 * 如果没有声明任何端点，返回 null（使用 Agent Card 自身的 url）。
 */
export function selectEndpoint(
  card: AgentCard,
  preferredBinding: 'JSONRPC' | 'REST' = 'JSONRPC',
): AgentCardEndpoint | null {
  if (!card.endpoints || card.endpoints.length === 0) {
    return null
  }

  // 优先选择匹配 preferredBinding 的端点
  const preferred = card.endpoints.find(e => e.transport === preferredBinding)
  if (preferred) return preferred

  // 回退到第一个端点
  return card.endpoints[0]
}

/**
 * 检查 Agent Card 是否支持指定的输出模式
 */
export function supportsOutputMode(card: AgentCard, mode: string): boolean {
  return card.defaultOutputModes.includes(mode)
}

/**
 * 检查 Agent Card 是否支持流式输出
 */
export function supportsStreaming(card: AgentCard): boolean {
  return card.capabilities.streaming === true
}
