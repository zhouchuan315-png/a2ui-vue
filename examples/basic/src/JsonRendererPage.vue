<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { A2UIRenderer } from '@a2ui/vue'
import type { ActionMessage, A2UIServerMessage } from '@a2ui/vue-core'
import { appMessages, type Locale } from './i18n'
import { registrationForm } from './mock-data'

type RenderStatus = 'waiting' | 'ready' | 'error'

type A2UIRendererExposed = InstanceType<typeof A2UIRenderer> & {
  processMessage: (message: A2UIServerMessage) => void
  reset: () => void
}

const props = withDefaults(defineProps<{
  locale?: Locale
}>(), {
  locale: 'zh',
})

const rendererRef = ref<A2UIRendererExposed | null>(null)
const jsonInput = ref(JSON.stringify(registrationForm, null, 2))
const renderedMessages = ref<A2UIServerMessage[]>([])
const actionLog = ref<string[]>([])
const parseError = ref<string | null>(null)
const renderStatus = ref<RenderStatus>('waiting')

const t = computed(() => appMessages[props.locale].jsonRenderer)
const lineCount = computed(() => jsonInput.value.split(/\r?\n/).length)
const messageCount = computed(() => renderedMessages.value.length)
const componentCount = computed(() =>
  renderedMessages.value.reduce(
    (count, message) => count + (message.updateComponents?.components.length ?? 0),
    0,
  ),
)
const parsedJsonLines = computed(() => {
  if (!renderedMessages.value.length) return []
  return JSON.stringify(renderedMessages.value, null, 2).split('\n')
})
const statusLabel = computed(() => {
  if (renderStatus.value === 'ready') return t.value.statusReady
  if (renderStatus.value === 'error') return t.value.statusError
  return t.value.statusWaiting
})

async function renderInput() {
  const renderer = rendererRef.value
  if (!renderer) return

  parseError.value = null
  actionLog.value = []

  try {
    const messages = parseMessages(jsonInput.value)
    renderer.reset()
    renderedMessages.value = []
    await nextTick()

    for (const message of messages) {
      renderer.processMessage(message)
    }

    renderedMessages.value = messages
    renderStatus.value = 'ready'
  } catch (error) {
    renderer.reset()
    renderedMessages.value = []
    parseError.value = error instanceof Error ? error.message : String(error)
    renderStatus.value = 'error'
  }
}

function loadSample() {
  jsonInput.value = JSON.stringify(registrationForm, null, 2)
  void renderInput()
}

function clearInput() {
  jsonInput.value = ''
  actionLog.value = []
  parseError.value = null
  renderedMessages.value = []
  renderStatus.value = 'waiting'
  rendererRef.value?.reset()
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} -> ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
}

function parseMessages(rawInput: string): A2UIServerMessage[] {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    throw new Error(t.value.emptyInput)
  }

  try {
    return normalizeParsedValue(JSON.parse(trimmed))
  } catch (jsonError) {
    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim())

    try {
      return normalizeParsedValue(lines.map((line) => JSON.parse(line)))
    } catch (jsonlError) {
      const message = jsonlError instanceof Error
        ? jsonlError.message
        : jsonError instanceof Error
          ? jsonError.message
          : String(jsonlError)
      throw new Error(t.value.jsonlFailed(message))
    }
  }
}

function normalizeParsedValue(value: unknown): A2UIServerMessage[] {
  const candidate = extractMessageCandidate(value)
  if (!candidate) {
    throw new Error(t.value.invalidRoot)
  }

  return candidate.map((message, index) => {
    if (!isA2UIServerMessage(message)) {
      throw new Error(t.value.invalidMessage(index))
    }
    return message
  })
}

function extractMessageCandidate(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value

  if (isRecord(value)) {
    if (Array.isArray(value.messages)) return value.messages
    if (isA2UIServerMessage(value)) return [value]
  }

  return null
}

