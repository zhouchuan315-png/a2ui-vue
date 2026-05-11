<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentDef, Scope } from '@a2ui/vue-core'
import ComponentResolver from '../../ComponentResolver.vue'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: Scope
}>()

const activeIndex = ref(0)
const tabs = computed(() => props.componentDef.tabs ?? [])
const activeTab = computed(() => tabs.value[activeIndex.value])
</script>

<template>
  <div class="a2-tabs">
    <div class="a2-tabs-header">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        class="a2-tabs-tab"
        :class="{ 'a2-tabs-tab--active': i === activeIndex }"
        @click="activeIndex = i"
      >
        {{ tab.title }}
      </button>
    </div>
    <div class="a2-tabs-content">
      <ComponentResolver
        v-if="activeTab?.child"
        :component-id="activeTab.child"
        :scope="scope"
      />
    </div>
  </div>
</template>

<style scoped>
.a2-tabs {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-lg);
  overflow: hidden;
  background: var(--a2-bg-surface);
  box-shadow: var(--a2-shadow-card);
}
.a2-tabs-header {
  display: flex;
  gap: var(--a2-space-1);
  padding: var(--a2-space-2) var(--a2-space-2) 0;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--a2-border-default);
  background: linear-gradient(180deg, var(--a2-bg-subtle) 0%, var(--a2-bg-muted) 100%);
  scrollbar-width: none;
}

.a2-tabs-header::-webkit-scrollbar {
  display: none;
}

.a2-tabs-tab {
  flex: 0 0 auto;
  margin-bottom: -1px;
  padding: var(--a2-space-2) var(--a2-space-4);
  border: none;
  border-radius: var(--a2-radius-base) var(--a2-radius-base) 0 0;
  background: transparent;
  cursor: pointer;
  font-size: var(--a2-font-size-base);
  font-weight: var(--a2-font-weight-medium);
  color: var(--a2-text-muted);
  border-bottom: 2px solid transparent;
  transition: all var(--a2-transition-fast);
  white-space: nowrap;
  line-height: 1.2;
}
.a2-tabs-tab:hover {
  color: var(--a2-text-secondary);
  background: rgba(255, 255, 255, 0.7);
}
.a2-tabs-tab--active {
  color: var(--a2-text-primary);
  background: var(--a2-bg-surface);
  border-bottom-color: var(--a2-text-primary);
}
.a2-tabs-content {
  padding: var(--a2-space-5);
  background: var(--a2-bg-surface);
}
</style>
