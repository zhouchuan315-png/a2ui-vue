<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { A2UIRenderer } from '@nine1ie/a2ui-vue'
import type { ActionMessage, A2UIServerMessage } from '@nine1ie/a2ui-vue-core'
import { appMessages, type Locale } from './i18n'
import { registrationForm, taskList, agentDashboard, componentLab, controlSuite, mediaGallery } from './mock-data'

type CompositionKey = 'registration' | 'tasks' | 'dashboard' | 'showcase' | 'controls' | 'media'
type ConfigTab = 'surface' | 'components' | 'dataModel' | 'messages'

type A2UIRendererExposed = InstanceType<typeof A2UIRenderer> & {
  processMessage: (message: A2UIServerMessage) => void
  reset: () => void
}

interface CompositionDefinition {
  messages: A2UIServerMessage[]
}

const props = withDefaults(defineProps<{
  locale?: Locale
}>(), {
  locale: 'zh',
})

const iconPaths: Record<string, string[]> = {
  registration: ['M5 6.5h14v11H5z', 'M8 10h8M8 14h5'],
  tasks: ['M6 7h12M6 12h12M6 17h12', 'M4 7h.01M4 12h.01M4 17h.01'],
  dashboard: ['M4.5 6.5h15v11h-15z', 'M8 10h3M14 10h2M8 14h8'],
  showcase: ['M5.5 6.5h5v5h-5zM13.5 6.5h5v5h-5zM5.5 13.5h5v5h-5zM13.5 13.5h5v5h-5z'],
  controls: ['M4 8h16M4 16h16', 'M9 8a1.75 1.75 0 1 0 0 .01M15 16a1.75 1.75 0 1 0 0 .01'],
  media: ['M5 6.5h14v11H5z', 'M9 10l3 2-3 2z', 'M15.5 9.5h.01M15.5 14.5h.01'],
}

const rendererRef = ref<A2UIRendererExposed | null>(null)
const activeComposition = ref<CompositionKey>('registration')
const activeConfigTab = ref<ConfigTab>('surface')
const actionLog = ref<string[]>([])
const t = computed(() => appMessages[props.locale])

const compositions: Record<CompositionKey, CompositionDefinition> = {
  registration: { messages: registrationForm },
  tasks: { messages: taskList },
  dashboard: { messages: agentDashboard },
  showcase: { messages: componentLab },
  controls: { messages: controlSuite },
  media: { messages: mediaGallery },
}

const compositionEntries = computed(() =>
  Object.entries(compositions) as [CompositionKey, CompositionDefinition][],
)

const currentComposition = computed(() => compositions[activeComposition.value])
const currentCreateSurface = computed(() =>
  currentComposition.value.messages.find((message) => message.createSurface)?.createSurface ?? {},
)
const currentComponents = computed(() =>
  currentComposition.value.messages.find((message) => message.updateComponents)?.updateComponents?.components ?? [],
)
const currentDataModel = computed(() =>
  currentComposition.value.messages.find((message) => message.updateDataModel)?.updateDataModel?.value ?? {},
)

const configTabs = computed<{ id: ConfigTab; label: string; value: unknown }[]>(() => [
  { id: 'surface', label: t.value.composition.configTabs.surface, value: currentCreateSurface.value },
  { id: 'components', label: t.value.composition.configTabs.components, value: currentComponents.value },
  { id: 'dataModel', label: t.value.composition.configTabs.dataModel, value: currentDataModel.value },
  { id: 'messages', label: t.value.composition.configTabs.messages, value: currentComposition.value.messages },
])

const activeConfig = computed(() =>
  configTabs.value.find((tab) => tab.id === activeConfigTab.value) ?? configTabs.value[0],
)
const configLines = computed(() => JSON.stringify(activeConfig.value.value, null, 2).split('\n'))
const componentCount = computed(() => currentComponents.value.length)
const hasDataModel = computed(() => Object.keys(currentDataModel.value as Record<string, unknown>).length > 0)

async function renderComposition() {
  const renderer = rendererRef.value
  if (!renderer) return

  renderer.reset()
  await nextTick()
  for (const message of currentComposition.value.messages) {
    renderer.processMessage(message)
  }
}

function selectComposition(key: CompositionKey) {
  if (activeComposition.value === key) return
  activeComposition.value = key
  activeConfigTab.value = 'surface'
  actionLog.value = []
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} -> ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
}

watch(activeComposition, () => {
  void renderComposition()
})

onMounted(() => {
  void renderComposition()
})
</script>

