import { describe, expect, it, vi } from 'vitest'
import {
  layoutSingle,
  layoutTwoVertical,
  setResolver,
  setupElement,
} from '../sliced-areas.test-utils'

describe('sliced-areas operations config', () => {
  it('disables resize handles when resize is disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.operations = { disable: ['resize'] }
    el.layout = layoutTwoVertical()

    const handles = el.querySelectorAll('.sliced-areas-handle')
    expect(handles.length).toBe(0)
  })

  it('limits operations via enable and disable lists', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    el.operations = { enable: ['split', 'join'], disable: ['join'] }

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for operations config test')
    }
    el.split(areaId, 'right')
    expect(splitSpy).toHaveBeenCalled()
    expect(Object.keys((el as unknown as { graph: any }).graph.areas).length).toBe(2)

    const ids = Object.keys((el as unknown as { graph: any }).graph.areas)
    const [firstId, secondId] = ids
    if (!firstId || !secondId) {
      throw new Error('Expected areas after split')
    }
    el.join(firstId, secondId)
    expect(Object.keys((el as unknown as { graph: any }).graph.areas).length).toBe(2)
  })

  it('blocks area drag when drag operations are disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    el.operations = { enable: ['resize'] }

    const corner = el.querySelector('.sliced-areas-corner') as HTMLElement
    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: corner,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      ctrlKey: false,
    })

    expect((el as unknown as { areaDragState: any }).areaDragState).toBeNull()
  })

  it('ignores grab and handle pointerdowns when operations are disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    el.operations = { enable: ['resize'] }

    const grab = document.createElement('div')
    grab.classList.add('sliced-areas-grab')
    grab.dataset.areaId = 'area-1'

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: grab,
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    })

    expect((el as unknown as { areaDragState: any }).areaDragState).toBeNull()

    el.operations = { disable: ['resize'] }
    const handle = document.createElement('div')
    handle.classList.add('sliced-areas-handle')
    handle.dataset.axis = 'vertical'
    handle.dataset.coord = '0.5'
    handle.dataset.start = '0'
    handle.dataset.end = '1'

    ;(el as unknown as { onPointerDown: (e: any) => void }).onPointerDown({
      target: handle,
      preventDefault: vi.fn(),
      pointerId: 2,
      clientX: 10,
      clientY: 10,
    })

    expect((el as unknown as { dragState: any }).dragState).toBeNull()
  })

  it('skips split preview when split is disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    el.operations = { enable: ['move'] }

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for split preview guard')
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
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId,
      rect: { left: 0, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'split',
    }

    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      50,
      50,
    )

    expect((el as unknown as { lastDropTarget: any }).lastDropTarget).toBeNull()
  })

  it('skips move and replace previews when both are disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    el.operations = { enable: ['split'] }

    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId] = ids
    if (!sourceId) {
      throw new Error('Expected areas for move/replace guard')
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
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: 'other',
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'move',
    }

    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      75,
      50,
    )

    expect((el as unknown as { lastDropTarget: any }).lastDropTarget).toBeNull()
  })

  it('falls back to move preview when replace is disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    el.operations = { enable: ['move'] }

    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId] = ids
    if (!sourceId) {
      throw new Error('Expected areas for replace fallback')
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
      75,
      50,
    )

    const lastDrop = (el as unknown as { lastDropTarget: any }).lastDropTarget
    expect(lastDrop?.mode).toBe('move')
  })

  it('skips move preview when move is disabled but replace is enabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    el.operations = { enable: ['replace'] }

    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId] = ids
    if (!sourceId) {
      throw new Error('Expected areas for move disabled guard')
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
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: 'other',
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'move',
    }

    ;(el as unknown as { updateAreaDragAt: (x: number, y: number) => void }).updateAreaDragAt(
      60,
      50,
    )

    expect((el as unknown as { lastDropTarget: any }).lastDropTarget).toBeNull()
  })

  it('skips disabled operations during finishAreaDrag', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId, targetId] = ids
    if (!sourceId || !targetId) {
      throw new Error('Expected areas for finishAreaDrag operations')
    }

    const splitSpy = vi.spyOn(el as unknown as { split: (...args: any[]) => void }, 'split')
    const joinSpy = vi.spyOn(el as unknown as { join: (...args: any[]) => void }, 'join')
    const replaceSpy = vi.spyOn(el as unknown as { replace: (...args: any[]) => void }, 'replace')
    const swapSpy = vi.spyOn(el as unknown as { swap: (...args: any[]) => void }, 'swap')
    const moveSpy = vi.spyOn(el as unknown as { move: (...args: any[]) => void }, 'move')

    const baseState = {
      sourceAreaId: sourceId,
      pointerId: 1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      axis: null,
      swapMode: false,
    }

    el.operations = { disable: ['split'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: sourceId,
      rect: { left: 0, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'split',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    el.operations = { disable: ['replace'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'replace',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    el.operations = { disable: ['move'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'move',
      moveRect: { left: 0.5, right: 0.75, top: 1, bottom: 0 },
      remainderRect: { left: 0.75, right: 1, top: 1, bottom: 0 },
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    el.operations = { disable: ['swap'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'center',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    el.operations = { disable: ['swap'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'swap',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    el.operations = { disable: ['join'] }
    ;(el as unknown as { areaDragState: any }).areaDragState = { ...baseState }
    ;(el as unknown as { lastPointer: any }).lastPointer = { x: 10, y: 10 }
    ;(el as unknown as { lastDropTarget: any }).lastDropTarget = {
      areaId: targetId,
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 },
      zone: 'left',
      mode: 'join',
    }
    ;(el as unknown as { finishAreaDrag: () => void }).finishAreaDrag()

    expect(splitSpy).not.toHaveBeenCalled()
    expect(joinSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()
    expect(swapSpy).not.toHaveBeenCalled()
    expect(moveSpy).not.toHaveBeenCalled()
  })

  it('no-ops public methods when operations are disabled', () => {
    const el = setupElement()
    setResolver(el)

    el.layout = layoutSingle()
    el.operations = { disable: ['split'] }
    const singleGraph = (el as unknown as { graph: any }).graph
    const singleId = Object.keys(singleGraph.areas)[0]
    if (!singleId) {
      throw new Error('Expected area for split guard')
    }
    el.split(singleId, 'right')
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(1)

    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [sourceId, targetId] = ids
    if (!sourceId || !targetId) {
      throw new Error('Expected areas for method guard')
    }

    el.operations = { disable: ['join'] }
    el.join(sourceId, targetId)
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(2)

    el.operations = { disable: ['replace'] }
    el.replace(sourceId, targetId)
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(2)

    el.operations = { disable: ['swap'] }
    const swapSpy = vi.spyOn(el as unknown as { swapAreaIds: (...args: any[]) => void }, 'swapAreaIds')
    el.swap(sourceId, targetId)
    expect(swapSpy).not.toHaveBeenCalled()

    el.operations = { disable: ['move'] }
    const beforeLayout = el.layout
    el.move(
      sourceId,
      targetId,
      { left: 0, right: 0.5, top: 1, bottom: 0 },
      { left: 0.5, right: 1, top: 1, bottom: 0 },
    )
    expect(el.layout).toEqual(beforeLayout)
  })

  it('prevents maximize and restore when disabled', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for maximize guard')
    }

    el.operations = { disable: ['maximize'] }
    el.maximize(areaId)
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(2)

    el.operations = {}
    el.maximize(areaId)
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(1)

    el.operations = { disable: ['restore'] }
    el.restore()
    expect(Object.keys((el as unknown as { graph: any }).graph.areas)).toHaveLength(1)
  })
})
