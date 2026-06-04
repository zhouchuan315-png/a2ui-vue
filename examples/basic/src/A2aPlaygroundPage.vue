<script setup lang="ts">
/**
 * A2A Playground — A2A 协议交互演示页面
 *
 * 支持两种模式：
 * 1. 本地 Mock 模式（默认）：使用预置的模拟数据，适合静态站点发布
 * 2. 自定义端点模式：手动连接用户提供的 A2A Agent
 *
 * 默认路径不依赖 examples/basic/server 或任何 API key。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { A2UIRenderer } from '@nine1ie/a2ui-vue'
import type { A2UIServerMessage, ActionMessage } from '@nine1ie/a2ui-vue-core'
import {
  createSessionState,
  mapStreamingEvent,
  mapCreateSurface,
  type A2ASessionState,
  type AgentCard,
  type A2AStreamingEvent,
  type A2ATask,
} from '@nine1ie/a2ui-vue-a2a'
import { getMockResponse } from './a2a-mock-data'
import type { Locale } from './i18n'

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'zh' })

// ─── Renderer 类型 ───

type A2UIRendererExposed = InstanceType<typeof A2UIRenderer> & {
  processMessage: (message: A2UIServerMessage) => void
  reset: () => void
}

// ─── 响应式状态 ───

const rendererRef = ref<A2UIRendererExposed | null>(null)

/** 模式：mock = 本地模拟，remote = 用户自定义远程端点 */
const mode = ref<'mock' | 'remote'>('mock')

/** 配置项 */
const agentCardUrl = ref('')
const authHeader = ref('')
const prompt = ref('')
const streaming = ref(true)
const connected = ref(false)
const connecting = ref(false)

/** 运行时状态 */
const taskState = ref<string>('')
const taskId = ref<string>('')
const actionLog = ref<string[]>([])
const eventLog = ref<{ time: string; type: string; detail: string; fullJson?: string }[]>([])
const agentCard = ref<AgentCard | null>(null)
const sessionState = ref<A2ASessionState>(createSessionState())
const abortController = ref<AbortController | null>(null)

/** Mock 播放状态 */
const mockPlaying = ref(false)

/** 事件流显示模式：summary = 摘要，full = 完整 JSON */
const eventViewMode = ref<'summary' | 'full'>('summary')

/** 是否有渲染内容 */
const hasContent = ref(false)

// ─── 国际化 ───

const t = computed(() => {
  const messages = {
    zh: {
      eyebrow: 'A2A 协议',
      title: 'A2A Playground',
      summary: '静态站点默认使用本地 Mock 数据，也可手动填入自定义 A2A Agent 查看真实事件流。',
      configTitle: '连接配置',
      mode: '运行模式',
      modeMock: '本地 Mock',
      modeRemote: '自定义端点',
      modeMockDesc: '使用预置模拟数据，无需 Agent',
      modeRemoteDesc: '手动填写可访问的 Agent Card URL',
      agentCardUrl: 'Agent Card URL',
      agentCardUrlPlaceholder: 'https://agent.example.com/.well-known/agent-card.json',
      authHeader: '认证头（可选）',
      authHeaderPlaceholder: 'Optional Authorization header',
      prompt: '提示词',
      promptPlaceholder: '输入发送给 Agent 的消息...',
      streaming: '流式输出',
      connect: '连接',
      disconnect: '断开',
      send: '发送',
      sendMock: '模拟响应',
      connecting: '连接中...',
      connected: '已连接',
      disconnected: '未连接',
      renderTitle: '渲染输出',
      renderCaption: '由 A2UIRenderer 实时渲染的 Agent 输出。',
      eventTitle: 'A2A 事件流',
      actionTitle: 'Action 日志',
      actionEmpty: '与渲染输出交互后，发出的动作会显示在这里。',
      eventEmpty: '发送消息后，事件流会显示在这里。',
      taskState: '任务状态',
      taskId: '任务 ID',
      none: '无',
    },
    en: {
      eyebrow: 'A2A Protocol',
      title: 'A2A Playground',
      summary: 'This static demo uses local mock data by default, with an optional custom A2A Agent endpoint for real event streams.',
      configTitle: 'Connection Config',
      mode: 'Run Mode',
      modeMock: 'Local Mock',
      modeRemote: 'Custom Endpoint',
      modeMockDesc: 'Uses preset mock data, no agent needed',
      modeRemoteDesc: 'Enter an accessible Agent Card URL manually',
      agentCardUrl: 'Agent Card URL',
      agentCardUrlPlaceholder: 'https://agent.example.com/.well-known/agent-card.json',
      authHeader: 'Auth Header (optional)',
      authHeaderPlaceholder: 'Optional Authorization header',
      prompt: 'Prompt',
      promptPlaceholder: 'Type your message to the agent...',
      streaming: 'Streaming',
      connect: 'Connect',
      disconnect: 'Disconnect',
      send: 'Send',
      sendMock: 'Simulate',
      connecting: 'Connecting...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      renderTitle: 'Rendered Output',
      renderCaption: 'Agent output rendered in real-time by A2UIRenderer.',
      eventTitle: 'A2A Event Stream',
      actionTitle: 'Action Log',
      actionEmpty: 'Interact with the rendered output to stream emitted actions here.',
      eventEmpty: 'Events will appear here after sending a message.',
      taskState: 'Task State',
      taskId: 'Task ID',
      none: 'None',
    },
  }
  return messages[props.locale]
})

