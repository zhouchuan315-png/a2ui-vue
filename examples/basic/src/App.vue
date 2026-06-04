<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appMessages, localeOptions, type Locale } from './i18n'

type NavKey = 'basic' | 'composition' | 'json' | 'docs' | 'restaurant' | 'a2a'

interface NavItem {
  key: NavKey
  route: string
}

const navItems: NavItem[] = [
  { key: 'basic', route: '/' },
  { key: 'composition', route: '/composition' },
  { key: 'json', route: '/json' },
  { key: 'docs', route: '/docs' },
  { key: 'restaurant', route: '/restaurant' },
  { key: 'a2a', route: '/a2a' },
]

const navIconPaths: Record<string, string[]> = {
  basic: ['M6 5.5h12v13H6z', 'M9 9h6M9 13h6'],
  composition: ['M6 6h5v5H6zM13 6h5v5h-5zM9.5 13h5v5h-5z'],
  json: ['M8 8l-3 4 3 4', 'M16 8l3 4-3 4', 'M13.5 6.5l-3 11'],
  docs: ['M6.5 5.5h8l3 3v10h-11z', 'M14.5 5.5v3h3', 'M9 12h6M9 15h6M9 9h2'],
  restaurant: ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'],
  a2a: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  workspace: ['M4.5 6.5h15v11h-15z', 'M4.5 10.5h15', 'M10.5 10.5v7'],
}

const route = useRoute()
const router = useRouter()
const locale = ref<Locale>(getInitialLocale())
const t = computed(() => appMessages[locale.value])

const activeRouteName = computed(() => {
  const match = navItems.find((item) => item.route === route.path)
  return match?.key ?? 'basic'
})

const currentWorkspaceLabel = computed(() => t.value.nav[activeRouteName.value])

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  const saved = window.localStorage.getItem('a2ui-example-locale')
  return saved === 'en' || saved === 'zh' ? saved : 'zh'
}

function setLocale(nextLocale: Locale) {
  locale.value = nextLocale
}

function navigateTo(routePath: string) {
  router.push(routePath)
}

watch(
  locale,
  (nextLocale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLocale === 'zh' ? 'zh-CN' : 'en'
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('a2ui-example-locale', nextLocale)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">A2</span>
        <div>
          <p class="brand-title">A2UI Composer</p>
          <p class="brand-subtitle">{{ t.brandSubtitle }}</p>
        </div>
      </div>

      <div class="language-switch" :aria-label="locale === 'zh' ? '语言切换' : 'Language switch'">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          class="language-option"
          :class="{ 'language-option--active': locale === option.value }"
          type="button"
          @click="setLocale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ 'nav-item--active': activeRouteName === item.key }"
          type="button"
          @click="navigateTo(item.route)"
        >
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                v-for="path in navIconPaths[item.key]"
                :key="path"
                :d="path"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          {{ t.nav[item.key] }}
        </button>
      </nav>

      <div class="sidebar-footer">
        <p class="sidebar-label">{{ t.sidebar.workspace }}</p>
        <div class="sidebar-note">
          <strong class="sidebar-note-title">
            <span class="nav-icon nav-icon--note">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  v-for="path in navIconPaths.workspace"
                  :key="path"
                  :d="path"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            {{ t.sidebar.rendererPreview }}
          </strong>
          <span>{{ t.sidebar.currentFocus }}: {{ currentWorkspaceLabel }}</span>
        </div>
      </div>
    </aside>

    <main class="workspace" :class="{ 'workspace--basic': activeRouteName === 'basic' }">
      <router-view :locale="locale" />
    </main>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(114, 93, 255, 0.08), transparent 22rem),
    linear-gradient(180deg, #f7f5fb 0%, #f1eff8 100%);
  color: #17141f;
  font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
}

:global(a) {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 12px;
  padding: 10px;
}

.sidebar,
.workspace {
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(57, 45, 101, 0.08);
}

.sidebar {
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #7a5cff 0%, #4d73ff 100%);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.brand-subtitle {
  margin: 0.2rem 0 0;
  color: #7b748f;
  font-size: 0.86rem;
}

.language-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 12px;
  background: rgba(248, 245, 255, 0.72);
}

.language-option {
  min-height: 2rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6a637a;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.language-option--active {
  background: #ffffff;
  color: #4d43d8;
  box-shadow: 0 8px 18px rgba(74, 58, 120, 0.08);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #655f75;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.nav-item--active {
  color: #1c162b;
  background: #f4f1fb;
  box-shadow: inset 0 0 0 1px rgba(122, 92, 255, 0.16);
}

.nav-icon {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  opacity: 0.72;
  flex: 0 0 auto;
}

.nav-icon svg {
  width: 1rem;
  height: 1rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(120, 112, 150, 0.14);
}

.sidebar-label {
  margin: 0 0 10px;
  font-size: 0.78rem;
  color: #8d859f;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sidebar-note {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #faf8ff 0%, #f2eefc 100%);
  color: #5c566d;
  font-size: 0.92rem;
}

.sidebar-note-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.nav-icon--note {
  width: 1rem;
  height: 1rem;
  opacity: 1;
}

.workspace {
  padding: 22px;
  min-width: 0;
  min-height: 0;
}

.workspace--basic {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 920px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    gap: 14px;
  }

  .workspace {
    padding: 16px;
  }

  .workspace--basic {
    padding: 0;
  }
}
</style>
