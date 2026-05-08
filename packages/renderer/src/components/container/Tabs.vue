<script setup lang="ts">
import { ref } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'

const props = defineProps<{
  componentDef: ComponentDef
}>()

const activeIndex = ref(0)
const tabs = props.componentDef.tabs ?? []
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
      <slot />
    </div>
  </div>
</template>

<style scoped>
.a2-tabs {
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-base);
  overflow: hidden;
}
.a2-tabs-header {
  display: flex;
  border-bottom: 1px solid var(--a2-border-default);
  background: var(--a2-bg-muted);
}
.a2-tabs-tab {
  padding: var(--a2-space-2) var(--a2-space-4);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--a2-font-size-base);
  font-weight: var(--a2-font-weight-medium);
  color: var(--a2-text-muted);
  border-bottom: 2px solid transparent;
  transition: all var(--a2-transition-fast);
}
.a2-tabs-tab:hover {
  color: var(--a2-text-secondary);
}
.a2-tabs-tab--active {
  color: var(--a2-color-primary);
  border-bottom-color: var(--a2-color-primary);
}
.a2-tabs-content {
  padding: var(--a2-space-4);
}
</style>
