import { beforeEach, describe, expect, it, vi } from 'vitest'
import { layoutSingle, setResolver, setupElement } from '../sliced-areas.test-utils'

describe('sliced-areas id reconciliation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('preserves explicit ids and updates the counter', () => {
    const el = setupElement()
    setResolver(el)

    const layout = {
      areas: [
        { id: 'area-3', tag: 'left', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { id: 'custom', tag: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      ],
    }

    el.layout = layout

    const ids = el.layout?.areas.map((area) => area.id).sort()
    expect(ids).toEqual(['area-3', 'custom'])

    const nextAreaId = (el as unknown as { nextAreaId: () => string }).nextAreaId.bind(el)
    expect(nextAreaId()).toBe('area-4')
  })

  it('rejects duplicate ids and auto-assigns missing ids', () => {
    const el = setupElement()
    const assignAreaIds = (el as unknown as { assignAreaIds: (layout: any) => any }).assignAreaIds.bind(
      el,
    )

    expect(() =>
      assignAreaIds({
        areas: [
          { id: 'dup', tag: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
          { id: 'dup', tag: 'b', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
        ],
      }),
    ).toThrow(/Duplicate area ID/)

    const assigned = assignAreaIds({
      areas: [
        { tag: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
        { tag: 'b', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
      ],
    })
    expect(assigned).toHaveLength(2)
    expect(assigned[0]?.id).toMatch(/^area-/)

    const withPattern = assignAreaIds({
      areas: [{ id: 'area-7', tag: 'c', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    })
    expect(withPattern[0]?.id).toBe('area-7')
    const nextAreaId = (el as unknown as { nextAreaId: () => string }).nextAreaId.bind(el)
    expect(nextAreaId()).toBe('area-8')
  })

  it('reuses wrappers and restores missing area nodes', () => {
    const el = setupElement()
    setResolver(el)

    const layout = {
      areas: [{ id: 'area-1', tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    }
    el.layout = layout

    const wrapper = el.querySelector('.sliced-areas-area') as HTMLDivElement | null
    expect(wrapper).not.toBeNull()

    const content = Array.from(wrapper?.children ?? []).find(
      (child) => !child.hasAttribute('data-sliced-areas-internal'),
    )
    content?.remove()

    const updatedLayout = {
      areas: [{ id: 'area-1', tag: 'main', rect: { left: 0, right: 1, top: 0.9, bottom: 0 } }],
    }
    el.layout = updatedLayout

    const nextWrapper = el.querySelector('.sliced-areas-area')
    expect(nextWrapper).toBe(wrapper)
    expect(el.querySelector('[data-area-id="area-1"]')).not.toBeNull()
  })

  it('replaces wrapper content when a new node is supplied', () => {
    const el = setupElement()
    setResolver(el)

    const layout = {
      areas: [{ id: 'area-1', tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    }
    el.layout = layout

    const wrapper = el.querySelector('.sliced-areas-area') as HTMLDivElement | null
    if (!wrapper) {
      throw new Error('Expected wrapper for reconciliation')
    }
    const currentNode = Array.from(wrapper.children).find(
      (child) => !child.hasAttribute('data-sliced-areas-internal'),
    )
    if (!currentNode) {
      throw new Error('Expected area node for reconciliation')
    }

    const expectedNode = document.createElement('div')
    expectedNode.dataset.areaId = 'area-1'
    const stubMap = new Map<string, HTMLElement>([['area-1', expectedNode]])
    const collectSpy = vi
      .spyOn(el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }, 'collectAreaNodes')
      .mockReturnValue(stubMap)

    const render = (el as unknown as { render: () => void }).render.bind(el)
    render()

    expect(wrapper.contains(currentNode)).toBe(false)
    expect(wrapper.contains(expectedNode)).toBe(true)
    collectSpy.mockRestore()
  })

  it('reconciles wrappers and no-ops without a root', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()

    const areaNodes = (el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }).collectAreaNodes.bind(
      el,
    )()
    const reconcile = (el as unknown as { reconcileAreaWrappers: (nodes: Map<string, HTMLElement>) => void })
      .reconcileAreaWrappers.bind(el)
    reconcile(areaNodes)

    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    reconcile(areaNodes)
  })

  it('updates the counter for area-N ids', () => {
    const el = setupElement()
    const assignAreaIds = (el as unknown as { assignAreaIds: (layout: any) => any }).assignAreaIds.bind(
      el,
    )
    assignAreaIds({
      areas: [{ id: 'area-12', tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    })
    expect((el as unknown as { areaCounter: number }).areaCounter).toBe(12)
    const nextAreaId = (el as unknown as { nextAreaId: () => string }).nextAreaId.bind(el)
    expect(nextAreaId()).toBe('area-13')
  })

  it('skips wrappers without handle ids during reconciliation', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()

    const wrapper = el.querySelector('.sliced-areas-area') as HTMLElement | null
    const handle = wrapper?.querySelector('.sliced-areas-corner') as HTMLElement | null
    if (!wrapper || !handle) {
      throw new Error('Expected wrapper handle for reconciliation')
    }
    handle.removeAttribute('data-area-id')

    const areaNodes = (el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }).collectAreaNodes.bind(
      el,
    )()
    const reconcile = (el as unknown as { reconcileAreaWrappers: (nodes: Map<string, HTMLElement>) => void })
      .reconcileAreaWrappers.bind(el)
    reconcile(areaNodes)
  })

  it('covers granular event branches and missing graph guard', () => {
    const el = setupElement()
    const emitGranularEvents = (
      el as unknown as {
        emitGranularEvents: (
          diff: { added: string[]; removed: string[]; updated: string[] },
          oldGraph: any,
          oldTags: Map<string, string>,
        ) => void
      }
    ).emitGranularEvents.bind(el)

    emitGranularEvents({ added: ['ghost'], removed: ['ghost'], updated: ['ghost'] }, { areas: {} }, new Map())

    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for event branches')
    }
    const oldGraph = { ...graph, areas: {} }
    emitGranularEvents({ added: [], removed: [], updated: [areaId] }, oldGraph, new Map())

    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.delete(areaId)
    emitGranularEvents({ added: [areaId, 'ghost'], removed: [areaId], updated: [areaId, 'ghost'] }, graph, new Map())
  })

  it('covers layout diff guards with missing areas', () => {
    const el = setupElement()
    const calculateLayoutDiff = (
      el as unknown as {
        calculateLayoutDiff: (
          oldGraph: any,
          oldTags: Map<string, string>,
          newGraph: any,
          newTags: Map<string, string>,
        ) => { added: string[]; removed: string[]; updated: string[] }
      }
    ).calculateLayoutDiff.bind(el)

    const newGraph = (el as unknown as { buildGraphFromRects: (items: any[]) => any }).buildGraphFromRects([
      { id: 'ghost', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
    ])
    const oldGraph = { verts: {}, edges: {}, areas: { ghost: undefined as unknown as any } }
    const diff = calculateLayoutDiff(oldGraph, new Map(), newGraph, new Map())
    expect(diff.added).toEqual([])
    const initialDiff = calculateLayoutDiff(null, new Map(), newGraph, new Map())
    expect(initialDiff.added).toEqual(['ghost'])
  })

  it('emits granular events for area changes but skips first render and maximize', () => {
    const el = setupElement()
    setResolver(el)

    const added: any[] = []
    const removed: any[] = []
    const updated: any[] = []

    el.addEventListener('sliced-areas:area-added', (event) => added.push(event))
    el.addEventListener('sliced-areas:area-removed', (event) => removed.push(event))
    el.addEventListener('sliced-areas:area-updated', (event) => updated.push(event))

    el.layout = layoutSingle()
    expect(added).toHaveLength(0)
    expect(removed).toHaveLength(0)
    expect(updated).toHaveLength(0)

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id for events')
    }
    el.split(areaId, 'right')
    expect(added).toHaveLength(1)

    const ids = Object.keys((el as unknown as { graph: any }).graph.areas)
    const removeId = ids.find((id) => id !== areaId) ?? ids[0]
    if (!removeId) {
      throw new Error('Expected area id for removal')
    }
    el.close(removeId)
    expect(removed).toHaveLength(1)

    const updatedBefore = updated.length
    el.retag(areaId, 'updated')
    expect(updated.length).toBeGreaterThan(updatedBefore)

    const addedBeforeMax = added.length
    const removedBeforeMax = removed.length
    const updatedBeforeMax = updated.length
    el.maximize(areaId)
    el.restore()
    expect(added).toHaveLength(addedBeforeMax)
    expect(removed).toHaveLength(removedBeforeMax)
    expect(updated).toHaveLength(updatedBeforeMax)
  })
})
