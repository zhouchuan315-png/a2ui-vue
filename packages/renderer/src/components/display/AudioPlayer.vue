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

const url = computed(() => {
  const dynamic = props.componentDef.url
  if (!dynamic) return ''
  if (isDynamicValue(dynamic)) {
    if ('path' in dynamic && dynamic.path) return resolvePath(dynamic.path, dataModel.value, props.scope)
    return resolveLiteral(dynamic)
  }
  return String(dynamic)
})

const hasUrl = computed(() => Boolean(url.value.trim()))
</script>

<template>
  <div class="a2-audio-shell">
    <audio v-if="hasUrl" class="a2-audio" controls :src="url" />
    <div v-else class="a2-audio-empty">
      <span class="a2-audio-empty-icon">♫</span>
      <span class="a2-audio-empty-text">No audio source</span>
    </div>
  </div>
</template>

<style scoped>
.a2-audio-shell {
  width: 100%;
  min-height: 3rem;
  padding: var(--a2-space-2);
  border: 1px solid color-mix(in srgb, var(--a2-border-default) 70%, transparent);
  border-radius: var(--a2-radius-lg);
  background: var(--a2-bg-subtle);
  box-shadow: var(--a2-shadow-card);
}

.a2-audio {
  width: 100%;
  min-height: 3rem;
}

.a2-audio-empty {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  gap: var(--a2-space-2);
  color: var(--a2-text-muted);
}

.a2-audio-empty-icon {
  width: 1.8rem;
  height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--a2-bg-surface);
  color: var(--a2-color-primary);
  font-size: var(--a2-font-size-base);
}

.a2-audio-empty-text {
  font-size: var(--a2-font-size-sm);
}
</style>
