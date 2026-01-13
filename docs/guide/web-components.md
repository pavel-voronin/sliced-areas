# Web Components Guide

This guide covers using Sliced Areas as a native Web Component in vanilla JavaScript or any framework that supports custom elements.

## Basic Usage

### Import and Register

```js
import 'sliced-areas'
import 'sliced-areas/styles.css'

// The <sliced-areas> element is now registered globally
```

### HTML Template

```html
<sliced-areas style="width: 100%; height: 100vh;"></sliced-areas>
```

### Set Layout

```js
const el = document.querySelector('sliced-areas')

el.layout = {
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

### Set Content Resolver

The resolver function creates DOM content for each area tag:

```js
el.setResolver((tag) => {
  if (tag === 'editor') {
    const editor = document.createElement('textarea')
    editor.style.cssText = 'width: 100%; height: 100%; border: none; padding: 1rem;'
    return editor
  }

  if (tag === 'preview') {
    const preview = document.createElement('div')
    preview.style.cssText = 'padding: 1rem;'
    preview.textContent = 'Preview area'
    return preview
  }

  return null
})
```

### Configure Operations

Enable or disable interactive operations. By default, all are enabled.

```js
// Disable resize and swap
el.operations = {
  disable: ['resize', 'swap']
}

// Allow only split and join
el.operations = {
  enable: ['split', 'join']
}
```

## Layout Format

The layout uses normalized coordinates (0 to 1 range):

```ts
type AreasLayout = {
  areas: Array<{
    tag: string      // Unique identifier for content
    rect: {
      left: number   // 0..1 (left edge)
      right: number  // 0..1 (right edge)
      top: number    // 0..1 (1 = top, 0 = bottom)
      bottom: number // 0..1 (1 = top, 0 = bottom)
    }
  }>
}
```

::: tip Coordinate System
Note that `top: 1` represents the **top** of the screen, and `bottom: 0` represents the **bottom**. This follows Blender's coordinate convention.
:::

### Common Layouts

**Single Area (Full Screen)**

```js
{
  areas: [
    { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
}
```

**Two Areas (Vertical Split)**

```js
{
  areas: [
    { tag: 'left', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
  ]
}
```

**Two Areas (Horizontal Split)**

```js
{
  areas: [
    { tag: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
    { tag: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } }
  ]
}
```

**Four Areas (Quadrants)**

```js
{
  areas: [
    { tag: 'top-left', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
    { tag: 'top-right', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
    { tag: 'bottom-left', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
    { tag: 'bottom-right', rect: { left: 0.5, right: 1, top: 0.5, bottom: 0 } }
  ]
}
```

## Area Operations

### Split Area

Split an area into two parts:

```js
// Get the area ID from the layout change event
el.addEventListener('sliced-areas:layoutchange', (e) => {
  const areaId = e.detail.layout.areas[0].id ?? e.detail.layout.areas[0].tag

  // Split vertically (default)
  el.split(areaId)

  // Split with specific zone
  el.split(areaId, 'split-vertical')
  el.split(areaId, 'split-horizontal')
})
```

### Join Areas

Merge two adjacent areas:

```js
el.join(sourceAreaId, targetAreaId)
```

### Replace Area Content

Replace the content of an area:

```js
el.replace(sourceAreaId, targetAreaId)
```

### Swap Areas

Swap the positions and content of two areas:

```js
el.swap(sourceAreaId, targetAreaId)
```

### Close Area

Close an area and redistribute its space:

```js
el.close(areaId)
```

### Retag Area

Change the tag of an area (updates its content):

```js
el.retag(areaId, 'new-tag')
```

### Maximize Area

Hide all other areas and make one full screen:

```js
el.maximize(areaId)
```

### Restore Layout

Restore the previous layout after maximizing:

```js
el.restore()
```

## Events

### Layout Change Event

Fired whenever the layout changes:

```js
el.addEventListener('sliced-areas:layoutchange', (event) => {
  const layout = event.detail.layout

  // Save to localStorage
  localStorage.setItem('layout', JSON.stringify(layout))

  console.log('Layout updated:', layout)
})
```

### Corner Click Event

Fired when a corner is clicked (useful for context menus):

```js
el.addEventListener('sliced-areas:cornerclick', (event) => {
  const { areaId, corner, clientX, clientY } = event.detail

  // Show context menu
  showContextMenu({
    x: clientX,
    y: clientY,
    items: [
      { label: 'Close Area', action: () => el.close(areaId) },
      { label: 'Maximize', action: () => el.maximize(areaId) }
    ]
  })
})
```

### Area Lifecycle Events

Track incremental changes without reloading the full layout:

```js
el.addEventListener('sliced-areas:area-added', (event) => {
  console.log('Added:', event.detail)
})

el.addEventListener('sliced-areas:area-removed', (event) => {
  console.log('Removed:', event.detail)
})

el.addEventListener('sliced-areas:area-updated', (event) => {
  console.log('Updated:', event.detail)
})
```

## TypeScript

Use type imports for better type safety:

```ts
import type {
  SlicedAreasElement,
  AreasLayout,
  AreaResolver,
  CornerClickDetail
} from 'sliced-areas'

const el = document.querySelector('sliced-areas') as SlicedAreasElement

const layout: AreasLayout = {
  areas: [
    { id: 'editor', tag: 'editor', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
  ]
}

const resolver: AreaResolver = (tag: string) => {
  const div = document.createElement('div')
  div.textContent = tag
  return div
}

el.layout = layout
el.setResolver(resolver)

el.addEventListener('sliced-areas:cornerclick', (event: CustomEvent<CornerClickDetail>) => {
  console.log(event.detail.areaId)
})
```

## Complete Example

Here's a complete example with persistence:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; font-family: sans-serif; }
    sliced-areas { width: 100vw; height: 100vh; }
    .area-content { padding: 1rem; }
  </style>
</head>
<body>
  <sliced-areas></sliced-areas>

  <script type="module">
    import 'sliced-areas'
    import 'sliced-areas/styles.css'

    const STORAGE_KEY = 'my-app-layout'
    const el = document.querySelector('sliced-areas')

    // Load saved layout or use default
    const savedLayout = localStorage.getItem(STORAGE_KEY)
    el.layout = savedLayout ? JSON.parse(savedLayout) : {
      areas: [
        { tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }
      ]
    }

    // Set content resolver
    el.setResolver((tag) => {
      const div = document.createElement('div')
      div.className = 'area-content'
      div.textContent = `Area: ${tag}`
      return div
    })

    // Save layout on change
    el.addEventListener('sliced-areas:layoutchange', (e) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(e.detail.layout))
    })

    // Handle corner clicks
    el.addEventListener('sliced-areas:cornerclick', (e) => {
      const { areaId, clientX, clientY } = e.detail
      if (confirm(`Close area ${areaId}?`)) {
        el.close(areaId)
      }
    })
  </script>
</body>
</html>
```

## Live Demo

Try the interactive demo below. You can resize areas by dragging splitters, and drag corners to split/join areas.

<WebComponentExample />

## Next Steps

- [Vue 3 Guide](/guide/vue) - Learn Vue integration
- [Core Concepts](/guide/concepts) - Understand the layout model
- [Web Component API](/api/web-component) - Full API reference
