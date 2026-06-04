/**
 * A2A to A2UI Mapper 单元测试
 *
 * 测试覆盖：
 * - 会话状态管理
 * - Surface ID 解析
 * - Surface 创建消息
 * - Part 映射（text / data / file / 各种 MIME 类型）
 * - Message 到组件映射
 * - Artifact 到组件映射
 * - 任务状态到状态组件映射
 * - 流事件到 A2UI 消息的完整映射
 * - ActionMessage 到 A2A Message 的反向映射
 */

import { describe, it, expect } from 'vitest'
import type { AgentCard, A2AMessage, A2ATask, A2AStreamingEvent, A2ATextPart } from '../src/types'
import type { ActionMessage } from '@nine1ie/a2ui-vue-core'
import {
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
} from '../src/mapper'

/** 创建测试用 Agent Card */
function createAgentCard(): AgentCard {
  return {
    name: 'Test Agent',
    version: '1.0.0',
    url: 'https://agent.example.com',
    authentication: { schemes: ['bearer'] },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'text/markdown'],
    capabilities: { streaming: true },
  }
}

describe('createSessionState', () => {
  it('创建空的会话状态', () => {
    const state = createSessionState()
    expect(state.artifacts).toEqual({})
    expect(state.contextId).toBeUndefined()
    expect(state.taskId).toBeUndefined()
  })
})

describe('resolveSurfaceId', () => {
  it('优先使用 taskId', () => {
    const state = createSessionState()
    state.taskId = 'task-123'
    state.contextId = 'ctx-456'
    expect(resolveSurfaceId(state, 'fallback')).toBe('a2a-task-123')
  })

  it('无 taskId 时使用 contextId', () => {
    const state = createSessionState()
    state.contextId = 'ctx-456'
    expect(resolveSurfaceId(state, 'fallback')).toBe('a2a-ctx-456')
  })

  it('都无时使用 fallback', () => {
    const state = createSessionState()
    expect(resolveSurfaceId(state, 'fallback-id')).toBe('a2a-fallback-id')
  })
})

describe('mapCreateSurface', () => {
  it('生成正确的 CreateSurface 消息', () => {
    const state = createSessionState()
    state.taskId = 'task-1'
    const card = createAgentCard()

    const msgs = mapCreateSurface(state, card, 'fallback')

    expect(msgs).toHaveLength(2)
    expect(msgs[0]).toEqual({
      createSurface: {
        surfaceId: 'a2a-task-1',
        catalogId: 'a2ui.org/standard-catalog/v0.9',
        theme: {
          agentDisplayName: 'Test Agent',
          iconUrl: undefined,
        },
      },
    })
    // 第二条是 root Column 组件
    expect(msgs[1].updateComponents).toBeDefined()
    expect(msgs[1].updateComponents!.components[0].id).toBe('root')
  })
})

describe('mapPart', () => {
  it('映射 text/plain part 为 Text 组件', () => {
    const part: A2ATextPart = { type: 'text', text: 'Hello World', mimeType: 'text/plain' }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component).toEqual({
      id: 'msg-1-part-0',
      component: 'Text',
      text: { literalString: 'Hello World' },
    })
  })

  it('映射 text/markdown part 为带 markdown 标志的 Text 组件', () => {
    const part: A2ATextPart = { type: 'text', text: '# Title', mimeType: 'text/markdown' }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component).toEqual({
      id: 'msg-1-part-0',
      component: 'Text',
      text: { literalString: '# Title' },
      markdown: true,
    })
  })

  it('映射 data part (a2ui+json) 为带透传标志的 Text 组件', () => {
    const part = {
      type: 'data' as const,
      data: { components: [{ id: 'root', component: 'Text' }] },
      mimeType: 'application/vnd.a2ui+json',
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component._a2uiPassthrough).toBe(true)
    expect(component._passthroughData).toEqual(part.data)
  })

  it('映射 data part (普通 JSON) 为格式化文本', () => {
    const part = {
      type: 'data' as const,
      data: { key: 'value', count: 42 },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component.component).toBe('Text')
    expect(component.text.literalString).toBe(JSON.stringify(part.data, null, 2))
    expect(component._a2uiPassthrough).toBeUndefined()
  })

  it('映射图片 file part 为 Image 组件', () => {
    const part = {
      type: 'file' as const,
      file: { mimeType: 'image/png', uri: 'https://example.com/img.png', name: 'photo.png' },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component).toEqual({
      id: 'msg-1-part-0',
      component: 'Image',
      src: { literalString: 'https://example.com/img.png' },
      alt: { literalString: 'photo.png' },
    })
  })

  it('映射 base64 图片 file part', () => {
    const part = {
      type: 'file' as const,
      file: { mimeType: 'image/jpeg', data: 'abc123' },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component.src.literalString).toBe('data:image/jpeg;base64,abc123')
  })

  it('映射音频 file part 为 AudioPlayer 组件', () => {
    const part = {
      type: 'file' as const,
      file: { mimeType: 'audio/mp3', uri: 'https://example.com/audio.mp3' },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component).toEqual({
      id: 'msg-1-part-0',
      component: 'AudioPlayer',
      src: { literalString: 'https://example.com/audio.mp3' },
    })
  })

  it('映射视频 file part 为 Video 组件', () => {
    const part = {
      type: 'file' as const,
      file: { mimeType: 'video/mp4', uri: 'https://example.com/video.mp4' },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component).toEqual({
      id: 'msg-1-part-0',
      component: 'Video',
      src: { literalString: 'https://example.com/video.mp4' },
    })
  })

  it('映射未知文件类型为下载链接文本', () => {
    const part = {
      type: 'file' as const,
      file: { mimeType: 'application/pdf', uri: 'https://example.com/doc.pdf', name: 'report.pdf' },
    }
    const component = mapPart(part, 'msg-1-part-0')

    expect(component.component).toBe('Text')
    expect(component.text.literalString).toContain('report.pdf')
    expect(component.text.literalString).toContain('https://example.com/doc.pdf')
  })
})