function isA2UIServerMessage(value: unknown): value is A2UIServerMessage {
  if (!isRecord(value)) return false
  return ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'].some((key) => key in value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

onMounted(() => {
  void renderInput()
})

watch(
  () => props.locale,
  () => {
    if (parseError.value) {
      void renderInput()
    }
  },
)
</script>

<template>
  <div class="json-page">
    <header class="json-header">
      <div>
        <p class="eyebrow">{{ t.eyebrow }}</p>
        <h1>{{ t.title }}</h1>
        <p class="json-summary">{{ t.summary }}</p>
      </div>
      <div class="status-pill" :class="`status-pill--${renderStatus}`">
        {{ statusLabel }}
      </div>
    </header>

    <section class="json-layout">
      <section class="panel editor-panel">
        <div class="panel-header panel-header--split">
          <div>
            <p class="panel-title">{{ t.editorTitle }}</p>
            <p class="panel-caption">{{ t.editorCaption }}</p>
          </div>
          <div class="button-row">
            <button class="tool-button" type="button" @click="loadSample">
              {{ t.loadSample }}
            </button>
            <button class="tool-button" type="button" @click="clearInput">
              {{ t.clear }}
            </button>
            <button class="tool-button tool-button--primary" type="button" @click="renderInput">
              {{ t.render }}
            </button>
          </div>
        </div>

        <textarea
          v-model="jsonInput"
          class="json-editor"
          spellcheck="false"
          @keydown.meta.enter.prevent="renderInput"
          @keydown.ctrl.enter.prevent="renderInput"
        />

        <div class="editor-meta">
          <span>{{ lineCount }} {{ t.lines }}</span>
          <span>{{ messageCount }} {{ t.messages }}</span>
          <span>{{ componentCount }} {{ t.components }}</span>
        </div>

        <p v-if="parseError" class="error-message">
          {{ parseError }}
        </p>
      </section>

      <section class="panel preview-panel">
        <div class="panel-header panel-header--split">
          <div>
            <p class="panel-title">{{ t.previewTitle }}</p>
            <p class="panel-caption">{{ t.previewCaption }}</p>
          </div>
          <div class="stats-row">
            <span>{{ messageCount }} {{ t.messages }}</span>
            <span>{{ componentCount }} {{ t.components }}</span>
          </div>
        </div>

        <div class="preview-frame">
          <A2UIRenderer ref="rendererRef" @action="handleAction" />
        </div>
      </section>

      <section class="panel config-panel">
        <div class="panel-header">
          <p class="panel-title">{{ t.configTitle }}</p>
          <p class="panel-caption">{{ t.configCaption }}</p>
        </div>

        <div v-if="parsedJsonLines.length" class="code-view">
          <div
            v-for="(line, index) in parsedJsonLines"
            :key="index"
            class="code-line"
          >
            <span class="code-line-number">{{ index + 1 }}</span>
            <code class="code-line-text">{{ line || ' ' }}</code>
          </div>
        </div>

        <p v-else class="empty-state">{{ t.statusWaiting }}</p>
      </section>

      <section class="panel action-panel">
        <div class="panel-header panel-header--split">
          <div>
            <p class="panel-title">{{ t.actionStream }}</p>
          </div>
          <span class="action-count">{{ actionLog.length }}</span>
        </div>

        <div v-if="actionLog.length" class="action-log">
          <div v-for="entry in actionLog" :key="entry" class="action-entry">
            {{ entry }}
          </div>
        </div>

        <p v-else class="action-empty">{{ t.actionEmpty }}</p>
      </section>
    </section>
  </div>
</template>

<style scoped>
.json-page {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.json-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.eyebrow {
  margin: 0 0 8px;
  color: #7a5cff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.json-header h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
  line-height: 1.02;
}

.json-summary {
  max-width: 58rem;
  margin: 10px 0 0;
  color: #6d667f;
  font-size: 1.02rem;
  line-height: 1.55;
}

.status-pill,
.stats-row span,
.action-count {
  min-height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
  color: #6d5efc;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill--ready {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.status-pill--error {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

.json-layout {
  display: grid;
  grid-template-columns: minmax(390px, 0.92fr) minmax(0, 1.08fr);
  gap: 12px;
  min-height: 0;
}

.panel {
  overflow: hidden;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(57, 45, 101, 0.06);
}

.panel-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.panel-header--split {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.panel-title {
  margin: 0;
  color: #1e1930;
  font-size: 1.1rem;
  font-weight: 700;
}

.panel-caption {
  margin: 6px 0 0;
  color: #7f7890;
  font-size: 0.92rem;
  line-height: 1.5;
}

.button-row,
.stats-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tool-button {
  min-height: 2rem;
  padding: 0 12px;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 10px;
  background: #ffffff;
  color: #4f495f;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.tool-button:hover {
  border-color: rgba(122, 92, 255, 0.34);
  color: #2f2840;
  box-shadow: 0 8px 18px rgba(74, 58, 120, 0.08);
}

.tool-button--primary {
  border-color: transparent;
  background: #6d5efc;
  color: #ffffff;
}

.tool-button--primary:hover {
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(109, 94, 252, 0.2);
}

.editor-panel,
.config-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  min-height: 560px;
}

.json-editor {
  width: 100%;
  min-width: 0;
  min-height: 0;
  resize: none;
  border: 0;
  outline: none;
  padding: 16px 18px;
  background:
    linear-gradient(180deg, rgba(252, 251, 255, 0.98) 0%, rgba(248, 246, 254, 0.98) 100%);
  color: #2f2840;
  font: 0.9rem/1.65 "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  tab-size: 2;
}

.editor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 18px;
  border-top: 1px solid rgba(120, 112, 150, 0.14);
  color: #7c758e;
  font-size: 0.82rem;
  font-weight: 700;
}

.editor-meta span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
}

.error-message {
  margin: 0;
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(239, 68, 68, 0.16);
  background: rgba(254, 242, 242, 0.8);
  color: #b91c1c;
  font-size: 0.9rem;
  line-height: 1.5;
}

.preview-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 560px;
}

