<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentDef } from '@nine1ie/a2ui-vue-core'
import { isDynamicValue, resolvePath, resolveLiteral } from '@nine1ie/a2ui-vue-core'
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
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
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
  line-height: var(--a2-line-height);
  color: var(--a2-text-primary);
}
.a2-text--h1 { font-size: var(--a2-font-size-4xl); font-weight: var(--a2-font-weight-bold); line-height: 1.05; letter-spacing: -0.03em; }
.a2-text--h2 { font-size: var(--a2-font-size-3xl); font-weight: var(--a2-font-weight-bold); line-height: 1.1; letter-spacing: -0.025em; }
.a2-text--h3 { font-size: var(--a2-font-size-2xl); font-weight: var(--a2-font-weight-semibold); line-height: 1.15; letter-spacing: -0.02em; }
.a2-text--h4 { font-size: var(--a2-font-size-xl); font-weight: var(--a2-font-weight-semibold); line-height: 1.2; }
.a2-text--h5 { font-size: var(--a2-font-size-lg); font-weight: var(--a2-font-weight-medium); line-height: 1.3; }
.a2-text--h6 { font-size: var(--a2-font-size-base); font-weight: var(--a2-font-weight-semibold); line-height: 1.35; }
.a2-text--body { font-size: var(--a2-font-size-base); color: var(--a2-text-secondary); }
.a2-text--caption { font-size: var(--a2-font-size-sm); color: var(--a2-text-muted); letter-spacing: 0.01em; }
</style>
