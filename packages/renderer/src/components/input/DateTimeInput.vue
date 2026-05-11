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

const label = computed(() => {
  const dynamic = props.componentDef.label
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})

const mode = computed(() => props.componentDef.mode ?? 'date')

const inputType = computed(() => {
  const map: Record<string, string> = { date: 'date', time: 'time', datetime: 'datetime-local' }
  return map[mode.value] ?? 'date'
})

const path = computed(() => props.componentDef.value?.path)

const value = computed({
  get: () => {
    if (!path.value) return ''
    return resolvePath(path.value, dataModel.value, props.scope) ?? ''
  },
  set: (val: string) => {
    if (!path.value) return
    setPath(path.value, dataModel.value, val, props.scope)
  },
})
</script>

<template>
  <div class="a2-datetime">
    <label v-if="label" class="a2-datetime-label">{{ label }}</label>
    <input
      :type="inputType"
      :value="value"
      class="a2-datetime-input"
      @input="value = ($event.target as HTMLInputElement).value"
    />
  </div>
</template>

<style scoped>
.a2-datetime {
  display: flex;
  flex-direction: column;
  gap: var(--a2-space-2);
  width: 100%;
  min-width: 0;
}
.a2-datetime-label {
  font-size: var(--a2-font-size-sm);
  font-weight: var(--a2-font-weight-semibold);
  color: var(--a2-text-secondary);
  letter-spacing: 0.01em;
}
.a2-datetime-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 3rem;
  padding: 0 var(--a2-space-4);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-lg);
  font-size: var(--a2-font-size-base);
  font-family: inherit;
  color: var(--a2-text-primary);
  background: var(--a2-bg-surface);
  outline: none;
  transition:
    border-color var(--a2-transition-fast),
    box-shadow var(--a2-transition-fast),
    background-color var(--a2-transition-fast);
}
.a2-datetime-input:hover {
  border-color: var(--a2-border-strong);
  background: var(--a2-bg-subtle);
}
.a2-datetime-input:focus {
  border-color: var(--a2-border-focus);
  background: var(--a2-bg-surface);
  box-shadow: var(--a2-shadow-focus);
}
</style>
