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

  it('covers render branches, area nodes, and retag requests', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for render branches')
    }

    const ensureStash = (el as unknown as { ensureStash: () => void }).ensureStash.bind(el)
    const render = (el as unknown as { render: () => void }).render.bind(el)
    ;(el as unknown as { ensureStash: () => void }).ensureStash = () => {}
    ;(el as unknown as { stashEl: HTMLElement | null }).stashEl = null
    render()
    ;(el as unknown as { ensureStash: () => void }).ensureStash = ensureStash

    const missingNode = document.createElement('div')
    missingNode.dataset.areaId = ''
    el.appendChild(missingNode)
    const autoNode = document.createElement('div')
    autoNode.dataset.areaId = 'dup'
    autoNode.setAttribute('data-sliced-areas-auto', 'true')
    el.appendChild(autoNode)
    const realNode = document.createElement('div')
    realNode.dataset.areaId = 'dup'
    el.appendChild(realNode)
    const collected = (el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }).collectAreaNodes()
    expect(collected.get('dup')).toBe(realNode)

    const resolver = (tag: string) => (tag === 'miss' ? null : document.createElement('div'))
    el.setResolver(resolver)
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.set(areaId, 'miss')
    const ensureAreaNode = (el as unknown as { ensureAreaNode: (a: string, b: string, c?: boolean) => void })
      .ensureAreaNode.bind(el)
    ensureAreaNode('new-node', areaId, false)

    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.set('tagged', 'tagged')
    const inheritAreaTag = (el as unknown as { inheritAreaTag: (a: string, b: string) => void })
      .inheritAreaTag.bind(el)
    inheritAreaTag('tagged', areaId)

    const serializeLayout = (el as unknown as { serializeLayout: (g: any) => any }).serializeLayout.bind(el)
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.delete(areaId)
    const layout = serializeLayout(graph)
    expect(layout.areas[0]?.tag).toBe(areaId)

    const retagEvent = new CustomEvent('sliced-areas:retag', { detail: { tag: 123 } })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(retagEvent)
    const badTargetEvent = new CustomEvent('sliced-areas:retag', { detail: { tag: 'x' } })
    Object.defineProperty(badTargetEvent, 'target', { value: document.createElement('svg') })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(badTargetEvent)

    const badAreaTarget = document.createElement('div')
    const badAreaEvent = new CustomEvent('sliced-areas:retag', { detail: { tag: 'x' } })
    Object.defineProperty(badAreaEvent, 'target', { value: badAreaTarget })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(badAreaEvent)

    const areaTarget = document.createElement('div')
    areaTarget.dataset.areaId = ''
    const areaEvent = new CustomEvent('sliced-areas:retag', { detail: { tag: 'x' } })
    Object.defineProperty(areaEvent, 'target', { value: areaTarget })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(areaEvent)

    const missingArea = document.createElement('div')
    missingArea.dataset.areaId = 'ghost'
    const missingEvent = new CustomEvent('sliced-areas:retag', { detail: { tag: 'x' } })
    Object.defineProperty(missingEvent, 'target', { value: missingArea })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(missingEvent)
  })

  it('covers render tag fallbacks and placeholders', () => {
    const el = setupElement()
    const resolver = vi.fn((tag: string) => {
      const node = document.createElement('div')
      node.textContent = tag
      return node
    })
    el.setResolver(resolver)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for render tags')
    }
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.set(areaId, 'tagged')
    const content = el.querySelector('.sliced-areas-area-content')
    content?.remove()
    const render = (el as unknown as { render: () => void }).render.bind(el)
    render()
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.delete(areaId)
    const content2 = el.querySelector('.sliced-areas-area-content')
    content2?.remove()
    render()
    expect(resolver).toHaveBeenCalled()

    const ensureAreaNode = (el as unknown as { ensureAreaNode: (a: string, b: string, c?: boolean) => void })
      .ensureAreaNode.bind(el)
    el.setResolver(null)
    ;(el as unknown as { areaTags: Map<string, string> }).areaTags.clear()
    ;(el as unknown as { areaTags: Map<string, unknown> }).areaTags.set('placeholder', undefined)
    ensureAreaNode('placeholder', 'missing-source', false)
    const placeholder = el.querySelector('[data-area-id="placeholder"]') as HTMLElement
    expect(placeholder.textContent).toBe('Area')
  })

  it('covers render and retag branches', () => {
    const el = setupElement()
    setResolver(el)
    el.layout = {
      areas: [
        { tag: 'alpha', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { tag: 'beta', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
      ],
    }
    const root = el.querySelector('.sliced-areas-root') as HTMLElement
    root.innerHTML = ''
    const areaTags = (el as unknown as { areaTags: Map<string, string> }).areaTags
    const ids = Array.from(areaTags.keys())
    ;(el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes.clear()
    ;(el as unknown as { render: () => void }).render()
    if (ids[1]) {
      areaTags.delete(ids[1])
    }
    root.innerHTML = ''
    ;(el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes.clear()
    ;(el as unknown as { render: () => void }).render()

    const auto = document.createElement('div')
    auto.dataset.areaId = 'dup'
    auto.setAttribute('data-sliced-areas-auto', 'true')
    const manual = document.createElement('div')
    manual.dataset.areaId = 'dup'
    el.append(auto, manual)
    const collectAreaNodes = (el as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }).collectAreaNodes.bind(
      el,
    )
    const nodes = collectAreaNodes()
    expect(nodes.get('dup')).toBe(manual)

    const el2 = setupElement()
    const autoA = document.createElement('div')
    autoA.dataset.areaId = 'dup'
    autoA.setAttribute('data-sliced-areas-auto', 'true')
    const autoB = document.createElement('div')
    autoB.dataset.areaId = 'dup'
    autoB.setAttribute('data-sliced-areas-auto', 'true')
    el2.append(autoA, autoB)
    const collectAreaNodes2 = (
      el2 as unknown as { collectAreaNodes: () => Map<string, HTMLElement> }
    ).collectAreaNodes.bind(el2)
    const nodes2 = collectAreaNodes2()
    expect(nodes2.get('dup')).toBe(autoA)

    const evt = new CustomEvent('sliced-areas:retag', { detail: { tag: 'next' } })
    Object.defineProperty(evt, 'target', { value: document.createTextNode('x') })
    ;(el as unknown as { onRetagRequest: (e: Event) => void }).onRetagRequest(evt)
  })

  it('reuses cached resolved nodes and clones source content', () => {
    const el = setupElement()
    const resolver = vi.fn(() => {
      const node = document.createElement('div')
      node.classList.add('cached-node')
      return node
    })
    el.setResolver(resolver)
    el.layout = layoutSingle()
    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area for cached render')
    }
    const resolvedNodes = (el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes
    const cached = resolvedNodes.get(areaId)
    if (!cached) {
      throw new Error('Expected cached node for render branch')
    }
    cached.remove()
    ;(el as unknown as { render: () => void }).render()
    const reused = el.querySelector('.cached-node')
    expect(reused).toBe(cached)

    const source = document.createElement('div')
    source.dataset.areaId = 'source'
    source.textContent = 'source'
    el.appendChild(source)
    const ensureAreaNode = (el as unknown as { ensureAreaNode: (a: string, b: string, c?: boolean) => void })
      .ensureAreaNode.bind(el)
    ensureAreaNode('cloned', 'source', true)
    const clone = el.querySelector('[data-area-id="cloned"]') as HTMLElement
    expect(clone).toBeTruthy()
    expect(clone?.hasAttribute('data-sliced-areas-auto')).toBe(true)
  })
})
