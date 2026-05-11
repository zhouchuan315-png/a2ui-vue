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

const hasLabel = computed(() => Boolean(label.value.trim()))

const path = computed(() => props.componentDef.value?.path)

const checked = computed({
  get: () => {
    if (!path.value) return false
    return Boolean(resolvePath(path.value, dataModel.value, props.scope))
  },
  set: (val: boolean) => {
    if (!path.value) return
    setPath(path.value, dataModel.value, val, props.scope)
  },
})
</script>

<template>
  <label class="a2-checkbox" :class="{ 'a2-checkbox--compact': !hasLabel }">
    <input
      class="a2-checkbox-input"
      type="checkbox"
      :checked="checked"
      @change="checked = ($event.target as HTMLInputElement).checked"
    />
    <span class="a2-checkbox-box" aria-hidden="true"></span>
    <span v-if="hasLabel" class="a2-checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.a2-checkbox {
  display: inline-grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  align-items: center;
  gap: var(--a2-space-2);
  cursor: pointer;
  width: 100%;
  min-width: 0;
  padding: var(--a2-space-2) var(--a2-space-3);
  border-radius: var(--a2-radius-lg);
  color: var(--a2-text-secondary);
  transition: background-color var(--a2-transition-fast), color var(--a2-transition-fast);
}

.a2-checkbox--compact {
  grid-template-columns: 1rem;
  width: auto;
  padding: 0;
  background: transparent;
  justify-content: center;
}

.a2-checkbox:hover {
  background: var(--a2-bg-subtle);
  color: var(--a2-text-primary);
}

.a2-checkbox--compact:hover {
  background: transparent;
}

.a2-checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.a2-checkbox-box {
  width: 1rem;
  height: 1rem;
  border-radius: 0.3rem;
  border: 1px solid var(--a2-border-strong);
  background: var(--a2-bg-surface);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition:
    background-color var(--a2-transition-fast),
    border-color var(--a2-transition-fast),
    box-shadow var(--a2-transition-fast),
    transform var(--a2-transition-fast);
  position: relative;
}

.a2-checkbox:hover .a2-checkbox-box {
  border-color: color-mix(in srgb, var(--a2-color-primary) 28%, var(--a2-border-strong));
  background: color-mix(in srgb, var(--a2-bg-subtle) 80%, white);
}

.a2-checkbox-box::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 0.52rem;
  height: 0.52rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5 6.5 11.5 12.5 4.5' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0;
}

.a2-checkbox-input:checked + .a2-checkbox-box {
  background: var(--a2-color-primary);
  border-color: var(--a2-color-primary);
  box-shadow: 0 6px 14px color-mix(in srgb, var(--a2-color-primary) 18%, transparent);
}

.a2-checkbox-input:checked + .a2-checkbox-box::after {
  opacity: 1;
}

.a2-checkbox-input:focus-visible + .a2-checkbox-box {
  box-shadow: var(--a2-shadow-focus);
}

.a2-checkbox-label {
  font-size: var(--a2-font-size-base);
  line-height: 1.5;
  min-width: 0;
}
</style>
