import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

import SlicedAreas from '../../src/plugin/vue'
import type { AreaResolver, AreasLayout, SlicedAreasElement } from '../../src/plugin/vue'

const layoutTwo: AreasLayout = {
  areas: [
    { tag: 'left', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
  ],
}

describe('SlicedAreas Vue resolver integration', () => {
  it('receives areaId in Vue resolver', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    let seenAreaId: string | null = null
    const resolver: AreaResolver = (_tag, areaId?: string) => {
      seenAreaId = areaId ?? null
      return document.createElement('div')
    }

    const state = reactive<{ layout: AreasLayout | null; resolver: AreaResolver | null }>({
      layout: layoutTwo,
      resolver,
    })

    const Root = defineComponent({
      setup: () => () => h(SlicedAreas, { layout: state.layout, resolver: state.resolver }),
    })

    const app = createApp(Root)
    app.mount(container)

    await nextTick()

    const element = container.querySelector('sliced-areas') as SlicedAreasElement | null
    const graph = element ? (element as unknown as { graph: any }).graph : null
    const areaIds = graph ? Object.keys(graph.areas) : []
    expect(seenAreaId).not.toBeNull()
    expect(areaIds).toContain(seenAreaId)

    app.unmount()
    container.remove()
  })

  it('supports cleanup callback in Vue resolver', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    let cleanupCalled = false
    const resolver: AreaResolver = () => ({
      element: document.createElement('div'),
      cleanup: () => {
        cleanupCalled = true
      },
    })

    const state = reactive<{ layout: AreasLayout | null; resolver: AreaResolver | null }>({
      layout: layoutTwo,
      resolver,
    })

    const Root = defineComponent({
      setup: () => () => h(SlicedAreas, { layout: state.layout, resolver: state.resolver }),
    })

    const app = createApp(Root)
    app.mount(container)

    await nextTick()

    const element = container.querySelector('sliced-areas') as SlicedAreasElement | null
    const graph = element ? (element as unknown as { graph: any }).graph : null
    const areaId = graph ? Object.keys(graph.areas)[0] : null
    if (element && areaId) {
      element.close(areaId)
    }

    expect(cleanupCalled).toBe(true)

    app.unmount()
    container.remove()
  })
})
