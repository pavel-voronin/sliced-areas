# Vue 3 Guide

This guide covers using Sliced Areas with Vue 3. The library provides a native Vue component wrapper with full TypeScript support.

## Installation

Import the Vue component:

```js
import { SlicedAreas } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'
```

Or register globally:

```js
import { createApp } from 'vue'
import { SlicedAreasPlugin } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const app = createApp(App)
app.use(SlicedAreasPlugin)
```

## Basic Usage

### Component Setup

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const layout = ref<AreasLayout>({
  areas: [
    {
      tag: 'editor',
      rect: { left: 0, right: 0.5, top: 1, bottom: 0 }
    },
    {
      tag: 'preview',
      rect: { left: 0.5, right: 1, top: 1, bottom: 0 }
    }
  ]
})

const resolveArea = (tag: string) => {
  const div = document.createElement('div')
  div.textContent = `Area: ${tag}`
  return div
}

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolveArea"
    @layoutchange="handleLayoutChange"
    style="width: 100%; height: 100vh"
  />
</template>
```

## Props

### `layout`

- **Type**: `AreasLayout | null`
- **Required**: No
- **Default**: `null`

The layout object defining areas and their positions:

```ts
type AreasLayout = {
  areas: Array<{
    tag: string
    rect: {
      left: number   // 0..1
      right: number  // 0..1
      top: number    // 0..1 (1 = top, 0 = bottom)
      bottom: number // 0..1
    }
  }>
}
```

### `resolver`

- **Type**: `AreaResolver | null`
- **Required**: No
- **Default**: `null`

A function that creates DOM content for each area tag:

```ts
type AreaResolver = (tag: string) => HTMLElement | null | undefined
```

### `operations`

- **Type**: `SlicedAreasOperationsConfig | null`
- **Required**: No
- **Default**: `null` (all operations enabled)

Enable or disable interactive operations:

```ts
type SlicedAreasOperationsConfig = {
  enable?: Array<
    | 'resize'
    | 'split'
    | 'join'
    | 'replace'
    | 'swap'
    | 'move'
    | 'maximize'
    | 'restore'
  >
  disable?: Array<
    | 'resize'
    | 'split'
    | 'join'
    | 'replace'
    | 'swap'
    | 'move'
    | 'maximize'
    | 'restore'
  >
}
```

```vue
<script setup>
const operations = {
  disable: ['resize', 'swap']
}
</script>

<template>
  <SlicedAreas :operations="operations" />
</template>
```

## Events

### `@layoutchange`

Emitted when the layout changes (resize, split, join, etc.):

```vue
<script setup>
const handleLayoutChange = (detail) => {
  console.log('New layout:', detail.layout)

  // Save to localStorage
  localStorage.setItem('layout', JSON.stringify(detail.layout))
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    @layoutchange="handleLayoutChange"
  />
</template>
```

### `@cornerclick`

Emitted when an area corner is clicked:

```vue
<script setup>
import { ref } from 'vue'

const contextMenu = ref({ show: false, x: 0, y: 0, areaId: null })

const handleCornerClick = (detail) => {
  contextMenu.value = {
    show: true,
    x: detail.clientX,
    y: detail.clientY,
    areaId: detail.areaId
  }
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    @cornerclick="handleCornerClick"
  />

  <ContextMenu
    v-if="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    @close="contextMenu.show = false"
  />
</template>
```

Event detail type:

```ts
type CornerClickDetail = {
  areaId: string
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  clientX: number
  clientY: number
}
```

## Reactive Layout Management

### Using Ref

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AreasLayout } from 'sliced-areas/vue'

const layout = ref<AreasLayout>({
  areas: [
    { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
})

// Reactively update layout
const splitView = () => {
  layout.value = {
    areas: [
      { tag: 'left', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
      { tag: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
    ]
  }
}

// Update from event
const handleLayoutChange = (detail) => {
  layout.value = detail.layout
}
</script>

<template>
  <button @click="splitView">Split View</button>
  <SlicedAreas
    :layout="layout"
    @layoutchange="handleLayoutChange"
  />
</template>
```

### Persistent Layouts

Save and load layouts from localStorage:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AreasLayout } from 'sliced-areas/vue'

const STORAGE_KEY = 'my-app-layout'

const defaultLayout: AreasLayout = {
  areas: [
    { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
}

const layout = ref<AreasLayout>(defaultLayout)

// Load saved layout on mount
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      layout.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse saved layout:', e)
    }
  }
})

// Save layout on change
const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
  localStorage.setItem(STORAGE_KEY, JSON.stringify(detail.layout))
}

