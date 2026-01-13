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
import type {
  AreaAddedDetail,
  AreaRemovedDetail,
  AreaUpdatedDetail,
  AreaResolver,
  AreasLayout,
  CornerClickDetail,
  SlicedAreasElement,
  SlicedAreasOperationsConfig,
} from './sliced-areas'

export type {
  AreaId,
  AreaAddedDetail,
  AreaRect,
  AreaRemovedDetail,
  AreaTag,
  AreasGraph,
  AreasLayout,
  AreaResolver,
  AreaUpdatedDetail,
  CornerClickDetail,
  GraphArea,
  GraphEdge,
  GraphVert,
  SlicedAreasElement,
  SlicedAreasOperation,
  SlicedAreasOperationsConfig,
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
    operations: {
      type: Object as PropType<SlicedAreasOperationsConfig | null>,
      default: null,
    },
  },
  emits: ['layoutchange', 'cornerclick', 'area-added', 'area-removed', 'area-updated'],
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

    const onAreaAdded = (event: Event) => {
      const customEvent = event as CustomEvent<AreaAddedDetail>
      emit('area-added', customEvent.detail)
    }

    const onAreaRemoved = (event: Event) => {
      const customEvent = event as CustomEvent<AreaRemovedDetail>
      emit('area-removed', customEvent.detail)
    }

    const onAreaUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AreaUpdatedDetail>
      emit('area-updated', customEvent.detail)
    }

    onMounted(() => {
      const element = elementRef.value!
      element.addEventListener('sliced-areas:layoutchange', onLayoutChange)
      element.addEventListener('sliced-areas:cornerclick', onCornerClick)
      element.addEventListener('sliced-areas:area-added', onAreaAdded)
      element.addEventListener('sliced-areas:area-removed', onAreaRemoved)
      element.addEventListener('sliced-areas:area-updated', onAreaUpdated)
    })

    onBeforeUnmount(() => {
      const element = elementRef.value!
      element.removeEventListener('sliced-areas:layoutchange', onLayoutChange)
      element.removeEventListener('sliced-areas:cornerclick', onCornerClick)
      element.removeEventListener('sliced-areas:area-added', onAreaAdded)
      element.removeEventListener('sliced-areas:area-removed', onAreaRemoved)
      element.removeEventListener('sliced-areas:area-updated', onAreaUpdated)
    })

    watch(
      [() => elementRef.value, () => props.resolver, () => props.layout, () => props.operations],
      ([element, resolver, layout, operations]) => {
        if (!element) return
        element.setResolver(resolver)
        element.layout = layout
        element.operations = operations
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

export { SlicedAreas }
export default SlicedAreas