<template>
  <div class="composition-page">
    <header class="composition-header">
      <div>
        <p class="eyebrow">{{ t.composition.eyebrow }}</p>
        <h1>{{ t.composition.title }}</h1>
        <p class="composition-summary">{{ t.composition.summary }}</p>
      </div>

      <a href="https://a2ui-composer.ag-ui.com/" target="_blank" rel="noreferrer">
        {{ t.composition.guide }}
      </a>
    </header>

    <section class="composition-layout">
      <aside class="composition-list panel">
        <div class="panel-header">
          <p class="panel-title">{{ t.composition.listTitle }}</p>
          <p class="panel-caption">{{ t.composition.listCaption }}</p>
        </div>

        <div class="composition-items">
          <button
            v-for="[key] in compositionEntries"
            :key="key"
            class="composition-item"
            :class="{ 'composition-item--active': activeComposition === key }"
            type="button"
            @click="selectComposition(key)"
          >
            <span class="composition-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  v-for="path in iconPaths[key]"
                  :key="path"
                  :d="path"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="composition-item-main">
              <strong>{{ t.demos[key].label }}</strong>
              <span>{{ t.demos[key].summary }}</span>
            </span>
          </button>
        </div>
      </aside>

      <section class="composition-main">
        <section class="panel preview-panel">
          <div class="panel-header panel-header--split">
            <div>
              <p class="panel-title">{{ t.composition.previewTitle }}</p>
              <p class="panel-caption">{{ t.composition.previewCaption }}</p>
            </div>
            <div class="stats-row">
              <span>{{ componentCount }} {{ t.composition.stats.components }}</span>
              <span>{{ hasDataModel ? t.composition.stats.data : '-' }}</span>
            </div>
          </div>

          <div class="preview-frame">
            <A2UIRenderer ref="rendererRef" @action="handleAction" />
          </div>
        </section>

        <aside class="panel config-panel">
          <div class="panel-header">
            <p class="panel-title">{{ t.composition.configTitle }}</p>
            <p class="panel-caption">{{ t.composition.configCaption }}</p>
          </div>

          <div class="tab-row">
            <button
              v-for="tab in configTabs"
              :key="tab.id"
              class="tab-button"
              :class="{ 'tab-button--active': activeConfigTab === tab.id }"
              type="button"
              @click="activeConfigTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="code-view">
            <div
              v-for="(line, index) in configLines"
              :key="`${activeConfig.id}-${index}`"
              class="code-line"
            >
              <span class="code-line-number">{{ index + 1 }}</span>
              <code class="code-line-text">{{ line || ' ' }}</code>
            </div>
          </div>
        </aside>

        <section class="panel action-panel">
          <div class="panel-header panel-header--split">
            <div>
              <p class="panel-title">{{ t.composition.actionStream }}</p>
            </div>
            <span class="action-count">{{ actionLog.length }}</span>
          </div>

          <div v-if="actionLog.length" class="action-log">
            <div v-for="entry in actionLog" :key="entry" class="action-entry">
              {{ entry }}
            </div>
          </div>

          <p v-else class="action-empty">{{ t.composition.actionEmpty }}</p>
        </section>
      </section>
    </section>
  </div>
</template>

<style scoped>
.composition-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 16px;
}

.composition-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.composition-header a {
  align-self: flex-start;
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(52, 47, 68, 0.18);
  color: #342f44;
  font-size: 0.95rem;
}

.eyebrow {
  margin: 0 0 8px;
  color: #7a5cff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.composition-header h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
  line-height: 1.02;
}

.composition-summary {
  max-width: 58rem;
  margin: 10px 0 0;
  color: #6d667f;
  font-size: 1.02rem;
  line-height: 1.55;
}

.composition-layout {
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
}

.composition-main {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
  gap: 12px;
  min-width: 0;
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

.composition-items {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.composition-item {
  width: 100%;
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #5d586d;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.composition-item:hover {
  color: #1f1b2d;
  background: rgba(250, 248, 255, 0.9);
}

.composition-item--active {
  color: #1f1b2d;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 1px rgba(122, 92, 255, 0.12),
    0 10px 24px rgba(74, 58, 120, 0.06);
  transform: translateX(2px);
}

.composition-icon {
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
  color: #7d7599;
  background: rgba(109, 94, 252, 0.08);
}

.composition-icon svg {
  width: 1.1rem;
  height: 1.1rem;
}

.composition-item-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.composition-item-main strong {
  color: inherit;
  font-size: 0.96rem;
}

.composition-item-main span {
  color: #817a91;
  font-size: 0.84rem;
  line-height: 1.45;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

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

.preview-frame {
  min-height: 560px;
  padding: 14px;
  background:
    radial-gradient(circle at top left, rgba(109, 94, 252, 0.08), transparent 18rem),
    linear-gradient(180deg, rgba(248, 246, 253, 0.92) 0%, rgba(243, 240, 249, 0.72) 100%);
}

.config-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 560px;
}

.tab-row {
  display: flex;
  gap: 2px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
  background: rgba(250, 248, 255, 0.65);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.tab-row::-webkit-scrollbar {
  display: none;
}

.tab-button {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6d667f;
  padding: 14px 12px 12px;
  font: inherit;
  cursor: pointer;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
  white-space: nowrap;
  line-height: 1.2;
}

.tab-button--active {
  color: #17141f;
  border-bottom-color: #7a5cff;
}

.code-view {
  min-height: 0;
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
  white-space: pre;
  color: #2f2840;
}

.action-panel {
  grid-column: 1 / -1;
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

.action-empty {
  margin: 0;
  padding: 18px;
  color: #756f87;
  line-height: 1.6;
}

@media (max-width: 1240px) {
  .composition-layout,
  .composition-main {
    grid-template-columns: 1fr;
  }

  .preview-frame,
  .config-panel {
    min-height: 460px;
  }
}

@media (max-width: 700px) {
  .composition-header,
  .panel-header--split {
    flex-direction: column;
  }

  .preview-frame {
    padding: 12px;
  }

  .code-line {
    grid-template-columns: 42px minmax(0, 1fr);
  }
}
</style>
