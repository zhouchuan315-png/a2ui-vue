<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'
import { isDynamicValue, resolvePath, resolveLiteral, executeFunction } from '@a2ui/vue-core'
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

const placeholder = computed(() => {
  const dynamic = props.componentDef.placeholder
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) return resolveLiteral(dynamic) ?? ''
  return String(dynamic)
})

const path = computed(() => props.componentDef.value?.path)

const value = computed({
  get: () => {
    if (!path.value) return ''
    return resolvePath(path.value, dataModel.value, props.scope) ?? ''
  },
  set: (val: string) => {
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

const errorMessage = ref('')
const checks = computed(() => props.componentDef.checks ?? [])

function validate() {
  for (const check of checks.value) {
    const result = executeFunction(
      { call: check.call, args: { value: value.value, ...check.args } },
      dataModel.value,
      props.scope,
    )
    if (result !== true) {
      errorMessage.value = check.message ?? 'Validation failed'
      return false
    }
  }
  errorMessage.value = ''
  return true
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  value.value = target.value
  validate()
}
</script>

<template>
  <div class="a2-text-field">
    <label v-if="label" class="a2-text-field-label">{{ label }}</label>
    <input
      class="a2-text-field-input"
      :class="{ 'a2-text-field-input--error': errorMessage }"
      type="text"
      :value="value"
      :placeholder="placeholder"
      @input="handleInput"
      @blur="validate"
    />
    <p v-if="errorMessage" class="a2-text-field-error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.a2-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--a2-space-1);
}
.a2-text-field-label {
  font-size: var(--a2-font-size-base);
  font-weight: var(--a2-font-weight-medium);
  color: var(--a2-text-secondary);
}
.a2-text-field-input {
  padding: var(--a2-space-2) var(--a2-space-3);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-base);
  font-size: var(--a2-font-size-base);
  font-family: inherit;
  color: var(--a2-text-primary);
  background: var(--a2-bg-surface);
  outline: none;
  transition: border-color var(--a2-transition-fast), box-shadow var(--a2-transition-fast);
}
.a2-text-field-input::placeholder {
  color: var(--a2-text-muted);
}
.a2-text-field-input:focus {
  border-color: var(--a2-border-focus);
  box-shadow: var(--a2-shadow-focus);
}
.a2-text-field-input--error {
  border-color: var(--a2-color-error);
}
.a2-text-field-input--error:focus {
  border-color: var(--a2-color-error);
  box-shadow: 0 0 0 3px var(--a2-color-error-focus);
}
.a2-text-field-error {
  font-size: var(--a2-font-size-xs);
  color: var(--a2-color-error);
  margin: 0;
}
</style>
