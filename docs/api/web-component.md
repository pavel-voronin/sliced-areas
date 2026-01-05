# Web Component API

Complete API reference for the `<sliced-areas>` Web Component.

## Element

### `<sliced-areas>`

Custom HTML element for managing resizable and splittable areas.

```html
<sliced-areas style="width: 100%; height: 100vh;"></sliced-areas>
```

**Tag Name**: `sliced-areas`

**Class**: `SlicedAreasElement`

## Properties

### `layout`

Get or set the current layout.

- **Type**: `AreasLayout | null`
- **Default**: `null`
- **Reactive**: Yes (triggers re-render)

```js
// Get current layout
const layout = element.layout

// Set new layout
element.layout = {
  areas: [
    { tag: 'editor', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
}

// Clear layout
element.layout = null
```

### `graph` <Badge type="tip" text="Read-only" />

Access the internal planar graph representation.

- **Type**: `AreasGraph | null`
- **Read-only**: Yes
- **Advanced**: For debugging and advanced use cases

```js
const graph = element.graph
if (graph) {
  console.log('Vertices:', graph.verts)
  console.log('Edges:', graph.edges)
  console.log('Areas:', graph.areas)
}
```

## Methods

### `setResolver()`

Set the content resolver function.

```ts
setResolver(resolver: AreaResolver | null): void
```

**Parameters:**

- `resolver`: Function that creates content for each area tag, or `null` to clear

**Example:**

```js
element.setResolver((tag) => {
  const div = document.createElement('div')
  div.textContent = `Area: ${tag}`
  return div
})

// Clear resolver
element.setResolver(null)
```

### `split()`

Split an area into two parts.

```ts
split(
  sourceAreaId: AreaId,
  zone?: string,
  clientX?: number,
  clientY?: number
): void
```

**Parameters:**

- `sourceAreaId`: ID of the area to split
- `zone` (optional): Drop zone identifier
  - `'split-vertical'` - Split left/right
  - `'split-horizontal'` - Split top/bottom
- `clientX` (optional): X coordinate for split position
- `clientY` (optional): Y coordinate for split position

**Example:**

```js
// Split area vertically (left/right)
element.split(areaId, 'split-vertical')

// Split area horizontally (top/bottom)
element.split(areaId, 'split-horizontal')

// Split with default behavior
element.split(areaId)
```

**Emits:** `sliced-areas:layoutchange`

### `join()`

Merge two adjacent areas into one.

```ts
join(sourceAreaId: AreaId, targetAreaId: AreaId): void
```

**Parameters:**

- `sourceAreaId`: ID of the area to merge from
- `targetAreaId`: ID of the area to merge into

**Example:**

```js
element.join(areaId1, areaId2)
```

**Emits:** `sliced-areas:layoutchange`

**Note:** Areas must be adjacent (share an edge).

### `replace()`

Replace the content tag of a target area.

```ts
replace(sourceAreaId: AreaId, targetAreaId: AreaId): void
```

**Parameters:**

- `sourceAreaId`: ID of the area whose content to copy
- `targetAreaId`: ID of the area to replace

**Example:**

```js
// Replace target's content with source's content
element.replace(sourceId, targetId)
```

**Emits:** `sliced-areas:layoutchange`

### `swap()`

Swap the positions and content of two areas.

```ts
swap(sourceAreaId: AreaId, targetAreaId: AreaId): void
```

**Parameters:**

- `sourceAreaId`: ID of the first area
- `targetAreaId`: ID of the second area

**Example:**

```js
element.swap(areaId1, areaId2)
```

**Emits:** `sliced-areas:layoutchange`

### `close()`

Close an area and redistribute its space.

```ts
close(areaId: AreaId): void
```

**Parameters:**

- `areaId`: ID of the area to close

**Example:**

```js
element.close(areaId)
```

**Emits:** `sliced-areas:layoutchange`

**Note:** Cannot close the last remaining area.

### `retag()`

Change the content tag of an area.

```ts
retag(areaId: AreaId, tag: AreaTag): void
```

**Parameters:**

- `areaId`: ID of the area to retag
- `tag`: New tag string

**Example:**

```js
// Change area content from 'editor' to 'viewer'
element.retag(areaId, 'viewer')
```

**Emits:** `sliced-areas:layoutchange`

### `maximize()`

Maximize an area to full screen, hiding all others.

```ts
maximize(areaId: AreaId): void
```

**Parameters:**

- `areaId`: ID of the area to maximize

**Example:**

```js
element.maximize(areaId)
```

**Emits:** `sliced-areas:layoutchange`

**Note:** Stores the current layout for later restoration.

