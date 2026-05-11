<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { A2UIRenderer } from '@a2ui/vue'
import type { ActionMessage, A2UIServerMessage } from '@a2ui/vue-core'
import { basicCatalogAdvancedExamples, basicCatalogEntries, basicCatalogGroups, basicCatalogMeta, basicCatalogSectionMeta, type BasicCatalogSection } from './basic-catalog'
import { catalogMessages, type Locale } from './i18n'

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
const activeEntryId = ref(basicCatalogEntries[0]?.id ?? '')
const previewMode = ref<'minimal' | 'advanced'>('minimal')
const searchQuery = ref('')
const activeSectionFilter = ref<'all' | BasicCatalogSection>('all')
const actionLog = ref<string[]>([])
const copyState = ref<'idle' | 'done' | 'error'>('idle')
const copyLinkState = ref<'idle' | 'done' | 'error'>('idle')
const sectionMeta = basicCatalogSectionMeta
const t = computed(() => catalogMessages[props.locale])

const iconPaths: Record<string, string[]> = {
  layout: ['M3 5.5h18M3 12h18M3 18.5h18', 'M7 4v16'],
  content: ['M5 6h14M5 12h10M5 18h14'],
  input: ['M4.5 7.5h15v9h-15z', 'M8 12h8'],
  navigation: ['M5 12h14', 'M13 6l6 6-6 6'],
  decoration: ['M4 12h16'],
  row: ['M4 7h4v10H4zM10 10h4v4h-4zM16 7h4v10h-4z'],
  column: ['M7 4h10v4H7zM10 10h4v4h-4zM7 16h10v4H7z'],
  list: ['M6 7h12M6 12h12M6 17h12', 'M4 7h.01M4 12h.01M4 17h.01'],
  card: ['M4.5 6.5h15v11h-15z', 'M7.5 10h9M7.5 14h6'],
  text: ['M5 7h14M9 7v10M15 7v10'],
  image: ['M5 6.5h14v11H5z', 'M8 14l2.5-2.5 2.5 2.5 3.5-4 2.5 4.5', 'M9 9h.01'],
  icon: ['M12 4l2.35 4.76L19.5 9.5l-3.75 3.65.89 5.35L12 16.1 7.36 18.5l.89-5.35L4.5 9.5l5.15-.74z'],
  video: ['M4.5 7.5h11v9h-11z', 'M11 10l3 2-3 2z', 'M16.5 9.5l3-2v9l-3-2'],
  audio: ['M6.5 10.5h3l4-3v9l-4-3h-3z', 'M16 9.5c1 1 1.5 1.7 1.5 2.5S17 13.5 16 14.5', 'M17.8 7.8c1.5 1.3 2.2 2.7 2.2 4.2s-.7 2.9-2.2 4.2'],
  textField: ['M4.5 7.5h15v9h-15z', 'M7.5 12h6'],
  checkbox: ['M5.5 6.5h13v11h-13z', 'M8.5 12l2 2 4.5-4.5'],
  slider: ['M4 8h16M4 16h16', 'M9 8a1.75 1.75 0 1 0 0 .01M15 16a1.75 1.75 0 1 0 0 .01'],
  datetime: ['M6.5 5.5h11v13h-11z', 'M6.5 9.5h11', 'M9 4.5v2M15 4.5v2'],
  choice: ['M5 8h6M5 16h6M14 8h5M14 16h5', 'M12 5.5v13'],
  button: ['M5 8h14v8H5z', 'M9 12h6'],
  tabs: ['M4.5 8.5h15v8h-15z', 'M5.5 8.5v-2h4v2M10.5 8.5v-2h4v2'],
  modal: ['M5 6h14v12H5z', 'M8 9h8M8 13h5'],
  divider: ['M4 12h6M14 12h6'],
  create: ['M12 5v14', 'M5 12h14'],
  gallery: ['M5.5 6.5h5v5h-5zM13.5 6.5h5v5h-5zM5.5 13.5h5v5h-5zM13.5 13.5h5v5h-5z'],
  basic: ['M6 5.5h12v13H6z', 'M9 9h6M9 13h6'],
  custom: ['M6 6h5v5H6zM13 6h5v5h-5zM9.5 13h5v5h-5z'],
  workspace: ['M4.5 6.5h15v11h-15z', 'M4.5 10.5h15', 'M10.5 10.5v7'],
}

