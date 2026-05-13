<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '@nine1ie/a2ui-vue-core'

const props = defineProps<{
  componentDef: ComponentDef
}>()

const alignment = computed(() => props.componentDef.alignment ?? 'start')

const alignItems = computed(() => {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'stretch',
    'space-around': 'stretch',
  }
  return map[alignment.value] ?? 'flex-start'
})
</script>

<template>
  <div class="a2-column" :style="{ alignItems }">
    <slot />
  </div>
</template>

<style scoped>
.a2-column {
  display: flex;
  flex-direction: column;
  gap: var(--a2-space-4);
  width: 100%;
  min-width: 0;
}
</style>