describe('mapMessageToComponents', () => {
  it('将多 part 消息映射为 Column + 子组件', () => {
    const state = createSessionState()
    state.taskId = 'task-1'

    const message: A2AMessage = {
      role: 'agent',
      messageId: 'msg-001',
      parts: [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: 'World' },
      ],
    }

    const result = mapMessageToComponents(message, state)

    expect(result.updateComponents).toBeDefined()
    expect(result.updateComponents!.surfaceId).toBe('a2a-task-1')

    const components = result.updateComponents!.components
    // 1 个 Column + 2 个 Text = 3 个组件
    expect(components).toHaveLength(3)
    expect(components[0].component).toBe('Column')
    expect(components[1].component).toBe('Text')
    expect(components[2].component).toBe('Text')
  })

  it('直接透传 application/vnd.a2ui+json 中的完整 A2UI 消息', () => {
    const state = createSessionState()
    state.taskId = 'task-1'

    const message: A2AMessage = {
      role: 'agent',
      parts: [
        {
          type: 'data',
          mimeType: 'application/vnd.a2ui+json',
          data: {
            updateComponents: {
              surfaceId: 'remote-surface',
              components: [
                { id: 'title', component: 'Text', text: { literalString: 'Rendered title' } },
              ],
            },
          },
        },
      ],
    }

    const result = mapMessageToComponents(message, state)

    expect(result.updateComponents?.surfaceId).toBe('a2a-task-1')
    expect(result.updateComponents?.components).toEqual([
      { id: 'title', component: 'Text', text: { literalString: 'Rendered title' } },
    ])
  })
})

describe('mapArtifactToComponents', () => {
  it('将 artifact 映射为带名称的组件树', () => {
    const state = createSessionState()
    state.taskId = 'task-1'

    const result = mapArtifactToComponents(
      {
        artifactId: 'art-1',
        name: 'Dashboard',
        parts: [{ type: 'text', text: 'Chart data...' }],
      },
      state,
    )

    const components = result.updateComponents!.components
    expect(components).toHaveLength(2)
    expect(components[0].id).toBe('artifact-art-1')
    expect(components[0]._artifactName).toBe('Dashboard')
  })
})

describe('mapTaskStatusToComponents', () => {
  it('映射 working 状态为加载中文本', () => {
    const result = mapTaskStatusToComponents('working', 'a2a-task-1')
    const statusComp = result.updateComponents!.components[0]
    expect(statusComp.text.literalString).toContain('处理中')
  })

  it('映射 completed 状态为完成文本', () => {
    const result = mapTaskStatusToComponents('completed', 'a2a-task-1')
    const statusComp = result.updateComponents!.components[0]
    expect(statusComp.text.literalString).toContain('完成')
  })

  it('映射 failed 状态为错误文本', () => {
    const result = mapTaskStatusToComponents('failed', 'a2a-task-1')
    const statusComp = result.updateComponents!.components[0]
    expect(statusComp.text.literalString).toContain('失败')
  })
})

