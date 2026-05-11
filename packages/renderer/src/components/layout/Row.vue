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
  width: 100%;
  min-width: 0;
  flex-wrap: wrap;
}

.a2-row :deep(.a2-text-field),
.a2-row :deep(.a2-datetime),
.a2-row :deep(.a2-slider) {
  flex: 1 1 16rem;
  min-width: 0;
}

.a2-row :deep(.a2-card),
.a2-row :deep(.a2-tabs) {
  flex: 1 1 22rem;
  min-width: 0;
}
</style>
