/**
 * A2A to A2UI Mapper — 协议桥接层
 *
 * 将 A2A 协议对象（Message、Task、Artifact、StreamingEvent）
 * 转换为现有的 A2UIServerMessage 对象。
 *
 * 设计原则：
 * - Renderer 不感知 A2A 类型，只处理标准 A2UI 消息
 * - 每个 A2A task 或 conversation 创建一个独立的 surface
 * - 保持 artifact 身份，增量更新时替换而非追加
 *
 * 组件 ID 命名规范：
 *   root, status, messages,
 *   message-{messageId},
 *   artifact-{artifactId},
 *   artifact-{artifactId}-part-{index}
 */

import type {
  A2AMessage,
  A2APart,
  A2ATextPart,
  A2ADataPart,
  A2AFilePart,
  A2ATask,
  A2AArtifact,
  A2ATaskState,
  A2ATaskStatusUpdateEvent,
  A2ATaskArtifactUpdateEvent,
  A2AStreamingEvent,
  AgentCard,
} from './types'
import type {
  A2UIServerMessage,
  ComponentDef,
} from '@nine1ie/a2ui-vue-core'
import { parseMessage, validateMessage } from '@nine1ie/a2ui-vue-core'
import { MapperError } from './errors'

type A2UINativeData = {
  components?: ComponentDef[]
  rootChildIds?: string[]
}

function isA2UIServerMessage(value: unknown): value is A2UIServerMessage {
  return !!value && typeof value === 'object' && (
    'createSurface' in value ||
    'updateComponents' in value ||
    'updateDataModel' in value ||
    'deleteSurface' in value
  )
}

function isValidA2UIServerMessage(value: unknown): value is A2UIServerMessage {
  return isA2UIServerMessage(value) && validateMessage(value).valid
}

function parseA2UIMessagesFromText(text: string): A2UIServerMessage[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed) && parsed.every(isValidA2UIServerMessage)) {
      return parsed
    }
    return isValidA2UIServerMessage(parsed) ? [parsed] : []
  } catch {
    // Continue with JSONL parsing below.
  }

  const messages: A2UIServerMessage[] = []
  for (const line of trimmed.split(/\r?\n/)) {
    const candidate = line.trim()
    if (!candidate) continue
    try {
      const message = parseMessage(candidate)
      if (!validateMessage(message).valid) return []
      messages.push(message)
    } catch {
      return []
    }
  }

  return messages.length > 0 ? messages : []
}

function extractNativeA2UIMessages(message: A2AMessage): A2UIServerMessage[] {
  const nativeMessages: A2UIServerMessage[] = []

  for (const part of message.parts) {
    if (part.type === 'data' && part.mimeType === 'application/vnd.a2ui+json') {
      if (isValidA2UIServerMessage(part.data)) {
        nativeMessages.push(part.data)
      }
      continue
    }

    if (part.type === 'text') {
      nativeMessages.push(...parseA2UIMessagesFromText(part.text))
    }
  }

  return nativeMessages
}

function normalizeSurfaceId(message: A2UIServerMessage, surfaceId: string): A2UIServerMessage {
  if (message.createSurface) {
    return { createSurface: { ...message.createSurface, surfaceId } }
  }
  if (message.updateComponents) {
    return { updateComponents: { ...message.updateComponents, surfaceId } }
  }
  if (message.updateDataModel) {
    return { updateDataModel: { ...message.updateDataModel, surfaceId } }
  }
  if (message.deleteSurface) {
    return { deleteSurface: { ...message.deleteSurface, surfaceId } }
  }
  return message
}

