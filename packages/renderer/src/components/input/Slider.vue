<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'
import { isDynamicValue, resolvePath, resolveLiteral } from '@a2ui/vue-core'
import { DATAMODEL_KEY } from '../../composables/useSurface'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: any
}>()

const dataModel = inject(DATAMODEL_KEY)!

function resolveNumber(dynamic: any, fallback: number): number {
  if (!dynamic) return fallback
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return Number(resolvePath(dynamic.path, dataModel.value, props.scope)) || fallback
    return Number(resolveLiteral(dynamic)) || fallback
  }
  return Number(dynamic) || fallback
}

const min = computed(() => resolveNumber(props.componentDef.min, 0))
const max = computed(() => resolveNumber(props.componentDef.max, 100))
const step = computed(() => resolveNumber(props.componentDef.step, 1))

const path = computed(() => props.componentDef.value?.path)

const value = computed({
  get: () => {
    if (!path.value) return min.value
    return Number(resolvePath(path.value, dataModel.value, props.scope)) || min.value
  },
  set: (val: number) => {
    if (!path.value) return
    const parts = path.value.split('/').filter(Boolean)
    let current = dataModel.value
    for (let i = 0; i < parts.length - 1; i++) {
      current = current?.[parts[i]]
    }
    if (current) {
      current[parts[parts.length - 1]] = val
    }
  },
})
</script>

<template>
  <div class="a2-slider">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      class="a2-slider-input"
      @input="value = Number(($event.target as HTMLInputElement).value)"
    />
    <span class="a2-slider-value">{{ value }}</span>
  </div>
</template>

<style scoped>
.a2-slider {
  display: flex;
  align-items: center;
  gap: var(--a2-space-3);
}
.a2-slider-input {
  flex: 1;
  accent-color: var(--a2-color-primary);
  cursor: pointer;
}
.a2-slider-value {
  font-size: var(--a2-font-size-base);
  color: var(--a2-text-secondary);
  min-width: 2rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