// ─── Mock 模式操作 ───

/** 生成 A2UI 消息的可读摘要 */
function summarizeA2UI(msg: A2UIServerMessage): string {
  if (msg.createSurface) {
    return `createSurface → ${msg.createSurface.surfaceId}`
  }
  if (msg.updateComponents) {
    const ids = msg.updateComponents.components.map(c => c.id).join(', ')
    return `updateComponents [${ids}]`
  }
  if (msg.updateDataModel) {
    return `updateDataModel → ${msg.updateDataModel.path ?? 'root'}`
  }
  if (msg.deleteSurface) {
    return `deleteSurface → ${msg.deleteSurface.surfaceId}`
  }
  return JSON.stringify(msg).slice(0, 80)
}

/** 格式化完整消息 JSON（美化缩进） */
function formatMessageJson(msg: A2UIServerMessage): string {
  return JSON.stringify(msg, null, 2)
}

async function handleMockSend() {
  if (mockPlaying.value || !prompt.value.trim()) return

  const text = prompt.value.trim()
  prompt.value = ''
  addEvent('user', text)

  // 获取 mock 响应（已经是 A2UIServerMessage[]）
  const messages = getMockResponse(text)
  mockPlaying.value = true

  // 逐条推送（每条间隔 200ms，模拟流式效果）
  for (let i = 0; i < messages.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 200))

    const msg = messages[i]
    addEvent('agent', summarizeA2UI(msg), formatMessageJson(msg))

    // 先标记有内容，触发 renderer 挂载，再等待 DOM 更新后发送消息
    hasContent.value = true
    await nextTick()
    rendererRef.value?.processMessage(msg)

    // 更新任务状态（从 createSurface 的 surfaceId 中提取 task id）
    if (msg.createSurface) {
      const sid = msg.createSurface.surfaceId
      const taskIdStr = sid.replace('a2a-mock-', '')
      taskId.value = taskIdStr
      taskState.value = 'working'
    }
  }

  taskState.value = 'completed'
  mockPlaying.value = false
}

// ─── 远程模式操作 ───

/** 发送消息到渲染器（处理 renderer 未挂载的情况） */
const pendingMessages: A2UIServerMessage[] = []

function emitToRenderer(message: A2UIServerMessage) {
  if (rendererRef.value) {
    rendererRef.value.processMessage(message)
  } else {
    pendingMessages.push(message)
  }
  hasContent.value = true
}

