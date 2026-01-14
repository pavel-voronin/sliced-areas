import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { layoutSingle, layoutTwoVertical, setupElement } from '../sliced-areas.test-utils'

const layoutWithId = (id: string, tag: string) => ({
  areas: [{ id, tag, rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
})

describe('sliced-areas resolver API', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('passes areaId as second parameter to resolver', () => {
    const el = setupElement()
    const resolver = vi.fn((tag: string, areaId?: string) => {
      if (!areaId) {
        throw new Error('Expected area id')
      }
      const node = document.createElement('div')
      node.textContent = tag
      node.dataset.testAreaId = areaId
      return node
    })
    el.setResolver(resolver)
    el.layout = layoutSingle()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    expect(resolver).toHaveBeenCalledWith('main', areaId)
  })

  it('works with legacy resolver that only accepts tag', () => {
    const el = setupElement()
    el.setResolver((tag: string) => {
      const node = document.createElement('div')
      node.textContent = tag
      return node
    })
    el.layout = layoutSingle()

    const node = Array.from(el.querySelectorAll<HTMLElement>('[data-area-id]')).find(
      (item) => !item.hasAttribute('data-sliced-areas-internal'),
    )
    expect(node).not.toBeNull()
    expect(node?.textContent).toBe('main')
  })

  it('supports resolver object results with cleanup', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver((tag: string) => ({
      element: Object.assign(document.createElement('div'), { textContent: tag }),
      cleanup,
    }))
    el.layout = layoutSingle()

    expect(cleanup).not.toHaveBeenCalled()
    const node = el.querySelector('[data-area-id]')
    expect(node).not.toBeNull()
  })

  it('calls cleanup when area is closed', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    el.close(areaId)

    expect(cleanup).toHaveBeenCalled()
  })

  it('calls cleanup when area tag changes via declarative layout', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutWithId('area-1', 'alpha')
    el.layout = layoutWithId('area-1', 'beta')

    expect(cleanup).toHaveBeenCalled()
  })

  it('calls cleanup when area is retagged', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutSingle()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    el.retag(areaId, 'updated')

    expect(cleanup).toHaveBeenCalled()
  })

  it('calls cleanup when area is replaced', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const [sourceId, targetId] = Object.keys(graph.areas)
    if (!sourceId || !targetId) {
      throw new Error('Expected area ids')
    }
    el.replace(sourceId, targetId)

    expect(cleanup).toHaveBeenCalled()
  })

  it('handles cleanup errors gracefully', () => {
    const el = setupElement()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed')
    })
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    expect(() => el.close(areaId)).not.toThrow()
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('handles cleanup errors when detaching area nodes', () => {
    const el = setupElement()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed')
    })
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutSingle()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    el.retag(areaId, 'detached')

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('cleans up all areas when resolver changes', () => {
    const el = setupElement()
    const cleanups = new Map<string, ReturnType<typeof vi.fn>>()
    el.setResolver((tag: string, areaId?: string) => {
      if (!areaId) {
        throw new Error('Expected area id')
      }
      const cleanup = vi.fn()
      cleanups.set(areaId, cleanup)
      const node = document.createElement('div')
      node.textContent = tag
      return { element: node, cleanup }
    })
    el.layout = layoutTwoVertical()

    el.setResolver(() => document.createElement('div'))

    for (const cleanup of cleanups.values()) {
      expect(cleanup).toHaveBeenCalled()
    }
  })

  it('logs cleanup errors when resolver changes', () => {
    const el = setupElement()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed')
    })
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutSingle()

    el.setResolver(() => document.createElement('div'))

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('creates a placeholder when resolver result is null or invalid', () => {
    const el = setupElement()
    let call = 0
    el.setResolver(() => {
      call += 1
      if (call === 1) {
        return { element: document.createElement('div') }
      }
      return { value: 'invalid' } as unknown as { element: HTMLElement }
    })
    el.layout = layoutSingle()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }
    el.split(areaId, 'right')

    const placeholder = el.querySelector('.sliced-areas-auto-content')
    expect(placeholder).not.toBeNull()
  })

  it('treats resolver objects with non-elements as missing content', () => {
    const el = setupElement()
    el.setResolver(() => ({
      element: undefined as unknown as HTMLElement,
    }))

    expect(() => {
      el.layout = layoutSingle()
    }).toThrow(/Missing area content detected/)
  })

  it('keeps cleanup callbacks after swap', () => {
    const el = setupElement()
    const cleanups = new Map<string, ReturnType<typeof vi.fn>>()
    el.setResolver((tag: string, areaId?: string) => {
      if (!areaId) {
        throw new Error('Expected area id')
      }
      const cleanup = vi.fn()
      cleanups.set(areaId, cleanup)
      const node = document.createElement('div')
      node.textContent = tag
      return { element: node, cleanup }
    })
    el.layout = layoutTwoVertical()

    const graph = (el as unknown as { graph: any }).graph
    const [firstId, secondId] = Object.keys(graph.areas)
    if (!firstId || !secondId) {
      throw new Error('Expected area ids')
    }
    el.swap(firstId, secondId)
    el.close(firstId)

    const cleanup = cleanups.get(firstId)
    expect(cleanup).toHaveBeenCalled()
  })

  it('transfers cleanup callback when renaming area ids', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver((_tag: string, _areaId?: string) => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutWithId('area-a', 'main')

    const graph = (el as unknown as { graph: any }).graph
    ;(el as unknown as { renameAreaId: (graph: any, fromId: string, toId: string) => any }).renameAreaId(
      graph,
      'area-a',
      'area-b',
    )

    const callbacks = (el as unknown as { cleanupCallbacks: Map<string, () => void> }).cleanupCallbacks
    expect(callbacks.has('area-b')).toBe(true)
  })

  it('logs cleanup errors when renaming to an existing node id', () => {
    const el = setupElement()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed')
    })
    el.setResolver((_tag: string, _areaId?: string) => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutWithId('area-a', 'main')

    const target = document.createElement('div')
    target.dataset.areaId = 'area-b'
    el.appendChild(target)

    const graph = (el as unknown as { graph: any }).graph
    ;(el as unknown as { renameAreaId: (graph: any, fromId: string, toId: string) => any }).renameAreaId(
      graph,
      'area-a',
      'area-b',
    )

    expect(cleanup).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('prunes cleanup callbacks for removed tags', () => {
    const el = setupElement()
    const cleanup = vi.fn()
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutWithId('area-a', 'main')

    const callbacks = (el as unknown as { cleanupCallbacks: Map<string, () => void> }).cleanupCallbacks
    expect(callbacks.has('area-a')).toBe(true)

    ;(el as unknown as { pruneAreaTags: (graph: any) => void }).pruneAreaTags({
      verts: {},
      edges: {},
      areas: {},
    })

    expect(callbacks.has('area-a')).toBe(false)
  })

  it('logs cleanup errors when reconciling wrapper content', () => {
    const el = setupElement()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed')
    })
    el.setResolver(() => ({
      element: document.createElement('div'),
      cleanup,
    }))
    el.layout = layoutSingle()

    const graph = (el as unknown as { graph: any }).graph
    const areaId = Object.keys(graph.areas)[0]
    if (!areaId) {
      throw new Error('Expected area id')
    }

    const wrapper = el.querySelector('.sliced-areas-area') as HTMLElement | null
    const currentNode = wrapper
      ? Array.from(wrapper.children).find(
          (child) => !child.hasAttribute('data-sliced-areas-internal'),
        )
      : null
    if (!currentNode) {
      throw new Error('Expected current node')
    }

    currentNode.removeAttribute('data-area-id')
    ;(el as unknown as { resolvedNodes: Map<string, HTMLElement> }).resolvedNodes.delete(areaId)
    ;(el as unknown as { render: () => void }).render()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
