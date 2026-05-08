import { describe, it, expect } from 'vitest'
import { ComponentRegistry } from '../src/component-registry'

describe('ComponentRegistry', () => {
  it('stores and retrieves components', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([
      { id: 'root', component: 'Column' },
      { id: 'a', component: 'Text' },
    ])

    expect(registry.getComponent('root')?.component).toBe('Column')
    expect(registry.getComponent('a')?.component).toBe('Text')
    expect(registry.getComponent('missing')).toBeUndefined()
  })

  it('upserts components', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([{ id: 'a', component: 'Text', text: 'v1' }])
    registry.updateComponents([{ id: 'a', component: 'Text', text: 'v2' }])

    expect(registry.getComponent('a')?.text).toBe('v2')
    expect(registry.size).toBe(1)
  })

  it('resolves explicitList children', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([
      { id: 'root', component: 'Column', children: { explicitList: ['a', 'b'] } },
      { id: 'a', component: 'Text' },
      { id: 'b', component: 'Button' },
    ])

    const children = registry.resolveChildren('root')
    expect(children).toHaveLength(2)
    expect(children[0].component).toBe('Text')
    expect(children[1].component).toBe('Button')
  })

  it('returns empty for missing children', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([{ id: 'leaf', component: 'Text' }])

    expect(registry.resolveChildren('leaf')).toEqual([])
    expect(registry.resolveChildren('missing')).toEqual([])
  })

  it('resolves template children from data model', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([
      {
        id: 'list',
        component: 'List',
        children: { template: { componentId: 'item', dataBinding: '/items' } },
      },
      { id: 'item', component: 'Text', text: { path: 'name' } },
    ])

    const dataModel = { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }
    const children = registry.resolveChildren('list', dataModel)

    expect(children).toHaveLength(3)
    expect(children[0].id).toBe('item__0')
    expect(children[2].id).toBe('item__2')
  })

  it('returns empty for template with non-array data', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([
      {
        id: 'list',
        component: 'List',
        children: { template: { componentId: 'item', dataBinding: '/notarray' } },
      },
    ])

    expect(registry.resolveChildren('list', { notarray: 'string' })).toEqual([])
  })

  it('getAll and clear', () => {
    const registry = new ComponentRegistry()
    registry.updateComponents([
      { id: 'a', component: 'Text' },
      { id: 'b', component: 'Button' },
    ])

    expect(registry.getAll()).toHaveLength(2)
    registry.clear()
    expect(registry.size).toBe(0)
  })
})
