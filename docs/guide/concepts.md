# Core Concepts

Understanding the fundamental concepts behind Sliced Areas will help you build better layouts and debug issues more effectively.

## Layout Model

Sliced Areas uses a **planar graph-based layout model** similar to Blender's Areas system. This provides flexibility and mathematical rigor for complex layouts.

### Planar Graph

Internally, the layout is represented as a planar graph with:

- **Vertices**: Corner points with (x, y) coordinates
- **Edges**: Connections between vertices (splitters)
- **Areas**: Rectangles defined by 4 vertices in clockwise order

```
Vertices (•)  Edges (─)  Areas (□)

    v1 ────── v2
    │    A1   │
    │         │
    v3 ─ v4 ─ v5
    │ A2 │ A3 │
    v6 ─ v7 ─ v8
```

This graph model enables:
- Efficient layout updates
- Automatic constraint solving
- Complex split/join operations
- Validation of layout integrity

### Normalized Coordinates

All coordinates use a normalized 0..1 range:

- **X-axis**: `0` = left edge, `1` = right edge
- **Y-axis**: `1` = top edge, `0` = bottom edge

::: tip Why inverted Y-axis?
The inverted Y-axis (`1` = top, `0` = bottom) matches Blender's convention and is more intuitive for screen layouts where "top" has a higher value.
:::

Benefits of normalized coordinates:
- **Responsive**: Automatically adapts to any screen size
- **Resolution-independent**: Works on mobile, tablet, desktop
- **Easy to reason about**: `0.5` always means "middle"
- **Simple serialization**: Pure numbers, no units

Example:

```js
{
  tag: 'editor',
  rect: {
    left: 0,      // Left edge
    right: 0.5,   // Middle
    top: 1,       // Top edge
    bottom: 0.5   // Middle
  }
}
// This area occupies the top-left quadrant
```

### Area Tags

Each area has a **tag** (string identifier) that:

- Identifies the area's content type (e.g., "editor", "preview", "console")
- Maps to content via the resolver function
- Persists across layout changes
- Can be changed with `retag()`

Tags are **external identifiers** controlled by your application. Internally, areas use stable IDs that change only during graph operations.

## Drag Interactions

Sliced Areas provides intuitive Blender-inspired drag gestures:

### Resize (Splitter Drag)

Drag the splitters between areas to resize them:

- Maintains layout structure
- Respects minimum area sizes (8% per axis)
- Updates all affected areas automatically

### Corner Drag Gestures

Drag area corners to show **drop zones** with different modes:

#### 1. Join Mode

**Merges two adjacent areas into one.**

Drop zones appear at 18% depth from edges when dragging toward an adjacent area.

```
Before:          After Join:
┌────┬────┐      ┌─────────┐
│ A  │ B  │  →   │    A    │
└────┴────┘      └─────────┘
```

Usage: `element.join(areaIdA, areaIdB)`

#### 2. Split Mode

**Divides one area into two parts.**

Drop zones appear when dragging within the same area, beyond 6px threshold.

```
Before:          After Split:
┌─────────┐      ┌────┬────┐
│    A    │  →   │ A  │ B  │
└─────────┘      └────┴────┘
```

Modes:
- **Split Vertical**: Left/right split
- **Split Horizontal**: Top/bottom split

Usage: `element.split(areaId, 'split-vertical')`

#### 3. Replace Mode

**Swaps the content tag between two areas.**

Drop zone covers the target area. Content moves, positions stay.

```
Before:          After Replace:
┌────┬────┐      ┌────┬────┐
│ A  │ B  │  →   │ B  │ B  │
└────┴────┘      └────┴────┘
```

Usage: `element.replace(sourceId, targetId)`

#### 4. Swap Mode

**Exchanges both content and position between two areas.**

Drop zone with swap indicator. Both areas exchange places.

```
Before:          After Swap:
┌────┬────┐      ┌────┬────┐
│ A  │ B  │  →   │ B  │ A  │
└────┴────┘      └────┴────┘
```

Usage: `element.swap(areaIdA, areaIdB)`

### Visual Feedback

During drag operations, Sliced Areas shows:

- **Drop zone overlays**: Colored regions indicating where the area will drop
- **Preview outlines**: Dashed borders showing the result
- **Mode indicators**: Icons showing the operation type
- **Cursor changes**: Visual feedback for drag state

