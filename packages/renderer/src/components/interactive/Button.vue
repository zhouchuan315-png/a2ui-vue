<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentDef, ActionMessage } from '@a2ui/vue-core'
import { isDynamicValue, resolvePath, resolveLiteral, executeFunction } from '@a2ui/vue-core'
import { DATAMODEL_KEY } from '../../composables/useSurface'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: any
}>()

const dataModel = inject(DATAMODEL_KEY)!
const surfaceManager = inject<any>('a2ui:surfaceManager')

const label = computed(() => {
  const dynamic = props.componentDef.label
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})

const variant = computed(() => props.componentDef.variant ?? 'default')

// Validation checks
const isValid = computed(() => {
  const checks = props.componentDef.checks
  if (!checks?.length) return true

  return checks.every((check: any) => {
    const result = executeFunction(
      { call: check.call, args: check.args },
      dataModel.value,
      props.scope,
    )
    return result === true
  })
})

function handleClick() {
  if (!isValid.value) return

  const action = props.componentDef.action
  if (!action) return

  if ('event' in action && action.event) {
    // Resolve context values
    const context: Record<string, any> = {}
    if (action.event.context) {
      for (const [key, value] of Object.entries(action.event.context)) {
        if (isDynamicValue(value)) {
          context[key] = resolvePath((value as any).path, dataModel.value, props.scope)
        } else {
          context[key] = value
        }
      }
    }

    const actionMsg: ActionMessage = {
      name: action.event.name,
      surfaceId: '', // Will be filled by surfaceManager
      sourceComponentId: props.componentDef.id,
      timestamp: new Date().toISOString(),
      context,
    }

    surfaceManager?.dispatchAction(actionMsg)
  }

  if ('functionCall' in action && action.functionCall) {
    executeFunction(action.functionCall, dataModel.value, props.scope)
  }
}
</script>

<template>
  <button
    class="a2-button"
    :class="[
      `a2-button--${variant}`,
      { 'a2-button--disabled': !isValid },
    ]"
    :disabled="!isValid"
    @click="handleClick"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.a2-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}
.a2-button--default {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}
.a2-button--default:hover {
  background: #e5e7eb;
}
.a2-button--primary {
  background: var(--a2-primary-color, #3b82f6);
  color: white;
}
.a2-button--primary:hover {
  opacity: 0.9;
}
.a2-button--borderless {
  background: transparent;
  color: var(--a2-primary-color, #3b82f6);
}
.a2-button--borderless:hover {
  background: rgba(59, 130, 246, 0.08);
}
.a2-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