/** 解析 SSE data 行并分发 A2UI 消息 */
function processSSEData(
  data: string,
  state: A2ASessionState,
  card: AgentCard,
) {
  // 尝试解析 JSON-RPC 响应
  let event: A2AStreamingEvent
  try {
    const parsed = JSON.parse(data)
    if (parsed.result && typeof parsed.result === 'object') {
      event = parsed.result
    } else if (parsed.error) {
      addEvent('error', `JSON-RPC Error [${parsed.error.code}]: ${parsed.error.message}`)
      return
    } else {
      event = parsed
    }
  } catch {
    return
  }

  // 首次事件：创建 surface
  if (!state.taskId && card) {
    const createMsgs = mapCreateSurface(state, card, event.taskId ?? 'session')
    for (const msg of createMsgs) {
      emitToRenderer(msg)
    }
  }

  // 映射流事件为 A2UI 消息
  const a2uiMessages = mapStreamingEvent(event, state, card)
  for (const msg of a2uiMessages) {
    emitToRenderer(msg)
  }

  // 更新任务状态
  if ('status' in event && 'id' in event) {
    const task = event as A2ATask
    taskState.value = task.status.state
    taskId.value = task.id
  }
  if ('taskId' in event && 'status' in event && !('artifact' in event)) {
    const statusEvent = event as { taskId: string; status: { state: string; message?: unknown } }
    taskState.value = statusEvent.status.state
    taskId.value = statusEvent.taskId
  }

  addEvent('agent', summarizeA2AEvent(event), JSON.stringify(event, null, 2))
}

/** 从 A2A 流事件生成可读摘要 */
function summarizeA2AEvent(event: A2AStreamingEvent): string {
  if ('role' in event && 'parts' in event) {
    const msg = event as { parts: Array<{ type: string; text?: string }> }
    const text = msg.parts.find(p => p.type === 'text')?.text ?? ''
    return `Message: ${text.slice(0, 80)}`
  }
  if ('status' in event && 'id' in event) {
    const task = event as A2ATask
    return `Task ${task.id}: ${task.status.state}`
  }
  if ('status' in event && 'taskId' in event) {
    const e = event as { taskId: string; status: { state: string } }
    return `TaskStatus ${e.taskId}: ${e.status.state}`
  }
  return JSON.stringify(event).slice(0, 80)
}

async function handleConnect() {
  if (connected.value) {
    handleDisconnect()
    return
  }

  connecting.value = true
  try {
    // 获取 Agent Card
    const cardUrl = agentCardUrl.value.trim()
    if (!cardUrl) throw new Error('Agent Card URL is required')
    const cardResp = await fetch(cardUrl)
    if (!cardResp.ok) throw new Error(`获取 Agent Card 失败: ${cardResp.status}`)
    const card: AgentCard = await cardResp.json()
    agentCard.value = card
    addEvent('system', `Agent Card: ${card.name} v${card.version}`)

    // 重置会话
    sessionState.value = createSessionState()
    connected.value = true
    hasContent.value = true
    addEvent('system', '连接成功')
  } catch (err) {
    addEvent('error', (err as Error).message)
  } finally {
    connecting.value = false
  }
}

function handleDisconnect() {
  abortController.value?.abort()
  abortController.value = null
  agentCard.value = null
  sessionState.value = createSessionState()
  connected.value = false
  taskState.value = ''
  taskId.value = ''
  addEvent('system', '已断开连接')
}