const currentEntry = computed(
  () => basicCatalogEntries.find((entry) => entry.id === activeEntryId.value) ?? basicCatalogEntries[0],
)

const currentScenario = computed(() =>
  previewMode.value === 'advanced'
    ? basicCatalogAdvancedExamples[currentEntry.value?.id ?? 'row']
    : {
        label: t.value.hero.minimalLabel,
        summary: t.value.hero.minimalSummary,
        usage: currentEntry.value?.usage ?? {},
        messages: currentEntry.value?.messages ?? [],
      },
)
const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase())
const filteredEntries = computed(() =>
  basicCatalogEntries.filter((entry) => {
    const matchesSection = activeSectionFilter.value === 'all' || entry.section === activeSectionFilter.value
    if (!matchesSection) return false

    if (!normalizedSearchQuery.value) return true

    const haystack = [
      entry.label,
      entry.title,
      entry.section,
      t.value.meta.section(entry.section),
      entry.description,
      basicCatalogMeta[entry.id]?.status,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearchQuery.value)
  }),
)
const filteredGroups = computed(() =>
  basicCatalogGroups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) =>
        filteredEntries.value.some((candidate) => candidate.id === entry.id),
      ),
    }))
    .filter((group) => group.entries.length > 0),
)
const filteredCount = computed(() => filteredEntries.value.length)

const usageText = computed(() => JSON.stringify(currentScenario.value?.usage ?? {}, null, 2))

const usageLines = computed(() => usageText.value.split('\n'))
const totalEntries = basicCatalogEntries.length
const currentEntryIndex = computed(() =>
  Math.max(0, basicCatalogEntries.findIndex((entry) => entry.id === currentEntry.value?.id)),
)
const entryPositionLabel = computed(() => `${currentEntryIndex.value + 1}/${totalEntries}`)
const currentGroupSize = computed(() =>
  basicCatalogGroups.find((group) => group.section === currentEntry.value?.section)?.entries.length ?? 0,
)
const currentMeta = computed(() => basicCatalogMeta[currentEntry.value?.id ?? 'row'])
const previewMeta = computed(() => [
  t.value.meta.section(currentEntry.value?.section ?? ''),
  t.value.meta.props(currentEntry.value?.props.length ?? 0),
  currentScenario.value.messages.some((message) => Boolean(message.updateDataModel?.value))
    ? t.value.meta.boundData
    : t.value.meta.staticExample,
])

function getHashState(hash: string): {
  entryId: string | null
  view: 'minimal' | 'advanced' | null
  section: 'all' | BasicCatalogSection | null
  q: string
} {
  const match = hash.match(/catalog=([^&]+)/)
  const decoded = match ? decodeURIComponent(match[1]) : ''
  const viewMatch = hash.match(/view=([^&]+)/)
  const sectionMatch = hash.match(/section=([^&]+)/)
  const sectionRaw = sectionMatch ? decodeURIComponent(sectionMatch[1]) : ''
  const qMatch = hash.match(/q=([^&]+)/)
  return {
    entryId: basicCatalogEntries.some((entry) => entry.id === decoded) ? decoded : null,
    view: viewMatch?.[1] === 'advanced' ? 'advanced' : viewMatch?.[1] === 'minimal' ? 'minimal' : null,
    section:
      sectionRaw === 'all'
        ? 'all'
        : Object.keys(basicCatalogSectionMeta).includes(sectionRaw)
          ? (sectionRaw as BasicCatalogSection)
          : null,
    q: qMatch ? decodeURIComponent(qMatch[1]) : '',
  }
}

