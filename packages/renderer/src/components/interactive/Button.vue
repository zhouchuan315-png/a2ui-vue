<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentDef, ActionMessage } from '@a2ui/vue-core'
import { isDynamicValue, resolvePath, resolveLiteral, executeFunction } from '@a2ui/vue-core'
import { DATAMODEL_KEY, SURFACE_KEY } from '../../composables/useSurface'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: any
}>()

const dataModel = inject(DATAMODEL_KEY)!
const surface = inject(SURFACE_KEY)
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

const isValid = computed(() => {
  const checks = props.componentDef.checks
  if (!checks?.length) return true
  return checks.every((check: any) => {
    const result = executeFunction({ call: check.call, args: check.args }, dataModel.value, props.scope)
    return result === true
  })
})

function resolveContextValue(value: unknown): unknown {
  if (!isDynamicValue(value)) return value
  if ('path' in value && value.path) return resolvePath(value.path, dataModel.value, props.scope)
  if ('functionCall' in value && value.functionCall) {
    return executeFunction(value.functionCall, dataModel.value, props.scope)
  }
  return resolveLiteral(value)
}

function handleClick() {
  if (!isValid.value) return
  const action = props.componentDef.action
  if (!action) return

  if ('event' in action && action.event) {
    const context: Record<string, any> = {}
    if (action.event.context) {
      for (const [key, value] of Object.entries(action.event.context)) {
        context[key] = resolveContextValue(value)
      }
    }
    const actionMsg: ActionMessage = {
      name: action.event.name,
      surfaceId: surface?.value.id ?? '',
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
    type="button"
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
  min-height: 2.75rem;
  padding: 0 var(--a2-space-4);
  border-radius: var(--a2-radius-lg);
  font-size: var(--a2-font-size-base);
  font-weight: var(--a2-font-weight-semibold);
  cursor: pointer;
  transition:
    transform var(--a2-transition-fast),
    background-color var(--a2-transition-fast),
    color var(--a2-transition-fast),
    border-color var(--a2-transition-fast),
    box-shadow var(--a2-transition-fast),
    opacity var(--a2-transition-fast);
  border: 1px solid var(--a2-border-default);
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--a2-space-2);
  white-space: nowrap;
}
.a2-button--default {
  background: var(--a2-bg-subtle);
  color: var(--a2-text-primary);
  border-color: var(--a2-border-default);
}
.a2-button--default:hover {
  background: var(--a2-bg-surface);
  border-color: var(--a2-border-strong);
}
.a2-button--primary {
  background: var(--a2-color-primary);
  color: var(--a2-text-inverse);
  border-color: transparent;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--a2-color-primary) 20%, transparent);
}
.a2-button--primary:hover {
  background: var(--a2-color-primary-hover);
  transform: translateY(-1px);
}
.a2-button--borderless {
  background: transparent;
  color: var(--a2-color-primary);
  border-color: transparent;
}
.a2-button--borderless:hover {
  background: var(--a2-color-primary-focus);
}
.a2-button:focus-visible {
  outline: none;
  box-shadow: var(--a2-shadow-focus);
}
.a2-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