.preview-frame {
  min-height: 0;
  padding: 14px;
  overflow: auto;
  background:
    radial-gradient(circle at top left, rgba(109, 94, 252, 0.08), transparent 18rem),
    linear-gradient(180deg, rgba(248, 246, 253, 0.92) 0%, rgba(243, 240, 249, 0.72) 100%);
}

.config-panel,
.action-panel {
  grid-column: 1 / -1;
}

.config-panel {
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 300px;
}

.code-view {
  min-height: 0;
  max-height: 360px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(252, 251, 255, 0.98) 0%, rgba(248, 246, 254, 0.98) 100%);
  font-family: "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  font-size: 0.86rem;
  line-height: 1.65;
}

.code-line {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  min-height: 1.7rem;
}

.code-line-number {
  display: inline-flex;
  justify-content: flex-end;
  padding: 0 14px 0 10px;
  color: #9a93ae;
  border-right: 1px solid rgba(120, 112, 150, 0.12);
  user-select: none;
  background: rgba(245, 242, 252, 0.8);
}

.code-line-text {
  display: block;
  padding: 0 16px;
  color: #2f2840;
  white-space: pre;
}

.empty-state,
.action-empty {
  margin: 0;
  padding: 18px;
  color: #756f87;
  line-height: 1.6;
}

.action-log {
  max-height: 180px;
  overflow: auto;
  padding: 14px 18px 18px;
  display: grid;
  gap: 8px;
  font-family: "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  font-size: 0.84rem;
}

.action-entry {
  padding: 10px 12px;
  border-radius: 12px;
  background: #faf8ff;
  color: #423d54;
  line-height: 1.55;
}

@media (max-width: 1180px) {
  .json-layout {
    grid-template-columns: 1fr;
  }

  .editor-panel,
  .preview-panel {
    min-height: 460px;
  }
}

@media (max-width: 700px) {
  .json-header,
  .panel-header--split {
    flex-direction: column;
  }

  .button-row {
    justify-content: flex-start;
  }

  .code-line {
    grid-template-columns: 42px minmax(0, 1fr);
  }
}
</style>