/** 会话状态 — 追踪当前 A2A 会话的上下文 */
export interface A2ASessionState {
  /** A2A 上下文 ID，用于维持多轮对话 */
  contextId?: string
  /** A2A 任务 ID，由服务端分配 */
  taskId?: string
  /** 当前任务状态 */
  taskState?: A2ATaskState
  /** 最后收到的消息 ID */
  lastMessageId?: string
  /** 已知的 artifact 集合，按 artifactId 索引 */
  artifacts: Record<string, A2AArtifact>
  /** root 组件的子组件 ID 列表，用于维护组件树的根节点 */
  rootChildIds: string[]
  /** 累积的流式文本（用于合并增量 chunks） */
  accumulatedText: string
  /** 当前累积文本对应的 A2UI 组件 ID（用于原地更新） */
  accumulatedComponentId: string
}

/** 创建新的会话状态 */
export function createSessionState(): A2ASessionState {
  return {
    artifacts: {},
    rootChildIds: [],
    accumulatedText: '',
    accumulatedComponentId: '',
  }
}

/**
 * 确定 surface ID
 *
 * 优先使用 taskId，其次使用 contextId，最后使用提供的 fallback。
 * surface ID 格式: a2a-{identifier}
 */
export function resolveSurfaceId(state: A2ASessionState, fallback: string): string {
  const id = state.taskId ?? state.contextId ?? fallback
  return `a2a-${id}`
}

/**
 * 创建 Surface 初始化消息
 *
 * 为每个 A2A 会话创建一个 A2UI surface，包含 agent 的元信息。
 * 同时创建 root Column 组件作为组件树的根节点。
 */
export function mapCreateSurface(
  state: A2ASessionState,
  agentCard: AgentCard,
  fallbackId: string,
): A2UIServerMessage[] {
  const surfaceId = resolveSurfaceId(state, fallbackId)
  return [
    {
      createSurface: {
        surfaceId,
        catalogId: 'a2ui.org/standard-catalog/v0.9',
        theme: {
          agentDisplayName: agentCard.name,
          iconUrl: agentCard.provider?.url,
        },
      },
    },
    {
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: { explicitList: [] },
          },
        ],
      },
    },
  ]
}

/**
 * 映射 A2A Text Part 到 A2UI Text 组件
 *
 * - text/plain 映射为 body 用法的 Text 组件
 * - text/markdown 映射为 markdown 用法的 Text 组件
 */
function mapTextPart(part: A2ATextPart, componentId: string): ComponentDef {
  const isMarkdown = part.mimeType === 'text/markdown'
  return {
    id: componentId,
    component: 'Text',
    text: {
      literalString: part.text,
    },
    // markdown 模式通过额外属性标识，渲染器侧可据此选择渲染方式
    ...(isMarkdown ? { markdown: true } : {}),
  }
}

/**
 * 映射 A2A Data Part 到 A2UI 组件
 *
 * - application/vnd.a2ui+json: 直接透传（调用方需自行验证合法性）
 * - 其他 JSON: 渲染为结构化 JSON 文本
 */
function mapDataPart(part: A2ADataPart, componentId: string): ComponentDef {
  const isA2UIJson = part.mimeType === 'application/vnd.a2ui+json'

  if (isA2UIJson) {
    // A2UI native 数据直接透传，作为 dataModel 更新
    return {
      id: componentId,
      component: 'Text',
      text: {
        literalString: JSON.stringify(part.data, null, 2),
      },
      _a2uiPassthrough: true,
      _passthroughData: part.data,
    }
  }

  // 通用 JSON 数据渲染为格式化文本
  return {
    id: componentId,
    component: 'Text',
    text: {
      literalString: JSON.stringify(part.data, null, 2),
    },
  }
}

/**
 * 映射 A2A File Part 到 A2UI 组件
 *
 * - 图片: Image 组件
 * - 音频: AudioPlayer 组件
 * - 视频: Video 组件
 * - 其他: 下载链接样式的 Text 组件
 */
