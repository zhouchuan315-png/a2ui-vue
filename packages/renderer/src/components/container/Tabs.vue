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
  border: 1px solid var(--a2-border-color, #e5e7eb);
  border-radius: 0.5rem;
  overflow: hidden;
}
.a2-tabs-header {
  display: flex;
  border-bottom: 1px solid var(--a2-border-color, #e5e7eb);
}
.a2-tabs-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #666;
  border-bottom: 2px solid transparent;
}
.a2-tabs-tab--active {
  color: var(--a2-primary-color, #3b82f6);
  border-bottom-color: var(--a2-primary-color, #3b82f6);
}
.a2-tabs-content {
  padding: 1rem;
}
</style>
