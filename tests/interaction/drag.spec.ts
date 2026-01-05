import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  layoutFourQuadrants,
  layoutSingle,
  layoutTwoHorizontal,
  layoutTwoVertical,
  setResolver,
  setupElement,
} from '../sliced-areas.test-utils'

describe('sliced-areas drag', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('handles pointer down for handles and corners', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const handle = el.querySelector('.sliced-areas-handle') as HTMLElement
    const corner = el.querySelector('.sliced-areas-corner') as HTMLElement

    const handleEvent = {
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    }
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown(handleEvent)
    expect(handleEvent.preventDefault).toHaveBeenCalled()
    expect((el as unknown as { dragState: any }).dragState).toBeTruthy()

    const cornerEvent = {
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 2,
      clientX: 20,
      clientY: 20,
      ctrlKey: false,
    }
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown(cornerEvent)
    expect(cornerEvent.preventDefault).toHaveBeenCalled()
    expect((el as unknown as { areaDragState: any }).areaDragState).toBeTruthy()
  })

  it('emits a corner click event for the top-left handle', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const corner = el.querySelector('.sliced-areas-corner.is-top-left') as HTMLElement
    const handler = vi.fn()
    el.addEventListener('sliced-areas:cornerclick', handler)

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 12,
      clientY: 34,
      ctrlKey: false,
    })
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 12,
      clientY: 34,
    })

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0]?.[0] as CustomEvent
    expect(event.detail.corner).toBe('top-left')
    expect(event.detail.areaId).toBe(corner.dataset.areaId)
  })

  it('does not emit a corner click event for other corners', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const corner = el.querySelector('.sliced-areas-corner.is-top-right') as HTMLElement
    const handler = vi.fn()
    el.addEventListener('sliced-areas:cornerclick', handler)

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 12,
      clientY: 34,
      ctrlKey: false,
    })
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 12,
      clientY: 34,
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores emitCornerClick calls for non-top-left corners', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const handler = vi.fn()
    el.addEventListener('sliced-areas:cornerclick', handler)

    ;(el as unknown as { emitCornerClick: (d: any) => void }).emitCornerClick({
      areaId: 'area-1',
      corner: 'top-right',
      clientX: 10,
      clientY: 10,
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('emits a corner click when moved state is unset', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for corner click fallback')
    }
    const handler = vi.fn()
    el.addEventListener('sliced-areas:cornerclick', handler)
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
      originCorner: 'top-left',
    }
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 5,
      clientY: 5,
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('cancels resize drag and restores cursor state', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const clone = (el as unknown as { cloneGraph: (g: any) => any }).cloneGraph(graph)
    ;(el as unknown as { dragSnapshot: any }).dragSnapshot = clone
    ;(el as unknown as { dragState: any }).dragState = { axis: 'vertical' }
    ;(el as unknown as { cancelResizeDrag: () => void }).cancelResizeDrag()
    expect((el as unknown as { dragState: any }).dragState).toBeNull()

    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    root.style.cursor = 'move'
    ;(el as unknown as { setDragCursor: (c: string) => void }).setDragCursor('col-resize')
    ;(el as unknown as { resetDragCursor: (force?: boolean) => void }).resetDragCursor(true)
    expect(root.style.cursor).toBe('move')
  })

  it('handles split gesture and zones', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0] as { id: string }
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )
    const state = {
      sourceAreaId: area.id,
      pointerId: 1,
      startX: 10,
      startY: 10,
      lastX: 10,
      lastY: 10,
      axis: null,
      swapMode: false,
    }
    const gesture = (
      el as unknown as {
        resolveSplitGesture: (s: any, x: number, y: number) => any
      }
    ).resolveSplitGesture(state, 40, 10)
    expect(gesture?.axis).toBe('vertical')
    const zone = (
      el as unknown as {
        getSplitZone: (r: any, x: number, y: number, g: any) => any
      }
    ).getSplitZone(rect, 75, 75, gesture)
    expect(['left', 'right', 'top', 'bottom']).toContain(zone)
  })

  it('resolves split zones and overlay rects', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0] as any
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )
    const zone = (
      el as unknown as {
        getSplitZoneByAxis: (r: any, x: number, y: number, a: any) => any
      }
    ).getSplitZoneByAxis(rect, 25, 25, 'vertical')
    expect(['left', 'right']).toContain(zone)
    const overlay = (
      el as unknown as {
        getSplitOverlayRect: (r: any, z: any, x: number, y: number) => any
      }
    ).getSplitOverlayRect(rect, 'left', 10, 10)
    expect(overlay.left).toBe(rect.left)
  })

  it('computes move previews and join targets', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoHorizontal()
    const graph = (el as unknown as { graph: any }).graph
    const topArea = Object.values(graph.areas).find((area: any) => {
      const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
        graph,
        area,
      )
      return rect.top === 1
    }) as any
    const topRect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      topArea,
    )
    const preview = (
      el as unknown as {
        getMovePreview: (r: any, z: any, x: number, y: number) => any
      }
    ).getMovePreview(topRect, 'bottom', 50, 75)
    expect(preview.overlay).toBeTruthy()

    const target = (
      el as unknown as {
        findJoinTargetAtPoint: (s: string, x: number, y: number) => any
      }
    ).findJoinTargetAtPoint(topArea.id, 50, 52)
    expect(target).toBeTruthy()
  })

  it('handles area drag finalization modes', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [source, target] = ids
    if (!source || !target) {
      throw new Error('Expected two areas for drag finalization')
    }

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')
    const swapSpy = vi.spyOn(el as unknown as { swap: (...args: any[]) => void }, 'swap')
    const joinSpy = vi.spyOn(el as unknown as { join: (...args: any[]) => void }, 'join')
    const moveSpy = vi.spyOn(el as unknown as { move: (...args: any[]) => void }, 'move')
    const replaceSpy = vi.spyOn(el as unknown as { replace: (...args: any[]) => void }, 'replace')

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: source,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: source,
      rect: { left: 0, right: 0.5, top: 1, bottom: 0 },
      zone: 'right',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(splitSpy).toHaveBeenCalled()

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: source,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: target,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'center',
      mode: 'swap',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(swapSpy).toHaveBeenCalled()

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: source,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: target,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(joinSpy).toHaveBeenCalled()

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: source,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: target,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'right',
      mode: 'move',
      moveRect: { left: 0.5, right: 1, top: 1, bottom: 0.5 },
      remainderRect: { left: 0.5, right: 1, top: 0.5, bottom: 0 },
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(moveSpy).toHaveBeenCalled()

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: source,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: target,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'replace',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(replaceSpy).toHaveBeenCalled()
  })

  it('updates resize drag and cancels with escape', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const handle = el.querySelector('.sliced-areas-handle') as HTMLElement
    const graph = (el as unknown as { graph: any }).graph
    const firstArea = Object.values(graph.areas)[0] as { id: string }
    const initialRect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      firstArea,
    )

    const downEvent = {
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    }
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown(downEvent)
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({
      clientX: 20,
      clientY: 0,
    })
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({
      key: 'Escape',
      preventDefault: vi.fn(),
    })
    const afterGraph = (el as unknown as { graph: any }).graph
    const afterRect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      afterGraph,
      afterGraph.areas[firstArea.id],
    )
    expect(afterRect.left).toBe(initialRect.left)
  })

  it('shows swap overlays during area drag', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const corner = el.querySelector('.sliced-areas-corner') as HTMLElement
    const handler = vi.fn()
    el.addEventListener('sliced-areas:layoutchange', handler)

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      ctrlKey: true,
    })
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({
      clientX: 75,
      clientY: 50,
      ctrlKey: true,
    })
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('swap')
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 80,
      clientY: 60,
    })
    expect(handler).toHaveBeenCalled()
  })

  it('shows join overlays during area drag', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const corner = el.querySelector('.sliced-areas-corner') as HTMLElement

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      ctrlKey: false,
    })
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({
      clientX: 52,
      clientY: 50,
      ctrlKey: false,
    })
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('join')
  })

  it('shows move overlays when dragging to a non-adjacent area', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutFourQuadrants()
    const corners = Array.from(el.querySelectorAll('.sliced-areas-corner'))
    const corner = corners[0] as HTMLElement

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      ctrlKey: false,
    })
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({
      clientX: 90,
      clientY: 90,
      ctrlKey: false,
    })
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('move')
  })

  it('handles control key release and cancels area drag', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()

    const updateSpy = vi.spyOn(
      el as unknown as { updateAreaDragAt: (x: number, y: number) => void },
      'updateAreaDragAt',
    )
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: 'area-1',
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: true,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 30, y: 30 }

    ;(el as unknown as { onKeyUp: (e: any) => void }).onKeyUp({ key: 'Control' })
    expect(updateSpy).toHaveBeenCalled()

    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({
      key: 'Escape',
      preventDefault: vi.fn(),
    })
    expect((el as unknown as { areaDragState: any }).areaDragState).toBeNull()
  })

  it('shows split overlay pieces', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0] as any
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      area,
    )
    const overlay = { ...rect, right: rect.left + (rect.right - rect.left) / 2 }
    ;(el as unknown as { showSplitOverlay: (t: any, z: any, o: any) => void }).showSplitOverlay(
      { areaId: area.id, rect },
      'left',
      overlay,
    )
    const drop = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(drop.dataset.splitMode).toBe('true')
    expect(drop.querySelectorAll('.sliced-areas-drop-piece')).toHaveLength(2)
  })

  it('covers grab handles, key toggles, and drag end normalization', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for grab drag')
    }
    const grab = document.createElement('div')
    grab.classList.add('sliced-areas-grab')
    grab.dataset.areaId = areaId
    el.appendChild(grab)

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: grab,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    })
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'Control' })
    expect((el as unknown as { areaDragState: any }).areaDragState?.swapMode).toBe(true)
    ;(el as unknown as { areaDragState: any }).areaDragState = null

    const handle = el.querySelector('.sliced-areas-handle') as HTMLElement
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 2,
      clientX: 0,
      clientY: 0,
    })
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 0,
      clientY: 0,
    })
    expect((el as unknown as { dragState: any }).dragState).toBeNull()
  })

  it('covers split/replace branches in area drag updates', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutFourQuadrants()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const sourceId = ids[0]
    const targetId = ids[ids.length - 1]
    if (!sourceId || !targetId) {
      throw new Error('Expected areas for split/replace coverage')
    }

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: sourceId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      2,
      2,
    )
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      200,
      200,
    )

    const tinyGraph = (el as unknown as { buildGraphFromRects: (items: any) => any })
      .buildGraphFromRects([
        { id: sourceId, rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { id: targetId, rect: { left: 0.6, right: 0.68, top: 0.8, bottom: 0.72 } },
      ])
    ;(el as unknown as { graph: any }).graph = tinyGraph
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: sourceId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      64,
      25,
    )
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('replace')
  })

  it('shows split overlays when only one axis is available', () => {
    const el = setupElement()
    setResolver(el)
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects([
      { id: 'source', rect: { left: 0, right: 0.12, top: 1, bottom: 0 } },
    ])
    ;(el as unknown as { graph: any }).graph = graph
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: 'source',
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      5,
      50,
    )
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('split')
  })

  it('shows split overlays from gesture detection', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for gesture split')
    }
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      40,
      0,
    )
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement
    expect(overlay.dataset.mode).toBe('split')
  })

  it('skips split when area is too small', () => {
    const el = setupElement()
    setResolver(el)
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects([
      { id: 'tiny', rect: { left: 0, right: 0.1, top: 0.1, bottom: 0 } },
    ])
    ;(el as unknown as { graph: any }).graph = graph
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: 'tiny',
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      5,
      95,
    )
    const overlay = el.querySelector('.sliced-areas-drop') as HTMLElement | null
    expect(overlay?.style.display).not.toBe('block')
  })

  it('handles finishAreaDrag guards', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for finishAreaDrag guards')
    }

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 5, y: 5 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId,
      rect: { left: 0, right: 0.1, top: 0.1, bottom: 0 },
      zone: 'left',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(splitSpy).not.toHaveBeenCalled()

    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: 'other',
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'center',
      mode: 'join',
    }
    const swapSpy = vi.spyOn(el as unknown as { swap: (...args: any[]) => void }, 'swap')
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(swapSpy).toHaveBeenCalled()
  })

  it('handles center zone move preview guard', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId, targetId] = ids
    if (!sourceId || !targetId) {
      throw new Error('Expected areas for center zone guard')
    }
    const zoneSpy = vi
      .spyOn(el as unknown as { getMoveZone: (r: any, x: number, y: number) => any }, 'getMoveZone')
      .mockReturnValue('center')
    ;(el as unknown as { areaDragState: any }).areaDragState = {
      sourceAreaId: sourceId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      75,
      50,
    )
    zoneSpy.mockRestore()
  })
})
