<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'

const props = defineProps<{
  componentDef: ComponentDef
}>()

const alignment = computed(() => props.componentDef.alignment ?? 'start')

const justifyContent = computed(() => {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
  }
  return map[alignment.value] ?? 'flex-start'
})
</script>

<template>
  <div class="a2-row" :style="{ justifyContent }">
    <slot />
  </div>
</template>

<style scoped>
.a2-row {
  display: flex;
  flex-direction: row;
  gap: var(--a2-space-3);
  align-items: center;
}
</style>
