// A2UI Surface Manager - lifecycle management for UI surfaces

import type {
  CreateSurfaceMessage,
  Theme,
  ActionMessage,
} from './types/protocol'
import { ComponentRegistry } from './component-registry'
import { deepMerge, getByPointer, setByPointer, deleteByPointer } from './data-model'

export interface SurfaceInstance {
  id: string
  catalogId: string
  theme?: Theme
  sendDataModel: boolean
  componentRegistry: ComponentRegistry
  dataModel: Record<string, any>
  createdAt: number
}

export type ActionHandler = (action: ActionMessage) => void

export class SurfaceManager {
  private surfaces = new Map<string, SurfaceInstance>()
  private actionHandler?: ActionHandler

  createSurface(msg: CreateSurfaceMessage): SurfaceInstance {
    const surface: SurfaceInstance = {
      id: msg.surfaceId,
      catalogId: msg.catalogId,
      theme: msg.theme,
      sendDataModel: msg.sendDataModel ?? false,
      componentRegistry: new ComponentRegistry(),
      dataModel: {},
      createdAt: Date.now(),
    }

    this.surfaces.set(msg.surfaceId, surface)
    return surface
  }

  deleteSurface(surfaceId: string): void {
    this.surfaces.delete(surfaceId)
  }

  getSurface(surfaceId: string): SurfaceInstance | undefined {
    return this.surfaces.get(surfaceId)
  }

  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId)
  }

  getAllSurfaces(): SurfaceInstance[] {
    return Array.from(this.surfaces.values())
  }

  clear(): void {
    this.surfaces.clear()
  }

  // Update data model with upsert semantics
  updateDataModel(surfaceId: string, path: string | undefined, value: any): void {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return

    if (!path || path === '/') {
      // Replace entire data model
      surface.dataModel = value ?? {}
    } else if (value === undefined) {
      // Delete key at path
      deleteByPointer(surface.dataModel, path)
    } else {
      const existing = getByPointer(surface.dataModel, path)
      if (typeof value === 'object' && value !== null && typeof existing === 'object' && existing !== null) {
        // Deep merge for objects
        setByPointer(surface.dataModel, path, deepMerge(existing, value))
      } else {
        // Direct set for primitives
        setByPointer(surface.dataModel, path, value)
      }
    }
  }

  // Set action handler for user interactions
  onAction(handler: ActionHandler): void {
    this.actionHandler = handler
  }

  // Dispatch user action
  dispatchAction(action: ActionMessage): void {
    this.actionHandler?.(action)
  }

  // Get data model snapshot for capability exchange
  getDataModelSnapshot(): Record<string, Record<string, any>> {
    const snapshot: Record<string, Record<string, any>> = {}
    for (const [id, surface] of this.surfaces) {
      snapshot[id] = surface.dataModel
    }
    return snapshot
  }
}
