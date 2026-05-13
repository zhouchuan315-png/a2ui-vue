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
  <div class="a2-video-shell">
    <video v-if="hasUrl" class="a2-video" controls :src="url" />
    <div v-else class="a2-video-empty">
      <span class="a2-video-empty-icon">▶</span>
      <span class="a2-video-empty-text">No video source</span>
    </div>
  </div>
</template>

<style scoped>
.a2-video-shell {
  width: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--a2-border-default) 70%, transparent);
  border-radius: var(--a2-radius-lg);
  background: linear-gradient(180deg, #14111d 0%, #262237 100%);
  box-shadow: var(--a2-shadow-card);
}

.a2-video {
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 14rem;
  background: transparent;
}

.a2-video-empty {
  aspect-ratio: 16 / 9;
  min-height: 14rem;
  display: grid;
  place-items: center;
  gap: var(--a2-space-2);
  padding: var(--a2-space-5);
  color: rgba(255, 255, 255, 0.78);
}

.a2-video-empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: var(--a2-font-size-xl);
}

.a2-video-empty-text {
  font-size: var(--a2-font-size-sm);
}
</style>
