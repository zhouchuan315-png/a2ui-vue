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

const isValid = computed(() => {
  const checks = props.componentDef.checks
  if (!checks?.length) return true
  return checks.every((check: any) => {
    const result = executeFunction({ call: check.call, args: check.args }, dataModel.value, props.scope)
    return result === true
  })
})

function handleClick() {
  if (!isValid.value) return
  const action = props.componentDef.action
  if (!action) return

  if ('event' in action && action.event) {
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
      surfaceId: '',
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
  padding: var(--a2-space-2) var(--a2-space-4);
  border-radius: var(--a2-radius-base);
  font-size: var(--a2-font-size-base);
  font-weight: var(--a2-font-weight-medium);
  cursor: pointer;
  transition: all var(--a2-transition-fast);
  border: 1px solid transparent;
  font-family: inherit;
}
.a2-button--default {
  background: var(--a2-bg-muted);
  color: var(--a2-text-secondary);
  border-color: var(--a2-border-default);
}
.a2-button--default:hover {
  background: var(--a2-bg-hover);
}
.a2-button--primary {
  background: var(--a2-color-primary);
  color: var(--a2-text-inverse);
}
.a2-button--primary:hover {
  background: var(--a2-color-primary-hover);
}
.a2-button--borderless {
  background: transparent;
  color: var(--a2-color-primary);
}
.a2-button--borderless:hover {
  background: var(--a2-color-primary-focus);
}
.a2-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
