<script setup lang="ts">
import { computed, h, inject, provide, ref, type VNode } from 'vue'
import { isTemplateChildList, type Scope } from '@a2ui/vue-core'
import { getComponentType } from './component-map'
import { useSurface } from './composables/useSurface'

const props = defineProps<{
  componentId: string
  scope?: Scope
}>()

const { registry, dataModel } = useSurface()

const componentDef = computed(() => registry.getComponent(props.componentId))
const componentType = computed(() => {
  if (!componentDef.value) return null
  return getComponentType(componentDef.value.component)
})

// Resolve children IDs
const childrenIds = computed(() => {
  if (!componentDef.value) return []
  const childList = componentDef.value.children
  if (!childList) return []

  if (isTemplateChildList(childList)) {
    // Template rendering: resolve data binding array
    const path = childList.template.dataBinding
    const array = getByPointer(dataModel.value, path)
    if (!Array.isArray(array)) return []
    return array.map((_, i) => ({
      id: `${childList.template.componentId}__${i}`,
      templateId: childList.template.componentId,
      index: i,
    }))
  }

  return (childList.explicitList ?? []).map((id: string) => ({ id }))
})

// JSON Pointer resolution helper
function getByPointer(obj: any, pointer: string): any {
  if (!pointer || pointer === '/') return obj
  const parts = pointer.split('/').filter(Boolean)
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part.replace(/~1/g, '/').replace(/~0/g, '~')]
  }
  return current
}
</script>

<template>
  <component
    v-if="componentType && componentDef"
    :is="componentType"
    :component-def="componentDef"
    :scope="scope"
  >
    <template v-for="child in childrenIds" :key="child.id">
      <ComponentResolver
        :component-id="child.templateId ?? child.id"
        :scope="child.templateId ? {
          currentItem: getByPointer(dataModel, `${componentDef.children.template.dataBinding}/${child.index}`),
          index: child.index,
          parent: scope,
        } : scope"
      />
    </template>
  </component>
</template>
