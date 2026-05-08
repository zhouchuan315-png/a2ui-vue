// @a2ui/vue - A2UI v0.9 Vue 3 Renderer

export { default as A2UIRenderer } from './A2UIRenderer.vue'
export { default as SurfaceRenderer } from './SurfaceRenderer.vue'
export { default as ComponentResolver } from './ComponentResolver.vue'
export { useA2UI } from './composables/useA2UI'
export { useSurface } from './composables/useSurface'
export { useDataModel } from './composables/useDataModel'
export { registerComponent, getComponentType } from './component-map'

// Re-export core types
export type * from '@a2ui/vue-core'