### `restore()`

Restore the layout after maximizing.

```ts
restore(): void
```

**Example:**

```js
element.restore()
```

**Emits:** `sliced-areas:layoutchange`

**Note:** Only works if a layout was previously maximized.

## Events

### `sliced-areas:layoutchange`

Fired when the layout changes.

**Event Type:** `CustomEvent<{ layout: AreasLayout }>`

**Detail:**

```ts
{
  layout: AreasLayout  // The new layout
}
```

**Example:**

```js
element.addEventListener('sliced-areas:layoutchange', (event) => {
  const layout = event.detail.layout
  console.log('Layout changed:', layout)

  // Save to localStorage
  localStorage.setItem('layout', JSON.stringify(layout))
})
```

**Triggered by:**
- Setting `layout` property
- Calling `split()`, `join()`, `replace()`, `swap()`
- Calling `close()`, `retag()`
- Calling `maximize()`, `restore()`
- User dragging splitters
- User drag-and-drop operations

### `sliced-areas:cornerclick`

Fired when an area corner is clicked.

**Event Type:** `CustomEvent<CornerClickDetail>`

**Detail:**

```ts
{
  areaId: AreaId,     // ID of the clicked area
  corner: CornerId,   // Which corner was clicked
  clientX: number,    // X coordinate
  clientY: number     // Y coordinate
}
```

**Corner Values:**
- `'top-left'`
- `'top-right'`
- `'bottom-left'`
- `'bottom-right'`

**Example:**

```js
element.addEventListener('sliced-areas:cornerclick', (event) => {
  const { areaId, corner, clientX, clientY } = event.detail

  // Show context menu
  showContextMenu({
    x: clientX,
    y: clientY,
    items: [
      { label: 'Close Area', onClick: () => element.close(areaId) },
      { label: 'Maximize', onClick: () => element.maximize(areaId) }
    ]
  })
})
```

## Lifecycle Hooks

### `connectedCallback()`

Called when the element is added to the DOM.

**Automatic:** Yes (standard Web Component lifecycle)

**What it does:**
- Creates root and stash containers
- Sets up ResizeObserver
- Renders the current layout

### `disconnectedCallback()`

Called when the element is removed from the DOM.

**Automatic:** Yes (standard Web Component lifecycle)

**What it does:**
- Cleans up ResizeObserver
- Removes event listeners
- Clears drag state

## TypeScript

Import types for better type safety:

```ts
import type {
  SlicedAreasElement,
  AreasLayout,
  AreasGraph,
  AreaResolver,
  AreaId,
  AreaTag,
  AreaRect,
  CornerId,
  CornerClickDetail
} from 'sliced-areas'

// Use types
const el = document.querySelector('sliced-areas') as SlicedAreasElement

const layout: AreasLayout = {
  areas: [
    { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
}

const resolver: AreaResolver = (tag: AreaTag): HTMLElement | null => {
  const div = document.createElement('div')
  div.textContent = tag
  return div
}

el.layout = layout
el.setResolver(resolver)

el.addEventListener('sliced-areas:layoutchange', (e: CustomEvent<{ layout: AreasLayout }>) => {
  console.log(e.detail.layout)
})

el.addEventListener('sliced-areas:cornerclick', (e: CustomEvent<CornerClickDetail>) => {
  const { areaId, corner, clientX, clientY } = e.detail
  console.log(`Corner ${corner} of area ${areaId} clicked at (${clientX}, ${clientY})`)
})
```

## Advanced Usage

### Accessing Internal State

```js
// Get current graph
const graph = element.graph

// Access vertices
Object.values(graph.verts).forEach(vert => {
  console.log(`Vertex ${vert.id} at (${vert.x}, ${vert.y})`)
})

// Access edges
Object.values(graph.edges).forEach(edge => {
  console.log(`Edge ${edge.id}: ${edge.v1} -> ${edge.v2}, border: ${edge.border}`)
})

// Access areas
Object.entries(graph.areas).forEach(([id, area]) => {
  console.log(`Area ${id}: vertices ${area.v1}, ${area.v2}, ${area.v3}, ${area.v4}`)
})
```

### Manual Area Operations

```js
// Get area IDs from the graph
const areaIds = Object.keys(element.graph.areas)

// Perform operations
element.split(areaIds[0], 'split-vertical')
element.join(areaIds[0], areaIds[1])
element.maximize(areaIds[0])
element.restore()
```

## See Also

- [TypeScript Types](/api/types) - Full type reference
- [Web Components Guide](/guide/web-components) - Usage guide with examples
- [Core Concepts](/guide/concepts) - Understanding the layout model
