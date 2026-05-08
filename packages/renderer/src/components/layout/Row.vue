<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'
import { DATAMODEL_KEY } from '../../composables/useSurface'

const props = defineProps<{
  componentDef: ComponentDef
}>()

const dataModel = inject(DATAMODEL_KEY)!

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
  <div
    class="a2-row"
    :style="{ justifyContent }"
  >
    <slot />
  </div>
</template>

<style scoped>
.a2-row {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}
</style>
