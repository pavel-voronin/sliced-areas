import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  layoutTwoHorizontal,
  layoutTwoVertical,
  setResolver,
  setupElement,
} from '../sliced-areas.test-utils'

describe('sliced-areas geometry', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('builds resize handles and moves edges', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const handles = (el as unknown as { buildResizeHandles: (g: any, w: number, h: number) => any })
      .buildResizeHandles(graph, 100, 100)
    expect(handles.length).toBeGreaterThan(0)

    const bounds = (el as unknown as {
      getEdgeDragBounds: (g: any, axis: any, coord: number, s: number, e: number) => any
    }).getEdgeDragBounds(graph, 'vertical', 0.5, 0, 1)
    expect(bounds).toBeTruthy()

    const moved = (el as unknown as {
      moveEdge: (g: any, axis: any, from: number, to: number, s: number, e: number) => any
    }).moveEdge(graph, 'vertical', 0.5, 0.6, 0, 1)
    expect(moved).toBeTruthy()
  })

  it('covers geometry helpers', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [first, second] = ids
    if (!first || !second) {
      throw new Error('Expected two areas for geometry helpers')
    }
    const areaA = graph.areas[first]
    const areaB = graph.areas[second]
    const orientation = (
      el as unknown as {
        getOrientation: (g: any, a: any, b: any) => any
      }
    ).getOrientation(graph, areaA, areaB)
    expect(['west', 'east']).toContain(orientation)

    const offsets = (
      el as unknown as {
        getOffsets: (g: any, a: any, b: any, d: any) => any
      }
    ).getOffsets(graph, areaA, areaB, orientation)
    expect(offsets).toBeTruthy()

    const zoneRect = (
      el as unknown as {
        getZoneRect: (r: any, z: any, m: any) => any
      }
    ).getZoneRect({ left: 0, right: 1, top: 1, bottom: 0 }, 'left', 'join')
    expect(zoneRect.right).toBeLessThan(1)

    const moveZone = (
      el as unknown as {
        getMoveZone: (r: any, x: number, y: number) => any
      }
    ).getMoveZone({ left: 0, right: 1, top: 1, bottom: 0 }, 75, 25)
    expect(['left', 'right', 'top', 'bottom', 'center']).toContain(moveZone)

    const shared = (
      el as unknown as {
        computeSharedSegments: (s: Array<{ start: number; end: number }>) => Array<any>
      }
    ).computeSharedSegments([
      { start: 0, end: 0.5 },
      { start: 0.25, end: 0.75 },
    ])
    expect(shared.length).toBeGreaterThan(0)

    const merged = (
      el as unknown as {
        mergeSegments: (s: Array<{ start: number; end: number }>) => Array<any>
      }
    ).mergeSegments([
      { start: 0, end: 0.2 },
      { start: 0.1, end: 0.3 },
    ])
    expect(merged).toHaveLength(1)

    const pieces = (el as unknown as { subtractRect: (o: any, i: any) => any[] }).subtractRect(
      { left: 0, right: 1, top: 1, bottom: 0 },
      { left: 0.25, right: 0.75, top: 0.75, bottom: 0.25 },
    )
    expect(pieces.length).toBeGreaterThan(0)

    const found = (el as unknown as {
      findAreaAtPoint: (x: number, y: number) => any
    }).findAreaAtPoint(200, 200)
    expect(found).toBeNull()

    const splitLabel = (el as unknown as { getSplitLabel: (z: any) => string }).getSplitLabel(
      'left',
    )
    const joinLabel = (el as unknown as { getJoinLabel: (d: any) => string }).getJoinLabel('up')
    expect(splitLabel).toContain('Split')
    expect(joinLabel).toContain('Join')
  })

  it('collects connected verts beyond initial range', () => {
    const el = setupElement()
    const graph = {
      verts: {
        v1: { id: 'v1', x: 0.5, y: 0.5 },
        v2: { id: 'v2', x: 0.5, y: 0.9 },
      },
      edges: {
        e1: { id: 'e1', v1: 'v1', v2: 'v2', border: false },
      },
      areas: {},
    }
    const connected = (
      el as unknown as {
        collectConnectedVerts: (g: any, axis: any, coord: number, s: number, e: number) => Set<string>
      }
    ).collectConnectedVerts(graph, 'vertical', 0.5, 0, 0.6)
    expect(connected.has('v1')).toBe(true)
    expect(connected.has('v2')).toBe(true)
  })

  it('covers alignment, offsets, and horizontal bounds', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoHorizontal()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [topId, bottomId] = ids
    if (!topId || !bottomId) {
      throw new Error('Expected two areas for alignment')
    }
    const topArea = graph.areas[topId]
    const bottomArea = graph.areas[bottomId]

    const orientation = (
      el as unknown as {
        getOrientation: (g: any, a: any, b: any) => any
      }
    ).getOrientation(graph, topArea, bottomArea)
    expect(['north', 'south']).toContain(orientation)

    const offsets = (
      el as unknown as {
        getOffsets: (g: any, a: any, b: any, d: any) => any
      }
    ).getOffsets(graph, topArea, bottomArea, orientation)
    expect(offsets).toBeTruthy()

    const joinAligned = (
      el as unknown as {
        joinAreasAligned: (g: any, a: string, b: string) => any
      }
    ).joinAreasAligned(graph, topId, bottomId)
    expect(joinAligned).toBeTruthy()

    const bounds = (el as unknown as {
      getEdgeDragBounds: (g: any, axis: any, coord: number, s: number, e: number) => any
    }).getEdgeDragBounds(graph, 'horizontal', 0.5, 0, 1)
    expect(bounds).toBeTruthy()

    const moved = (el as unknown as {
      moveEdge: (g: any, axis: any, from: number, to: number, s: number, e: number) => any
    }).moveEdge(graph, 'horizontal', 0.5, 0.6, 0, 1)
    expect(moved).toBeTruthy()

    const canJoin = (el as unknown as { canJoin: (a: string, b: string) => boolean }).canJoin(
      topId,
      bottomId,
    )
    expect(canJoin).toBe(true)
  })

  it('returns null for misaligned joins', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [
        { id: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0.2 } },
        { id: 'b', rect: { left: 0.5, right: 1, top: 0.8, bottom: 0 } },
      ],
    )
    const joinAligned = (
      el as unknown as {
        joinAreasAligned: (g: any, a: string, b: string) => any
      }
    ).joinAreasAligned(graph, 'a', 'b')
    expect(joinAligned).toBeNull()
  })

  it('joins aligned areas in multiple directions', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [leftId, rightId] = ids
    if (!leftId || !rightId) {
      throw new Error('Expected vertical areas for join')
    }
    const westJoin = (
      el as unknown as {
        joinAreasAligned: (g: any, a: string, b: string) => any
      }
    ).joinAreasAligned(graph, rightId, leftId)
    expect(westJoin).toBeTruthy()

    const westOffsets = (
      el as unknown as {
        getOffsets: (g: any, a: any, b: any, d: any) => any
      }
    ).getOffsets(graph, graph.areas[rightId], graph.areas[leftId], 'west')
    expect(westOffsets).toBeTruthy()

    el.layout = layoutTwoHorizontal()
    const hGraph = (el as unknown as { graph: any }).graph
    const hIds = Object.keys(hGraph.areas)
    const [topId, bottomId] = hIds
    if (!topId || !bottomId) {
      throw new Error('Expected horizontal areas for join')
    }
    const northJoin = (
      el as unknown as {
        joinAreasAligned: (g: any, a: string, b: string) => any
      }
    ).joinAreasAligned(hGraph, bottomId, topId)
    expect(northJoin).toBeTruthy()
  })

  it('covers collectConnectedVerts edge cases', () => {
    const el = setupElement()
    const graph = {
      verts: {
        '': { id: '', x: 0.5, y: 0.5 },
        v1: { id: 'v1', x: 0.5, y: 0.6 },
      },
      edges: {
        e1: { id: 'e1', v1: 'v1', v2: 'missing', border: false },
      },
      areas: {},
    }
    const connected = (
      el as unknown as {
        collectConnectedVerts: (g: any, axis: any, coord: number, s: number, e: number) => Set<string>
      }
    ).collectConnectedVerts(graph, 'vertical', 0.5, 0, 1)
    expect(connected.has('v1')).toBe(true)
  })

  it('returns early when no verts match', () => {
    const el = setupElement()
    const graph = {
      verts: {
        v1: { id: 'v1', x: 0.1, y: 0.1 },
      },
      edges: {},
      areas: {},
    }
    const connected = (
      el as unknown as {
        collectConnectedVerts: (g: any, axis: any, coord: number, s: number, e: number) => Set<string>
      }
    ).collectConnectedVerts(graph, 'vertical', 0.5, 0.8, 1)
    expect(connected.size).toBe(0)
  })
})
