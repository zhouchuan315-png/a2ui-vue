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

const label = computed(() => {
  const dynamic = props.componentDef.label
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})

const path = computed(() => props.componentDef.value?.path)

const checked = computed({
  get: () => {
    if (!path.value) return false
    return Boolean(resolvePath(path.value, dataModel.value, props.scope))
  },
  set: (val: boolean) => {
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
  <label class="a2-checkbox">
    <input
      type="checkbox"
      :checked="checked"
      @change="checked = ($event.target as HTMLInputElement).checked"
    />
    <span class="a2-checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.a2-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--a2-space-2);
  cursor: pointer;
  font-size: var(--a2-font-size-base);
  color: var(--a2-text-primary);
}
.a2-checkbox input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--a2-color-primary);
  cursor: pointer;
}
</style>
