# sliced-areas

Blender-like “Areas” layout system as a Web Component with an optional Vue 3 wrapper.

## Install

```sh
npm install sliced-areas
```

## Web Component Setup

```ts
import 'sliced-areas'
import 'sliced-areas/styles.css'
import type { AreasLayout, SlicedAreasElement } from 'sliced-areas'

const layout: AreasLayout = {
  areas: [{ tag: 'viewport', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
}

const areas = document.querySelector('sliced-areas') as SlicedAreasElement
areas.setResolver((tag) => document.querySelector(`[data-area-tag="${tag}"]`))
areas.layout = layout
```

```html
<sliced-areas style="height: 100%;"></sliced-areas>
<div data-area-tag="viewport">Viewport content</div>
```

## Vue 3 Setup

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { SlicedAreasPlugin } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const app = createApp(App)
app.use(SlicedAreasPlugin)
app.mount('#app')
```

```vue
<template>
  <SlicedAreas
    class="layout-root"
    :layout="layout"
    :resolver="resolveArea"
    @layoutchange="onLayoutChange"
    @cornerclick="onCornerClick"
  />
</template>
```

## Layout Format

`AreasLayout` uses normalized coordinates (0..1) and tags for content lookup:

```ts
type AreasLayout = {
  areas: Array<{
    tag: string
    rect: { left: number; right: number; top: number; bottom: number }
  }>
}
```

- Area ids are internal and auto-generated; only tags are persistent.
- The layout always fills the component bounds.

## Gestures and Operations

- Resize: drag splitters between areas.
- Move/Split/Join/Replace: drag an area corner into another area.
- Split orientation is inferred from drag direction.
- Swap: hold `Ctrl` while dragging an area into another.
- Maximize/Restore: use the API methods.

## Events

- `sliced-areas:layoutchange` → `{ layout: AreasLayout }`
- `sliced-areas:cornerclick` → `{ areaId, corner, clientX, clientY }`

Vue emits `layoutchange` and `cornerclick` with the same payloads.

## API (Element)

```ts
element.layout: AreasLayout | null
element.setResolver(resolver: (tag: string) => HTMLElement | null | undefined): void
element.split(areaId, zone?, clientX?, clientY?): void
element.join(sourceAreaId, targetAreaId): void
element.replace(sourceAreaId, targetAreaId): void
element.swap(sourceAreaId, targetAreaId): void
element.move(sourceAreaId, targetAreaId, overlayRect, remainderRect): void
element.close(areaId): void
element.retag(areaId, tag): void
element.maximize(areaId): void
element.restore(): void
```

## Retagging from Area Content

Dispatch a bubbling event from inside an area node to update its tag:

```ts
node.dispatchEvent(
  new CustomEvent('sliced-areas:retag', { bubbles: true, detail: { tag: 'viewport' } }),
)
```
