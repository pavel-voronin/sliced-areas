# Vue 3 Guide

Use the Vue wrapper for reactive props, typed events, and direct access to the underlying Web Component. Each example below shows the live result next to the exact Vue code you would write.

## Basic Setup

<VueBasicDemo />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const layout = ref<AreasLayout>({
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.55, top: 1, bottom: 0.4 } },
    { tag: 'preview', rect: { left: 0.55, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'inspector', rect: { left: 0, right: 1, top: 0.4, bottom: 0 } },
  ],
})

const resolver = (tag: string) => {
  const panel = document.createElement('div')
  panel.textContent = `Area: ${tag}`
  panel.style.cssText = 'height: 100%; display: grid; place-items: center;'
  return panel
}

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolver"
    style="width: 100%; height: 420px"
    @layoutchange="handleLayoutChange"
  />
</template>
```

::: tip Coordinate system
`top: 1` represents the top edge and `bottom: 0` represents the bottom edge, matching Blender's convention.
:::

## Layout Presets

<VueLayoutsDemo />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AreasLayout } from 'sliced-areas/vue'

const layouts: Record<string, AreasLayout> = {
  studio: {
    areas: [
      { tag: 'canvas', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
      { tag: 'layers', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
      { tag: 'timeline', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } },
    ],
  },
  grid: {
    areas: [
      { tag: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
      { tag: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
      { tag: 'c', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
      { tag: 'd', rect: { left: 0.5, right: 1, top: 0.5, bottom: 0 } },
    ],
  },
}

const layout = ref<AreasLayout>(layouts.studio)

const applyLayout = (key: string) => {
  layout.value = layouts[key]
}

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
}
</script>
```

## Operations and Events

<VueOperationsDemo />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AreasLayout, SlicedAreasOperationsConfig } from 'sliced-areas/vue'

const layout: AreasLayout = {
  areas: [
    { tag: 'workspace', rect: { left: 0, right: 0.7, top: 1, bottom: 0 } },
    { tag: 'details', rect: { left: 0.7, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'stats', rect: { left: 0.7, right: 1, top: 0.4, bottom: 0 } },
  ],
}

const operations = ref<SlicedAreasOperationsConfig | null>({
  disable: ['swap', 'replace'],
})

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  console.log('Updated layout', detail.layout)
}
</script>
```

## Programmatic Actions

<VueActionsDemo />

Use the component methods to trigger graph operations:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { SlicedAreasElement } from 'sliced-areas'

const areasRef = ref<{ $el: SlicedAreasElement } | null>(null)

const firstAreaId = Object.keys(areasRef.value?.$el?.graph?.areas ?? {})[0]
const secondAreaId = Object.keys(areasRef.value?.$el?.graph?.areas ?? {})[1]

areasRef.value?.$el?.split(firstAreaId, 'right')
areasRef.value?.$el?.join(firstAreaId, secondAreaId)
areasRef.value?.$el?.swap(firstAreaId, secondAreaId)
areasRef.value?.$el?.maximize(firstAreaId)
areasRef.value?.$el?.restore()
</script>
```
