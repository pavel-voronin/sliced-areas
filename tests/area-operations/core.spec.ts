import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { layoutSingle, layoutTwoVertical, setResolver, setupElement, type Rect } from '../sliced-areas.test-utils'

describe('sliced-areas core', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('clears layout when set to null or empty', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    expect(el.layout?.areas.length).toBe(1)
    el.layout = null
    expect(el.layout).toBeNull()
    el.layout = { areas: [] }
    expect(el.layout).toBeNull()
  })

  it('renders layout and serializes tags', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const layout = el.layout
    expect(layout).not.toBeNull()
    const tags = layout?.areas.map((area) => area.tag).sort()
    expect(tags).toEqual(['left', 'right'])
  })

  it('throws on missing area content without resolver', () => {
    const el = setupElement()
    const rects = [{ id: 'a', rect: { left: 0, right: 1, top: 1, bottom: 0 } }]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph
    const render = (el as unknown as { render: () => void }).render.bind(el)
    expect(() => render()).toThrow(/Missing area content/)
  })

  it('splits, joins, replaces, swaps, moves, closes, and retags areas', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graphA = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graphA.areas)[0] as string
    el.split(areaId, 'right')
    const graphB = (el as unknown as { graph: any }).graph
    expect(Object.keys(graphB.areas).length).toBe(2)

    const areaIds = Object.keys(graphB.areas)
    const [first, second] = areaIds
    if (!first || !second) {
      throw new Error('Expected two areas after split')
    }

    el.swap(first, second)
    const layoutAfterSwap = el.layout
    expect(layoutAfterSwap?.areas.length).toBe(2)

    const targetRect: Rect = { left: 0.5, right: 1, top: 1, bottom: 0 }
    const overlay: Rect = { left: 0.5, right: 1, top: 1, bottom: 0.5 }
    const remainder: Rect = { left: 0.5, right: 1, top: 0.5, bottom: 0 }
    el.move(first, second, overlay, remainder)
    const graphAfterMove = (el as unknown as { graph: any }).graph
    expect(graphAfterMove.areas[first]).toBeTruthy()
    expect(graphAfterMove.areas[second]).toBeTruthy()

    el.replace(first, second)
    const graphAfterReplace = (el as unknown as { graph: any }).graph
    expect(graphAfterReplace.areas[second]).toBeFalsy()
    expect(graphAfterReplace.areas[first]).toBeTruthy()

    el.close(first)
    const graphAfterClose = (el as unknown as { graph: any }).graph
    expect(Object.keys(graphAfterClose.areas).length).toBe(1)

    const remaining = Object.keys(graphAfterClose.areas)[0]
    if (!remaining) {
      throw new Error('Expected remaining area after close')
    }
    el.retag(remaining, 'new-tag')
    const tags = el.layout?.areas.map((area) => area.tag)
    expect(tags).toEqual(['new-tag'])
  })

  it('joins adjacent areas', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const ids = Object.keys(graph.areas)
    const [first, second] = ids
    if (!first || !second) {
      throw new Error('Expected two areas to join')
    }
    el.join(first, second)
    const next = (el as unknown as { graph: any }).graph
    expect(Object.keys(next.areas)).toHaveLength(1)
  })

  it('handles maximize and restore', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area to maximize')
    }
    el.maximize(areaId)
    const maxGraph = (el as unknown as { graph: any }).graph
    expect(Object.keys(maxGraph.areas)).toHaveLength(1)
    el.restore()
    const restored = (el as unknown as { graph: any }).graph
    expect(Object.keys(restored.areas)).toHaveLength(2)
  })

  it('emits layout change events on retag request', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const handler = vi.fn()
    el.addEventListener('sliced-areas:layoutchange', handler)
    const areaNode = el.querySelector('[data-area-id]') as HTMLElement
    areaNode.dispatchEvent(
      new CustomEvent('sliced-areas:retag', { bubbles: true, detail: { tag: 'retagged' } }),
    )
    expect(handler).toHaveBeenCalled()
    const tags = el.layout?.areas.map((area) => area.tag)
    expect(tags).toEqual(['retagged'])
  })

  it('normalizes rects and creates placeholders', () => {
    const el = setupElement()
    const normalize = (
      el as unknown as {
        normalizeRectsToUnit: (items: Array<{ id: string; rect: Rect }>) => Array<any>
      }
    ).normalizeRectsToUnit.bind(el)
    const normalized = normalize([{ id: 'a', rect: { left: 10, right: 20, top: 20, bottom: 10 } }])
    expect(normalized[0]?.rect.left).toBe(0)
    expect(normalized[0]?.rect.right).toBe(1)

    const ensure = (
      el as unknown as {
        ensureAreaNode: (newId: string, sourceId: string, clone?: boolean) => void
      }
    ).ensureAreaNode.bind(el)
    ensure('auto-1', 'missing', false)
    const placeholder = el.querySelector('[data-area-id="auto-1"]') as HTMLElement
    expect(placeholder).toBeTruthy()
    expect(placeholder.textContent).toBe('missing')
  })

  it('uses default splitter size when css vars are missing', () => {
    const el = setupElement()
    const original = globalThis.getComputedStyle
    const root = el.querySelector('.sliced-areas-root')
    const spy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((target) => {
      if (target === el || (root && target === root)) {
        return {
          getPropertyValue: (prop: string) =>
            prop === '--sliced-areas-splitter-size' ? '' : '',
        } as CSSStyleDeclaration
      }
      return original(target)
    })
    setResolver(el)
    el.layout = layoutSingle()
    const area = el.querySelector('.sliced-areas-area') as HTMLElement
    expect(area.style.left).toBe('1px')
    expect(area.style.top).toBe('1px')
    spy.mockRestore()
  })

  it('collects nodes and handles renaming conflicts', () => {
    const el = setupElement()
    const node = document.createElement('div')
    node.dataset.areaId = 'area-1'
    node.setAttribute('data-sliced-areas-auto', 'true')
    el.appendChild(node)

    const node2 = document.createElement('div')
    node2.dataset.areaId = 'area-1'
    el.appendChild(node2)

    const collected = (el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> })
      .collectAreaNodes()
    expect(collected.get('area-1')).toBe(node2)

    const rename = (el as unknown as {
      renameAreaId: (g: any, from: string, to: string) => any
    }).renameAreaId.bind(el)
    const graph = {
      verts: {},
      edges: {},
      areas: {
        'area-1': { id: 'area-1', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' },
        'area-2': { id: 'area-2', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' },
      },
    }
    expect(() => rename(graph, 'area-1', 'area-2')).toThrow(/target id already exists/)
  })

  it('preserves existing area nodes and splits by zone when pointer is invalid', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for split by zone')
    }

    const existing = document.createElement('div')
    existing.dataset.areaId = 'area-99'
    el.appendChild(existing)
    const ensure = (
      el as unknown as {
        ensureAreaNode: (newId: string, sourceId: string, clone?: boolean) => void
      }
    ).ensureAreaNode.bind(el)
    ensure('area-99', areaId, true)
    expect(el.querySelectorAll('[data-area-id="area-99"]')).toHaveLength(1)

    el.split(areaId, 'left', Number.NaN, Number.NaN)
    const nextGraph = (el as unknown as { graph: any }).graph
    expect(Object.keys(nextGraph.areas)).toHaveLength(2)
  })

  it('processes remainders and renames area nodes', () => {
    const el = setupElement()
    setResolver(el)
    const rects = [
      { id: 'primary', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
      { id: 'other', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph

    const fromNode = document.createElement('div')
    fromNode.dataset.areaId = 'primary'
    el.appendChild(fromNode)
    const toNode = document.createElement('div')
    toNode.dataset.areaId = 'target'
    el.appendChild(toNode)

    const next = (
      el as unknown as {
        processRemainders: (g: any, r: any[], t: string) => any
      }
    ).processRemainders(
      graph,
      [
        { id: 'primary', sourceAreaId: 'target' },
        { id: 'other', sourceAreaId: 'other' },
      ],
      'target',
    )
    expect(next.areas.target).toBeTruthy()
    expect(next.areas.other).toBeFalsy()
    expect(el.querySelector('[data-area-id="primary"]')).toBeNull()
  })

  it('closes a non-terminal area and emits layout change', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutTwoVertical()
    const handler = vi.fn()
    el.addEventListener('sliced-areas:layoutchange', handler)
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area to close')
    }
    el.close(areaId)
    const next = (el as unknown as { graph: any }).graph
    expect(Object.keys(next.areas)).toHaveLength(1)
    expect(handler).toHaveBeenCalled()
  })

  it('uses cached resolved nodes and throws on missing area content', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for cached render')
    }
    const content = el.querySelector('.sliced-areas-area-content')
    content?.remove()
    const render = (el as unknown as { render: () => void }).render.bind(el)
    render()
    expect(el.querySelector(`[data-area-id="${areaId}"]`)).toBeTruthy()

    const stubMap = new Map([[areaId, undefined as unknown as HTMLElement]])
    const collectSpy = vi
      .spyOn(el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }, 'collectAreaNodes')
      .mockReturnValue(stubMap)
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    root.innerHTML = ''
    expect(() => render()).toThrow(/Missing area content for/)
    collectSpy.mockRestore()
  })

  it('handles normalizeRectsToUnit early exits', () => {
    const el = setupElement()
    const normalize = (
      el as unknown as {
        normalizeRectsToUnit: (items: Array<{ id: string; rect: Rect }>) => Array<any>
      }
    ).normalizeRectsToUnit.bind(el)

    const invalid = normalize([
      { id: 'bad', rect: { left: Number.NaN, right: 1, top: 1, bottom: 0 } },
    ])
    expect(invalid[0]?.rect.left).toBe(Number.NaN)

    const unit = normalize([{ id: 'unit', rect: { left: 0, right: 1, top: 1, bottom: 0 } }])
    expect(unit[0]?.rect.left).toBe(0)
    expect(unit[0]?.rect.right).toBe(1)
  })

  it('covers split helpers and invalid move operations', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for split helper coverage')
    }
    const rect = (el as unknown as { getAreaRect: (g: any, a: any) => any }).getAreaRect(
      graph,
      graph.areas[areaId],
    )
    const splitByZone = (
      el as unknown as {
        splitAreaByZone: (g: any, id: string, z: any, r: number, n: string) => any
      }
    ).splitAreaByZone(graph, areaId, 'bottom', 0.3, 'new-bottom')
    expect(splitByZone).toBeTruthy()

    const splitAtPointer = (
      el as unknown as {
        splitAreaAtPointer: (g: any, id: string, z: any, x: number, y: number, n: string) => any
      }
    ).splitAreaAtPointer(graph, areaId, 'bottom', 50, 50, 'new-pointer')
    expect(splitAtPointer).toBeTruthy()

    const splitAt = (
      el as unknown as {
        splitAreaAt: (g: any, id: string, a: any, c: number, n: string, k: any) => any
      }
    ).splitAreaAt(graph, areaId, 'horizontal', rect.top, 'new-invalid', 'min')
    expect(splitAt).toBeNull()

    const removedHorizontal = (
      el as unknown as {
        splitAreaAt: (g: any, id: string, a: any, c: number, n: string, k: any) => any
      }
    ).splitAreaAt(graph, areaId, 'horizontal', rect.bottom + 0.2, 'new-all', 'other')
    expect(removedHorizontal?.areas[areaId]).toBeFalsy()

    const removedVertical = (
      el as unknown as {
        splitAreaAt: (g: any, id: string, a: any, c: number, n: string, k: any) => any
      }
    ).splitAreaAt(graph, areaId, 'vertical', rect.left + 0.2, 'new-all-2', 'other')
    expect(removedVertical?.areas[areaId]).toBeFalsy()

    const pairGraph = (el as unknown as { buildGraphFromRects: (items: any) => any })
      .buildGraphFromRects([
        { id: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { id: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      ])
    const invalidMove = (
      el as unknown as {
        moveArea: (g: any, s: string, t: string, o: Rect, r: Rect) => any
      }
    ).moveArea(
      pairGraph,
      'a',
      'b',
      { left: 0, right: 0, top: 0, bottom: 0 },
      { left: 0, right: 1, top: 1, bottom: 0 },
    )
    expect(invalidMove).toBeNull()
  })

  it('updates tags and resolved nodes on rename', () => {
    const el = setupElement()
    const graph = {
      verts: {
        v1: { id: 'v1', x: 0, y: 0 },
        v2: { id: 'v2', x: 0, y: 1 },
        v3: { id: 'v3', x: 1, y: 1 },
        v4: { id: 'v4', x: 1, y: 0 },
      },
      edges: {},
      areas: {
        from: { id: 'from', v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' },
      },
    }
    const fromNode = document.createElement('div')
    fromNode.dataset.areaId = 'from'
    el.appendChild(fromNode)
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.set('from', 'tag')
    ;(el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes.set(
      'from',
      fromNode,
    )

    const renamed = (
      el as unknown as { renameAreaId: (g: any, f: string, t: string) => any }
    ).renameAreaId(graph, 'from', 'to')
    expect(renamed.areas.to).toBeTruthy()
    expect(fromNode.dataset.areaId).toBe('to')
    expect((el as unknown as { areaTags: Map<string, string> }).areaTags.has('to')).toBe(true)
    expect((el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes.has('to')).toBe(
      true,
    )
  })

  it('covers processRemainders branches', () => {
    const el = setupElement()
    setResolver(el)
    const rects = [
      { id: 'target', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
      { id: 'extra', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph

    const withRest = (
      el as unknown as {
        processRemainders: (g: any, r: any[], t: string) => any
      }
    ).processRemainders(
      graph,
      [
        { id: 'target', sourceAreaId: 'target' },
        { id: 'extra', sourceAreaId: 'target' },
      ],
      'target',
    )
    expect(withRest.areas.target).toBeTruthy()

    const removedTarget = (
      el as unknown as {
        processRemainders: (g: any, r: any[], t: string) => any
      }
    ).processRemainders(graph, [{ id: 'extra', sourceAreaId: 'extra' }], 'target')
    expect(removedTarget.areas.target).toBeTruthy()
  })

  it('joins partially overlapping vertical areas', () => {
    const el = setupElement()
    setResolver(el)
    const rects = [
      { id: 'top', rect: { left: 0, right: 0.6, top: 1, bottom: 0.5 } },
      { id: 'bottom', rect: { left: 0.4, right: 1, top: 0.5, bottom: 0 } },
    ]
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      rects,
    )
    ;(el as unknown as { graph: any }).graph = graph
    const joined = (
      el as unknown as { joinAreas: (g: any, a: string, b: string) => any }
    ).joinAreas(graph, 'top', 'bottom')
    expect(joined).toBeTruthy()
  })

  it('trims areas to range for both axes', () => {
    const el = setupElement()
    const graph = (el as unknown as { buildGraphFromRects: (items: any) => any }).buildGraphFromRects(
      [{ id: 'area', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
    )
    ;(el as unknown as { graph: any }).graph = graph
    const trim = (
      el as unknown as {
        trimAreaToRange: (g: any, id: string, axis: any, s: number, e: number) => any
      }
    ).trimAreaToRange.bind(el)

    const horizontal = trim(graph, 'area', 'horizontal', 0.2, 0.8)
    expect(horizontal.created.length).toBeGreaterThan(0)

    const vertical = trim(graph, 'area', 'vertical', 0.2, 0.8)
    expect(vertical.created.length).toBeGreaterThan(0)
  })
})
