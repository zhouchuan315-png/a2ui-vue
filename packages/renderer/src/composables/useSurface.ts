// useSurface - Access current surface context

import { inject, ref, type InjectionKey, provide, type Ref } from 'vue'
import type { SurfaceInstance, ComponentRegistry } from '@a2ui/vue-core'

export const SURFACE_KEY: InjectionKey<Ref<SurfaceInstance>> = Symbol('a2ui:surface')
export const REGISTRY_KEY: InjectionKey<ComponentRegistry> = Symbol('a2ui:registry')
export const DATAMODEL_KEY: InjectionKey<Ref<Record<string, any>>> = Symbol('a2ui:dataModel')

export function useSurface() {
  const surface = inject(SURFACE_KEY)
  const registry = inject(REGISTRY_KEY)
  const dataModel = inject(DATAMODEL_KEY)

  if (!surface || !registry || !dataModel) {
    throw new Error('[A2UI] useSurface() must be used within a SurfaceRenderer')
  }

  return { surface, registry, dataModel }
}

export function provideSurface(surface: Ref<SurfaceInstance>) {
  provide(SURFACE_KEY, surface)
  provide(REGISTRY_KEY, surface.value.componentRegistry)
  provide(DATAMODEL_KEY, ref(surface.value.dataModel))
}