function mapFilePart(part: A2AFilePart, componentId: string): ComponentDef {
  const mimeType = part.file.mimeType ?? ''
  const fileUri = part.file.uri
  const fileData = part.file.data
  const fileName = part.file.name ?? 'attachment'

  // 图片类型
  if (mimeType.startsWith('image/')) {
    const src = fileData
      ? `data:${mimeType};base64,${fileData}`
      : fileUri ?? ''
    return {
      id: componentId,
      component: 'Image',
      src: { literalString: src },
      alt: { literalString: fileName },
    }
  }

  // 音频类型
  if (mimeType.startsWith('audio/')) {
    const src = fileData
      ? `data:${mimeType};base64,${fileData}`
      : fileUri ?? ''
    return {
      id: componentId,
      component: 'AudioPlayer',
      src: { literalString: src },
    }
  }

  // 视频类型
  if (mimeType.startsWith('video/')) {
    const src = fileData
      ? `data:${mimeType};base64,${fileData}`
      : fileUri ?? ''
    return {
      id: componentId,
      component: 'Video',
      src: { literalString: src },
    }
  }

  // 不支持的文件类型 — 渲染为下载链接样式的文本
  const linkText = fileUri
    ? `[${fileName}](${fileUri})`
    : `[${fileName}] (base64 inline)`
  return {
    id: componentId,
    component: 'Text',
    text: {
      literalString: linkText,
    },
  }
}

/**
 * 映射单个 A2A Part 到 A2UI ComponentDef
 */
export function mapPart(part: A2APart, componentId: string): ComponentDef {
  switch (part.type) {
    case 'text':
      return mapTextPart(part, componentId)
    case 'data':
      return mapDataPart(part, componentId)
    case 'file':
      return mapFilePart(part, componentId)
    default:
      throw new MapperError(`不支持的 part 类型: ${(part as { type: string }).type}`)
  }
}

/**
 * 将 A2A Task 状态映射为 A2UI 状态组件
 *
 * 状态映射规则：
 * - submitted / working / input-required -> 加载中状态
 * - completed -> 完成
 * - failed -> 错误
 * - canceled -> 已取消
 * - rejected -> 已拒绝
 */
function mapTaskStateToStatusText(state: A2ATaskState): string {
  switch (state) {
    case 'submitted':
      return '任务已提交，等待处理...'
    case 'working':
      return '正在处理中...'
    case 'input-required':
      return '需要输入...'
    case 'completed':
      return '任务完成'
    case 'failed':
      return '任务失败'
    case 'canceled':
      return '任务已取消'
    case 'rejected':
      return '任务已拒绝'
    default:
      return `未知状态: ${state}`
  }
}

/**
 * 将 A2A Message 映射为 A2UI UpdateComponents 消息
 *
 * 一条 A2A Message 的所有 parts 会映射为一组 A2UI 组件，
 * 使用 Column 布局包裹。
 */
