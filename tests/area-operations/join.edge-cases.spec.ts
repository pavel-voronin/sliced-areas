import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  layoutSingle,
  layoutTwoHorizontal,
  layoutTwoVertical,
  setResolver,
  setupElement,
  type Rect,
} from '../sliced-areas.test-utils'

describe('sliced-areas branch coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('covers join, trim, and area rect helpers', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { id: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      ],
    )
    const joinAreas = (el as unknown as { joinAreas: (...args: any[]) => any }).joinAreas.bind(el)
    expect(joinAreas(graph, 'missing', 'b')).toBeNull()
    expect(joinAreas(graph, 'a', 'missing')).toBeNull()

    const graphNoOverlap = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'c', rect: { left: 0, right: 0.5, top: 1, bottom: 0.6 } },
        { id: 'd', rect: { left: 0.5, right: 1, top: 0.4, bottom: 0 } },
      ],
    )
    expect(joinAreas(graphNoOverlap, 'c', 'd')).toBeNull()

    const trim = (el as unknown as { trimAreaToRange: (...args: any[]) => any }).trimAreaToRange.bind(el)
    expect(trim(graph, 'missing', 'horizontal', 0.2, 0.8).created).toHaveLength(0)
    trim(graph, 'a', 'horizontal', 0.2, 0.8)
    trim(graph, 'a', 'vertical', 0.2, 0.8)

    const splitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    splitSpy.mockReturnValue(null)
    trim(graph, 'a', 'horizontal', 0.2, 0.8)
    trim(graph, 'a', 'vertical', 0.2, 0.8)
    splitSpy.mockRestore()

    const setAreaRect = (el as unknown as { setAreaRect: (g: any, id: string, r: Rect) => any })
      .setAreaRect.bind(el)
    expect(setAreaRect(graph, 'missing', { left: 0, right: 1, top: 1, bottom: 0 })).toBe(graph)

    const moveArea = (el as unknown as { moveArea: (...args: any[]) => any }).moveArea.bind(el)
    expect(moveArea(graph, 'a', 'a', { left: 0, right: 1, top: 1, bottom: 0 }, { left: 0, right: 1, top: 1, bottom: 0 })).toBeNull()

    const replaceArea = (el as unknown as { replaceArea: (...args: any[]) => any }).replaceArea.bind(el)
    expect(replaceArea(graph, 'a', 'a')).toBeNull()
    expect(replaceArea(graph, 'missing', 'a')).toBeNull()
    expect(replaceArea(graph, 'a', 'missing')).toBeNull()
  })

  it('covers rename, detach, join alignment, and canJoin guards', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    const rename = (el as unknown as { renameAreaId: (g: any, f: string, t: string) => any })
      .renameAreaId.bind(el)
    expect(rename(graph, 'area', 'area')).toBe(graph)
    expect(rename(graph, 'missing', 'other')).toBe(graph)

    const node = document.createElement('div')
    node.dataset.areaId = 'area'
    el.appendChild(node)
    const detach = (el as unknown as { detachAreaNode: (id: string) => void }).detachAreaNode.bind(
      el,
    )
    detach('area')
    detach('missing')

    const alignedGraph = (el as unknown as { buildGraphFromRects: (items: any) => any })
      .buildGraphFromRects([
        { id: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
        { id: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
      ])
    const joinAligned = (el as unknown as { joinAreasAligned: (...args: any[]) => any })
      .joinAreasAligned.bind(el)
    expect(joinAligned(alignedGraph, 'missing', 'bottom')).toBeNull()
    expect(joinAligned(alignedGraph, 'top', 'missing')).toBeNull()
    const joined = joinAligned(alignedGraph, 'bottom', 'top')
    expect(joined).toBeTruthy()

    const canJoin = (el as unknown as { canJoin: (...args: any[]) => boolean }).canJoin.bind(el)
    ;(el as unknown as { graph: any }).graph = null
    expect(canJoin('a', 'b')).toBe(false)
    ;(el as unknown as { graph: any }).graph = alignedGraph
    expect(canJoin('missing', 'top')).toBe(false)
    expect(canJoin('top', 'missing')).toBe(false)
  })

  it('covers join area overlap and alignment branches', () => {
    const el = setupElement()
    const joinAreas = (el as unknown as { joinAreas: (...args: any[]) => any }).joinAreas.bind(el)

    const graphNoYOverlap = (el as unknown as { buildGraphFromRects: (items: any) => any })
      .buildGraphFromRects([
        { id: 'left', rect: { left: 0, right: 0.5, top: 0.4, bottom: 0 } },
        { id: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0.6 } },
      ])
    expect(joinAreas(graphNoYOverlap, 'left', 'right')).toBeNull()

    const graphNoXOverlap = (el as unknown as { buildGraphFromRects: (items: any) => any })
      .buildGraphFromRects([
        { id: 'top', rect: { left: 0, right: 0.4, top: 1, bottom: 0.5 } },
        { id: 'bottom', rect: { left: 0.6, right: 1, top: 0.5, bottom: 0 } },
      ])
    expect(joinAreas(graphNoXOverlap, 'top', 'bottom')).toBeNull()

    const base = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { id: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      ],
    )
    const trimSpy = vi.spyOn(el as unknown as { trimAreaToRange: (...args: any[]) => any }, 'trimAreaToRange')
    trimSpy.mockImplementationOnce(() => ({ graph: { ...base, areas: { b: base.areas.b } }, keptAreaId: 'a', created: [] }))
    expect(joinAreas(base, 'a', 'b')).toBeNull()
    trimSpy.mockRestore()

    const trimSpyB = vi.spyOn(el as unknown as { trimAreaToRange: (...args: any[]) => any }, 'trimAreaToRange')
    trimSpyB.mockImplementationOnce(() => ({ graph: base, keptAreaId: 'a', created: [] }))
    trimSpyB.mockImplementationOnce(() => ({ graph: { ...base, areas: { a: base.areas.a } }, keptAreaId: 'b', created: [] }))
    expect(joinAreas(base, 'a', 'b')).toBeNull()
    trimSpyB.mockRestore()

    const alignedSpy = vi.spyOn(el as unknown as { joinAreasAligned: (...args: any[]) => any }, 'joinAreasAligned')
    alignedSpy.mockReturnValue(null)
    expect(joinAreas(base, 'a', 'b')).toBeNull()
    alignedSpy.mockRestore()
  })

  it('covers trimAreaToRange updated/missing branches', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    const trim = (el as unknown as { trimAreaToRange: (...args: any[]) => any }).trimAreaToRange.bind(el)
    const splitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    splitSpy.mockImplementation(() => ({ ...graph, areas: {} }))
    trim(graph, 'area', 'horizontal', 0.2, 0.8)
    trim(graph, 'area', 'vertical', 0.2, 0.8)
    splitSpy.mockRestore()

    const splitSpyNull = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    splitSpyNull.mockReturnValue(null)
    trim(graph, 'area', 'vertical', 0.2, 0.8)
    splitSpyNull.mockRestore()
  })

  it('covers join alignment and offset guards', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
        { id: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
      ],
    )
    const joinAligned = (el as unknown as { joinAreasAligned: (...args: any[]) => any }).joinAreasAligned.bind(el)
    const noAdj = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'a', rect: { left: 0, right: 0.4, top: 1, bottom: 0.6 } },
        { id: 'b', rect: { left: 0.6, right: 1, top: 0.4, bottom: 0 } },
      ],
    )
    expect(joinAligned(noAdj, 'a', 'b')).toBeNull()
    expect(joinAligned(graph, 'top', 'bottom')).toBeTruthy()

    const areAligned = (el as unknown as { areAreasAligned: (...args: any[]) => any }).areAreasAligned.bind(el)
    const badGraph = { verts: {}, edges: {}, areas: { a: { id: 'a', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' }, b: { id: 'b', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' } } }
    expect(areAligned(badGraph as any, badGraph.areas.a as any, badGraph.areas.b as any, 'east')).toBe(false)
  })

  it('covers findJoinTargetAtPoint and join labels', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [leftId, rightId] = ids
    if (!leftId || !rightId) {
      throw new Error('Expected areas for join target')
    }

    const findJoinTarget = (el as unknown as { findJoinTargetAtPoint: (...args: any[]) => any })
      .findJoinTargetAtPoint.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(findJoinTarget(leftId, 10, 10)).toBeNull()
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = el.querySelector('.sliced-areas-root')
    expect(findJoinTarget('missing', 10, 10)).toBeNull()

    const targetEast = findJoinTarget(leftId, 52, 50)
    expect(targetEast).toBeTruthy()
    const targetEastFar = findJoinTarget(leftId, 90, 10)
    expect(targetEastFar).toBeNull()

    el.layout = layoutTwoHorizontal()
    const hGraph = (el as unknown as { graph: any }).graph
    const hIds = Object.keys(hGraph.areas)
    const [topId, bottomId] = hIds
    if (!topId || !bottomId) {
      throw new Error('Expected areas for join target north')
    }
    const targetNorth = findJoinTarget(bottomId, 50, 45)
    expect(targetNorth).toBeTruthy()

    const joinLeft = (el as unknown as { getJoinLabel: (d: any) => string }).getJoinLabel('left')
    expect(joinLeft).toContain('Join')
  })

  it('covers join overlap and merge branches', () => {
    const el = setupElement()
    const buildGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects.bind(el)
    const joinAreas = (el as unknown as { joinAreas: (...args: any[]) => any }).joinAreas.bind(el)

    const westGraph = buildGraph([
      { id: 'a', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0.3 } },
      { id: 'b', rect: { left: 0.5, right: 1, top: 0.3, bottom: 0.1 } },
    ])
    const orientSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    orientSpy.mockReturnValue('west')
    expect(joinAreas(westGraph, 'a', 'b')).toBeNull()
    orientSpy.mockRestore()

    const northGraph = buildGraph([
      { id: 'a', rect: { left: 0.1, right: 0.3, top: 0.5, bottom: 0 } },
      { id: 'b', rect: { left: 0.3, right: 0.5, top: 1, bottom: 0.5 } },
    ])
    const orientNorthSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    orientNorthSpy.mockReturnValue('north')
    expect(joinAreas(northGraph, 'a', 'b')).toBeNull()
    orientNorthSpy.mockRestore()

    const trimGraph = buildGraph([
      { id: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
      { id: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
    ])
    const orientSouthSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    orientSouthSpy.mockReturnValue('south')
    const trimSpy = vi.spyOn(el as unknown as { trimAreaToRange: (...args: any[]) => any }, 'trimAreaToRange')
    const graphNoA = { ...trimGraph, areas: { ...trimGraph.areas } }
    delete graphNoA.areas.a
    trimSpy.mockReturnValueOnce({ graph: graphNoA, keptAreaId: 'a', created: [] })
    expect(joinAreas(trimGraph, 'a', 'b')).toBeNull()
    trimSpy.mockReset()
    const graphNoB = { ...trimGraph, areas: { ...trimGraph.areas } }
    delete graphNoB.areas.b
    trimSpy
      .mockReturnValueOnce({ graph: trimGraph, keptAreaId: 'a', created: [] })
      .mockReturnValueOnce({ graph: graphNoB, keptAreaId: 'b', created: [] })
    expect(joinAreas(trimGraph, 'a', 'b')).toBeNull()
    trimSpy.mockRestore()
    orientSouthSpy.mockRestore()

    const joinAligned = (el as unknown as { joinAreasAligned: (...args: any[]) => any }).joinAreasAligned.bind(el)
    const stacked = buildGraph([
      { id: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
      { id: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
    ])
    expect(joinAligned(stacked, 'top', 'bottom')).toBeTruthy()
    const alignSpy = vi.spyOn(el as unknown as { areAreasAligned: (...args: any[]) => boolean }, 'areAreasAligned')
    const orientAlignSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    orientAlignSpy.mockReturnValue('south')
    alignSpy.mockReturnValue(true)
    joinAligned(stacked, 'top', 'bottom')
    orientAlignSpy.mockRestore()
    alignSpy.mockRestore()
    const orientInvalidSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    const alignInvalidSpy = vi.spyOn(el as unknown as { areAreasAligned: (...args: any[]) => boolean }, 'areAreasAligned')
    orientInvalidSpy.mockReturnValue('invalid')
    alignInvalidSpy.mockReturnValue(true)
    joinAligned(stacked, 'top', 'bottom')
    orientInvalidSpy.mockRestore()
    alignInvalidSpy.mockRestore()

    const stackedGraph = buildGraph([
      { id: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
      { id: 'b', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
    ])
    const orientStackNullSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    const trimStackNullSpy = vi.spyOn(el as unknown as { trimAreaToRange: (...args: any[]) => any }, 'trimAreaToRange')
    const graphNoAStack = { ...stackedGraph, areas: { ...stackedGraph.areas } }
    delete graphNoAStack.areas.a
    orientStackNullSpy.mockReturnValue('south')
    trimStackNullSpy.mockReturnValueOnce({ graph: graphNoAStack, keptAreaId: 'a', created: [] })
    expect(joinAreas(stackedGraph, 'a', 'b')).toBeNull()
    trimStackNullSpy.mockRestore()
    orientStackNullSpy.mockRestore()
    const orientStackSpy = vi.spyOn(el as unknown as { getOrientation: (...args: any[]) => any }, 'getOrientation')
    const trimStackSpy = vi.spyOn(el as unknown as { trimAreaToRange: (...args: any[]) => any }, 'trimAreaToRange')
    const graphNoBStack = { ...stackedGraph, areas: { ...stackedGraph.areas } }
    delete graphNoBStack.areas.b
    orientStackSpy.mockReturnValue('south')
    trimStackSpy
      .mockReturnValueOnce({ graph: stackedGraph, keptAreaId: 'a', created: [] })
      .mockReturnValueOnce({ graph: graphNoBStack, keptAreaId: 'b', created: [] })
    expect(joinAreas(stackedGraph, 'a', 'b')).toBeNull()
    trimStackSpy.mockRestore()
    orientStackSpy.mockRestore()

    const computeSharedSegments = (
      el as unknown as { computeSharedSegments: (s: Array<{ start: number; end: number }>) => any }
    ).computeSharedSegments.bind(el)
    computeSharedSegments([
      { start: 0, end: 1 },
      { start: 0, end: 1 },
    ])
    const originalSort = Array.prototype.sort
    Array.prototype.sort = function () {
      return originalSort.call(this, (a: any, b: any) => (a.pos ?? 0) - (b.pos ?? 0))
    }
    computeSharedSegments([
      { start: 0, end: 1 },
      { start: 1 - 0.0000005, end: 2 },
    ])
    Array.prototype.sort = originalSort

    const mergeHoleCells = (el as unknown as { mergeHoleCells: (c: Rect[]) => Rect[] }).mergeHoleCells.bind(el)
    mergeHoleCells([
      { left: 0, right: 0.5, top: 1, bottom: 0.5 },
      { left: 0.5, right: 1, top: 1, bottom: 0.5 },
    ])
    mergeHoleCells([
      { left: 0.5, right: 1, top: 1, bottom: 0.5 },
      { left: 0, right: 0.5, top: 1, bottom: 0.5 },
    ])
    mergeHoleCells([
      { left: 0, right: 0.5, top: 1, bottom: 0.6 },
      { left: 0.5, right: 1, top: 0.8, bottom: 0.2 },
    ])

    const collectAdjacentNeighbors = (
      el as unknown as { collectAdjacentNeighbors: (g: any, h: Rect, s: any) => any[] }
    ).collectAdjacentNeighbors.bind(el)
    const hole = { left: 0.5, right: 0.7, top: 0.8, bottom: 0.7 }
    const westGap = buildGraph([{ id: 'w', rect: { left: 0, right: 0.5, top: 0.4, bottom: 0.3 } }])
    collectAdjacentNeighbors(westGap, hole, 'west')
    const eastGap = buildGraph([{ id: 'e', rect: { left: 0.7, right: 1, top: 0.4, bottom: 0.3 } }])
    collectAdjacentNeighbors(eastGap, hole, 'east')
  })

  it('covers join target branches', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [leftId, rightId] = ids
    if (!leftId || !rightId) {
      throw new Error('Expected areas for join target branches')
    }

    const findJoinTarget = (el as unknown as { findJoinTargetAtPoint: (...args: any[]) => any })
      .findJoinTargetAtPoint.bind(el)
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root

    findJoinTarget(leftId, 50, 5)
    findJoinTarget(leftId, 90, 50)
    findJoinTarget(rightId, 45, 50)
    findJoinTarget(rightId, 10, 50)

    el.layout = layoutTwoHorizontal()
    const hGraph = (el as unknown as { graph: any }).graph
    const hIds = Object.keys(hGraph.areas)
    const [topId, bottomId] = hIds
    if (!topId || !bottomId) {
      throw new Error('Expected areas for join target branches')
    }
    findJoinTarget(bottomId, 50, 90)
    findJoinTarget(topId, 50, 10)

    const buildGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects.bind(el)
    const northGraph = buildGraph([
      { id: 'top-a', rect: { left: 0, right: 0.6, top: 1, bottom: 0.5 } },
      { id: 'top-b', rect: { left: 0.2, right: 0.8, top: 1, bottom: 0.5 } },
      { id: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
    ])
    ;(el as unknown as { graph: any }).graph = northGraph
    findJoinTarget('bottom', 80, 45)
    findJoinTarget('bottom', 30, 10)
    findJoinTarget('bottom', 30, 45)

    const northWide = buildGraph([
      { id: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
      { id: 'bottom', rect: { left: 0.25, right: 0.75, top: 0.5, bottom: 0 } },
    ])
    ;(el as unknown as { graph: any }).graph = northWide
    findJoinTarget('bottom', 90, 45)

    const eastGraph = buildGraph([
      { id: 'source', rect: { left: 0, right: 0.5, top: 0.6, bottom: 0.4 } },
      { id: 'target-a', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      { id: 'target-b', rect: { left: 0.5, right: 1, top: 0.8, bottom: 0.2 } },
    ])
    ;(el as unknown as { graph: any }).graph = eastGraph
    findJoinTarget('source', 80, 10)
    findJoinTarget('source', 55, 45)
  })
})
