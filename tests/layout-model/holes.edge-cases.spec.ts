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

  it('covers edge bounds and hole helpers', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    const moveEdge = (el as unknown as { moveEdge: (...args: any[]) => any }).moveEdge.bind(el)
    const collectSpy = vi.spyOn(el as unknown as { collectConnectedVerts: (...args: any[]) => Set<string> }, 'collectConnectedVerts')
    collectSpy.mockReturnValue(new Set(['missing']))
    moveEdge(graph, 'vertical', 0.5, 0.6, 0, 1)
    collectSpy.mockRestore()

    const getEdgeDragBounds = (
      el as unknown as { getEdgeDragBounds: (...args: any[]) => any }
    ).getEdgeDragBounds.bind(el)
    expect(getEdgeDragBounds(graph, 'vertical', 0.2, 0.8, 1)).toBeNull()
    expect(getEdgeDragBounds(graph, 'horizontal', 0.2, 0.8, 1)).toBeNull()
    expect(getEdgeDragBounds(graph, 'vertical', 0, 0, 1)).toBeTruthy()

    const findHoleCells = (el as unknown as { findHoleCells: (g: any) => Rect[] }).findHoleCells.bind(el)
    const axisSpy = vi.spyOn(el as unknown as { collectAxisCoords: (...args: any[]) => number[] }, 'collectAxisCoords')
    axisSpy.mockReturnValueOnce([undefined as unknown as number, 1])
    axisSpy.mockReturnValueOnce([0, 1])
    findHoleCells(graph)
    axisSpy.mockReturnValueOnce([0, 1])
    axisSpy.mockReturnValueOnce([undefined as unknown as number, 1])
    findHoleCells(graph)
    axisSpy.mockRestore()

    const mergeHoleCells = (el as unknown as { mergeHoleCells: (c: any[]) => any[] }).mergeHoleCells.bind(el)
    mergeHoleCells([{ left: 0, right: 0.5, top: 1, bottom: 0 }, undefined as unknown as Rect])
    const merged = mergeHoleCells([
      { left: 0, right: 0.5, top: 1, bottom: 0 },
      { left: 0.5, right: 1, top: 1, bottom: 0 },
    ])
    expect(merged[0]?.right).toBe(1)

    const collectAdjacentNeighbors = (
      el as unknown as { collectAdjacentNeighbors: (g: any, h: Rect, s: any) => any[] }
    ).collectAdjacentNeighbors.bind(el)
    const hole = { left: 0.4, right: 0.6, top: 1, bottom: 0 }
    collectAdjacentNeighbors(graph, hole, 'west')
    collectAdjacentNeighbors(graph, hole, 'east')
  })

  it('covers hole alignment and neighbor collection branches', () => {
    const el = setupElement()
    setResolver(el)
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'left', rect: { left: 0, right: 0.4, top: 1, bottom: 0 } }],
    )
    const alignNeighbor = (el as unknown as { alignNeighborToHole: (...args: any[]) => any }).alignNeighborToHole.bind(el)
    alignNeighbor(graph, 'missing', { left: 0.4, right: 0.6, top: 1, bottom: 0 }, 'west')

    const splitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    splitSpy.mockReturnValue(null)
    alignNeighbor(graph, 'left', { left: 0.4, right: 0.6, top: 1, bottom: 0 }, 'west')
    splitSpy.mockRestore()

    const alignSplitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    alignSplitSpy.mockImplementation((g: any) => g)
    const topGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'tall', rect: { left: 0, right: 0.4, top: 1, bottom: 0 } }],
    )
    alignNeighbor(topGraph, 'tall', { left: 0.4, right: 0.6, top: 0.8, bottom: 0 }, 'west')
    const rightGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'wide', rect: { left: 0.2, right: 1, top: 0.5, bottom: 0 } }],
    )
    alignNeighbor(rightGraph, 'wide', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    alignSplitSpy.mockRestore()

    const wideGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'wide', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } }],
    )
    const widened = alignNeighbor(wideGraph, 'wide', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    expect(widened.changed).toBe(true)

    const plan = (el as unknown as { findHoleFillPlan: (...args: any[]) => any }).findHoleFillPlan.bind(el)
    const hole = { left: 0.4, right: 0.6, top: 1, bottom: 0 }
    const coverGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'west-top', rect: { left: 0, right: 0.4, top: 1, bottom: 0.5 } },
        { id: 'west-bottom', rect: { left: 0, right: 0.4, top: 0.5, bottom: 0 } },
      ],
    )
    expect(plan(coverGraph, hole)).toBeTruthy()

    const collectSpy = vi.spyOn(el as unknown as { collectHoleNeighbors: (...args: any[]) => any }, 'collectHoleNeighbors')
    const coverSpy = vi.spyOn(el as unknown as { isHoleSideCovered: (...args: any[]) => boolean }, 'isHoleSideCovered')
    collectSpy
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        side: 'east',
        neighbors: [{ areaId: 'mock', rect: hole }],
        segments: [{ start: hole.bottom, end: hole.top }],
      })
    coverSpy.mockReturnValueOnce(true)
    expect(plan(graph, hole)).toBeTruthy()
    coverSpy.mockRestore()
    collectSpy.mockRestore()

    const collectHoleNeighbors = (
      el as unknown as { collectHoleNeighbors: (g: any, h: Rect, s: any) => any }
    ).collectHoleNeighbors.bind(el)
    const westGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'west', rect: { left: hole.left, right: hole.left, top: hole.top, bottom: hole.top } }],
    )
    collectHoleNeighbors(westGraph, hole, 'west')
    const eastGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'east', rect: { left: hole.right, right: hole.right, top: hole.top, bottom: hole.top } }],
    )
    collectHoleNeighbors(eastGraph, hole, 'east')
    const southGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'south', rect: { left: hole.left, right: hole.left, top: hole.bottom, bottom: hole.bottom } }],
    )
    collectHoleNeighbors(southGraph, hole, 'south')
    const northGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'north', rect: { left: hole.left, right: hole.left, top: hole.top, bottom: hole.top } }],
    )
    collectHoleNeighbors(northGraph, hole, 'north')

    const isHoleSideCovered = (
      el as unknown as { isHoleSideCovered: (h: Rect, s: any, seg: Array<{ start: number; end: number }>) => boolean }
    ).isHoleSideCovered.bind(el)
    expect(isHoleSideCovered(hole, 'south', [])).toBe(false)
    const mergeSpy = vi.spyOn(el as unknown as { mergeSegments: (...args: any[]) => any }, 'mergeSegments')
    mergeSpy.mockReturnValue([undefined])
    expect(isHoleSideCovered(hole, 'south', [{ start: 0, end: 0.1 }])).toBe(false)
    mergeSpy.mockReturnValue([{ start: 0.5, end: 0.6 }])
    expect(isHoleSideCovered({ left: 0, right: 1, top: 1, bottom: 0 }, 'south', [{ start: 0, end: 1 }])).toBe(false)
    mergeSpy.mockReturnValue([{ start: 0, end: 0.5 }, undefined])
    expect(isHoleSideCovered({ left: 0, right: 0.5, top: 1, bottom: 0 }, 'south', [{ start: 0, end: 0.5 }])).toBe(true)
    mergeSpy.mockRestore()
  })

  it('covers hole alignment split branches', () => {
    const el = setupElement()
    setResolver(el)
    const alignNeighbor = (el as unknown as { alignNeighborToHole: (...args: any[]) => any }).alignNeighborToHole.bind(
      el,
    )
    const buildGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects.bind(el)
    const hole = { left: 0.4, right: 0.6, top: 0.8, bottom: 0.2 }

    const topGraph = buildGraph([{ id: 'top', rect: { left: 0, right: 0.4, top: 1, bottom: 0.2 } }])
    const topResult = alignNeighbor(topGraph, 'top', hole, 'west')
    expect(topResult.changed).toBe(true)

    const bottomGraph = buildGraph([{ id: 'bottom', rect: { left: 0, right: 0.4, top: 1, bottom: 0 } }])
    const bottomSplitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    const bottomHole = { left: 0.4, right: 0.6, top: 1, bottom: 0.5 }
    const bottomNoArea = { ...bottomGraph, areas: { ...bottomGraph.areas } }
    delete bottomNoArea.areas.bottom
    bottomSplitSpy.mockReturnValueOnce(bottomNoArea)
    alignNeighbor(bottomGraph, 'bottom', bottomHole, 'west')
    bottomSplitSpy.mockReset()
    bottomSplitSpy.mockReturnValueOnce(null)
    alignNeighbor(bottomGraph, 'bottom', bottomHole, 'west')
    bottomSplitSpy.mockRestore()

    const topOnlyGraph = buildGraph([{ id: 'top-only', rect: { left: 0, right: 0.4, top: 1, bottom: 0.5 } }])
    const topSplitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    topSplitSpy.mockImplementation((g: any) => g)
    alignNeighbor(topOnlyGraph, 'top-only', { left: 0.4, right: 0.6, top: 0.8, bottom: 0.5 }, 'west')
    topSplitSpy.mockReset()
    topSplitSpy.mockReturnValueOnce(null)
    alignNeighbor(topOnlyGraph, 'top-only', { left: 0.4, right: 0.6, top: 0.8, bottom: 0.5 }, 'west')
    topSplitSpy.mockRestore()

    const leftGraph = buildGraph([{ id: 'left', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } }])
    const splitSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    const noAreaGraph = { ...leftGraph, areas: { ...leftGraph.areas } }
    delete noAreaGraph.areas.left
    splitSpy.mockReturnValueOnce(noAreaGraph)
    alignNeighbor(leftGraph, 'left', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    splitSpy.mockReset()
    splitSpy.mockReturnValueOnce(null)
    alignNeighbor(leftGraph, 'left', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    splitSpy.mockRestore()

    const rightSkipGraph = buildGraph([{ id: 'skip', rect: { left: 0.2, right: 0.8, top: 0.5, bottom: 0 } }])
    alignNeighbor(rightSkipGraph, 'skip', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')

    const rightGraph = buildGraph([{ id: 'right', rect: { left: 0.2, right: 1, top: 0.5, bottom: 0 } }])
    const rightResult = alignNeighbor(rightGraph, 'right', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    expect(rightResult.changed).toBe(true)

    const rightNullSpy = vi.spyOn(el as unknown as { splitAreaAt: (...args: any[]) => any }, 'splitAreaAt')
    rightNullSpy.mockReturnValueOnce(null)
    alignNeighbor(rightGraph, 'right', { left: 0.2, right: 0.8, top: 0.5, bottom: 0 }, 'south')
    rightNullSpy.mockRestore()

    const plan = (el as unknown as { findHoleFillPlan: (...args: any[]) => any }).findHoleFillPlan.bind(el)
    const collectSpy = vi.spyOn(el as unknown as { collectHoleNeighbors: (...args: any[]) => any }, 'collectHoleNeighbors')
    const coverSpy = vi.spyOn(el as unknown as { isHoleSideCovered: (...args: any[]) => boolean }, 'isHoleSideCovered')
    collectSpy.mockReturnValueOnce({
      side: 'west',
      neighbors: [{ areaId: 'mock', rect: hole }],
      segments: [{ start: hole.bottom, end: hole.top }],
    })
    coverSpy.mockReturnValueOnce(false)
    expect(plan(leftGraph, hole)).toBeNull()
    coverSpy.mockRestore()
    collectSpy.mockRestore()
  })
})