function syncHash(
  entryId: string,
  view: 'minimal' | 'advanced',
  section: 'all' | BasicCatalogSection,
  q: string,
) {
  const params = new URLSearchParams()
  params.set('catalog', entryId)
  params.set('view', view)
  if (section !== 'all') params.set('section', section)
  if (q.trim()) params.set('q', q.trim())
  const nextHash = params.toString()
  if (window.location.hash.replace(/^#/, '') === nextHash) return
  window.history.replaceState(null, '', `#${nextHash}`)
}

function handleHashChange() {
  const hashState = getHashState(window.location.hash)
  if (hashState.entryId && hashState.entryId !== activeEntryId.value) {
    activeEntryId.value = hashState.entryId
    actionLog.value = []
    copyState.value = 'idle'
    copyLinkState.value = 'idle'
  }

  if (hashState.view && hashState.view !== previewMode.value) {
    previewMode.value = hashState.view
  }

  if (hashState.section && hashState.section !== activeSectionFilter.value) {
    activeSectionFilter.value = hashState.section
  }

  if (hashState.q !== searchQuery.value) {
    searchQuery.value = hashState.q
  }

  if (hashState.entryId || hashState.view) {
    nextTick(() => {
      void renderEntry()
    })
  }
}

async function renderEntry() {
  const renderer = rendererRef.value
  const scenario = currentScenario.value
  if (!renderer || !scenario) return

  renderer.reset()
  await nextTick()
  for (const message of scenario.messages) {
    renderer.processMessage(message)
  }
}

function selectEntry(entryId: string) {
  if (activeEntryId.value === entryId) return
  activeEntryId.value = entryId
  actionLog.value = []
  copyState.value = 'idle'
  copyLinkState.value = 'idle'

  nextTick(() => {
    void renderEntry()
  })
}

function selectPreviewMode(mode: 'minimal' | 'advanced') {
  if (previewMode.value === mode) return
  previewMode.value = mode
  actionLog.value = []
  copyState.value = 'idle'
  copyLinkState.value = 'idle'

  nextTick(() => {
    void renderEntry()
  })
}

function setSectionFilter(section: 'all' | BasicCatalogSection) {
  activeSectionFilter.value = section
}

function clearFilters() {
  searchQuery.value = ''
  activeSectionFilter.value = 'all'
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} -> ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
}

async function copyUsage() {
  try {
    await navigator.clipboard.writeText(usageText.value)
    copyState.value = 'done'
  } catch {
    copyState.value = 'error'
  }

  window.setTimeout(() => {
    copyState.value = 'idle'
  }, 1600)
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copyLinkState.value = 'done'
  } catch {
    copyLinkState.value = 'error'
  }

  window.setTimeout(() => {
    copyLinkState.value = 'idle'
  }, 1600)
}

watch([activeEntryId, previewMode, activeSectionFilter, searchQuery], ([entryId, view, section, q]) => {
  syncHash(entryId, view, section, q)
})

watch(filteredEntries, (entries) => {
  if (!entries.length) return
  if (entries.some((entry) => entry.id === activeEntryId.value)) return
  activeEntryId.value = entries[0].id
})

