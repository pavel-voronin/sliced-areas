import { beforeEach, describe, expect, it } from 'vitest'
import { layoutSingle, setupElement, setResolver } from '../sliced-areas.test-utils'

describe('sliced-areas helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('covers labels, zones, and overlay helpers', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0]
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )

    const splitRight = (el as unknown as { getSplitLabel: (z: any) => string }).getSplitLabel(
      'right',
    )
    const splitTop = (el as unknown as { getSplitLabel: (z: any) => string }).getSplitLabel('top')
    const splitBottom = (el as unknown as { getSplitLabel: (z: any) => string }).getSplitLabel(
      'bottom',
    )
    const splitCenter = (el as unknown as { getSplitLabel: (z: any) => string }).getSplitLabel(
      'center',
    )
    expect(splitRight).toContain('Split')
    expect(splitTop).toContain('Split')
    expect(splitBottom).toContain('Split')
    expect(splitCenter).toContain('Split')

    const joinDown = (el as unknown as { getJoinLabel: (d: any) => string }).getJoinLabel('down')
    expect(joinDown).toContain('Join')

    const offsets = (el as unknown as { getOffsets: (g: any, a: any, b: any, d: any) => any }).getOffsets(
      graph,
      area,
      area,
      'none',
    )
    expect(offsets).toBeNull()

    const zoneRight = (
      el as unknown as { getZoneRect: (r: any, z: any, m: any) => any }
    ).getZoneRect(rect, 'right', 'move')
    const zoneBottom = (
      el as unknown as { getZoneRect: (r: any, z: any, m: any) => any }
    ).getZoneRect(rect, 'bottom', 'split')
    const zoneTop = (
      el as unknown as { getZoneRect: (r: any, z: any, m: any) => any }
    ).getZoneRect(rect, 'top', 'join')
    const zoneCenter = (
      el as unknown as { getZoneRect: (r: any, z: any, m: any) => any }
    ).getZoneRect(rect, 'center', 'swap')
    expect(zoneRight.left).toBeGreaterThan(rect.left)
    expect(zoneBottom.bottom).toBe(rect.bottom)
    expect(zoneTop.top).toBe(rect.top)
    expect(zoneCenter).toEqual(rect)

    const overlayRight = (
      el as unknown as { getSplitOverlayRect: (r: any, z: any, x: number, y: number) => any }
    ).getSplitOverlayRect(rect, 'right', 80, 50)
    const overlayBottom = (
      el as unknown as { getSplitOverlayRect: (r: any, z: any, x: number, y: number) => any }
    ).getSplitOverlayRect(rect, 'bottom', 50, 80)
    const overlayTop = (
      el as unknown as { getSplitOverlayRect: (r: any, z: any, x: number, y: number) => any }
    ).getSplitOverlayRect(rect, 'top', 50, 20)
    const overlayCenter = (
      el as unknown as { getSplitOverlayRect: (r: any, z: any, x: number, y: number) => any }
    ).getSplitOverlayRect(rect, 'center', 50, 50)
    expect(overlayRight.right).toBe(rect.right)
    expect(overlayBottom.bottom).toBe(rect.bottom)
    expect(overlayTop.top).toBe(rect.top)
    expect(overlayCenter).toEqual(rect)
  })

  it('covers move previews and join overlays', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const rect = { left: 0, right: 1, top: 1, bottom: 0 }
    const preview = (
      el as unknown as {
        getMovePreview: (r: any, z: any, x: number, y: number) => any
      }
    ).getMovePreview(rect, 'left', 25, 50)
    expect(preview.overlay).toBeTruthy()

    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    const fallback = (
      el as unknown as {
        getMovePreview: (r: any, z: any, x: number, y: number) => any
      }
    ).getMovePreview(rect, 'right', 10, 10)
    expect(fallback.replace).toBe(true)

    const joinOverlay = (
      el as unknown as { getJoinOverlayRect: (s: any, t: any, o: any) => any }
    ).getJoinOverlayRect(
      { left: 0, right: 0.5, top: 1, bottom: 0 },
      { left: 0.5, right: 1, top: 1, bottom: 0 },
      'east',
    )
    expect(joinOverlay.left).toBe(0.5)

    const joinOverlayWest = (
      el as unknown as { getJoinOverlayRect: (s: any, t: any, o: any) => any }
    ).getJoinOverlayRect(
      { left: 0.5, right: 1, top: 1, bottom: 0 },
      { left: 0, right: 0.5, top: 1, bottom: 0 },
      'west',
    )
    expect(joinOverlayWest.right).toBe(0.5)

    const joinOverlayNorth = (
      el as unknown as { getJoinOverlayRect: (s: any, t: any, o: any) => any }
    ).getJoinOverlayRect(
      { left: 0, right: 1, top: 0.5, bottom: 0 },
      { left: 0, right: 1, top: 1, bottom: 0.5 },
      'north',
    )
    expect(joinOverlayNorth.top).toBe(1)

    const joinResult = (
      el as unknown as { getJoinResultRect: (s: any, t: any, o: any) => any }
    ).getJoinResultRect(
      { left: 0, right: 0.5, top: 1, bottom: 0 },
      { left: 0.5, right: 1, top: 1, bottom: 0 },
      'east',
    )
    expect(joinResult.right).toBe(1)

    const joinResultNorth = (
      el as unknown as { getJoinResultRect: (s: any, t: any, o: any) => any }
    ).getJoinResultRect(
      { left: 0, right: 1, top: 0.5, bottom: 0 },
      { left: 0, right: 1, top: 1, bottom: 0.5 },
      'north',
    )
    expect(joinResultNorth.top).toBe(1)

    const noOverlap = (el as unknown as { subtractRect: (o: any, i: any) => any[] }).subtractRect(
      { left: 0, right: 1, top: 1, bottom: 0 },
      { left: 2, right: 3, top: 3, bottom: 2 },
    )
    expect(noOverlap).toHaveLength(1)
  })

  it('covers gesture resolution and move zone branches', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0] as { id: string }
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )
    const state: any = {
      sourceAreaId: area.id,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    const gesture = (
      el as unknown as { resolveSplitGesture: (s: any, x: number, y: number) => any }
    ).resolveSplitGesture(state, 0, 40)
    expect(gesture?.axis).toBe('horizontal')

    const flipped = (
      el as unknown as { resolveSplitGesture: (s: any, x: number, y: number) => any }
    ).resolveSplitGesture(state, 40, 40)
    expect(flipped?.axis).toBe('vertical')

    state.axis = 'vertical'
    state.lastX = 0
    state.lastY = 0
    const flippedToHorizontal = (
      el as unknown as { resolveSplitGesture: (s: any, x: number, y: number) => any }
    ).resolveSplitGesture(state, 0, 30)
    expect(flippedToHorizontal?.axis).toBe('horizontal')

    const zone = (
      el as unknown as { getSplitZone: (r: any, x: number, y: number, g: any) => any }
    ).getSplitZone(rect, 70, 20, { axis: 'horizontal' })
    expect(['top', 'bottom']).toContain(zone)

    const zoneByAxis = (
      el as unknown as { getSplitZoneByAxis: (r: any, x: number, y: number, a: any) => any }
    ).getSplitZoneByAxis(rect, 50, 10, 'horizontal')
    expect(['top', 'bottom']).toContain(zoneByAxis)

    const leftZone = (
      el as unknown as { getMoveZone: (r: any, x: number, y: number) => any }
    ).getMoveZone(rect, 10, 50)
    const rightZone = (
      el as unknown as { getMoveZone: (r: any, x: number, y: number) => any }
    ).getMoveZone(rect, 90, 50)
    expect(leftZone).toBe('left')
    expect(rightZone).toBe('right')
  })

  it('covers join shade and invalid area rect', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const result = { left: 0.25, right: 0.75, top: 0.75, bottom: 0.25 }
    const source = { left: 0, right: 1, top: 1, bottom: 0 }
    const target = { left: 0, right: 1, top: 1, bottom: 0 }
    ;(el as unknown as { showJoinShade: (r: any, s: any, t: any) => void }).showJoinShade(
      result,
      source,
      target,
    )
    const shade = el.querySelector('.sliced-areas-drop-dim')
    expect(shade).toBeTruthy()
    ;(el as unknown as { hideJoinShade: () => void }).hideJoinShade()

    const graph = { verts: {}, edges: {}, areas: { bad: { id: 'bad', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' } } }
    const getAreaRect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect.bind(el)
    expect(() => getAreaRect(graph, graph.areas.bad)).toThrow(/Invalid area vertices/)
  })

  it('renders split overlay variants', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0] as any
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )
    const overlay = { left: rect.left, right: rect.left + 0.3, top: rect.top, bottom: rect.bottom }
    ;(el as unknown as { showSplitOverlay: (t: any, z: any, o: any) => void }).showSplitOverlay(
      { areaId: area.id, rect },
      'right',
      overlay,
    )
    ;(el as unknown as { showSplitOverlay: (t: any, z: any, o: any) => void }).showSplitOverlay(
      { areaId: area.id, rect },
      'bottom',
      overlay,
    )
    const drop = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(drop.dataset.splitMode).toBe('true')
  })
})
