/**
 * Agent Card Discovery 单元测试
 *
 * 测试覆盖：
 * - Agent Card URL 解析（直接 URL / 自动发现）
 * - Agent Card 获取（成功 / 网络错误 / HTTP 错误 / JSON 解析错误）
 * - Agent Card 验证（必填字段缺失检查）
 * - 协议绑定端点选择
 * - 能力检查函数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AgentCard } from '../src/types'
import {
  resolveAgentCardUrl,
  fetchAgentCard,
  validateAgentCard,
  selectEndpoint,
  supportsOutputMode,
  supportsStreaming,
} from '../src/agent-card'
import { AgentCardError, AgentCardValidationError } from '../src/errors'

/** 创建一个合法的 Agent Card 测试数据 */
function createValidCard(overrides?: Partial<AgentCard>): AgentCard {
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

describe('resolveAgentCardUrl', () => {
  it('使用 agentCardUrl 直接返回', () => {
    const url = resolveAgentCardUrl({
      agentCardUrl: 'https://custom.com/card.json',
    })
    expect(url).toBe('https://custom.com/card.json')
  })

  it('从 agentBaseUrl 拼接 well-known 路径', () => {
    const url = resolveAgentCardUrl({
      agentBaseUrl: 'https://agent.example.com',
    })
    expect(url).toBe('https://agent.example.com/.well-known/agent-card.json')
  })

  it('处理 agentBaseUrl 尾部斜杠', () => {
    const url = resolveAgentCardUrl({
      agentBaseUrl: 'https://agent.example.com/',
    })
    expect(url).toBe('https://agent.example.com/.well-known/agent-card.json')
  })

  it('agentCardUrl 优先级高于 agentBaseUrl', () => {
    const url = resolveAgentCardUrl({
      agentCardUrl: 'https://priority.com/card.json',
      agentBaseUrl: 'https://ignored.com',
    })
    expect(url).toBe('https://priority.com/card.json')
  })

  it('两个都未提供时抛出错误', () => {
    expect(() => resolveAgentCardUrl({})).toThrow('必须提供 agentCardUrl 或 agentBaseUrl')
  })
})

describe('fetchAgentCard', () => {
  const validCard = createValidCard()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功获取并验证 Agent Card', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(validCard),
    }))

    const card = await fetchAgentCard({ agentCardUrl: 'https://example.com/card.json' })
    expect(card.name).toBe('Test Agent')
    expect(card.version).toBe('1.0.0')
  })

  it('网络错误时抛出 AgentCardError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    await expect(
      fetchAgentCard({ agentCardUrl: 'https://example.com/card.json' }),
    ).rejects.toThrow(AgentCardError)
  })

  it('HTTP 错误时抛出 AgentCardError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }))

    await expect(
      fetchAgentCard({ agentCardUrl: 'https://example.com/card.json' }),
    ).rejects.toThrow('HTTP 404')
  })

  it('JSON 解析错误时抛出 AgentCardError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    }))

    await expect(
      fetchAgentCard({ agentCardUrl: 'https://example.com/card.json' }),
    ).rejects.toThrow('不是合法的 JSON')
  })

  it('验证失败时抛出 AgentCardValidationError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ name: 'Incomplete' }),
    }))

    await expect(
      fetchAgentCard({ agentCardUrl: 'https://example.com/card.json' }),
    ).rejects.toThrow(AgentCardValidationError)
  })

  it('使用自定义 fetchImpl', async () => {
    const customFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(validCard),
    })

    await fetchAgentCard({
      agentCardUrl: 'https://example.com/card.json',
      fetchImpl: customFetch as unknown as typeof fetch,
    })

    expect(customFetch).toHaveBeenCalledOnce()
  })

  it('传递认证头', async () => {
    const customFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(validCard),
    })

    await fetchAgentCard(
      { agentCardUrl: 'https://example.com/card.json', fetchImpl: customFetch as unknown as typeof fetch },
      { Authorization: 'Bearer test-token' },
    )

    const [, init] = customFetch.mock.calls[0]
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-token' })
  })
})

describe('validateAgentCard', () => {
  it('合法的 Agent Card 通过验证', () => {
    expect(() => validateAgentCard(createValidCard())).not.toThrow()
  })

  it('缺少 name 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ name: '' as any }))).toThrow('name')
  })

  it('缺少 version 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ version: '' as any }))).toThrow('version')
  })

  it('缺少 url 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ url: '' as any }))).toThrow('url')
  })

  it('缺少 authentication 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ authentication: undefined as any }))).toThrow('authentication')
  })

  it('缺少 defaultInputModes 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ defaultInputModes: undefined as any }))).toThrow('defaultInputModes')
  })

  it('缺少 defaultOutputModes 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ defaultOutputModes: undefined as any }))).toThrow('defaultOutputModes')
  })

  it('缺少 capabilities 字段报错', () => {
    expect(() => validateAgentCard(createValidCard({ capabilities: undefined as any }))).toThrow('capabilities')
  })
})

describe('selectEndpoint', () => {
  it('无端点时返回 null', () => {
    const card = createValidCard()
    expect(selectEndpoint(card)).toBeNull()
  })

  it('优先选择匹配 preferredBinding 的端点', () => {
    const card = createValidCard({
      endpoints: [
        { url: 'https://rest.example.com', transport: 'REST' },
        { url: 'https://rpc.example.com', transport: 'JSONRPC' },
      ],
    })
    const ep = selectEndpoint(card, 'JSONRPC')
    expect(ep?.url).toBe('https://rpc.example.com')
  })

  it('没有匹配时回退到第一个端点', () => {
    const card = createValidCard({
      endpoints: [
        { url: 'https://grpc.example.com', transport: 'GRPC' },
      ],
    })
    const ep = selectEndpoint(card, 'JSONRPC')
    expect(ep?.url).toBe('https://grpc.example.com')
  })
})

describe('supportsOutputMode', () => {
  it('支持已声明的输出模式', () => {
    const card = createValidCard({ defaultOutputModes: ['text/plain', 'text/markdown'] })
    expect(supportsOutputMode(card, 'text/plain')).toBe(true)
  })

  it('不支持未声明的输出模式', () => {
    const card = createValidCard({ defaultOutputModes: ['text/plain'] })
    expect(supportsOutputMode(card, 'image/png')).toBe(false)
  })
})

describe('supportsStreaming', () => {
  it('capabilities.streaming 为 true 时返回 true', () => {
    const card = createValidCard({ capabilities: { streaming: true } })
    expect(supportsStreaming(card)).toBe(true)
  })

  it('capabilities.streaming 为 false/undefined 时返回 false', () => {
    expect(supportsStreaming(createValidCard({ capabilities: {} }))).toBe(false)
  })
})
