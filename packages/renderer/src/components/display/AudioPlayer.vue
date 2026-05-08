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

const url = computed(() => {
  const dynamic = props.componentDef.url
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})
</script>

<template>
  <audio class="a2-audio" controls :src="url" />
</template>

<style scoped>
.a2-audio {
  width: 100%;
}
</style>