export function mapMessageToComponents(
  message: A2AMessage,
  state: A2ASessionState,
): A2UIServerMessage {
  const surfaceId = state.taskId ?? state.contextId ?? 'pending'

  const nativeMessages = extractNativeA2UIMessages(message)
  if (nativeMessages.length > 0) {
    const componentUpdate = nativeMessages.find((msg): msg is { updateComponents: NonNullable<A2UIServerMessage['updateComponents']> } =>
      !!msg.updateComponents,
    )
    if (componentUpdate) {
      return normalizeSurfaceId(componentUpdate, `a2a-${surfaceId}`)
    }
  }

  // 检查是否包含 A2UI native data part — 直接提取组件树
  const a2uiPart = message.parts.find(
    p => p.type === 'data' && (p as A2ADataPart).mimeType === 'application/vnd.a2ui+json',
  ) as A2ADataPart | undefined

  if (a2uiPart && a2uiPart.data && typeof a2uiPart.data === 'object') {
    const data = a2uiPart.data as A2UINativeData
    if (Array.isArray(data.components) && data.components.length > 0) {
      // 将 A2UI 组件直接作为 root 子节点
      const componentIds = data.components.map(c => c.id)
      // 只添加不在任何容器 children 中的顶层组件
      const childIdSet = new Set<string>()
      for (const comp of data.components) {
        const childList = comp.children?.explicitList
        if (childList) {
          for (const id of childList) childIdSet.add(id)
        }
      }
      for (const id of componentIds) {
        if (!state.rootChildIds.includes(id) && !childIdSet.has(id)) {
          state.rootChildIds.push(id)
        }
      }

      return {
        updateComponents: {
          surfaceId: `a2a-${surfaceId}`,
          components: data.components,
        },
      }
    }
  }

  // 标准路径：将 parts 包装为 Column 容器
  const messageId = message.messageId ?? `msg-${Date.now()}`
  const rootId = `message-${messageId}`

  const childIds: string[] = message.parts.map((_, index) =>
    `${rootId}-part-${index}`,
  )

  const components: ComponentDef[] = [
    // 容器 Column — 只有这个会被加入 rootChildIds
    {
      id: rootId,
      component: 'Column',
      children: { explicitList: childIds },
    },
    // 各 part 对应的子组件 — 不会加入 rootChildIds
    ...message.parts.map((part, index) =>
      mapPart(part, `${rootId}-part-${index}`),
    ),
  ]

  return {
    updateComponents: {
      surfaceId: `a2a-${surfaceId}`,
      components,
    },
  }
}

/**
 * 将 A2A Artifact 映射为 A2UI UpdateComponents 消息
 *
 * Artifact 使用独立的组件树，支持增量更新替换。
 */
export function mapArtifactToComponents(
  artifact: A2AArtifact,
  state: A2ASessionState,
): A2UIServerMessage {
  const surfaceId = state.taskId ?? state.contextId ?? 'pending'
  const rootId = `artifact-${artifact.artifactId}`

  const childIds: string[] = artifact.parts.map((_, index) =>
    `${rootId}-part-${index}`,
  )

  const components: ComponentDef[] = [
    {
      id: rootId,
      component: 'Column',
      children: { explicitList: childIds },
      ...(artifact.name ? { _artifactName: artifact.name } : {}),
    },
    ...artifact.parts.map((part, index) =>
      mapPart(part, `${rootId}-part-${index}`),
    ),
  ]

  return {
    updateComponents: {
      surfaceId: `a2a-${surfaceId}`,
      components,
    },
  }
}

/**
 * 将任务状态更新映射为 A2UI UpdateComponents 消息
 *
 * 在 surface 中维护一个 status 组件，实时反映任务状态。
 */
export function mapTaskStatusToComponents(
  state: A2ATaskState,
  surfaceId: string,
): A2UIServerMessage {
  return {
    updateComponents: {
      surfaceId,
      components: [
        {
          id: 'status',
          component: 'Text',
          text: {
            literalString: mapTaskStateToStatusText(state),
          },
        },
      ],
    },
  }
}

/**
 * 核心映射函数：将任意 A2A StreamingEvent 映射为 A2UIServerMessage 数组
 *
 * 这是流事件到 A2UI 消息的主要转换入口。
 * 根据事件类型返回 0~N 条 A2UI 消息。
 *
 * @param event - A2A 流事件
 * @param state - 会话状态（会被就地更新）
 * @param agentCard - 远程 Agent 的元信息
 * @returns 映射后的 A2UI 消息数组
 */
