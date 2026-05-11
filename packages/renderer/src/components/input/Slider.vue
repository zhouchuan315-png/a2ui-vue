<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'
import { isDynamicValue, resolvePath, resolveLiteral, setPath } from '@a2ui/vue-core'
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
    setPath(path.value, dataModel.value, val, props.scope)
  },
})

const progress = computed(() => {
  const range = max.value - min.value
  if (range <= 0) return 0
  return ((value.value - min.value) / range) * 100
})
</script>

<template>
  <div class="a2-slider" :style="{ '--a2-slider-progress': `${progress}%` }">
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
  width: 100%;
  min-width: 0;
}
.a2-slider-input {
  flex: 1;
  appearance: none;
  -webkit-appearance: none;
  height: 0.38rem;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      var(--a2-color-primary) 0%,
      var(--a2-color-primary) var(--a2-slider-progress),
      var(--a2-bg-muted) var(--a2-slider-progress),
      var(--a2-bg-muted) 100%
    );
  cursor: pointer;
}

.a2-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--a2-color-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--a2-color-primary) 28%, transparent);
}

.a2-slider-input::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--a2-color-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--a2-color-primary) 28%, transparent);
}

.a2-slider-input::-moz-range-track {
  height: 0.38rem;
  border-radius: 999px;
  background: transparent;
}

.a2-slider-input:focus-visible {
  outline: none;
}

.a2-slider-value {
  min-width: 3rem;
  padding: 0.35rem 0.55rem;
  border-radius: var(--a2-radius-full);
  background: var(--a2-bg-subtle);
  font-size: var(--a2-font-size-sm);
  color: var(--a2-text-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
