// useA2UI - Main composable for A2UI rendering

import { ref, provide, shallowRef, onUnmounted } from 'vue'
import {
  SurfaceManager,
  parseMessage,
  type A2UIServerMessage,
  type SurfaceInstance,
  type Theme,
  type ActionMessage,
} from '@nine1ie/a2ui-vue-core'

export interface A2UIOptions {
  onAction?: (action: ActionMessage) => void
}

export function useA2UI(options?: A2UIOptions) {
  const surfaceManager = new SurfaceManager()
  const surfaces = ref(new Map<string, SurfaceInstance>())

  if (options?.onAction) {
    surfaceManager.onAction(options.onAction)
  }

  // Provide surface manager to child components
  provide('a2ui:surfaceManager', surfaceManager)

  function processMessage(message: A2UIServerMessage) {
    if (message.createSurface) {
      const surface = surfaceManager.createSurface(message.createSurface)
      surfaces.value = new Map(surfaceManager.getAllSurfaces().map((s) => [s.id, s]))
    }

    if (message.updateComponents && message.updateComponents.surfaceId) {
      const surface = surfaceManager.getSurface(message.updateComponents.surfaceId)
      if (surface) {
        surface.componentRegistry.updateComponents(message.updateComponents.components)
        // Trigger reactivity
        surfaces.value = new Map(surfaceManager.getAllSurfaces().map((s) => [s.id, s]))
      }
    }

    if (message.updateDataModel && message.updateDataModel.surfaceId) {
      surfaceManager.updateDataModel(
        message.updateDataModel.surfaceId,
        message.updateDataModel.path,
        message.updateDataModel.value
      )
      surfaces.value = new Map(surfaceManager.getAllSurfaces().map((s) => [s.id, s]))
    }

    if (message.deleteSurface) {
      surfaceManager.deleteSurface(message.deleteSurface.surfaceId)
      surfaces.value = new Map(surfaceManager.getAllSurfaces().map((s) => [s.id, s]))
    }
  }

  function processJSON(json: string) {
    try {
      const message = parseMessage(json)
      processMessage(message)
    } catch (e) {
      console.error('[A2UI] Parse error:', e)
    }
  }

  function processJSONStream(chunk: string) {
    const lines = chunk.split('\n').filter((l) => l.trim())
    for (const line of lines) {
      processJSON(line)
    }
  }

  function destroy() {
    for (const surface of surfaceManager.getAllSurfaces()) {
      surfaceManager.deleteSurface(surface.id)
    }
    surfaces.value = new Map()
  }

  onUnmounted(destroy)

  return {
    surfaces,
    surfaceManager,
    processMessage,
    processJSON,
    processJSONStream,
    destroy,
  }
}
