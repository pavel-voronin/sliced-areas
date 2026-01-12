# Vue Component API

Complete API reference for the Vue 3 wrapper component.

## Component

### `<SlicedAreas>`

Vue 3 component wrapper for the Sliced Areas Web Component.

```vue
<script setup>
import { SlicedAreas } from 'sliced-areas/vue'
</script>

<template>
  <SlicedAreas :layout="layout" :resolver="resolver" />
</template>
```

## Import

### Named Import

```js
import { SlicedAreas } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'
```

### Plugin (Global Registration)

```js
import { createApp } from 'vue'
import { SlicedAreasPlugin } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const app = createApp(App)
app.use(SlicedAreasPlugin)

// Now <SlicedAreas> is available in all components
```

## Props

### `layout`

The current layout object.

- **Type**: `AreasLayout | null`
- **Required**: No
- **Default**: `null`
- **Reactive**: Yes

```vue
<script setup>
import { ref } from 'vue'

const layout = ref({
  areas: [
    { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
})
</script>

<template>
  <SlicedAreas :layout="layout" />
</template>
```

**Type Definition:**

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

Content resolver function.

- **Type**: `AreaResolver | null`
- **Required**: No
- **Default**: `null`
- **Reactive**: Yes

```vue
<script setup>
const resolveArea = (tag) => {
  const div = document.createElement('div')
  div.textContent = `Area: ${tag}`
  return div
}
</script>

<template>
  <SlicedAreas :resolver="resolveArea" />
</template>
```

**Type Definition:**

```ts
type AreaResolver = (tag: string) => HTMLElement | null | undefined
```

### `operations`

Enable or disable interactive operations.

- **Type**: `SlicedAreasOperationsConfig | null`
- **Required**: No
- **Default**: `null` (all operations enabled)
- **Reactive**: Yes

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

**Type Definition:**

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

## Events

### `@layoutchange`

Emitted when the layout changes.

- **Type**: `CustomEvent<{ layout: AreasLayout }>`
- **Payload**: `{ layout: AreasLayout }`

```vue
<script setup>
import { ref } from 'vue'

const layout = ref(null)

const handleLayoutChange = (detail) => {
  layout.value = detail.layout

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

**TypeScript:**

```vue
<script setup lang="ts">
import type { AreasLayout } from 'sliced-areas/vue'

const handleLayoutChange = (detail: { layout: AreasLayout }): void => {
  console.log('New layout:', detail.layout)
}
</script>

<template>
  <SlicedAreas @layoutchange="handleLayoutChange" />
</template>
```

### `@cornerclick`

Emitted when an area corner is clicked.

- **Type**: `CustomEvent<CornerClickDetail>`
- **Payload**: `CornerClickDetail`

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

const closeArea = () => {
  // Access the element ref to call methods
  areasRef.value?.close(contextMenu.value.areaId)
  contextMenu.value.show = false
}
</script>

<template>
  <SlicedAreas
    ref="areasRef"
    @cornerclick="handleCornerClick"
  />

  <ContextMenu
    v-if="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    @close-area="closeArea"
  />
</template>
```

**Type Definition:**

```ts
type CornerClickDetail = {
  areaId: string
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  clientX: number
  clientY: number
}
```

## Template Ref

Access the underlying Web Component element via template ref.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SlicedAreasElement } from 'sliced-areas'

const areasRef = ref<SlicedAreasElement | null>(null)

onMounted(() => {
  if (areasRef.value) {
    // Access Web Component methods
    console.log('Current graph:', areasRef.value.graph)
  }
})

const maximizeFirstArea = () => {
  if (areasRef.value?.graph) {
    const firstAreaId = Object.keys(areasRef.value.graph.areas)[0]
    areasRef.value.maximize(firstAreaId)
  }
}
</script>

<template>
  <button @click="maximizeFirstArea">Maximize</button>
  <SlicedAreas ref="areasRef" :layout="layout" />