async function handleRemoteSend() {
  if (!agentCard.value || !prompt.value.trim()) return

  const text = prompt.value.trim()
  prompt.value = ''
  addEvent('user', text)

  const card = agentCard.value
  const state = sessionState.value

  // 取消之前的流
  abortController.value?.abort()
  const ac = new AbortController()
  abortController.value = ac

  try {
    const endpoint = card.url
    const rpcId = Date.now()
    const body = {
      jsonrpc: '2.0',
      id: rpcId,
      method: 'SendStreamingMessage',
      params: {
        messages: [
          {
            role: 'user',
            contextId: state.contextId,
            taskId: state.taskId,
            parts: [{ type: 'text', text, mimeType: 'text/plain' }],
          },
        ],
        configuration: {
          acceptedOutputModes: ['application/vnd.a2ui+json', 'text/markdown', 'text/plain', 'application/json'],
        },
      },
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    if (authHeader.value.trim()) {
      headers['Authorization'] = authHeader.value.trim()
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ac.signal,
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)

    // 先标记有内容
    hasContent.value = true
    await nextTick()

    // 直接读取 SSE 流
    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentData = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          // event 行 — 仅记录，实际处理在 data 行
        } else if (line.startsWith('data:')) {
          currentData = line.slice(5).trimStart()
        } else if (line === '' && currentData) {
          processSSEData(currentData, state, card)
          currentData = ''
          await nextTick()
        }
      }
    }

    // 处理缓冲区剩余数据
    if (currentData) {
      processSSEData(currentData, state, card)
    }
    if (buffer.trim()) {
      processSSEData(buffer.trim(), state, card)
    }

    // 流结束后检查终态
    if (state.taskState && !['completed', 'failed', 'canceled', 'rejected'].includes(state.taskState)) {
      addEvent('system', `流在非终态 "${state.taskState}" 下关闭`)
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      addEvent('error', (err as Error).message)
    }
  }
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} -> ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
}

// ─── 统一发送入口 ───

async function handleSend() {
  if (mode.value === 'mock') {
    await handleMockSend()
  } else {
    await handleRemoteSend()
  }
}

// ─── 事件日志 ───

function addEvent(type: string, detail: string, fullJson?: string) {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, type, detail, fullJson })
  if (eventLog.value.length > 100) {
    eventLog.value.length = 100
  }
}

// ─── 键盘快捷键 ───

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSend()
  }
}

// ─── 切换模式时清理状态 ───

function switchMode(next: 'mock' | 'remote') {
  if (mode.value === next) return
  handleDisconnect()
  mode.value = next
}

// ─── 清理 ───

onBeforeUnmount(() => {
  abortController.value?.abort()
})
</script>

