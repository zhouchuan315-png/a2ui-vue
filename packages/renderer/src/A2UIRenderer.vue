<script setup lang="ts">
import { provide, ref, computed } from 'vue'
import { SurfaceManager, type ActionMessage, type Theme, type A2UIServerMessage } from '@nine1ie/a2ui-vue-core'
import SurfaceRenderer from './SurfaceRenderer.vue'
import { provideTheme } from './theme/provide'

const props = defineProps<{
  theme?: Theme
}>()

const emit = defineEmits<{
  action: [action: ActionMessage]
}>()

// Wire up theme system
const { cssVars } = provideTheme(props.theme)

const surfaceManager = new SurfaceManager()
const surfaces = ref(new Map(surfaceManager.getAllSurfaces().map(s => [s.id, s])))

surfaceManager.onAction((action) => {
  emit('action', action)
})

provide('a2ui:surfaceManager', surfaceManager)

function processMessage(message: A2UIServerMessage) {
  if (message.createSurface) {
    surfaceManager.createSurface(message.createSurface)
  }
  if (message.updateComponents?.surfaceId) {
    const surface = surfaceManager.getSurface(message.updateComponents.surfaceId)
    surface?.componentRegistry.updateComponents(message.updateComponents.components)
    if (surface) surface._version++
  }
  if (message.updateDataModel?.surfaceId) {
    surfaceManager.updateDataModel(
      message.updateDataModel.surfaceId,
      message.updateDataModel.path,
      message.updateDataModel.value,
    )
    const surface = surfaceManager.getSurface(message.updateDataModel.surfaceId)
    if (surface) surface._version++
  }
  if (message.deleteSurface) {
    surfaceManager.deleteSurface(message.deleteSurface.surfaceId)
  }
  surfaces.value = new Map(surfaceManager.getAllSurfaces().map(s => [s.id, s]))
}

function processJSON(json: string) {
  try {
    processMessage(JSON.parse(json))
  } catch (e) {
    console.error('[A2UI] Parse error:', e)
  }
}

function processJSONStream(chunk: string) {
  chunk.split('\n').filter(l => l.trim()).forEach(processJSON)
}

function reset() {
  surfaceManager.clear()
  surfaces.value = new Map()
}

defineExpose({ processMessage, processJSON, processJSONStream, reset })
</script>

<template>
  <div class="a2ui-renderer" :style="cssVars">
    <SurfaceRenderer
      v-for="[id, surface] of surfaces"
      :key="id + '-' + surface._version"
      :surface="surface"
    />
  </div>
</template>

<style>
/* Global reset for all A2UI components */
.a2ui-renderer {
  font-family: var(--a2-font-family);
  font-size: var(--a2-font-size-base);
  line-height: var(--a2-line-height);
  color: var(--a2-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
