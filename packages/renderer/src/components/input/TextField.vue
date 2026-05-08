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

// Two-way binding via path
const path = computed(() => props.componentDef.value?.path)

const value = computed({
  get: () => {
    if (!path.value) return ''
    return resolvePath(path.value, dataModel.value, props.scope) ?? ''
  },
  set: (val: string) => {
    if (!path.value) return
    // Update data model directly (two-way binding)
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

// Validation
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
  gap: 0.25rem;
}
.a2-text-field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.a2-text-field-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.a2-text-field-input:focus {
  border-color: var(--a2-primary-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.a2-text-field-input--error {
  border-color: #ef4444;
}
.a2-text-field-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin: 0;
}
</style>
