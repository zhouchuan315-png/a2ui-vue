<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'
import { resolvePath, setPath } from '@a2ui/vue-core'
import { DATAMODEL_KEY } from '../../composables/useSurface'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: any
}>()

const dataModel = inject(DATAMODEL_KEY)!

const options = computed(() => props.componentDef.options ?? [])
const multi = computed(() => props.componentDef.multi ?? false)
const path = computed(() => props.componentDef.value?.path)

const selected = computed({
  get: () => {
    if (!path.value) return multi.value ? [] : ''
    return resolvePath(path.value, dataModel.value, props.scope) ?? (multi.value ? [] : '')
  },
  set: (val: any) => {
    if (!path.value) return
    setPath(path.value, dataModel.value, val, props.scope)
  },
})

function isSelected(value: string): boolean {
  if (multi.value) {
    return Array.isArray(selected.value) && selected.value.includes(value)
  }
  return selected.value === value
}

function toggle(value: string) {
  if (multi.value) {
    const arr = Array.isArray(selected.value) ? [...selected.value] : []
    const idx = arr.indexOf(value)
    if (idx >= 0) {
      arr.splice(idx, 1)
    } else {
      arr.push(value)
    }
    selected.value = arr
  } else {
    selected.value = value
  }
}
</script>

<template>
  <div class="a2-choice-picker">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="a2-choice-option"
      :class="{ 'a2-choice-option--selected': isSelected(opt.value) }"
      @click="toggle(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.a2-choice-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--a2-space-2);
  width: 100%;
}
.a2-choice-option {
  min-height: 2.25rem;
  padding: 0 var(--a2-space-3);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-full);
  background: var(--a2-bg-subtle);
  font-size: var(--a2-font-size-sm);
  font-weight: var(--a2-font-weight-medium);
  font-family: inherit;
  color: var(--a2-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--a2-transition-fast),
    color var(--a2-transition-fast),
    border-color var(--a2-transition-fast),
    transform var(--a2-transition-fast),
    box-shadow var(--a2-transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.a2-choice-option:hover {
  border-color: color-mix(in srgb, var(--a2-color-primary) 30%, var(--a2-border-default));
  color: var(--a2-text-primary);
  background: var(--a2-bg-surface);
}
.a2-choice-option--selected {
  background: var(--a2-color-primary);
  color: var(--a2-text-inverse);
  border-color: var(--a2-color-primary);
  box-shadow: 0 10px 20px color-mix(in srgb, var(--a2-color-primary) 18%, transparent);
}
.a2-choice-option--selected:hover {
  background: var(--a2-color-primary-hover);
  color: var(--a2-text-inverse);
}
.a2-choice-option:focus-visible {
  outline: none;
  box-shadow: var(--a2-shadow-focus);
}
</style>