</template>
```

**Available Methods:**

All Web Component methods are available on the ref:

- `split(areaId, zone?, x?, y?)`
- `join(sourceId, targetId)`
- `replace(sourceId, targetId)`
- `swap(sourceId, targetId)`
- `close(areaId)`
- `retag(areaId, tag)`
- `maximize(areaId)`
- `restore()`
- `setResolver(resolver)`

See [Web Component API](/api/web-component) for full method documentation.

## Slots

The `<SlicedAreas>` component has **no slots**. Content is managed via the `resolver` prop.

## Attributes

All HTML attributes are forwarded to the underlying `<sliced-areas>` element:

```vue
<template>
  <SlicedAreas
    :layout="layout"
    style="width: 100%; height: 100vh"
    class="my-areas"
    data-testid="areas"
  />
</template>
```

## TypeScript

Full TypeScript support is included.

### Import Types

```ts
import type {
  AreasLayout,
  AreaResolver,
  AreaId,
  AreaTag,
  AreaRect,
  CornerClickDetail,
  SlicedAreasElement
} from 'sliced-areas/vue'
```

### Typed Component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout, AreaResolver } from 'sliced-areas/vue'
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

const resolveArea: AreaResolver = (tag: string): HTMLElement | null => {
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
    :resolver="resolveArea"
    @layoutchange="handleLayoutChange"
  />
</template>
```

## Composables

### Basic Composable Example

Create a reusable composable for managing areas:

```ts
// composables/useSlicedAreas.ts
import { ref } from 'vue'
import type { AreasLayout, AreaResolver } from 'sliced-areas/vue'

export function useSlicedAreas(storageKey: string) {
  const layout = ref<AreasLayout | null>(null)

  // Load from localStorage
  const loadLayout = () => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        layout.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load layout:', e)
      }
    }
  }

  // Save to localStorage
  const saveLayout = (newLayout: AreasLayout) => {
    layout.value = newLayout
    localStorage.setItem(storageKey, JSON.stringify(newLayout))
  }

  // Reset layout
  const resetLayout = () => {
    layout.value = null
    localStorage.removeItem(storageKey)
  }

  return {
    layout,
    loadLayout,
    saveLayout,
    resetLayout
  }
}
```

**Usage:**

```vue
<script setup>
import { onMounted } from 'vue'
import { useSlicedAreas } from './composables/useSlicedAreas'

const { layout, loadLayout, saveLayout, resetLayout } = useSlicedAreas('my-layout')

onMounted(() => {
  loadLayout()
})
</script>

<template>
  <button @click="resetLayout">Reset</button>
  <SlicedAreas
    :layout="layout"
    @layoutchange="(detail) => saveLayout(detail.layout)"
  />
</template>
```

## Complete Example

Full example with state management:

```vue
<script setup lang="ts">
import { ref, onMounted, createApp } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout, AreaResolver } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

// Import area components
import EditorArea from './components/EditorArea.vue'
import PreviewArea from './components/PreviewArea.vue'

const STORAGE_KEY = 'app-layout'

const defaultLayout: AreasLayout = {
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
  ]
}

const layout = ref<AreasLayout>(defaultLayout)

const components = {
  editor: EditorArea,
  preview: PreviewArea
}

const resolveArea: AreaResolver = (tag: string): HTMLElement | null => {
  const Component = components[tag]
  if (!Component) return null

  const container = document.createElement('div')
  container.style.cssText = 'width: 100%; height: 100%;'

  const app = createApp(Component)
  app.mount(container)

  return container
}

const handleLayoutChange = (detail: { layout: AreasLayout }): void => {
  layout.value = detail.layout
  localStorage.setItem(STORAGE_KEY, JSON.stringify(detail.layout))
}

const resetLayout = (): void => {
  layout.value = defaultLayout
  localStorage.removeItem(STORAGE_KEY)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      layout.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load layout:', e)
    }
  }
})
</script>

<template>
  <div class="app">
    <header>
      <button @click="resetLayout">Reset Layout</button>
    </header>

    <SlicedAreas
      :layout="layout"
      :resolver="resolveArea"
      @layoutchange="handleLayoutChange"
      style="width: 100%; height: calc(100vh - 60px)"
    />
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
}

header {
  height: 60px;
  padding: 1rem;
  border-bottom: 1px solid #ccc;
}
</style>
```

## See Also

- [Web Component API](/api/web-component) - Full Web Component reference
- [TypeScript Types](/api/types) - Type definitions
- [Vue Guide](/guide/vue) - Usage guide with examples
