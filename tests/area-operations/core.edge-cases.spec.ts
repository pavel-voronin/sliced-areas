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

  it('covers public method guards and restore branches', () => {
    const el = setupElement()
    const emitLayoutChange = (el as unknown as { emitLayoutChange: () => void }).emitLayoutChange.bind(
      el,
    )
    emitLayoutChange()
    el.setResolver(null)
    el.split('missing')
    el.join('missing', 'missing')
    el.replace('missing', 'missing')
    el.swap('missing', 'missing')
    el.move('missing', 'missing', { left: 0, right: 1, top: 1, bottom: 0 }, { left: 0, right: 1, top: 1, bottom: 0 })
    el.close('missing')
    el.retag('missing', 'tag')
    el.maximize('missing')
    el.restore()

    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id for guards')
    }

    const joinSpy = vi.spyOn(el as unknown as { joinAreas: (...args: any[]) => any }, 'joinAreas')
    joinSpy.mockReturnValue(null)
    el.join(areaId, areaId)
    joinSpy.mockRestore()

    const replaceSpy = vi.spyOn(
      el as unknown as { replaceArea: (...args: any[]) => any },
      'replaceArea',
    )
    replaceSpy.mockReturnValue(null)
    el.replace(areaId, areaId)
    replaceSpy.mockRestore()

    const swapSpy = vi.spyOn(el as unknown as { swapAreaIds: (...args: any[]) => any }, 'swapAreaIds')
    swapSpy.mockReturnValue(null)
    el.swap(areaId, areaId)
    swapSpy.mockRestore()

    const moveSpy = vi.spyOn(el as unknown as { moveArea: (...args: any[]) => any }, 'moveArea')
    moveSpy.mockReturnValue(null)
    el.move(areaId, areaId, { left: 0, right: 1, top: 1, bottom: 0 }, { left: 0, right: 1, top: 1, bottom: 0 })
    moveSpy.mockRestore()

    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.delete(areaId)
    el.maximize(areaId)
    ;(el as unknown as { storedGraph: any }).storedGraph = (el as unknown as { graph: any }).graph
    ;(el as unknown as { storedTags: Map<string, string> | null }).storedTags = null
    el.restore()
    ;(el as unknown as { storedGraph: any }).storedGraph = (el as unknown as { graph: any }).graph
    ;(el as unknown as { storedTags: Map<string, string> | null }).storedTags = new Map()
    el.restore()
  })

  it('covers normalize rects and split helpers', () => {
    const el = setupElement()
    const normalize = (el as unknown as { normalizeRectsToUnit: (r: any[]) => any[] }).normalizeRectsToUnit.bind(
      el,
    )
    const zeroSpan = normalize([{ id: 'a', rect: { left: 0, right: 0, top: 1, bottom: 0 } }])
    expect(zeroSpan[0]?.rect.left).toBe(0)

    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    const splitByZone = (el as unknown as { splitAreaByZone: (...args: any[]) => any }).splitAreaByZone.bind(
      el,
    )
    expect(splitByZone(graph, 'area', 'left', 0.5, 'left')).toBeTruthy()
    expect(splitByZone(graph, 'area', 'right', 0.5, 'right')).toBeTruthy()
    expect(splitByZone(graph, 'area', 'bottom', 0.5, 'bottom')).toBeTruthy()
    expect(splitByZone(graph, 'area', 'top', 0.5, 'top')).toBeTruthy()
    expect(splitByZone(graph, 'missing', 'top', 0.5, 'top')).toBeNull()

    const splitAtPointer = (
      el as unknown as { splitAreaAtPointer: (...args: any[]) => any }
    ).splitAreaAtPointer.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(splitAtPointer(graph, 'area', 'left', 10, 10, 'next')).toBeNull()
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = el.querySelector('.sliced-areas-root')
    expect(splitAtPointer(graph, 'area', 'left', 10, 10, 'next')).toBeTruthy()
    expect(splitAtPointer(graph, 'area', 'bottom', 10, 10, 'next2')).toBeTruthy()

    const splitAt = (el as unknown as { splitAreaAt: (...args: any[]) => any }).splitAreaAt.bind(el)
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      graph.areas.area,
    )
    expect(splitAt(graph, 'missing', 'horizontal', 0.2, 'x', 'min')).toBeNull()
    expect(splitAt(graph, 'area', 'vertical', rect.left, 'x', 'min')).toBeNull()
  })

  it('covers offsets and shared segments edge cases', () => {
    const el = setupElement()
    const getOffsets = (el as unknown as { getOffsets: (...args: any[]) => any }).getOffsets.bind(el)
    const graph = {
      verts: { v1: { id: 'v1', x: 0, y: 0 } },
      edges: {},
      areas: { a: { id: 'a', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' }, b: { id: 'b', v1: 'v1', v2: 'v1', v3: 'v1', v4: 'v1' } },
    }
    expect(getOffsets(graph, graph.areas.a, graph.areas.b, 'west')).toBeNull()

    const computeSharedSegments = (
      el as unknown as { computeSharedSegments: (s: Array<{ start: number; end: number }>) => any }
    ).computeSharedSegments.bind(el)
    const shared = computeSharedSegments([
      { start: 0, end: 0 },
      { start: 0, end: 0.5 },
      { start: 0.25, end: 0.75 },
    ])
    expect(shared.length).toBeGreaterThan(0)
    const tiny = computeSharedSegments([
      { start: 0, end: 0.1 },
      { start: 0.1, end: 0.2 },
    ])
    expect(tiny.length).toBe(0)
  })

  it('covers updated null branches and missing area guards', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [areaId, otherId] = ids
    if (!areaId || !otherId) {
      throw new Error('Expected areas for updated null branches')
    }

    const splitSpy = vi.spyOn(el as unknown as { splitAreaByZone: (...args: any[]) => any }, 'splitAreaByZone')
    splitSpy.mockReturnValue(null)
    el.split(areaId, 'left', Number.NaN, Number.NaN)
    splitSpy.mockRestore()

    const canJoinSpy = vi.spyOn(el as unknown as { canJoin: (...args: any[]) => boolean }, 'canJoin')
    const joinSpy = vi.spyOn(el as unknown as { joinAreas: (...args: any[]) => any }, 'joinAreas')
    canJoinSpy.mockReturnValue(true)
    joinSpy.mockReturnValue(null)
    el.join(areaId, otherId)
    canJoinSpy.mockRestore()
    joinSpy.mockRestore()

    el.close('missing')
    el.retag('missing', 'tag')
    el.maximize('missing')

    const moveArea = (el as unknown as { moveArea: (...args: any[]) => any }).moveArea.bind(el)
    expect(moveArea(graph, 'missing', otherId, { left: 0, right: 1, top: 1, bottom: 0 }, { left: 0, right: 1, top: 1, bottom: 0 })).toBeNull()
  })
})
