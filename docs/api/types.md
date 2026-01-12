# TypeScript Types

Complete type reference for Sliced Areas.

## Import

```ts
// Web Component types
import type {
  SlicedAreasElement,
  AreasLayout,
  AreasGraph,
  AreaResolver,
  AreaId,
  AreaTag,
  AreaRect,
  SlicedAreasOperation,
  SlicedAreasOperationsConfig,
  CornerId,
  CornerClickDetail,
  GraphVert,
  GraphEdge,
  GraphArea
} from 'sliced-areas'

// Vue types (includes Web Component types)
import type {
  AreasLayout,
  AreaResolver,
  // ... all Web Component types
} from 'sliced-areas/vue'
```

## Layout Types

### `AreasLayout`

Serializable layout object.

```ts
type AreasLayout = {
  areas: Array<{
    tag: AreaTag
    rect: AreaRect
  }>
}
```

**Usage:**

```ts
const layout: AreasLayout = {
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
}
```

### `AreaRect`

Normalized rectangle in 0..1 coordinate space.

```ts
type AreaRect = {
  left: number    // 0..1
  right: number   // 0..1
  top: number     // 0..1 (1 = top, 0 = bottom)
  bottom: number  // 0..1
}
```

**Example:**

```ts
// Full screen
const fullScreen: AreaRect = {
  left: 0,
  right: 1,
  top: 1,
  bottom: 0
}

// Top-left quadrant
const topLeft: AreaRect = {
  left: 0,
  right: 0.5,
  top: 1,
  bottom: 0.5
}
```

### `AreaId`

Stable internal identifier for an area.

```ts
type AreaId = string
```

**Note:** Area IDs are managed internally and should be obtained from the graph or events.

### `AreaTag`

External identifier for area content.

```ts
type AreaTag = string
```

**Usage:**

```ts
const tag: AreaTag = 'editor'

// Tags are user-defined and map to content via the resolver
```

### `CornerId`

Area corner identifiers.

```ts
type CornerId = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
```

**Usage:**

```ts
const corner: CornerId = 'top-left'

// Used in CornerClickDetail event
```

## Graph Types

### `AreasGraph`

Internal planar graph representation.

```ts
type AreasGraph = {
  verts: Record<VertId, GraphVert>
  edges: Record<EdgeId, GraphEdge>
  areas: Record<AreaId, GraphArea>
}
```

**Usage:**

```ts
const graph: AreasGraph = element.graph

// Access vertices
Object.values(graph.verts).forEach(vert => {
  console.log(`Vertex ${vert.id} at (${vert.x}, ${vert.y})`)
})
```

### `GraphVert`

Graph vertex with normalized coordinates.

```ts
type GraphVert = {
  id: VertId
  x: number   // 0..1
  y: number   // 0..1
}
```

### `GraphEdge`

Graph edge connecting two vertices.

```ts
type GraphEdge = {
  id: EdgeId
  v1: VertId      // First vertex
  v2: VertId      // Second vertex
  border: boolean // True if on container border
}
```

### `GraphArea`

Area represented by four ordered vertices.

```ts
type GraphArea = {
  id: AreaId
  v1: VertId  // Top-left
  v2: VertId  // Top-right
  v3: VertId  // Bottom-right
  v4: VertId  // Bottom-left
}
```

**Note:** Vertices are ordered clockwise starting from top-left.

## Function Types

### `AreaResolver`

Content resolver function.

```ts
type AreaResolver = (tag: AreaTag) => HTMLElement | null | undefined
```

**Parameters:**

- `tag`: The area tag to resolve

**Returns:**

- `HTMLElement`: Content to display in the area
- `null` or `undefined`: Skip rendering for this tag

**Example:**

```ts
const resolver: AreaResolver = (tag: AreaTag): HTMLElement | null => {
  if (tag === 'editor') {
    const textarea = document.createElement('textarea')
    textarea.style.cssText = 'width: 100%; height: 100%;'
    return textarea
  }

  if (tag === 'preview') {
    const div = document.createElement('div')
    div.textContent = 'Preview'
    return div
  }

  return null
}
```

### `SlicedAreasOperation`

Operation identifiers for enabling or disabling behavior.

```ts
type SlicedAreasOperation =
  | 'resize'
  | 'split'
  | 'join'
  | 'replace'
  | 'swap'
  | 'move'
  | 'maximize'
  | 'restore'
```

### `SlicedAreasOperationsConfig`

Configuration for which operations are enabled.

```ts
type SlicedAreasOperationsConfig = {
  enable?: SlicedAreasOperation[]
  disable?: SlicedAreasOperation[]
}
```

## Event Types

### `CornerClickDetail`

Event detail for corner click events.

```ts
type CornerClickDetail = {
  areaId: AreaId
  corner: CornerId
  clientX: number
  clientY: number
}
```

**Usage:**

```ts
element.addEventListener('sliced-areas:cornerclick', (e: CustomEvent<CornerClickDetail>) => {
  const { areaId, corner, clientX, clientY } = e.detail

  console.log(`Area ${areaId}, corner ${corner} clicked at (${clientX}, ${clientY})`)
})
```