export function mapStreamingEvent(
  event: A2AStreamingEvent,
  state: A2ASessionState,
  agentCard: AgentCard,
): A2UIServerMessage[] {
  const messages: A2UIServerMessage[] = []
  const currentSurfaceId = () => resolveSurfaceId(state, 'pending')

  /** 添加组件消息并同步更新 root 子节点列表 */
  function pushComponent(componentMsg: A2UIServerMessage) {
    messages.push(componentMsg)
    if (componentMsg.updateComponents) {
      const comps = componentMsg.updateComponents.components
      // 收集本批次中所有容器的子节点 ID
      const childIdsInBatch = new Set<string>()
      for (const comp of comps) {
        const childList = comp.children?.explicitList
        if (childList) {
          for (const id of childList) childIdsInBatch.add(id)
        }
      }
      // 只把不在任何容器 children 中的组件加入 root（跳过 status 组件）
      for (const comp of comps) {
        if (comp.id !== 'root' && comp.id !== 'status' && !state.rootChildIds.includes(comp.id) && !childIdsInBatch.has(comp.id)) {
          state.rootChildIds.push(comp.id)
        }
      }
    }
  }

  function pushNativeMessages(nativeMessages: A2UIServerMessage[]) {
    const normalized = nativeMessages
      .filter(message => !message.createSurface && !message.deleteSurface)
      .map(message => normalizeSurfaceId(message, currentSurfaceId()))

    for (const message of normalized) {
      if (message.updateComponents) {
        pushComponent(message)
      } else {
        messages.push(message)
      }
    }
  }

  /** 在所有组件消息之后，推送 root 组件更新 */
  function pushRootUpdate() {
    if (state.rootChildIds.length > 0) {
      messages.push({
        updateComponents: {
          surfaceId: currentSurfaceId(),
          components: [
            {
              id: 'root',
              component: 'Column',
              children: { explicitList: [...state.rootChildIds] },
            },
          ],
        },
      })
    }
  }

  // 事件 1: 直接 Message（非 Task 封装的响应）
  if ('role' in event && 'parts' in event) {
    const msg = event as A2AMessage
    state.taskId = msg.taskId ?? state.taskId
    state.contextId = msg.contextId ?? state.contextId
    state.lastMessageId = msg.messageId

    const nativeMessages = extractNativeA2UIMessages(msg)
    if (nativeMessages.length > 0) {
      state.accumulatedText = ''
      state.accumulatedComponentId = ''
      pushNativeMessages(nativeMessages)
      pushRootUpdate()
      return messages
    }

    // 检查是否包含 A2UI native data part — 直接提取组件树，跳过文本累积
    const hasA2UIPart = msg.parts.some(
      p => p.type === 'data' && (p as A2ADataPart).mimeType === 'application/vnd.a2ui+json',
    )

    if (hasA2UIPart) {
      // A2UI 数据：清除流式文本累积，保留 rootChildIds（增量更新累积）
      state.accumulatedText = ''
      state.accumulatedComponentId = ''
      pushComponent(mapMessageToComponents(msg, state))
      pushRootUpdate()
      return messages
    }

    // 文本消息：增量累积
    const text = msg.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || ''

    // 增量累积：如果新文本是之前文本的延续，则原地更新组件
    if (text && state.accumulatedText && text.startsWith(state.accumulatedText) && state.accumulatedComponentId) {
      // 增量更新：替换已有组件的文本内容
      state.accumulatedText = text
      messages.push({
        updateComponents: {
          surfaceId: currentSurfaceId(),
          components: [
            {
              id: state.accumulatedComponentId,
              component: 'Text',
              text: { literalString: text },
            },
          ],
        },
      })
      pushRootUpdate()
      return messages
    }

    // 新消息或不连续的文本：创建新组件
    if (text) {
      state.accumulatedText = text
    }

    const componentMsg = mapMessageToComponents(msg, state)

    // 记录累积组件 ID（取第一个 part 组件的 ID）
    if (msg.parts.length > 0) {
      const rootId = `message-${msg.messageId ?? `msg-${Date.now()}`}`
      state.accumulatedComponentId = `${rootId}-part-0`
    }

    pushComponent(componentMsg)
    pushRootUpdate()
    return messages
  }

  // 事件 2: Task 对象（首次返回或状态查询）
  if ('status' in event && 'id' in event) {
    const task = event as A2ATask

    // 如果是新任务，创建 surface（含 root 组件）
    if (!state.taskId) {
      state.taskId = task.id
      state.contextId = task.contextId ?? state.contextId
      messages.push(...mapCreateSurface(state, agentCard, task.id))
    }

    state.taskId = task.id
    state.contextId = task.contextId ?? state.contextId
    state.taskState = task.status.state

    // 映射状态
    pushComponent(mapTaskStatusToComponents(task.status.state, currentSurfaceId()))

    // 映射历史消息
    if (task.history) {
      for (const msg of task.history) {
        pushComponent(mapMessageToComponents(msg, state))
      }
    }

    // 映射 artifacts
    if (task.artifacts) {
      for (const artifact of task.artifacts) {
        state.artifacts[artifact.artifactId] = artifact
        pushComponent(mapArtifactToComponents(artifact, state))
      }
    }

    pushRootUpdate()
    return messages
  }

  // 事件 3: TaskStatusUpdateEvent
  if ('taskId' in event && 'status' in event && !('artifact' in event)) {
    const statusEvent = event as A2ATaskStatusUpdateEvent
    state.taskId = statusEvent.taskId
    state.contextId = statusEvent.contextId ?? state.contextId
    state.taskState = statusEvent.status.state

    pushComponent(mapTaskStatusToComponents(statusEvent.status.state, currentSurfaceId()))

    // 状态事件可能附带消息
    if (statusEvent.status.message) {
      pushComponent(mapMessageToComponents(statusEvent.status.message, state))
    }

    pushRootUpdate()
    return messages
  }

  // 事件 4: TaskArtifactUpdateEvent
  if ('taskId' in event && 'artifact' in event) {
    const artifactEvent = event as A2ATaskArtifactUpdateEvent
    state.taskId = artifactEvent.taskId
    state.contextId = artifactEvent.contextId ?? state.contextId

    // 保存/更新 artifact
    state.artifacts[artifactEvent.artifact.artifactId] = artifactEvent.artifact
    pushComponent(mapArtifactToComponents(artifactEvent.artifact, state))

    pushRootUpdate()
    return messages
  }

  // 未知事件类型 — 忽略
  return messages
}

