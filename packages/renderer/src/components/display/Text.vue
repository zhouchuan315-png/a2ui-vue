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

const text = computed(() => {
  const dynamic = props.componentDef.text
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) {
      return resolvePath(dynamic.path, dataModel.value, props.scope)
    }
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})

const tag = computed(() => {
  const hint = props.componentDef.usageHint
  if (!hint) return 'p'
  if (hint.startsWith('h') && !isNaN(Number(hint[1]))) return hint
  if (hint === 'caption') return 'small'
  return 'p'
})
</script>

<template>
  <component :is="tag" class="a2-text" :class="`a2-text--${componentDef.usageHint ?? 'body'}`">
    {{ text }}
  </component>
</template>

<style scoped>
.a2-text {
  margin: 0;
  line-height: 1.5;
}
.a2-text--h1 { font-size: 2rem; font-weight: 700; }
.a2-text--h2 { font-size: 1.5rem; font-weight: 600; }
.a2-text--h3 { font-size: 1.25rem; font-weight: 600; }
.a2-text--h4 { font-size: 1.1rem; font-weight: 500; }
.a2-text--h5 { font-size: 1rem; font-weight: 500; }
.a2-text--h6 { font-size: 0.9rem; font-weight: 500; }
.a2-text--body { font-size: 1rem; }
.a2-text--caption { font-size: 0.85rem; color: #666; }
</style>
