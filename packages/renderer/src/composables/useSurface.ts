// useSurface - Access current surface context

import { inject, ref, computed, type InjectionKey, provide, type Ref, type ComputedRef } from 'vue'
import type { SurfaceInstance, ComponentRegistry } from '@nine1ie/a2ui-vue-core'

export const SURFACE_KEY: InjectionKey<Ref<SurfaceInstance>> = Symbol('a2ui:surface')
export const REGISTRY_KEY: InjectionKey<ComputedRef<ComponentRegistry>> = Symbol('a2ui:registry')
export const DATAMODEL_KEY: InjectionKey<ComputedRef<Record<string, any>>> = Symbol('a2ui:dataModel')

export function useSurface() {
  const surface = inject(SURFACE_KEY)
  const registryRef = inject(REGISTRY_KEY)
  const dataModelRef = inject(DATAMODEL_KEY)

  if (!surface || !registryRef || !dataModelRef) {
    throw new Error('[A2UI] useSurface() must be used within a SurfaceRenderer')
  }

  return { surface, registry: registryRef, dataModel: dataModelRef }
}

export function provideSurface(surface: Ref<SurfaceInstance>) {
  provide(SURFACE_KEY, surface)
  provide(REGISTRY_KEY, computed(() => surface.value.componentRegistry))
  provide(DATAMODEL_KEY, computed(() => surface.value.dataModel))
}