describe('mapStreamingEvent', () => {
  const agentCard = createAgentCard()

  it('映射直接 Message 事件', () => {
    const state = createSessionState()
    const event: A2AMessage = {
      role: 'agent',
      contextId: 'ctx-1',
      parts: [{ type: 'text', text: 'Response' }],
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(state.contextId).toBe('ctx-1')
    // 消息组件 + root 更新
    expect(messages).toHaveLength(2)
    expect(messages[0].updateComponents).toBeDefined()
  })

  it('将 text part 中的 A2UI JSON 作为原生渲染消息处理', () => {
    const state = createSessionState()
    state.taskId = 'task-1'
    const event: A2AMessage = {
      role: 'agent',
      taskId: 'task-1',
      parts: [
        {
          type: 'text',
          text: JSON.stringify({
            updateComponents: {
              surfaceId: 'ignored',
              components: [
                { id: 'heading', component: 'Text', text: { literalString: 'A股市场历史对比分析' } },
              ],
            },
          }),
        },
      ],
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(messages).toHaveLength(2)
    expect(messages[0].updateComponents?.surfaceId).toBe('a2a-task-1')
    expect(messages[0].updateComponents?.components[0].text.literalString).toBe('A股市场历史对比分析')
    expect(messages[1].updateComponents?.components[0].id).toBe('root')
  })

  it('透传 data part 中的完整 A2UI updateComponents 消息', () => {
    const state = createSessionState()
    state.taskId = 'task-1'
    const event: A2AMessage = {
      role: 'agent',
      taskId: 'task-1',
      parts: [
        {
          type: 'data',
          mimeType: 'application/vnd.a2ui+json',
          data: {
            updateComponents: {
              surfaceId: 'ignored',
              components: [
                { id: 'metric', component: 'Text', text: { literalString: '12.5%' } },
              ],
            },
          },
        },
      ],
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(messages).toHaveLength(2)
    expect(messages[0].updateComponents?.components[0].id).toBe('metric')
    expect(messages[0].updateComponents?.components[0].text.literalString).toBe('12.5%')
    expect(messages[1].updateComponents?.components[0].children.explicitList).toEqual(['metric'])
  })

  it('映射 Task 事件（首次 — 创建 surface + 状态 + 消息）', () => {
    const state = createSessionState()
    const event: A2ATask = {
      id: 'task-1',
      contextId: 'ctx-1',
      status: { state: 'working' },
      history: [
        { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      ],
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(state.taskId).toBe('task-1')
    expect(state.contextId).toBe('ctx-1')
    expect(state.taskState).toBe('working')

    // 应该包含: createSurface + status + 1 history message
    expect(messages.length).toBeGreaterThanOrEqual(3)
    expect(messages[0].createSurface).toBeDefined()
    expect(messages[1].updateComponents).toBeDefined()
  })

  it('映射 TaskStatusUpdateEvent', () => {
    const state = createSessionState()
    state.taskId = 'task-1'

    const event = {
      taskId: 'task-1',
      contextId: 'ctx-1',
      status: { state: 'completed' as const },
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(state.taskState).toBe('completed')
    expect(messages).toHaveLength(1)
    expect(messages[0].updateComponents).toBeDefined()
  })

  it('映射 TaskArtifactUpdateEvent', () => {
    const state = createSessionState()
    state.taskId = 'task-1'

    const event = {
      taskId: 'task-1',
      artifact: {
        artifactId: 'art-1',
        name: 'Result',
        parts: [{ type: 'text' as const, text: 'Output' }],
      },
    }

    const messages = mapStreamingEvent(event, state, agentCard)

    expect(state.artifacts['art-1']).toBeDefined()
    expect(messages).toHaveLength(2)
  })

  it('未知事件返回空数组', () => {
    const state = createSessionState()
    const event = { unknown: true } as any

    const messages = mapStreamingEvent(event, state, agentCard)
    expect(messages).toEqual([])
  })
})

describe('mapActionToA2AMessage', () => {
  it('将 ActionMessage 转换为 A2A Message', () => {
    const state = createSessionState()
    state.contextId = 'ctx-1'
    state.taskId = 'task-1'

    const action: ActionMessage = {
      name: 'button-click',
      surfaceId: 'a2a-task-1',
      sourceComponentId: 'btn-submit',
      timestamp: '2026-05-13T00:00:00Z',
      context: { value: 'test' },
    }

    const a2aMessage = mapActionToA2AMessage(action, state)

    expect(a2aMessage.role).toBe('user')
    expect(a2aMessage.contextId).toBe('ctx-1')
    expect(a2aMessage.taskId).toBe('task-1')
    expect(a2aMessage.parts).toHaveLength(1)
    expect(a2aMessage.parts[0].type).toBe('data')

    const data = (a2aMessage.parts[0] as any).data
    expect(data.type).toBe('a2ui.action')
    expect(data.name).toBe('button-click')
    expect(data.context).toEqual({ value: 'test' })
  })
})

describe('extractCreateSurface', () => {
  const agentCard = createAgentCard()

  it('从 Message 事件提取 surface 创建消息', () => {
    const state = createSessionState()
    const event: A2AMessage = {
      role: 'agent',
      contextId: 'ctx-1',
      parts: [{ type: 'text', text: 'Hi' }],
    }

    const result = extractCreateSurface(event, state, agentCard)

    expect(result.length).toBeGreaterThan(0)
    expect(result[0].createSurface).toBeDefined()
    expect(state.contextId).toBe('ctx-1')
  })

  it('从 Task 事件提取 surface 创建消息', () => {
    const state = createSessionState()
    const event: A2ATask = {
      id: 'task-1',
      contextId: 'ctx-1',
      status: { state: 'working' },
    }

    const result = extractCreateSurface(event, state, agentCard)

    expect(result.length).toBeGreaterThan(0)
    expect(state.taskId).toBe('task-1')
  })

  it('已有 taskId 时返回空数组', () => {
    const state = createSessionState()
    state.taskId = 'existing-task'
    const event: A2AMessage = {
      role: 'agent',
      parts: [{ type: 'text', text: 'Hi' }],
    }

    const result = extractCreateSurface(event, state, agentCard)
    expect(result).toEqual([])
  })
})
