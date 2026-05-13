<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { A2UIRenderer } from '@nine1ie/a2ui-vue'
import type { ActionMessage, A2UIServerMessage } from '@nine1ie/a2ui-vue-core'
import { appMessages, type Locale } from './i18n'
import { restaurantFinderStream } from './restaurant-mock-data'

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
const actionLog = ref<string[]>([])
const t = computed(() => appMessages[props.locale].restaurantFinder)

const messages = restaurantFinderStream
const totalMessages = messages.length
const currentStep = ref(0)
const isPlaying = ref(false)
const playbackSpeed = ref(1)
let playTimer: ReturnType<typeof setInterval> | null = null

const streamedMessages = computed(() => messages.slice(0, currentStep.value))

const streamedJson = computed(() =>
  streamedMessages.value.map((msg) => JSON.stringify(msg, null, 2)).join('\n'),
)

const streamedLines = computed(() => streamedJson.value.split('\n'))

const dataSize = computed(() => {
  const bytes = new Blob([streamedJson.value]).size
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
})

function stopPlayback() {
  if (playTimer !== null) {
    clearInterval(playTimer)
    playTimer = null
  }
  isPlaying.value = false
}

function resetAndReplay(toStep: number) {
  const renderer = rendererRef.value
  if (!renderer) return
  renderer.reset()
  for (let i = 0; i < toStep; i++) {
    renderer.processMessage(messages[i])
  }
}

watch(currentStep, (newStep, oldStep) => {
  if (newStep === oldStep) return
  if (newStep > oldStep && newStep === oldStep + 1) {
    const renderer = rendererRef.value
    if (renderer) renderer.processMessage(messages[newStep - 1])
  } else {
    resetAndReplay(newStep)
  }
})

function stepForward() {
  if (currentStep.value >= totalMessages) return
  currentStep.value++
}

function stepBackward() {
  if (currentStep.value <= 0) return
  stopPlayback()
  currentStep.value = 0
}

function startPlayback() {
  if (isPlaying.value) {
    stopPlayback()
    return
  }

  if (currentStep.value >= totalMessages) {
    currentStep.value = 0
  }

  isPlaying.value = true
  const interval = Math.max(80, 600 / playbackSpeed.value)

  playTimer = setInterval(() => {
    if (currentStep.value >= totalMessages) {
      stopPlayback()
      return
    }
    currentStep.value++
  }, interval)
}

function setSpeed(speed: number) {
  playbackSpeed.value = speed
  if (isPlaying.value) {
    stopPlayback()
    startPlayback()
  }
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} -> ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
}

onMounted(() => {
  currentStep.value = 0
})

onBeforeUnmount(() => {
  stopPlayback()
})
</script>

<template>
  <div class="restaurant-page">
    <header class="restaurant-header">
      <div>
        <p class="eyebrow">{{ t.eyebrow }}</p>
        <h1>{{ t.title }}</h1>
        <p class="restaurant-summary">{{ t.summary }}</p>
      </div>
    </header>

    <section class="restaurant-layout">
      <!-- Left: JSONL Stream Viewer -->
      <section class="panel stream-panel">
        <div class="panel-header panel-header--split">
          <div>
            <p class="panel-title">{{ t.streamTitle }}</p>
          </div>
          <div class="stream-stats">
            <span class="stat-pill">{{ currentStep }} / {{ totalMessages }}</span>
            <span class="stat-pill">{{ dataSize }}</span>
          </div>
        </div>

        <div class="stream-controls">
          <button class="control-btn" type="button" @click="stepBackward" :disabled="currentStep === 0">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="control-btn control-btn--primary" type="button" @click="startPlayback">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button class="control-btn" type="button" @click="stepForward" :disabled="currentStep >= totalMessages">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M19 12l-7-7M19 12l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="speed-controls">
            <button
              v-for="speed in [1, 2, 4]"
              :key="speed"
              class="speed-btn"
              :class="{ 'speed-btn--active': playbackSpeed === speed }"
              type="button"
              @click="setSpeed(speed)"
            >
              {{ speed }}x
            </button>
          </div>

          <input
            v-model.number="currentStep"
            type="range"
            class="step-slider"
            :min="0"
            :max="totalMessages"
          />
        </div>

        <div class="stream-view">
          <div
            v-for="(line, index) in streamedLines"
            :key="index"
            class="stream-line"
          >
            <span class="stream-line-number">{{ index + 1 }}</span>
            <code class="stream-line-text">{{ line || ' ' }}</code>
          </div>
        </div>
      </section>

      <!-- Right: Rendered Output -->
      <section class="panel render-panel">
        <div class="panel-header panel-header--split">
          <div>
            <p class="panel-title">{{ t.renderTitle }}</p>
            <p class="panel-caption">{{ t.renderCaption }}</p>
          </div>
          <span class="stat-pill stat-pill--active">{{ t.liveLabel }}</span>
        </div>

        <div class="render-frame">
          <A2UIRenderer ref="rendererRef" @action="handleAction" />
        </div>
      </section>
    </section>

    <!-- Action Log -->
    <section v-if="actionLog.length" class="panel action-panel">
      <div class="panel-header panel-header--split">
        <div>
          <p class="panel-title">{{ t.actionStream }}</p>
        </div>
        <span class="action-count">{{ actionLog.length }}</span>
      </div>

      <div class="action-log">
        <div v-for="entry in actionLog" :key="entry" class="action-entry">
          {{ entry }}
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.restaurant-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 16px;
}

