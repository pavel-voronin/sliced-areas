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

  it('covers pointer down branches and drag guards', () => {
    const el = setupElement()
    ;(el as unknown as { graph: any }).graph = null
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({ target: {}, preventDefault: vi.fn() })

    setResolver(el)
    el.layout = layoutTwoVertical()
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root

    const grab = document.createElement('div')
    grab.classList.add('sliced-areas-grab')
    root.appendChild(grab)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: grab,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    const corner = document.createElement('div')
    corner.classList.add('sliced-areas-corner')
    root.appendChild(corner)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    const other = document.createElement('div')
    root.appendChild(other)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: other,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    const handle = document.createElement('div')
    handle.classList.add('sliced-areas-handle')
    handle.dataset.axis = ''
    handle.dataset.coord = 'x'
    root.appendChild(handle)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    const handle2 = document.createElement('div')
    handle2.classList.add('sliced-areas-handle')
    handle2.dataset.axis = 'vertical'
    handle2.dataset.coord = '0.2'
    handle2.dataset.start = '0'
    handle2.dataset.end = '1'
    root.appendChild(handle2)
    const boundsSpy = vi.spyOn(el as unknown as { getEdgeDragBounds: (...args: any[]) => any }, 'getEdgeDragBounds')
    boundsSpy.mockReturnValue(null)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle2,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })
    boundsSpy.mockRestore()
  })

  it('covers pointer move/up and key handlers', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoHorizontal()
    const graph = (el as unknown as { graph: any }).graph
    const handle = el.querySelector('.sliced-areas-handle') as HTMLElement
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({ clientX: 0, clientY: 0 })
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 0,
      clientY: 0,
    })

    ;(el as unknown as { dragState: any }).dragState = { axis: 'horizontal', coord: 0.5, start: 0, end: 1, min: 0, max: 1, pointerId: 1, originX: 0, originY: 0 }
    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({ clientX: 0, clientY: 0 })
    ;(el as unknown as { graph: any }).graph = null
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 0,
      clientY: 0,
    })

    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'x' })
    ;(el as unknown as { areaDragState: any }).areaDragState = null
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'Control' })
    ;(el as unknown as { dragState: any }).dragState = { axis: 'vertical' }
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'Escape', preventDefault: vi.fn() })
    ;(el as unknown as { onKeyUp: (e: any) => void }).onKeyUp({ key: 'x' })
    ;(el as unknown as { areaDragState: any }).areaDragState = null
    ;(el as unknown as { onKeyUp: (e: any) => void }).onKeyUp({ key: 'Control' })

    const setDragCursor = (el as unknown as { setDragCursor: (c: string) => void }).setDragCursor.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    setDragCursor('move')
    const resetDragCursor = (el as unknown as { resetDragCursor: (f?: boolean) => void }).resetDragCursor.bind(el)
    resetDragCursor()
  })

  it('covers event and drag state guards', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    ;(el as unknown as { graph: any }).graph = (el as unknown as { graph: any }).graph

    const nonElementTarget = document.createTextNode('x')
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: nonElementTarget,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    const handle = document.createElement('div')
    handle.classList.add('sliced-areas-handle')
    handle.dataset.coord = '0.5'
    handle.dataset.start = '0'
    handle.dataset.end = '1'
    root.appendChild(handle)
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })

    ;(el as unknown as { onPointerMove: (e: any) => void }).onPointerMove({ clientX: 0, clientY: 0 })
    ;(el as unknown as { dragState: any }).dragState = null
    ;(el as unknown as { areaDragState: any }).areaDragState = null
    ;(el as unknown as { onPointerUp: (e: any) => void }).onPointerUp({
      clientX: 0,
      clientY: 0,
    })

    ;(el as unknown as { dragState: any }).dragState = { axis: 'vertical' }
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'Escape', preventDefault: vi.fn() })

    const setDragCursor = (el as unknown as { setDragCursor: (c: string) => void }).setDragCursor.bind(el)
    setDragCursor('col-resize')

    const startAreaDrag = (el as unknown as { startAreaDrag: (e: any, id: string) => void }).startAreaDrag.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    startAreaDrag({ clientX: 0, clientY: 0, pointerId: 1, ctrlKey: false }, 'area')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    startAreaDrag({ clientX: 0, clientY: 0, pointerId: 1, ctrlKey: false, target: root }, 'area')

    const updateAreaDrag = (el as unknown as { updateAreaDrag: (e: any) => void }).updateAreaDrag.bind(el)
    ;(el as unknown as { areaDragState: any }).areaDragState = null
    updateAreaDrag({ clientX: 0, clientY: 0, ctrlKey: false })

    const updateAreaDragAt = (el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    updateAreaDragAt(0, 0)
  })

  it('covers drag overlays, move previews, and finishAreaDrag branches', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId, targetId] = ids
    if (!sourceId || !targetId) {
      throw new Error('Expected areas for drag overlays')
    }

    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    const showDropOverlay = (el as unknown as { showDropOverlay: (...args: any[]) => void })
      .showDropOverlay.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    showDropOverlay({ areaId: targetId, rect: { left: 0, right: 1, top: 1, bottom: 0 } }, 'left', 'join')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    showDropOverlay({ areaId: targetId, rect: { left: 0, right: 1, top: 1, bottom: 0 } }, 'left', 'join', {
      left: 0,
      right: 0.5,
      top: 1,
      bottom: 0,
    })
    const drop = el.querySelector('.sliced-areas-drop') as HTMLElement
    drop.remove()
    showDropOverlay({ areaId: targetId, rect: { left: 0, right: 1, top: 1, bottom: 0 } }, 'right', 'move')

    const showSplitOverlay = (el as unknown as { showSplitOverlay: (...args: any[]) => void })
      .showSplitOverlay.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    showSplitOverlay({ areaId: targetId, rect: { left: 0, right: 1, top: 1, bottom: 0 } }, 'left', {
      left: 0,
      right: 0.5,
      top: 1,
      bottom: 0,
    })
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root

    const getMovePreview = (el as unknown as { getMovePreview: (...args: any[]) => any }).getMovePreview.bind(el)
    const rect = { left: 0, right: 1, top: 1, bottom: 0 }
    const previewLeft = getMovePreview(rect, 'left', 10, 50)
    expect(previewLeft.replace).toBe(false)
    const previewRight = getMovePreview(rect, 'right', 55, 50)
    expect(previewRight.overlay).toBeTruthy()
    const previewBottom = getMovePreview(rect, 'bottom', 50, 75)
    expect(previewBottom.overlay).toBeTruthy()
    const previewTop = getMovePreview(rect, 'top', 50, 25)
    expect(previewTop.overlay).toBeTruthy()

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
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = null
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')
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
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: sourceId,
      rect: { left: 0, right: 0.5, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(splitSpy).toHaveBeenCalled()

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
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'center',
      mode: 'move',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'right',
      mode: 'join',
    }
    const joinSpy = vi.spyOn(el as unknown as { join: (...args: any[]) => void }, 'join')
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(joinSpy).toHaveBeenCalled()
  })

  it('covers move/split zones and gesture thresholds', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const area = Object.values(graph.areas)[0]
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(graph, area)

    const findAreaAtPoint = (el as unknown as { findAreaAtPoint: (x: number, y: number) => any })
      .findAreaAtPoint.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(findAreaAtPoint(10, 10)).toBeNull()

    const getMoveZone = (el as unknown as { getMoveZone: (...args: any[]) => any }).getMoveZone.bind(el)
    expect(getMoveZone(rect, 10, 10)).toBe('center')

    const resolveSplitGesture = (
      el as unknown as { resolveSplitGesture: (s: any, x: number, y: number) => any }
    ).resolveSplitGesture.bind(el)
    const state: any = {
      sourceAreaId: 'a',
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }
    expect(resolveSplitGesture(state, 2, 2)).toBeNull()
    state.axis = 'horizontal'
    state.lastX = 0
    state.lastY = 0
    resolveSplitGesture(state, 40, 0)

    const getSplitZone = (el as unknown as { getSplitZone: (...args: any[]) => any }).getSplitZone.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(getSplitZone(rect, 10, 10, { axis: 'vertical' })).toBe('right')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = el.querySelector('.sliced-areas-root')
    expect(getSplitZone(rect, 70, 20, { axis: 'horizontal' })).toBe('top')

    const getSplitZoneByAxis = (
      el as unknown as { getSplitZoneByAxis: (...args: any[]) => any }
    ).getSplitZoneByAxis.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(getSplitZoneByAxis(rect, 10, 10, 'vertical')).toBe('right')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = el.querySelector('.sliced-areas-root')
    expect(getSplitZoneByAxis(rect, 10, 10, 'vertical')).toBe('left')
    expect(getSplitZoneByAxis(rect, 10, 90, 'horizontal')).toBe('bottom')

    const getSplitOverlayRect = (
      el as unknown as { getSplitOverlayRect: (...args: any[]) => any }
    ).getSplitOverlayRect.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    expect(getSplitOverlayRect(rect, 'left', 10, 10)).toEqual(rect)
  })

  it('covers drag, split, and bounds branches', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const areaId = ids[0]
    if (!areaId) {
      throw new Error('Expected area for drag branches')
    }
    const rect = { left: 0, right: 1, top: 1, bottom: 0 }

    const setDragCursor = (el as unknown as { setDragCursor: (c: string) => void }).setDragCursor.bind(el)
    setDragCursor('col-resize')
    setDragCursor('row-resize')

    const startAreaDrag = (el as unknown as { startAreaDrag: (e: any, id: string) => void }).startAreaDrag.bind(el)
    startAreaDrag({ pointerId: 1, clientX: 0, clientY: 0, ctrlKey: false, target: el }, areaId)
    startAreaDrag(
      { pointerId: 1, clientX: 0, clientY: 0, ctrlKey: false, target: document.createTextNode('x') },
      areaId,
    )

    ;(el as unknown as { areaDragState: any }).areaDragState = null
    ;(el as unknown as { dragState: any }).dragState = null
    ;(el as unknown as { onKeyDown: (e: any) => void }).onKeyDown({ key: 'Escape', preventDefault: vi.fn() })

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
    const findAreaAtPoint = vi.spyOn(el as unknown as { findAreaAtPoint: (...args: any[]) => any }, 'findAreaAtPoint')
    findAreaAtPoint.mockReturnValue({ areaId, rect })
    const canSplitRect = vi.spyOn(el as unknown as { canSplitRect: (...args: any[]) => boolean }, 'canSplitRect')
    const zoneSpy = vi.spyOn(el as unknown as { getSplitZoneByAxis: (...args: any[]) => any }, 'getSplitZoneByAxis')
    zoneSpy.mockReturnValue('left')
    const overlaySpy = vi.spyOn(el as unknown as { getSplitOverlayRect: (...args: any[]) => any }, 'getSplitOverlayRect')
    overlaySpy.mockReturnValue(rect)
    const showSplitSpy = vi.spyOn(el as unknown as { showSplitOverlay: (...args: any[]) => void }, 'showSplitOverlay')
    showSplitSpy.mockImplementation(() => {})
    const resolveGestureSpy = vi.spyOn(el as unknown as { resolveSplitGesture: (...args: any[]) => any }, 'resolveSplitGesture')

    canSplitRect.mockImplementation((_r: Rect, axis: string) => axis === 'vertical')
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(50, 50)
    canSplitRect.mockImplementation((_r: Rect, axis: string) => axis === 'horizontal')
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(60, 60)
    canSplitRect.mockImplementation(() => true)
    resolveGestureSpy.mockReturnValueOnce({ axis: 'vertical' })
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(70, 70)
    resolveGestureSpy.mockReturnValueOnce({ axis: 'horizontal' })
    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(80, 80)

    resolveGestureSpy.mockRestore()
    showSplitSpy.mockRestore()
    overlaySpy.mockRestore()
    zoneSpy.mockRestore()
    canSplitRect.mockRestore()
    findAreaAtPoint.mockRestore()

    ;(el as unknown as { areaDragState: any }).areaDragState = null
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')
    const moveSpy = vi.spyOn(el as unknown as { move: (...args: any[]) => void }, 'move')
    const joinSpy = vi.spyOn(el as unknown as { join: (...args: any[]) => void }, 'join')
    const canSplitSpy = vi.spyOn(el as unknown as { canSplitRect: (...args: any[]) => boolean }, 'canSplitRect')
    canSplitSpy.mockReturnValue(true)

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
      areaId,
      rect,
      zone: 'center',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
    ;(el as unknown as { lastPointer: any }).lastPointer = null
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId,
      rect,
      zone: 'left',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(splitSpy).toHaveBeenCalled()

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
      areaId,
      rect,
      zone: 'top',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
      areaId,
      rect,
      zone: 'center',
      mode: 'move',
      moveRect: rect,
      remainderRect: rect,
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
      areaId,
      rect,
      zone: 'left',
      mode: 'move',
      moveRect: rect,
      remainderRect: rect,
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(moveSpy).toHaveBeenCalled()

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
      areaId,
      rect,
      zone: 'left',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
      rect,
      zone: 'left',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()
    expect(joinSpy).toHaveBeenCalled()

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
      rect,
      zone: 'top',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
      rect,
      zone: 'bottom',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

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
      rect,
      zone: 'diagonal',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    canSplitSpy.mockRestore()
    joinSpy.mockRestore()
    moveSpy.mockRestore()
    splitSpy.mockRestore()

    const showDropOverlay = (el as unknown as { showDropOverlay: (...args: any[]) => void }).showDropOverlay.bind(el)
    showDropOverlay({ areaId, rect }, 'left', 'join', rect)
    showDropOverlay({ areaId, rect }, 'left', 'join', rect)

    const showJoinShade = (el as unknown as { showJoinShade: (...args: any[]) => void }).showJoinShade.bind(el)
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    showJoinShade(rect, rect, rect)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    showJoinShade(rect, rect, rect)
    showJoinShade(rect, rect, rect)

    const showDragLabel = (el as unknown as { showDragLabel: (...args: any[]) => void }).showDragLabel.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    showDragLabel(10, 10, 'Drag')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    showDragLabel(10, 10, 'Drag')
    showDragLabel(10, 10, 'Drag')

    const resolveSplitGesture = (
      el as unknown as { resolveSplitGesture: (...args: any[]) => { axis: 'vertical' | 'horizontal' } | null }
    ).resolveSplitGesture.bind(el)
    const verticalState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: 'vertical' as const,
      swapMode: false,
    }
    resolveSplitGesture(verticalState, 0, 100)
    const horizontalState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: 'horizontal' as const,
      swapMode: false,
    }
    resolveSplitGesture(horizontalState, 100, 0)
    const horizontalSmall = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: 'horizontal' as const,
      swapMode: false,
    }
    resolveSplitGesture(horizontalSmall, 6, 5)
    const smallState = {
      sourceAreaId: areaId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: 'vertical' as const,
      swapMode: false,
    }
    resolveSplitGesture(smallState, 1, 1)

    const getSplitZone = (el as unknown as { getSplitZone: (...args: any[]) => any }).getSplitZone.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    getSplitZone(rect, 10, 10, { axis: 'vertical' })
    getSplitZone(rect, 10, 10, { axis: 'horizontal' })
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    getSplitZone(rect, 25, 50, { axis: 'horizontal' })
    getSplitZone(rect, 75, 50, { axis: 'horizontal' })

    const getSplitZoneByAxis = (
      el as unknown as { getSplitZoneByAxis: (...args: any[]) => any }
    ).getSplitZoneByAxis.bind(el)
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = null
    getSplitZoneByAxis(rect, 10, 10, 'vertical')
    getSplitZoneByAxis(rect, 10, 10, 'horizontal')
    ;(el as unknown as { rootEl: HTMLElement | null }).rootEl = root
    getSplitZoneByAxis(rect, 25, 50, 'vertical')
    getSplitZoneByAxis(rect, 75, 50, 'vertical')

    const getEdgeDragBounds = (
      el as unknown as { getEdgeDragBounds: (g: any, a: any, c: number, s: number, e: number) => any }
    ).getEdgeDragBounds.bind(el)
    const edgeGraph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects([
      { id: 'edge', rect: rect },
    ])
    getEdgeDragBounds(edgeGraph, 'vertical', 0.5, 1.1, 1.2)
    getEdgeDragBounds(edgeGraph, 'horizontal', 0.5, 1.1, 1.2)

    const findHoleCells = (el as unknown as { findHoleCells: (g: any) => Rect[] }).findHoleCells.bind(el)
    const axisSpy = vi.spyOn(el as unknown as { collectAxisCoords: (...args: any[]) => number[] }, 'collectAxisCoords')
    axisSpy.mockReturnValueOnce([0, 0, 1])
    axisSpy.mockReturnValueOnce([0, 1])
    findHoleCells(edgeGraph)
    axisSpy.mockRestore()
  })
})
