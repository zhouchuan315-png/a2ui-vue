// useDataModel - Resolve Dynamic* values against the surface data model

import { computed, type ComputedRef, inject, type Ref } from 'vue'
import {
  isDynamicValue,
  resolvePath,
  resolveLiteral,
  executeFunction,
  type DynamicValue,
  type Scope,
} from '@nine1ie/a2ui-vue-core'
import { DATAMODEL_KEY, REGISTRY_KEY } from './useSurface'

export function useDataModel() {
  const dataModel = inject(DATAMODEL_KEY)
  const registry = inject(REGISTRY_KEY)

  if (!dataModel || !registry) {
    throw new Error('[A2UI] useDataModel() must be used within a SurfaceRenderer')
  }

  function resolve(dynamic: DynamicValue, scope?: Scope): any {
    if (!isDynamicValue(dynamic)) return dynamic

    if ('path' in dynamic && dynamic.path) {
      return resolvePath(dynamic.path, dataModel!.value, scope)
    }

    if ('functionCall' in dynamic && dynamic.functionCall) {
      return executeFunction(dynamic.functionCall, dataModel!.value, scope)
    }

    return resolveLiteral(dynamic)
  }

  function reactiveResolve(dynamic: DynamicValue, scope?: Scope): ComputedRef<any> {
    return computed(() => resolve(dynamic, scope))
  }

  return { dataModel, resolve, reactiveResolve }
}