## Element Types

### `SlicedAreasElement`

The Web Component element class.

```ts
class SlicedAreasElement extends HTMLElement {
  // Properties
  layout: AreasLayout | null
  operations: SlicedAreasOperationsConfig | null
  readonly graph: AreasGraph | null

  // Methods
  setResolver(resolver: AreaResolver | null): void
  split(sourceAreaId: AreaId, zone?: string, clientX?: number, clientY?: number): void
  join(sourceAreaId: AreaId, targetAreaId: AreaId): void
  replace(sourceAreaId: AreaId, targetAreaId: AreaId): void
  swap(sourceAreaId: AreaId, targetAreaId: AreaId): void
  close(areaId: AreaId): void
  retag(areaId: AreaId, tag: AreaTag): void
  maximize(areaId: AreaId): void
  restore(): void

  // Lifecycle
  connectedCallback(): void
  disconnectedCallback(): void
}
```

**Usage:**

```ts
const element = document.querySelector('sliced-areas') as SlicedAreasElement

element.layout = { areas: [...] }
element.setResolver((tag) => ...)
```

## Internal Types

These types are exported but intended for advanced use cases.

### `VertId`

Internal vertex identifier.

```ts
type VertId = string
```

### `EdgeId`

Internal edge identifier.

```ts
type EdgeId = string
```

## Type Guards

### Check if layout is valid

```ts
function isValidLayout(layout: unknown): layout is AreasLayout {
  if (!layout || typeof layout !== 'object') return false
  const l = layout as AreasLayout
  return (
    Array.isArray(l.areas) &&
    l.areas.every(area =>
      typeof area.tag === 'string' &&
      typeof area.rect === 'object' &&
      typeof area.rect.left === 'number' &&
      typeof area.rect.right === 'number' &&
      typeof area.rect.top === 'number' &&
      typeof area.rect.bottom === 'number'
    )
  )
}
```

### Check if rect is normalized

```ts
function isNormalizedRect(rect: AreaRect): boolean {
  return (
    rect.left >= 0 && rect.left <= 1 &&
    rect.right >= 0 && rect.right <= 1 &&
    rect.top >= 0 && rect.top <= 1 &&
    rect.bottom >= 0 && rect.bottom <= 1 &&
    rect.left < rect.right &&
    rect.bottom < rect.top
  )
}
```

## Utility Types

### Extract area tags

```ts
type ExtractTags<T extends AreasLayout> = T['areas'][number]['tag']

// Usage
type MyLayout = {
  areas: Array<{ tag: 'editor' | 'preview', rect: AreaRect }>
}

type MyTags = ExtractTags<MyLayout> // 'editor' | 'preview'
```

### Typed resolver

```ts
type TypedResolver<T extends string> = (tag: T) => HTMLElement | null

// Usage
type MyTags = 'editor' | 'preview'
const resolver: TypedResolver<MyTags> = (tag) => {
  // tag is strongly typed as 'editor' | 'preview'
  switch (tag) {
    case 'editor': return createEditor()
    case 'preview': return createPreview()
  }
}
```

## Examples

### Full typed component

```ts
import type {
  SlicedAreasElement,
  AreasLayout,
  AreaResolver,
  CornerClickDetail
} from 'sliced-areas'

class MyApp {
  private element: SlicedAreasElement
  private layout: AreasLayout

  constructor() {
    this.element = document.querySelector('sliced-areas')!

    this.layout = {
      areas: [
        { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
      ]
    }

    this.setup()
  }

  private setup(): void {
    this.element.layout = this.layout
    this.element.setResolver(this.createResolver())

    this.element.addEventListener('sliced-areas:layoutchange', this.handleLayoutChange)
    this.element.addEventListener('sliced-areas:cornerclick', this.handleCornerClick)
  }

  private createResolver(): AreaResolver {
    return (tag: string): HTMLElement | null => {
      const div = document.createElement('div')
      div.textContent = `Area: ${tag}`
      return div
    }
  }

  private handleLayoutChange = (e: CustomEvent<{ layout: AreasLayout }>): void => {
    this.layout = e.detail.layout
    localStorage.setItem('layout', JSON.stringify(this.layout))
  }

  private handleCornerClick = (e: CustomEvent<CornerClickDetail>): void => {
    const { areaId, corner, clientX, clientY } = e.detail
    console.log(`Corner ${corner} of area ${areaId} clicked`)
  }
}
```

### Vue typed component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import type { AreasLayout, AreaResolver, CornerClickDetail } from 'sliced-areas/vue'

const layout = ref<AreasLayout>({
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
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

const handleCornerClick = (detail: CornerClickDetail): void => {
  console.log(`Corner ${detail.corner} clicked on area ${detail.areaId}`)
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolveArea"
    @layoutchange="handleLayoutChange"
    @cornerclick="handleCornerClick"
  />
</template>
```

## See Also

- [Web Component API](/api/web-component) - Web Component methods and properties
- [Vue API](/api/vue) - Vue component reference
- [Core Concepts](/guide/concepts) - Understanding the types in context
