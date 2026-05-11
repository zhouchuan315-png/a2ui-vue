<script setup lang="ts">
import { computed } from 'vue'
import { getByPointer, isTemplateChildList, type Scope } from '@a2ui/vue-core'
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

type ResolvedChild = {
  key: string
  componentId: string
  scope?: Scope
}

const resolvedChildren = computed<ResolvedChild[]>(() => {
  if (!componentDef.value) return []
  const childList = componentDef.value.children
  if (!childList) return []

  if (isTemplateChildList(childList)) {
    const array = getByPointer(dataModel.value, childList.template.dataBinding)
    if (!Array.isArray(array)) return []

    return array.map((item, index) => ({
      key: `${childList.template.componentId}__${index}`,
      componentId: childList.template.componentId,
      scope: {
        currentItem: item,
        index,
        parent: props.scope,
      },
    }))
  }

  return (childList.explicitList ?? []).map((id: string) => ({
    key: id,
    componentId: id,
    scope: props.scope,
  }))
})
</script>

<template>
  <component
    v-if="componentType && componentDef"
    :is="componentType"
    :component-def="componentDef"
    :scope="scope"
  >
    <template v-for="child in resolvedChildren" :key="child.key">
      <ComponentResolver
        :component-id="child.componentId"
        :scope="child.scope"
      />
    </template>
  </component>
</template>
