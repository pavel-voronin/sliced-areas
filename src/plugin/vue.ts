import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
  type App,
  type PropType,
} from 'vue'

import { registerSlicedAreasElement } from './sliced-areas'
import type { AreaResolver, AreasLayout, CornerClickDetail, SlicedAreasElement } from './sliced-areas'

export type {
  AreaId,
  AreaRect,
  AreaTag,
  AreasGraph,
  AreasLayout,
  AreaResolver,
  CornerClickDetail,
  GraphArea,
  GraphEdge,
  GraphVert,
  SlicedAreasElement,
} from './sliced-areas'

registerSlicedAreasElement()

const SlicedAreas = defineComponent({
  name: 'SlicedAreas',
  inheritAttrs: false,
  props: {
    layout: {
      type: Object as PropType<AreasLayout | null>,
      default: null,
    },
    resolver: {
      type: Function as unknown as PropType<AreaResolver | null>,
      default: null,
    },
  },
  emits: ['layoutchange', 'cornerclick'],
  setup(props, { emit, slots }) {
    const attrs = useAttrs()
    const elementRef = ref<SlicedAreasElement | null>(null)

    const onLayoutChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ layout: AreasLayout }>
      emit('layoutchange', customEvent.detail)
    }

    const onCornerClick = (event: Event) => {
      const customEvent = event as CustomEvent<CornerClickDetail>
      emit('cornerclick', customEvent.detail)
    }

    onMounted(() => {
      const element = elementRef.value!
      element.addEventListener('sliced-areas:layoutchange', onLayoutChange)
      element.addEventListener('sliced-areas:cornerclick', onCornerClick)
    })

    onBeforeUnmount(() => {
      const element = elementRef.value!
      element.removeEventListener('sliced-areas:layoutchange', onLayoutChange)
      element.removeEventListener('sliced-areas:cornerclick', onCornerClick)
    })

    watch(
      [() => elementRef.value, () => props.resolver, () => props.layout],
      ([element, resolver, layout]) => {
        if (!element) return
        element.setResolver(resolver)
        element.layout = layout
      },
      { immediate: true },
    )

    return () =>
      h(
        'sliced-areas',
        {
          ...attrs,
          ref: elementRef,
        },
        slots.default?.(),
      )
  },
})

export const SlicedAreasPlugin = {
  install(app: App) {
    app.component('SlicedAreas', SlicedAreas)
  },
}

export default SlicedAreas
