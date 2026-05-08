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

function resolveDynamic(dynamic: any): any {
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return dynamic
}

const url = computed(() => resolveDynamic(props.componentDef.url))
const alt = computed(() => resolveDynamic(props.componentDef.alt) ?? '')
</script>

<template>
  <img class="a2-image" :src="url" :alt="alt" loading="lazy" />
</template>

<style scoped>
.a2-image {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}
</style>
