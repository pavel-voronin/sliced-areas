import { describe, it, expect, vi } from 'vitest'
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  resolveComponent,
} from 'vue'

import SlicedAreas, { SlicedAreasPlugin } from '../../src/plugin/vue'
import type {
  AreaResolver,
  AreasLayout,
  CornerClickDetail,
  SlicedAreasElement,
} from '../../src/plugin/vue'

describe('SlicedAreas Vue wrapper', () => {
  it('syncs layout and resolver with the custom element', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const layout: AreasLayout = {
      areas: [
        {
          tag: 'main',
          rect: { left: 0, right: 1, top: 0, bottom: 1 },
        },
      ],
    }

    const resolver: AreaResolver = () => document.createElement('div')
    const state = reactive<{ layout: AreasLayout | null; resolver: AreaResolver | null }>({
      layout,
      resolver,
    })

    const Root = defineComponent({
      setup: () => () =>
        h(SlicedAreas, {
          layout: state.layout,
          resolver: state.resolver,
        }),
    })

    const app = createApp(Root)
    app.mount(container)

    await nextTick()

    const element = container.querySelector('sliced-areas') as SlicedAreasElement | null
    expect(element).not.toBeNull()
    expect(element?.layout?.areas[0]?.tag).toBe('main')

    const updatedResolver = vi.fn<AreaResolver>(() => document.createElement('div'))
    const setResolverSpy = vi.spyOn(element as SlicedAreasElement, 'setResolver')
    state.resolver = updatedResolver
    await nextTick()

    expect(setResolverSpy).toHaveBeenCalledWith(updatedResolver)

    app.unmount()
    container.remove()
  })

  it('emits layoutchange when the custom element dispatches it', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const received: Array<{ layout: AreasLayout }> = []

    const Root = defineComponent({
      setup: () => () =>
        h(SlicedAreas, {
          onLayoutchange: (detail: { layout: AreasLayout }) => received.push(detail),
        }),
    })

    const app = createApp(Root)
    app.mount(container)

    const element = container.querySelector('sliced-areas') as SlicedAreasElement | null
    expect(element).not.toBeNull()

    const layout: AreasLayout = {
      areas: [
        {
          tag: 'main',
          rect: { left: 0, right: 1, top: 0, bottom: 1 },
        },
      ],
    }

    element?.dispatchEvent(
      new CustomEvent('sliced-areas:layoutchange', {
        detail: { layout },
      }),
    )
    await nextTick()

    expect(received).toEqual([{ layout }])

    app.unmount()
    container.remove()
  })

  it('emits cornerclick when the custom element dispatches it', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const received: CornerClickDetail[] = []

    const Root = defineComponent({
      setup: () => () =>
        h(SlicedAreas, {
          onCornerclick: (detail: CornerClickDetail) => received.push(detail),
        }),
    })

    const app = createApp(Root)
    app.mount(container)

    const element = container.querySelector('sliced-areas') as SlicedAreasElement | null
    expect(element).not.toBeNull()

    const detail: CornerClickDetail = {
      areaId: 'area-1',
      corner: 'top-left',
      clientX: 120,
      clientY: 80,
    }

    element?.dispatchEvent(new CustomEvent('sliced-areas:cornerclick', { detail }))
    await nextTick()

    expect(received).toEqual([detail])

    app.unmount()
    container.remove()
  })

  it('registers the component through the plugin', () => {
    const container = document.createElement('div')
    document.body.append(container)

    const Root = defineComponent({
      render() {
        return h(resolveComponent('SlicedAreas'))
      },
    })

    const app = createApp(Root)
    app.use(SlicedAreasPlugin)
    app.mount(container)

    const element = container.querySelector('sliced-areas')
    expect(element).not.toBeNull()

    app.unmount()
    container.remove()
  })

  it('binds and unbinds DOM event listeners', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    const Root = defineComponent({
      setup: () => () => h(SlicedAreas),
    })

    const app = createApp(Root)
    app.mount(container)
    await nextTick()

    expect(addSpy).toHaveBeenCalledWith('sliced-areas:layoutchange', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('sliced-areas:cornerclick', expect.any(Function))

    app.unmount()

    expect(removeSpy).toHaveBeenCalledWith('sliced-areas:layoutchange', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('sliced-areas:cornerclick', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
    container.remove()
  })
})