onMounted(() => {
  const hashState = getHashState(window.location.hash)
  if (hashState.entryId) {
    activeEntryId.value = hashState.entryId
  }
  if (hashState.view) {
    previewMode.value = hashState.view
  }
  if (hashState.section) {
    activeSectionFilter.value = hashState.section
  }
  if (hashState.q) {
    searchQuery.value = hashState.q
  }
  window.addEventListener('hashchange', handleHashChange)
  void renderEntry()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="catalog-page">
    <header class="catalog-header">
      <div>
        <h1>{{ t.title }}</h1>
        <p class="catalog-summary">
          {{ t.summary }}
        </p>
      </div>

      <div class="catalog-links">
        <a href="https://a2ui-composer.ag-ui.com/basic-catalog" target="_blank" rel="noreferrer">
          {{ t.links.concept }}
        </a>
        <a href="https://a2ui-composer.ag-ui.com/" target="_blank" rel="noreferrer">
          {{ t.links.guide }}
        </a>
      </div>
    </header>

    <section class="catalog-layout">
      <aside class="catalog-nav">
        <div class="catalog-nav-head">
          <p class="catalog-nav-kicker">{{ t.nav.kicker }}</p>
          <p class="catalog-nav-title">{{ t.nav.title }}</p>
          <p class="catalog-nav-copy">{{ t.nav.copy }}</p>
          <p class="catalog-nav-meta">{{ t.nav.visible(filteredCount, totalEntries) }}</p>

          <div class="catalog-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M11 5.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              <path d="m18 18 2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <input
              v-model="searchQuery"
              class="catalog-search-input"
              type="text"
              :placeholder="t.nav.search"
            />
          </div>

          <div class="catalog-filter-row">
            <button
              class="catalog-filter-chip"
              :class="{ 'catalog-filter-chip--active': activeSectionFilter === 'all' }"
              type="button"
              @click="setSectionFilter('all')"
            >
              {{ t.nav.all }}
            </button>
            <button
              v-for="group in basicCatalogGroups"
              :key="`filter-${group.section}`"
              class="catalog-filter-chip"
              :class="{ 'catalog-filter-chip--active': activeSectionFilter === group.section }"
              type="button"
              @click="setSectionFilter(group.section)"
            >
              {{ group.section }}
            </button>
          </div>
        </div>

        <div
          v-for="group in filteredGroups"
          :key="group.section"
          class="catalog-group"
        >
          <div class="catalog-group-head">
            <div class="catalog-group-title-wrap">
              <span class="catalog-group-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    v-for="path in iconPaths[sectionMeta[group.section].icon]"
                    :key="path"
                    :d="path"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <p class="catalog-group-title">{{ group.section }}</p>
            </div>
            <span class="catalog-group-count">{{ group.entries.length }}</span>
          </div>
          <button
            v-for="entry in group.entries"
            :key="entry.id"
            class="catalog-entry"
            :class="{ 'catalog-entry--active': currentEntry?.id === entry.id }"
            @click="selectEntry(entry.id)"
          >
            <span class="catalog-entry-main">
              <span class="catalog-entry-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    v-for="path in iconPaths[basicCatalogMeta[entry.id].icon]"
                    :key="path"
                    :d="path"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="catalog-entry-label">{{ entry.label }}</span>
            </span>
            <span class="catalog-entry-meta">{{ t.props.count(entry.props.length) }}</span>
          </button>
        </div>

        <div v-if="!filteredGroups.length" class="catalog-empty">
          <p class="catalog-empty-title">{{ t.empty.title }}</p>
          <p class="catalog-empty-copy">{{ t.empty.copy }}</p>
          <button class="catalog-empty-action" type="button" @click="clearFilters">
            {{ t.empty.action }}
          </button>
        </div>
      </aside>

      <section class="catalog-detail">
        <article class="catalog-hero">
          <div class="catalog-hero-top">
            <div class="catalog-kicker-group">
              <span class="catalog-badge">{{ currentMeta.badge }}</span>
              <p class="catalog-kicker">{{ currentEntry.section }}</p>
            </div>
            <div class="catalog-hero-actions">
              <button class="catalog-link-button" type="button" @click="copyLink">
                {{ copyLinkState === 'done' ? t.hero.linkCopied : copyLinkState === 'error' ? t.hero.copyFailed : t.hero.copyLink }}
              </button>
              <span class="catalog-position">{{ entryPositionLabel }}</span>
            </div>
          </div>

          <div class="catalog-hero-main">
            <div>
              <h2>{{ currentEntry.title }}</h2>
              <p class="catalog-description">{{ currentEntry.description }}</p>
            </div>

            <div class="catalog-facts">
              <div class="catalog-fact">
                <span class="catalog-fact-label">{{ t.hero.groupSize }}</span>
                <strong>{{ currentGroupSize }}</strong>
              </div>
              <div class="catalog-fact">
                <span class="catalog-fact-label">{{ t.hero.propSurface }}</span>
                <strong>{{ currentEntry.props.length }}</strong>
              </div>
            </div>
          </div>

          <div class="catalog-meta-strip">
            <span
              v-for="item in previewMeta"
              :key="item"
              class="catalog-meta-pill"
            >
              {{ item }}
            </span>
            <span class="catalog-meta-pill catalog-meta-pill--status">{{ currentMeta.status }}</span>
          </div>

          <div class="catalog-mode-row">
            <div class="catalog-mode-copy">
              <strong>{{ currentScenario.label }} {{ t.hero.example }}</strong>
              <span>{{ currentScenario.summary }}</span>
            </div>

            <div class="catalog-mode-switch">
              <button
                class="catalog-mode-button"
                :class="{ 'catalog-mode-button--active': previewMode === 'minimal' }"
                type="button"
                @click="selectPreviewMode('minimal')"
              >
                {{ t.hero.minimal }}
              </button>
              <button
                class="catalog-mode-button"
                :class="{ 'catalog-mode-button--active': previewMode === 'advanced' }"
                type="button"
                @click="selectPreviewMode('advanced')"
              >
                {{ t.hero.advanced }}
              </button>
            </div>
          </div>
        </article>

        <section class="catalog-overview-grid">
          <article class="overview-card overview-card--signature">
            <p class="overview-label">{{ t.overview.signature }}</p>
            <code class="overview-signature">{{ currentMeta.signature }}</code>
          </article>

          <article class="overview-card">
            <p class="overview-label">{{ t.overview.bestUse }}</p>
            <div class="overview-notes">
              <p
                v-for="note in currentMeta.notes"
                :key="note"
                class="overview-note"
              >
                {{ note }}
              </p>
            </div>
          </article>

          <article class="overview-card overview-card--status">
            <p class="overview-label">{{ t.overview.status }}</p>
            <strong class="overview-status">{{ currentMeta.status }}</strong>
            <span class="overview-status-copy">{{ t.overview.statusCopy }}</span>
          </article>
        </section>

        <section class="detail-card">
          <div class="detail-card-header">
            <div class="detail-card-copy">
              <h3>{{ t.preview.title }}</h3>
              <p>{{ t.preview.copy }}</p>
            </div>
            <span class="detail-card-tag">{{ t.preview.tag }}</span>
          </div>

          <div class="preview-stage">
            <div class="preview-stage-inner">
              <A2UIRenderer ref="rendererRef" @action="handleAction" />
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card-header">
            <div class="detail-card-copy">
              <h3>{{ t.usage.title }}</h3>
              <p>{{ previewMode === 'minimal' ? t.usage.minimalCopy : t.usage.advancedCopy }}</p>
            </div>
            <button class="copy-button" type="button" @click="copyUsage">
              {{ copyState === 'done' ? t.usage.copied : copyState === 'error' ? t.usage.copyFailed : t.usage.copyJson }}
            </button>
          </div>

          <div class="usage-view">
            <div
              v-for="(line, index) in usageLines"
              :key="`${currentEntry.id}-${index}`"
              class="usage-line"
            >
              <span class="usage-line-number">{{ index + 1 }}</span>
              <code class="usage-line-text">{{ line || ' ' }}</code>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card-header">
            <div class="detail-card-copy">
              <h3>{{ t.props.title }}</h3>
              <p>{{ t.props.copy }}</p>
            </div>
          </div>

          <div v-if="currentEntry.props.length" class="props-table-wrap">
            <table class="props-table">
              <thead>
                <tr>
                  <th>{{ t.props.name }}</th>
                  <th>{{ t.props.description }}</th>
                  <th>{{ t.props.default }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prop in currentEntry.props" :key="`${currentEntry.id}-${prop.name}`">
                  <td>{{ prop.name }}</td>
                  <td>{{ prop.description }}</td>
                  <td>{{ prop.defaultValue }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="props-empty">{{ t.props.empty }}</p>
        </section>

        <section class="detail-card">
          <div class="detail-card-header">
            <div class="detail-card-copy">
              <h3>{{ t.actions.title }}</h3>
              <p>{{ t.actions.copy }}</p>
            </div>
            <span class="action-count">{{ actionLog.length }}</span>
          </div>

          <div v-if="actionLog.length" class="action-log">
            <div v-for="entry in actionLog" :key="entry" class="action-entry">
              {{ entry }}
            </div>
          </div>

          <p v-else class="action-empty">{{ t.actions.empty }}</p>
        </section>
      </section>
    </section>
  </div>
</template>

<style scoped>
.catalog-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(247, 244, 253, 0.88) 100%);
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 28px 22px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(252, 250, 255, 0.88) 100%);
  backdrop-filter: blur(12px);
}

.catalog-header h1 {
  margin: 0;
  font-size: clamp(2.2rem, 2.8vw, 3rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.catalog-summary {
  max-width: 56rem;
  margin: 12px 0 0;
  color: #6f6881;
  font-size: 1.02rem;
  line-height: 1.6;
}

.catalog-links {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: flex-start;
  font-size: 0.95rem;
  color: #342f44;
}

.catalog-links a {
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(52, 47, 68, 0.18);
}

.catalog-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  min-height: 0;
  flex: 1;
}

.catalog-nav {
  border-right: 1px solid rgba(120, 112, 150, 0.14);
  padding: 18px 14px 28px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(252, 250, 255, 0.9) 0%, rgba(243, 239, 250, 0.72) 100%);
}

.catalog-nav-head {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: -18px -14px 18px;
  padding: 18px 14px 16px;
  background:
    linear-gradient(180deg, rgba(250, 248, 255, 0.98) 0%, rgba(250, 248, 255, 0.92) 82%, rgba(250, 248, 255, 0) 100%);
}

.catalog-nav-kicker {
  margin: 0 0 6px;
  color: #8f87a8;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.catalog-nav-title {
  margin: 0;
  color: #211c2f;
  font-size: 1.12rem;
  font-weight: 700;
}

.catalog-nav-copy {
  margin: 8px 0 0;
  color: #7a738d;
  font-size: 0.88rem;
  line-height: 1.55;
}

.catalog-nav-meta {
  margin: 10px 0 0;
  color: #8b84a1;
  font-size: 0.78rem;
  font-weight: 600;
}

.catalog-search {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  color: #8b84a1;
}

.catalog-search svg {
  width: 1rem;
  height: 1rem;
}

.catalog-search-input {
  border: 0;
  outline: 0;
  background: transparent;
  color: #271f38;
  font: inherit;
}

.catalog-search-input::placeholder {
  color: #9b93b1;
}

.catalog-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.catalog-filter-chip {
  min-height: 1.9rem;
  padding: 0 10px;
  border: 1px solid rgba(120, 112, 150, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #6c6580;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease;
}

.catalog-filter-chip--active {
  background: rgba(109, 94, 252, 0.1);
  color: #4d43d8;
  border-color: rgba(109, 94, 252, 0.16);
}

.catalog-group + .catalog-group {
  margin-top: 22px;
}

.catalog-empty {
  margin-top: 18px;
  padding: 16px 14px;
  border: 1px dashed rgba(120, 112, 150, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.catalog-empty-title {
  margin: 0;
  color: #292339;
  font-size: 0.92rem;
  font-weight: 700;
}

.catalog-empty-copy {
  margin: 6px 0 0;
  color: #7a738d;
  font-size: 0.84rem;
  line-height: 1.55;
}

.catalog-empty-action {
  margin-top: 12px;
  min-height: 2rem;
  padding: 0 12px;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 999px;
  background: #fff;
  color: #4f4862;
  font: inherit;
  cursor: pointer;
}

.catalog-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.catalog-group-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.catalog-group-title {
  margin: 0 0 8px;
  color: #8b84a1;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-group-icon {
  width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #7b72a1;
  background: rgba(109, 94, 252, 0.08);
}

.catalog-group-icon svg,
.catalog-entry-icon svg {
  width: 0.88rem;
  height: 0.88rem;
}

.catalog-group-count {
  min-width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
  color: #6d5efc;
  font-size: 0.75rem;
  font-weight: 700;
}

.catalog-entry {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 0;
  border-radius: 12px;
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

.catalog-entry:hover {
  color: #1f1b2d;
  background: rgba(255, 255, 255, 0.78);
}

.catalog-entry--active {
  color: #1f1b2d;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 1px rgba(122, 92, 255, 0.12),
    0 10px 24px rgba(74, 58, 120, 0.06);
  transform: translateX(2px);
}

.catalog-entry-main {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.catalog-entry-icon {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.65rem;
  color: #7d7599;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(120, 112, 150, 0.08);
  flex: 0 0 auto;
}

.catalog-entry--active .catalog-entry-icon {
  color: #584fe0;
  background: rgba(109, 94, 252, 0.1);
}

.catalog-entry-label {
  min-width: 0;
  font-weight: 500;
}

.catalog-entry-meta {
  color: #9a92b2;
  font-size: 0.76rem;
  white-space: nowrap;
}

.catalog-detail {
  padding: 20px 24px 30px;
  overflow: auto;
  display: grid;
  gap: 18px;
}

.catalog-hero {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  gap: 12px;
  padding: 16px 18px 18px;
  border: 1px solid rgba(120, 112, 150, 0.12);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(250, 247, 255, 0.94) 100%);
  box-shadow: 0 14px 32px rgba(57, 45, 101, 0.06);
  backdrop-filter: blur(10px);
}

.catalog-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.catalog-kicker-group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.catalog-badge {
  min-width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, rgba(109, 94, 252, 0.16) 0%, rgba(77, 115, 255, 0.12) 100%);
  color: #5e54e8;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px rgba(109, 94, 252, 0.12);
}

.catalog-position {
  min-width: 3.25rem;
  padding: 0.36rem 0.72rem;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
  color: #6d5efc;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}

.catalog-hero-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.catalog-link-button {
  min-height: 2rem;
  padding: 0 12px;
  border: 1px solid rgba(120, 112, 150, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #5a536e;
  font: inherit;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.catalog-link-button:hover {
  background: #fff;
  border-color: rgba(109, 94, 252, 0.18);
  color: #3e3752;
}

.catalog-hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.catalog-kicker {
  margin: 0;
  color: #6d5efc;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-hero h2 {
  margin: 0;
  font-size: clamp(1.95rem, 2.2vw, 2.7rem);
  letter-spacing: -0.04em;
}

.catalog-description {
  max-width: 56rem;
  margin: 10px 0 0;
  color: #6f6881;
  font-size: 1rem;
  line-height: 1.6;
}

.catalog-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(112px, 1fr));
  gap: 10px;
  flex: 0 0 auto;
}

.catalog-fact {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(248, 245, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(122, 92, 255, 0.08);
}

.catalog-fact-label {
  color: #8f87a8;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-fact strong {
  color: #211c2f;
  font-size: 1.12rem;
}

.catalog-meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-meta-pill {
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #6d667f;
  font-size: 0.8rem;
  box-shadow: inset 0 0 0 1px rgba(120, 112, 150, 0.12);
}

.catalog-meta-pill--status {
  color: #4d43d8;
  background: rgba(109, 94, 252, 0.1);
}

.catalog-mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
}

.catalog-mode-copy {
  display: grid;
  gap: 4px;
}

.catalog-mode-copy strong {
  color: #221d30;
  font-size: 0.96rem;
}

.catalog-mode-copy span {
  color: #7b738d;
  font-size: 0.9rem;
  line-height: 1.55;
}

.catalog-mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
}

.catalog-mode-button {
  min-height: 2rem;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #655f78;
  font: inherit;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.catalog-mode-button--active {
  background: #fff;
  color: #372f4c;
  box-shadow: 0 4px 14px rgba(66, 50, 110, 0.08);
}

.catalog-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.5fr) minmax(220px, 0.9fr);
  gap: 16px;
}

.overview-card {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 28px rgba(57, 45, 101, 0.04);
}

.overview-card--signature {
  background:
    linear-gradient(180deg, rgba(251, 248, 255, 0.96) 0%, rgba(246, 242, 255, 0.9) 100%);
}

.overview-card--status {
  align-content: start;
}

.overview-label {
  margin: 0;
  color: #8a82a2;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.overview-signature {
  color: #2d2740;
  font-family: 'SFMono-Regular', 'JetBrains Mono', 'IBM Plex Mono', monospace;
  font-size: 0.92rem;
  line-height: 1.7;
  word-break: break-word;
}

.overview-notes {
  display: grid;
  gap: 8px;
}

.overview-note {
  margin: 0;
  color: #5f596f;
  font-size: 0.95rem;
  line-height: 1.6;
}

.overview-status {
  color: #1f1b2d;
  font-size: 1.2rem;
  letter-spacing: -0.02em;
}

.overview-status-copy {
  color: #807892;
  font-size: 0.9rem;
  line-height: 1.55;
}

.detail-card {
  overflow: hidden;
  border: 1px solid rgba(120, 112, 150, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 38px rgba(57, 45, 101, 0.05);
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(252, 249, 255, 0.86) 100%);
}

.detail-card-copy {
  display: grid;
  gap: 4px;
}

.detail-card-copy p {
  margin: 0;
  color: #807892;
  font-size: 0.9rem;
  line-height: 1.5;
}

.detail-card-header h3 {
  margin: 0;
  font-size: 1.32rem;
}

.detail-card-tag {
  padding: 0.38rem 0.68rem;
  border-radius: 999px;
  background: rgba(109, 94, 252, 0.08);
  color: #6d5efc;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.preview-stage {
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(109, 94, 252, 0.1), transparent 18rem),
    radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.08), transparent 14rem),
    linear-gradient(180deg, #fcfbff 0%, #f5f2fb 100%);
}

.preview-stage-inner {
  min-height: 160px;
  padding: 20px;
  border: 1px solid rgba(122, 92, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 16px 28px rgba(96, 75, 160, 0.06);
}

.copy-button {
  min-height: 2.2rem;
  padding: 0 14px;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 999px;
  background: #faf8ff;
  color: #514b62;
  font: inherit;
  cursor: pointer;
}

.copy-button:hover {
  background: #f3efff;
}

.usage-view {
  padding: 12px 0;
  background: #fff;
}

.usage-line {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  gap: 14px;
  align-items: baseline;
  padding: 0 18px;
  font-family: 'SFMono-Regular', 'JetBrains Mono', 'IBM Plex Mono', monospace;
  font-size: 0.92rem;
  line-height: 1.72;
}

.usage-line-number {
  color: #a39ab8;
  text-align: right;
  user-select: none;
}

.usage-line-text {
  white-space: pre-wrap;
  color: #2c2738;
}

.props-table-wrap {
  overflow-x: auto;
}

.props-table {
  width: 100%;
  border-collapse: collapse;
}

.props-table th,
.props-table td {
  padding: 15px 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.12);
  text-align: left;
  vertical-align: top;
}

.props-table th {
  color: #6c647e;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.props-table td:first-child {
  width: 18%;
  color: #1f1b2d;
  font-weight: 600;
}

.props-table td:last-child {
  width: 14%;
  color: #6f6881;
}

.props-table tbody tr:hover {
  background: rgba(250, 248, 255, 0.74);
}

.props-empty,
.action-empty {
  margin: 0;
  padding: 18px;
  color: #756f87;
  line-height: 1.6;
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
  max-height: 220px;
  overflow: auto;
  padding: 14px 18px 18px;
  display: grid;
  gap: 8px;
  font-family: 'SFMono-Regular', 'JetBrains Mono', 'IBM Plex Mono', monospace;
  font-size: 0.86rem;
}

.action-entry {
  padding: 10px 12px;
  border-radius: 12px;
  background: #faf8ff;
  color: #423d54;
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .catalog-nav {
    border-right: 0;
    border-bottom: 1px solid rgba(120, 112, 150, 0.14);
  }

  .catalog-hero {
    position: static;
  }

  .catalog-overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .catalog-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .catalog-detail {
    padding: 18px 16px 24px;
  }

  .catalog-hero-main {
    flex-direction: column;
  }

  .catalog-hero-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .catalog-hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .catalog-mode-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .catalog-facts {
    width: 100%;
  }

  .detail-card-header {
    padding-inline: 16px;
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-stage,
  .usage-line,
  .props-table th,
  .props-table td,
  .props-empty,
  .action-empty {
    padding-inline: 16px;
  }
}
</style>