.restaurant-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.eyebrow {
  margin: 0 0 8px;
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.restaurant-header h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
  line-height: 1.02;
}

.restaurant-summary {
  max-width: 58rem;
  margin: 10px 0 0;
  color: #6d667f;
  font-size: 1.02rem;
  line-height: 1.55;
}

.restaurant-layout {
  display: grid;
  grid-template-columns: minmax(380px, 0.85fr) minmax(0, 1.15fr);
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

.stream-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat-pill {
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

.stat-pill--active {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.stream-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
  background: rgba(250, 248, 255, 0.65);
}

.control-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 10px;
  background: #ffffff;
  color: #4f495f;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.control-btn:hover:not(:disabled) {
  border-color: rgba(122, 92, 255, 0.34);
  color: #2f2840;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn svg {
  width: 1rem;
  height: 1rem;
}

.control-btn--primary {
  border-color: transparent;
  background: #dc2626;
  color: #ffffff;
}

.control-btn--primary:hover:not(:disabled) {
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25);
}

.speed-controls {
  display: flex;
  gap: 2px;
  margin-left: 4px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
}

.speed-btn {
  min-height: 1.6rem;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #6d667f;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.speed-btn--active {
  background: #ffffff;
  color: #372f4c;
  box-shadow: 0 2px 8px rgba(66, 50, 110, 0.08);
}

.step-slider {
  flex: 1;
  min-width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(109, 94, 252, 0.15);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.step-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #dc2626;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
}

.step-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #dc2626;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
}

.stream-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 560px;
}

.stream-view {
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
  background:
    linear-gradient(180deg, rgba(252, 251, 255, 0.98) 0%, rgba(248, 246, 254, 0.98) 100%);
  font-family: "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  font-size: 0.82rem;
  line-height: 1.65;
}

.stream-line {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  min-height: 1.6rem;
}

.stream-line-number {
  display: inline-flex;
  justify-content: flex-end;
  padding: 0 12px 0 8px;
  color: #a39ab8;
  border-right: 1px solid rgba(120, 112, 150, 0.12);
  user-select: none;
  background: rgba(245, 242, 252, 0.8);
}

.stream-line-text {
  display: block;
  padding: 0 14px;
  color: #2f2840;
  white-space: pre;
}

.render-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 560px;
}

.render-frame {
  min-height: 0;
  padding: 14px;
  overflow: auto;
  background:
    radial-gradient(circle at top left, rgba(220, 38, 38, 0.06), transparent 18rem),
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.04), transparent 14rem),
    linear-gradient(180deg, rgba(248, 246, 253, 0.92) 0%, rgba(243, 240, 249, 0.72) 100%);
}

.action-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.action-count {
  min-width: 1.8rem;
  height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f4f1fb;
  color: #6d5efc;
  font-size: 0.82rem;
  font-weight: 700;
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
  .restaurant-layout {
    grid-template-columns: 1fr;
  }

  .stream-panel,
  .render-panel {
    min-height: 460px;
  }
}

@media (max-width: 700px) {
  .restaurant-header,
  .panel-header--split {
    flex-direction: column;
  }

  .stream-controls {
    flex-wrap: wrap;
  }

  .stream-line {
    grid-template-columns: 36px minmax(0, 1fr);
  }
}
</style>