/**
 * 将 A2UI ActionMessage 转换为 A2A follow-up Message
 *
 * 当用户在渲染的 UI 中触发交互（如点击按钮），Renderer 会发出
 * ActionMessage。此函数将其转换为 A2A 协议的 Message 对象，
 * 作为后续请求发送给 Agent。
 */
export function mapActionToA2AMessage(
  action: import('@nine1ie/a2ui-vue-core').ActionMessage,
  state: A2ASessionState,
): A2AMessage {
  return {
    role: 'user',
    contextId: state.contextId,
    taskId: state.taskId,
    parts: [
      {
        type: 'data',
        data: {
          type: 'a2ui.action',
          name: action.name,
          surfaceId: action.surfaceId,
          sourceComponentId: action.sourceComponentId,
          timestamp: action.timestamp,
          context: action.context,
        },
      },
    ],
  }
}

/**
 * 从 A2A Message 或 Task 中提取 surface 初始化消息
 *
 * 用于在首次收到 Agent 响应时创建 surface。
 */
export function extractCreateSurface(
  event: A2AStreamingEvent,
  state: A2ASessionState,
  agentCard: AgentCard,
): A2UIServerMessage[] {
  // 如果已有 task，不重复创建
  if (state.taskId) return []

  // 从 Message 中获取 contextId
  if ('role' in event && 'parts' in event) {
    const msg = event as A2AMessage
    if (msg.contextId) {
      state.contextId = msg.contextId
    }
    return mapCreateSurface(state, agentCard, msg.contextId ?? 'session')
  }

  // 从 Task 中获取
  if ('status' in event && 'id' in event) {
    const task = event as A2ATask
    state.taskId = task.id
    state.contextId = task.contextId ?? state.contextId
    return mapCreateSurface(state, agentCard, task.id)
  }

  return []
}