<template>
  <div class="a2a-playground">
    <!-- 顶部标题区 -->
    <header class="playground-header">
      <span class="playground-eyebrow">{{ t.eyebrow }}</span>
      <h1 class="playground-title">{{ t.title }}</h1>
      <p class="playground-summary">{{ t.summary }}</p>
    </header>

    <div class="playground-layout">
      <!-- 左侧配置面板 -->
      <aside class="config-panel">
        <h2 class="panel-title">{{ t.configTitle }}</h2>

        <!-- 模式切换 -->
        <div class="mode-switch">
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': mode === 'mock' }"
            type="button"
            @click="switchMode('mock')"
          >
            <span class="mode-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            {{ t.modeMock }}
          </button>
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': mode === 'remote' }"
            type="button"
            @click="switchMode('remote')"
          >
            <span class="mode-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            {{ t.modeRemote }}
          </button>
        </div>
        <p class="mode-desc">{{ mode === 'mock' ? t.modeMockDesc : t.modeRemoteDesc }}</p>

        <!-- 远程模式配置 -->
        <template v-if="mode === 'remote'">
          <div class="field">
            <label class="field-label">{{ t.agentCardUrl }}</label>
            <input
              v-model="agentCardUrl"
              class="field-input"
              :placeholder="t.agentCardUrlPlaceholder"
              type="url"
            />
          </div>

          <div class="field">
            <label class="field-label">{{ t.authHeader }}</label>
            <input
              v-model="authHeader"
              class="field-input"
              :placeholder="t.authHeaderPlaceholder"
              type="password"
            />
          </div>
        </template>

        <div class="field">
          <label class="field-label">{{ t.prompt }}</label>
          <textarea
            v-model="prompt"
            class="field-textarea"
            :placeholder="t.promptPlaceholder"
            rows="3"
            @keydown="handleKeydown"
          />
        </div>

        <label v-if="mode === 'remote'" class="toggle-row">
          <input v-model="streaming" class="toggle-input" type="checkbox" />
          <span class="toggle-switch"></span>
          <span class="toggle-label">{{ t.streaming }}</span>
        </label>

        <!-- 远程模式：连接按钮 -->
        <button
          v-if="mode === 'remote'"
          class="connect-btn"
          :class="{
            'connect-btn--connected': connected,
            'connect-btn--connecting': connecting,
          }"
          :disabled="connecting || !agentCardUrl.trim()"
          type="button"
          @click="handleConnect"
        >
          {{ connecting ? t.connecting : connected ? t.disconnect : t.connect }}
        </button>

        <!-- 发送按钮 -->
        <button
          class="send-btn"
          :disabled="mode === 'remote' ? (!connected || !prompt.trim()) : (mockPlaying || !prompt.trim())"
          type="button"
          @click="handleSend"
        >
          {{ mockPlaying ? '...' : mode === 'mock' ? t.sendMock : t.send }}
        </button>

        <!-- 状态信息 -->
        <div class="status-section">
          <div class="status-row">
            <span class="status-dot" :class="{ 'status-dot--on': mode === 'mock' ? mockPlaying : connected }"></span>
            <span>{{ mode === 'mock' ? (mockPlaying ? '...' : t.modeMock) : (connected ? t.connected : t.disconnected) }}</span>
          </div>
          <div class="status-row">
            <span class="status-key">{{ t.taskState }}:</span>
            <span class="status-value">{{ taskState || t.none }}</span>
          </div>
          <div class="status-row">
            <span class="status-key">{{ t.taskId }}:</span>
            <span class="status-value status-value--mono">{{ taskId || t.none }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <!-- 渲染输出 -->
        <section class="render-section">
          <div class="section-header">
            <h2 class="section-title">{{ t.renderTitle }}</h2>
            <span class="section-caption">{{ t.renderCaption }}</span>
          </div>
          <div class="render-container">
            <A2UIRenderer
              v-if="hasContent"
              ref="rendererRef"
              class="renderer-instance"
              @action="handleAction"
            />
            <div v-else class="render-empty">
              <p>{{ t.eventEmpty }}</p>
            </div>
          </div>
        </section>

        <!-- 底部面板：事件流 + Action 日志 -->
        <div class="bottom-panels">
          <!-- A2A 事件流 -->
          <section class="event-section">
            <div class="event-header">
              <h3 class="sub-title">{{ t.eventTitle }}</h3>
              <button
                class="view-toggle"
                type="button"
                @click="eventViewMode = eventViewMode === 'summary' ? 'full' : 'summary'"
              >
                {{ eventViewMode === 'summary' ? '展开 JSON' : '收起摘要' }}
              </button>
            </div>
            <div class="event-list">
              <div v-if="eventLog.length === 0" class="event-empty">
                {{ t.eventEmpty }}
              </div>
              <div
                v-for="(event, idx) in eventLog"
                :key="idx"
                class="event-item"
                :class="`event-item--${event.type}`"
              >
                <span class="event-time">{{ event.time }}</span>
                <span class="event-type">{{ event.type }}</span>
                <template v-if="eventViewMode === 'full' && event.fullJson">
                  <pre class="event-detail event-detail--json">{{ event.fullJson }}</pre>
                </template>
                <template v-else>
                  <span class="event-detail">{{ event.detail }}</span>
                </template>
              </div>
            </div>
          </section>

          <!-- Action 日志 -->
          <section class="action-section">
            <h3 class="sub-title">{{ t.actionTitle }}</h3>
            <div class="action-list">
              <div v-if="actionLog.length === 0" class="action-empty">
                {{ t.actionEmpty }}
              </div>
              <div v-for="(log, idx) in actionLog" :key="idx" class="action-item">
                {{ log }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.a2a-playground {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* ─── 顶部标题 ─── */

.playground-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.12);
}

.playground-eyebrow {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(122, 92, 255, 0.1);
  color: #6a51d4;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.playground-title {
  margin: 8px 0 4px;
  font-size: 1.5rem;
  font-weight: 800;
}

.playground-summary {
  margin: 0;
  color: #7b748f;
  font-size: 0.92rem;
}

/* ─── 主布局 ─── */

.playground-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ─── 配置面板 ─── */

.config-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  height: fit-content;
}

.panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

