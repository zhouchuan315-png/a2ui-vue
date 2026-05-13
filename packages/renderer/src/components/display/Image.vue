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
const hasUrl = computed(() => Boolean(String(url.value ?? '').trim()))
</script>

<template>
  <div class="a2-image-frame">
    <img
      v-if="hasUrl"
      class="a2-image"
      :src="url"
      :alt="alt"
      loading="lazy"
    />
    <div v-else class="a2-image-empty">
      <span class="a2-image-empty-icon">◌</span>
      <span class="a2-image-empty-text">Image unavailable</span>
    </div>
  </div>
</template>

<style scoped>
.a2-image-frame {
  width: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--a2-border-default) 70%, transparent);
  border-radius: var(--a2-radius-lg);
  box-shadow: var(--a2-shadow-card);
  background: var(--a2-bg-subtle);
}

.a2-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.a2-image-empty {
  min-height: 12rem;
  display: grid;
  place-items: center;
  gap: var(--a2-space-2);
  padding: var(--a2-space-5);
  color: var(--a2-text-muted);
  text-align: center;
}

.a2-image-empty-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--a2-bg-surface);
  color: var(--a2-color-primary);
  font-size: var(--a2-font-size-lg);
}

.a2-image-empty-text {
  font-size: var(--a2-font-size-sm);
}
</style>