// Reset to default
const resetLayout = () => {
  layout.value = defaultLayout
  localStorage.removeItem(STORAGE_KEY)
}
</script>

<template>
  <button @click="resetLayout">Reset Layout</button>
  <SlicedAreas
    :layout="layout"
    @layoutchange="handleLayoutChange"
  />
</template>
```

## Component Integration

### Using Vue Components as Content

While the resolver must return HTMLElement, you can mount Vue components:

```vue
<script setup lang="ts">
import { createApp, h } from 'vue'
import EditorComponent from './components/EditorComponent.vue'
import PreviewComponent from './components/PreviewComponent.vue'

const components = {
  editor: EditorComponent,
  preview: PreviewComponent
}

const resolveArea = (tag: string) => {
  const Component = components[tag]
  if (!Component) return null

  // Create a container
  const container = document.createElement('div')
  container.style.cssText = 'width: 100%; height: 100%;'

  // Mount Vue component
  const app = createApp(Component)
  app.mount(container)

  return container
}
</script>

<template>
  <SlicedAreas :resolver="resolveArea" />
</template>
```

### Sharing State with Area Components

Pass shared state through a composable or provide/inject:

```vue
<script setup lang="ts">
import { ref, provide } from 'vue'
import { createApp } from 'vue'
import EditorArea from './areas/EditorArea.vue'

const sharedData = ref({ text: 'Hello' })

// Provide to child components
provide('sharedData', sharedData)

const resolveArea = (tag: string) => {
  if (tag === 'editor') {
    const container = document.createElement('div')
    const app = createApp(EditorArea)

    // Pass shared state
    app.provide('sharedData', sharedData)
    app.mount(container)

    return container
  }
  return null
}
</script>
```

## Accessing the Web Component

Get a reference to the underlying Web Component element:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SlicedAreasElement } from 'sliced-areas'

const areasRef = ref<SlicedAreasElement | null>(null)

onMounted(() => {
  if (areasRef.value) {
    // Call Web Component methods directly
    console.log('Current graph:', areasRef.value.graph)
  }
})

const maximizeFirstArea = () => {
  if (areasRef.value && areasRef.value.layout) {
    const firstAreaId = Object.keys(areasRef.value.graph?.areas || {})[0]
    areasRef.value.maximize(firstAreaId)
  }
}
</script>

<template>
  <button @click="maximizeFirstArea">Maximize First Area</button>
  <SlicedAreas ref="areasRef" :layout="layout" />
</template>
```

## Complete Example

Here's a full example with multiple area types:

```vue
<script setup lang="ts">
import { ref, createApp } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

// Import area components
import ViewportArea from './components/ViewportArea.vue'
import OutlinerArea from './components/OutlinerArea.vue'
import ConsoleArea from './components/ConsoleArea.vue'

const layout = ref<AreasLayout>({
  areas: [
    { tag: 'viewport', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
    { tag: 'outliner', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
    { tag: 'console', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } }
  ]
})

const components = {
  viewport: ViewportArea,
  outliner: OutlinerArea,
  console: ConsoleArea
}

const resolveArea = (tag: string) => {
  const Component = components[tag]
  if (!Component) {
    const div = document.createElement('div')
    div.textContent = `Unknown area: ${tag}`
    return div
  }

  const container = document.createElement('div')
  container.style.cssText = 'width: 100%; height: 100%;'

  const app = createApp(Component)
  app.mount(container)

  return container
}

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
  localStorage.setItem('app-layout', JSON.stringify(detail.layout))
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolveArea"
    @layoutchange="handleLayoutChange"
    style="width: 100vw; height: 100vh"
  />
</template>
```

## Live Demo

Try the interactive Vue demo below. This uses the Vue wrapper component with reactive props and events.

<VueComponentExample />

## TypeScript Support

Full type support is included:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout, AreaResolver } from 'sliced-areas/vue'

const layout = ref<AreasLayout | null>(null)

const resolver: AreaResolver = (tag: string): HTMLElement | null => {
  const div = document.createElement('div')
  div.textContent = tag
  return div
}

const handleLayoutChange = (detail: { layout: AreasLayout }): void => {
  layout.value = detail.layout
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolver"
    @layoutchange="handleLayoutChange"
  />
</template>
```

## Next Steps

- [Web Components Guide](/guide/web-components) - Learn about the underlying Web Component
- [Core Concepts](/guide/concepts) - Understand the layout model
- [Vue API Reference](/api/vue) - Full API documentation