/* ─── 模式切换 ─── */

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid rgba(120, 112, 150, 0.2);
  border-radius: 8px;
  background: transparent;
  color: #655f75;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms ease;
}

.mode-btn:hover {
  background: rgba(122, 92, 255, 0.06);
}

.mode-btn--active {
  background: rgba(122, 92, 255, 0.12);
  color: #6a51d4;
  border-color: rgba(122, 92, 255, 0.3);
}

.mode-icon {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
}

.mode-icon svg {
  width: 1rem;
  height: 1rem;
}

.mode-desc {
  margin: -8px 0 0;
  font-size: 0.78rem;
  color: #8d859f;
}

/* ─── 字段 ─── */

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #655f75;
}

.field-input,
.field-textarea {
  padding: 8px 10px;
  border: 1px solid rgba(120, 112, 150, 0.2);
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  color: #17141f;
  outline: none;
  transition: border-color 160ms ease;
}

.field-input:focus,
.field-textarea:focus {
  border-color: rgba(122, 92, 255, 0.5);
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

/* ─── Toggle 开关 ─── */

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: rgba(120, 112, 150, 0.25);
  position: relative;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 200ms ease;
}

.toggle-input:checked + .toggle-switch {
  background: #7a5cff;
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(16px);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
}

/* ─── 按钮 ─── */

.connect-btn,
.send-btn {
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 160ms ease, opacity 160ms ease;
}

.connect-btn {
  background: linear-gradient(135deg, #7a5cff 0%, #4d73ff 100%);
  color: #fff;
}

.connect-btn:hover {
  opacity: 0.9;
}

.connect-btn--connected {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: rgba(122, 92, 255, 0.1);
  color: #6a51d4;
}

.send-btn:hover:not(:disabled) {
  background: rgba(122, 92, 255, 0.18);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── 状态信息 ─── */

.status-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(248, 245, 255, 0.7);
  font-size: 0.82rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.status-dot--on {
  background: #27ae60;
  box-shadow: 0 0 6px rgba(39, 174, 96, 0.4);
}

.status-key {
  color: #8d859f;
}

.status-value {
  color: #17141f;
  font-weight: 600;
}

.status-value--mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
}

/* ─── 内容区 ─── */

.content-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.render-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.section-caption {
  font-size: 0.8rem;
  color: #8d859f;
}

.render-container {
  flex: 1;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 12px;
  background: #fff;
  overflow: auto;
  min-height: 200px;
}

.renderer-instance {
  padding: 16px;
}

.render-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #8d859f;
  font-size: 0.9rem;
}

/* ─── 底部面板 ─── */

.bottom-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex-shrink: 0;
}

.event-section,
.action-section {
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.sub-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.view-toggle {
  padding: 2px 8px;
  border: 1px solid rgba(120, 112, 150, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #6a51d4;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
}

.view-toggle:hover {
  background: rgba(122, 92, 255, 0.08);
}

.event-list,
.action-list {
  flex: 1;
  overflow-y: auto;
  font-size: 0.8rem;
  font-family: 'IBM Plex Mono', monospace;
  line-height: 1.6;
}

.event-empty,
.action-empty {
  color: #8d859f;
  font-family: inherit;
  font-size: 0.82rem;
}

.event-item {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}

.event-time {
  color: #aaa;
  flex-shrink: 0;
}

.event-type {
  font-weight: 700;
  flex-shrink: 0;
  min-width: 50px;
}

.event-item--system .event-type {
  color: #3498db;
}

.event-item--user .event-type {
  color: #7a5cff;
}

.event-item--agent .event-type {
  color: #27ae60;
}

.event-item--error .event-type {
  color: #e74c3c;
}

.event-detail {
  color: #555;
  word-break: break-all;
}

.event-detail--json {
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(248, 245, 255, 0.7);
  font-size: 0.72rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 160px;
  overflow-y: auto;
}

.action-item {
  padding: 2px 0;
  color: #555;
  word-break: break-all;
}

@media (max-width: 920px) {
  .playground-layout {
    grid-template-columns: 1fr;
  }

  .bottom-panels {
    grid-template-columns: 1fr;
  }
}
</style>
