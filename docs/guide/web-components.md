# Web Components Guide

Use Sliced Areas as a native Web Component in any framework or plain JavaScript. Each example below shows the live result next to the exact code you would write.

## Basic Setup

<WebComponentBasicDemo />

```js
import 'sliced-areas'
import 'sliced-areas/styles.css'

const el = document.querySelector('sliced-areas')

el.setResolver((tag) => {
  const panel = document.createElement('div')
  panel.textContent = `Area: ${tag}`
  panel.style.cssText = 'height: 100%; display: grid; place-items: center;'
  return panel
})

el.layout = {
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.55, top: 1, bottom: 0.4 } },
    { tag: 'preview', rect: { left: 0.55, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'inspector', rect: { left: 0, right: 1, top: 0.4, bottom: 0 } }
  ]
}
```

::: tip Coordinate system
`top: 1` represents the top edge and `bottom: 0` represents the bottom edge, matching Blender's convention.
:::

## Layout Presets

<WebComponentLayoutsDemo />

```js
const layouts = {
  studio: {
    areas: [
      { tag: 'canvas', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
      { tag: 'layers', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
      { tag: 'timeline', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } }
    ]
  },
  grid: {
    areas: [
      { tag: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
      { tag: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
      { tag: 'c', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
      { tag: 'd', rect: { left: 0.5, right: 1, top: 0.5, bottom: 0 } }
    ]
  }
}

const applyLayout = (key) => {
  el.layout = layouts[key]
}
```

## Operations and Events

<WebComponentOperationsDemo />

```js
// Disable specific interactions
el.operations = {
  disable: ['swap', 'replace']
}

// Listen to layout changes
el.addEventListener('sliced-areas:layoutchange', (event) => {
  const nextLayout = event.detail.layout
  console.log('Updated layout', nextLayout)
})
```

## Programmatic Actions

<WebComponentActionsDemo />

Use the element methods to trigger graph operations:

```js
const firstAreaId = Object.keys(el.graph?.areas ?? {})[0]
const secondAreaId = Object.keys(el.graph?.areas ?? {})[1]

el.split(firstAreaId, 'right')
el.join(firstAreaId, secondAreaId)
el.swap(firstAreaId, secondAreaId)
el.maximize(firstAreaId)
el.restore()
```