## Light DOM Rendering

Sliced Areas uses **Light DOM** (not Shadow DOM):

### Why Light DOM?

- **Full CSS control**: Your styles apply directly
- **Accessibility**: Screen readers work naturally
- **DOM access**: Query and manipulate content freely
- **Event bubbling**: Events propagate normally
- **Framework compatibility**: Works with all frameworks

### Content Resolver Pattern

The resolver function creates content on demand:

```js
element.setResolver((tag) => {
  // Create and return an HTMLElement
  const div = document.createElement('div')
  div.textContent = tag
  return div
})
```

**How it works:**

1. When an area needs content, the resolver is called with its tag
2. You return an HTMLElement (or null to skip)
3. The element is inserted into the area's container
4. When tags change, old content is detached and new content is inserted

**Benefits:**

- **Lazy loading**: Create content only when needed
- **Dynamic content**: Change based on application state
- **Framework integration**: Mount Vue/React components
- **Memory efficient**: Detached content can be garbage collected

### Stash Container

Sliced Areas maintains a **stash** for detached content:

- When an area is closed, its content moves to the stash
- When an area tag changes, old content moves to the stash
- When content is reused, it's pulled from the stash
- The stash is invisible (`display: none`)

This allows:
- Content reuse without recreation
- State preservation across layout changes
- Manual cleanup if needed

## State Management

### Layout Persistence

Layouts are **serializable** as JSON:

```js
const layout = element.layout
localStorage.setItem('layout', JSON.stringify(layout))

// Later...
const saved = localStorage.getItem('layout')
element.layout = JSON.parse(saved)
```

This enables:
- LocalStorage persistence
- Server-side storage
- Multi-device sync
- Undo/redo systems

### Maximize State

When you call `maximize(areaId)`:

1. Current layout is saved internally
2. All other areas are hidden
3. The maximized area becomes full screen
4. Call `restore()` to revert

The stored layout includes:
- Full graph structure
- All area tags
- All positions

### Tag Management

Tags are **stable identifiers** for content:

```js
// Initial layout
{ tag: 'editor', rect: { ... } }

// After retag
element.retag(areaId, 'viewer')
// Layout now has: { tag: 'viewer', rect: { ... } }

// The area position stays the same, content changes
```

This separation allows:
- Content switching without layout changes
- Tag-based routing
- Dynamic content loading

## Performance Considerations

### Responsiveness

Sliced Areas uses **ResizeObserver** to handle:
- Window resizes
- Container size changes
- Dynamic content updates

The layout updates automatically without manual intervention.

### Minimum Area Sizes

Areas have a minimum size of **8% per axis**:

```js
// Minimum width: 8% of container
// Minimum height: 8% of container
```

This prevents:
- Unusable tiny areas
- Layout instability
- Visual glitches

### Graph Validation

The layout engine validates:
- No overlapping areas
- No gaps (holes) in the layout
- Proper vertex connections
- Edge border flags

Invalid layouts are rejected with warnings in the console.

## Best Practices

### 1. Use Semantic Tags

Choose meaningful tags:

```js
// Good
{ tag: 'code-editor', ... }
{ tag: 'preview-panel', ... }

// Avoid
{ tag: 'area1', ... }
{ tag: 'div', ... }
```

### 2. Handle Resolver Errors

Return null for unknown tags:

```js
const resolver = (tag) => {
  const handlers = {
    editor: createEditor,
    preview: createPreview
  }

  const handler = handlers[tag]
  return handler ? handler() : null
}
```

### 3. Persist Layouts

Save user layouts for better UX:

```js
element.addEventListener('sliced-areas:layoutchange', (e) => {
  localStorage.setItem('layout', JSON.stringify(e.detail.layout))
})
```

### 4. Provide Reset Option

Let users reset to defaults:

```js
const resetLayout = () => {
  element.layout = DEFAULT_LAYOUT
  localStorage.removeItem('layout')
}
```

### 5. Use TypeScript

Leverage types for safety:

```ts
import type { AreasLayout, AreaResolver } from 'sliced-areas'

const layout: AreasLayout = { ... }
const resolver: AreaResolver = (tag) => { ... }
```

## Next Steps

- [Web Components Guide](/guide/web-components) - Learn Web Component usage
- [Vue Guide](/guide/vue) - Learn Vue integration
- [API Reference](/api/) - Explore the full API
