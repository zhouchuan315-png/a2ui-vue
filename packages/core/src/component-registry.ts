// A2UI Component Registry - Adjacency List management

import type { ComponentDef, ChildList } from './types/protocol'
import { isTemplateChildList } from './types/protocol'
import type { Scope } from './data-model'
import { getByPointer } from './data-model'

export class ComponentRegistry {
  private components = new Map<string, ComponentDef>()

  // Merge new component definitions (upsert)
  updateComponents(components: ComponentDef[]): void {
    for (const comp of components) {
      this.components.set(comp.id, comp)
    }
  }

  getComponent(id: string): ComponentDef | undefined {
    return this.components.get(id)
  }

  hasComponent(id: string): boolean {
    return this.components.has(id)
  }

  get size(): number {
    return this.components.size
  }

  // Resolve children of a component, returns ordered ComponentDef list
  resolveChildren(id: string, dataModel?: any, scope?: Scope): ComponentDef[] {
    const comp = this.components.get(id)
    if (!comp) return []

    const childList = comp.children as ChildList | undefined
    if (!childList) return []

    if (isTemplateChildList(childList)) {
      return this.resolveTemplate(childList, dataModel, scope)
    }

    // explicitList
    return (childList.explicitList ?? [])
      .map((childId) => this.components.get(childId))
      .filter((c): c is ComponentDef => c != null)
  }

  // Resolve template-based children (data-bound lists)
  private resolveTemplate(
    templateChild: { template: { componentId: string; dataBinding: string } },
    dataModel?: any,
    scope?: Scope
  ): ComponentDef[] {
    if (!dataModel) return []

    const { componentId, dataBinding } = templateChild.template
    const array = getByPointer(dataModel, dataBinding)
    if (!Array.isArray(array)) return []

    return array.map((_, index) => {
      const base = this.components.get(componentId)
      return {
        ...base,
        id: `${componentId}__${index}`,
        _templateIndex: index,
        _templateSource: componentId,
      } as ComponentDef
    })
  }

  // Get all components as a flat array
  getAll(): ComponentDef[] {
    return Array.from(this.components.values())
  }

  // Clear all components
  clear(): void {
    this.components.clear()
  }
}
