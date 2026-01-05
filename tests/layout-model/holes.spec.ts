import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setResolver, setupElement, type Rect } from '../sliced-areas.test-utils'

describe('sliced-areas holes', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('normalizes rects and fills holes', () => {
    const el = setupElement()
    const rects = [
      { id: 'left-bottom', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
      { id: 'left-top', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
      { id: 'right-top', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const normalized = (el as unknown as { normalizeGraph: (graph: any) => any }).normalizeGraph(
      graph,
    )
    const leftBottom = normalized.areas['left-bottom']
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => Rect }).getAreaRect(
      normalized,
      leftBottom,
    )
    expect(rect.right).toBe(1)
  })

  it('throws on overlapping layouts', () => {
    const el = setupElement()
    const rects = [
      { id: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0 } },
      { id: 'b', rect: { left: 0, right: 0.6, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const normalize = (el as unknown as { normalizeGraph: (graph: any) => any }).normalizeGraph.bind(
      el,
    )
    expect(() => normalize(graph)).toThrow(/Overlapping areas/)
  })

  it('finds hole fill plans and neighbors', () => {
    const el = setupElement()
    const rects = [
      { id: 'left', rect: { left: 0, right: 0.4, top: 1, bottom: 0 } },
      { id: 'right', rect: { left: 0.6, right: 1, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const holes = (el as unknown as { findHoleCells: (g: any) => Rect[] }).findHoleCells(graph)
    expect(holes).toHaveLength(1)
    const hole = holes[0] as Rect
    const plan = (el as unknown as { findHoleFillPlan: (g: any, h: Rect) => any }).findHoleFillPlan(
      graph,
      hole,
    )
    expect(plan).toBeTruthy()
    const expanded = (el as unknown as {
      expandRectIntoHole: (r: Rect, h: Rect, s: any) => Rect
    }).expandRectIntoHole({ left: 0, right: 0.4, top: 1, bottom: 0 }, hole, plan.side)
    expect(expanded.right).toBe(0.6)
  })

  it('detects uncovered hole sides with segmented neighbors', () => {
    const el = setupElement()
    const rects = [
      { id: 'left-top', rect: { left: 0, right: 0.4, top: 1, bottom: 0.6 } },
      { id: 'left-bottom', rect: { left: 0, right: 0.4, top: 0.4, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const holes = (el as unknown as { findHoleCells: (g: any) => Rect[] }).findHoleCells(graph)
    const gapHole = holes.find((hole) => hole.left === 0.4 && hole.right === 1) as Rect | undefined
    if (!gapHole) {
      throw new Error('Expected gap hole to test segmented coverage')
    }
    const plan = (el as unknown as { findHoleFillPlan: (g: any, h: Rect) => any }).findHoleFillPlan(
      graph,
      gapHole,
    )
    expect(plan).toBeTruthy()
  })

  it('expands into north holes', () => {
    const el = setupElement()
    const expanded = (el as unknown as {
      expandRectIntoHole: (r: Rect, h: Rect, s: any) => Rect
    }).expandRectIntoHole(
      { left: 0, right: 1, top: 0.5, bottom: 0 },
      { left: 0, right: 1, top: 1, bottom: 0.5 },
      'north',
    )
    expect(expanded.bottom).toBe(0.5)
  })

  it('aligns neighbors to holes', () => {
    const el = setupElement()
    setResolver(el)
    const rects = [
      { id: 'left', rect: { left: -0.2, right: 0.4, top: 1.2, bottom: -0.2 } },
      { id: 'right', rect: { left: 0.6, right: 1.2, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph
    const hole: Rect = { left: 0.4, right: 0.6, top: 1, bottom: 0 }
    const aligned = (el as unknown as { tryAlignHoleNeighbors: (g: any, h: Rect) => any })
      .tryAlignHoleNeighbors(graph, hole)
    expect(aligned.changed).toBe(true)
  })

  it('throws on unfillable holes', () => {
    const el = setupElement()
    const graph = { verts: {}, edges: {}, areas: {} }
    const normalize = (el as unknown as { normalizeGraph: (graph: any) => any }).normalizeGraph.bind(
      el,
    )
    expect(() => normalize(graph)).toThrow(/Unfillable hole/)
  })

  it('throws hole error with area details', () => {
    const el = setupElement()
    const rects = [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const throwHoleError = (
      el as unknown as { throwHoleError: (g: any, holes: Rect[]) => never }
    ).throwHoleError.bind(el)
    expect(() =>
      throwHoleError(graph, [{ left: 0.25, right: 0.75, top: 0.75, bottom: 0.25 }]),
    ).toThrow(/Unfillable hole/)
  })

  it('exercises fillHoles alignment retries', () => {
    const el = setupElement()
    const rects = [
      { id: 'left', rect: { left: 0, right: 0.4, top: 1, bottom: 0 } },
      { id: 'right', rect: { left: 0.6, right: 1, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const planSpy = vi
      .spyOn(el as unknown as { findHoleFillPlan: (g: any, h: Rect) => any }, 'findHoleFillPlan')
      .mockReturnValue(null)
    const alignSpy = vi
      .spyOn(el as unknown as { tryAlignHoleNeighbors: (g: any, h: Rect) => any }, 'tryAlignHoleNeighbors')
      .mockImplementation((g: any) => ({ graph: g, changed: true }))
    const fillHoles = (el as unknown as { fillHoles: (g: any) => any }).fillHoles.bind(el)
    expect(() => fillHoles(graph)).toThrow(/Unfillable hole/)
    planSpy.mockRestore()
    alignSpy.mockRestore()
  })

  it('covers adjacent neighbor collection and alignment', () => {
    const el = setupElement()
    setResolver(el)
    const rects = [
      { id: 'south', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
      { id: 'north', rect: { left: 0, right: 1, top: 1, bottom: 0.7 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph
    const hole: Rect = { left: 0.2, right: 0.8, top: 0.7, bottom: 0.5 }

    const southNeighbors = (
      el as unknown as {
        collectAdjacentNeighbors: (g: any, h: Rect, s: any) => Array<any>
      }
    ).collectAdjacentNeighbors(graph, hole, 'south')
    const northNeighbors = (
      el as unknown as {
        collectAdjacentNeighbors: (g: any, h: Rect, s: any) => Array<any>
      }
    ).collectAdjacentNeighbors(graph, hole, 'north')
    expect(southNeighbors.length).toBeGreaterThan(0)
    expect(northNeighbors.length).toBeGreaterThan(0)

    const aligned = (
      el as unknown as {
        alignNeighborToHole: (g: any, id: string, h: Rect, s: any) => any
      }
    ).alignNeighborToHole(graph, 'south', hole, 'south')
    expect(aligned.changed).toBe(true)
  })

  it('handles hole neighbor collection gaps', () => {
    const el = setupElement()
    const rects = [{ id: 'wide', rect: { left: 0, right: 1, top: 0.4, bottom: 0 } }]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    const hole: Rect = { left: 0.2, right: 0.8, top: 0.6, bottom: 0.4 }
    const neighbors = (
      el as unknown as {
        collectHoleNeighbors: (g: any, h: Rect, s: any) => any
      }
    ).collectHoleNeighbors(graph, hole, 'south')
    expect(neighbors).toBeNull()

    const eastGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'east', rect: { left: 0.8, right: 1, top: 0.2, bottom: 0 } }],
    )
    const eastNeighbors = (
      el as unknown as {
        collectHoleNeighbors: (g: any, h: Rect, s: any) => any
      }
    ).collectHoleNeighbors(eastGraph, hole, 'east')
    expect(eastNeighbors).toBeNull()

    const covered = (
      el as unknown as {
        isHoleSideCovered: (h: Rect, s: any, seg: Array<{ start: number; end: number }>) => boolean
      }
    ).isHoleSideCovered(hole, 'south', [
      { start: 0, end: 0.2 },
      { start: 0.4, end: 0.5 },
    ])
    expect(covered).toBe(false)

    const mergeSpy = vi
      .spyOn(el as unknown as { mergeSegments: (s: Array<{ start: number; end: number }>) => any }, 'mergeSegments')
      .mockReturnValue([
        { start: 0, end: 0.4 },
        { start: 0.35, end: 0.6 },
      ])
    const coveredOverlap = (
      el as unknown as {
        isHoleSideCovered: (h: Rect, s: any, seg: Array<{ start: number; end: number }>) => boolean
      }
    ).isHoleSideCovered({ left: 0, right: 0.6, top: 1, bottom: 0 }, 'south', [
      { start: 0, end: 0.2 },
    ])
    expect(coveredOverlap).toBe(true)
    mergeSpy.mockRestore()
  })

  it('skips undefined overlaps', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    graph.areas.b = undefined as unknown as any
    const overlaps = (el as unknown as { findOverlaps: (g: any) => any[] }).findOverlaps(graph)
    expect(overlaps).toHaveLength(0)
  })
})
