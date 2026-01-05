import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { layoutSingle, layoutTwoVertical, setResolver, setupElement } from '../sliced-areas.test-utils'

describe('sliced-areas lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('connects and disconnects observers', () => {
    const el = setupElement()
    ;(el as unknown as { resizeObserver: ResizeObserver | null }).resizeObserver = null
    ;(el as unknown as { connectedCallback: () => void }).connectedCallback()
    expect((el as unknown as { resizeObserver: ResizeObserver | null }).resizeObserver).not.toBeNull()
    ;(el as unknown as { disconnectedCallback: () => void }).disconnectedCallback()
    expect((el as unknown as { resizeObserver: ResizeObserver | null }).resizeObserver).toBeNull()
  })

  it('renders on resize observer callback', () => {
    const original = globalThis.ResizeObserver
    let callback: any = null
    class ResizeObserverSpy {
      constructor(cb: ResizeObserverCallback) {
        callback = cb
      }
      observe() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverSpy as unknown as typeof ResizeObserver

    const el = setupElement()
    const renderSpy = vi.spyOn(el as unknown as { render: () => void }, 'render')
    if (callback) {
      callback([], {} as ResizeObserver)
    }
    expect(renderSpy).toHaveBeenCalled()

    globalThis.ResizeObserver = original
  })

  it('exercises setupElement fallback paths', () => {
    const ctor = customElements.get('sliced-areas') as any
    const originalEnsure = ctor.prototype.ensureRoot
    ctor.prototype.ensureRoot = () => {}
    const el = setupElement()
    const rect = el.getBoundingClientRect()
    rect.toJSON()
    ctor.prototype.ensureRoot = originalEnsure
  })

  it('covers custom element registration branch', async () => {
    const originalGet = customElements.get.bind(customElements)
    const getSpy = vi.spyOn(customElements, 'get').mockImplementation((name: string) => {
      if (name === 'sliced-areas') return undefined
      return originalGet(name)
    })
    const defineSpy = vi.spyOn(customElements, 'define').mockImplementation(() => {})

    vi.resetModules()
    await import('../../src/plugin/sliced-areas')

    getSpy.mockRestore()
    defineSpy.mockRestore()
  })

  it('covers custom element registration when already defined', async () => {
    vi.resetModules()
    await import('../../src/plugin/sliced-areas')
  })

  it('ignores retag when tag is unchanged', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const handler = vi.fn()
    el.addEventListener('sliced-areas:layoutchange', handler)
    const areaId = (el as unknown as { graph: any }).graph ? Object.keys((el as unknown as { graph: any }).graph.areas)[0] : ''
    if (!areaId) {
      throw new Error('Expected area id for retag')
    }
    el.retag(areaId, 'main')
    expect(handler).not.toHaveBeenCalled()
  })

  it('no-ops on maximize and restore when state is missing', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area to maximize')
    }
    el.maximize(areaId)
    const stored = (el as unknown as { storedGraph: any }).storedGraph
    el.maximize(areaId)
    expect((el as unknown as { storedGraph: any }).storedGraph).toBe(stored)
    el.restore()
    el.restore()
    expect((el as unknown as { storedGraph: any }).storedGraph).toBeNull()
  })

  it('does not close the last remaining area', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area to close')
    }
    el.close(areaId)
    const next = (el as unknown as { graph: any }).graph
    expect(Object.keys(next.areas)).toHaveLength(1)
  })
})
