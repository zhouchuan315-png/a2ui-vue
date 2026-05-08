import { describe, it, expect, vi } from 'vitest'
import { SurfaceManager } from '../src/surface'

describe('SurfaceManager', () => {
  it('creates and retrieves surfaces', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })

    expect(manager.hasSurface('s1')).toBe(true)
    expect(manager.getSurface('s1')?.catalogId).toBe('cat1')
    expect(manager.hasSurface('missing')).toBe(false)
  })

  it('deletes surfaces', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.deleteSurface('s1')

    expect(manager.hasSurface('s1')).toBe(false)
  })

  it('lists all surfaces', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.createSurface({ surfaceId: 's2', catalogId: 'cat2' })

    expect(manager.getAllSurfaces()).toHaveLength(2)
  })

  it('updates data model with path', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.updateDataModel('s1', undefined, { name: 'Alice' })

    expect(manager.getSurface('s1')?.dataModel).toEqual({ name: 'Alice' })
  })

  it('updates data model at nested path', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.updateDataModel('s1', undefined, { user: { name: 'Alice' } })
    manager.updateDataModel('s1', '/user/name', 'Bob')

    expect(manager.getSurface('s1')?.dataModel.user.name).toBe('Bob')
  })

  it('deletes data model key when value omitted', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.updateDataModel('s1', undefined, { a: 1, b: 2 })
    manager.updateDataModel('s1', '/a', undefined)

    expect(manager.getSurface('s1')?.dataModel).toEqual({ b: 2 })
  })

  it('dispatches actions', () => {
    const manager = new SurfaceManager()
    const handler = vi.fn()
    manager.onAction(handler)

    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.dispatchAction({
      name: 'click',
      surfaceId: 's1',
      sourceComponentId: 'btn',
      timestamp: new Date().toISOString(),
      context: {},
    })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'click' }))
  })

  it('gets data model snapshot', () => {
    const manager = new SurfaceManager()
    manager.createSurface({ surfaceId: 's1', catalogId: 'cat1' })
    manager.updateDataModel('s1', undefined, { x: 1 })

    const snapshot = manager.getDataModelSnapshot()
    expect(snapshot.s1).toEqual({ x: 1 })
  })
})
