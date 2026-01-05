# sliced-areas

Blender-like resizable and splittable areas layout system. Available as a Web Component with optional Vue 3 wrapper.

## Installation

```sh
npm install sliced-areas
```

## Web Component Usage

```ts
import 'sliced-areas'
import 'sliced-areas/styles.css'
import type { AreasLayout, SlicedAreasElement } from 'sliced-areas'

const layout: AreasLayout = {
  areas: [{ tag: 'viewport', rect: { left: 0, right: 1, top: 1, bottom: 0 } }]
}

const areas = document.querySelector('sliced-areas') as SlicedAreasElement
areas.setResolver((tag) => {
  const div = document.createElement('div')
  div.textContent = `Content for: ${tag}`
  return div
})
areas.layout = layout
```

```html
<sliced-areas style="height: 100vh;"></sliced-areas>
```

**Important:** Resolver must return a fresh node each time. When areas share the same tag, reusing the same DOM element will move it to the last area.

## Vue 3 Usage

```ts
import { createApp } from 'vue'
import { SlicedAreasPlugin } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const app = createApp(App)
app.use(SlicedAreasPlugin)
app.mount('#app')
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AreasLayout } from 'sliced-areas/vue'

const layout = ref<AreasLayout>({
  areas: [{ tag: 'viewport', rect: { left: 0, right: 1, top: 1, bottom: 0 } }]
})

const resolveArea = (tag: string) => {
  const div = document.createElement('div')
  div.textContent = `Content for: ${tag}`
  return div
}

const onLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
}
</script>

<template>
  <SlicedAreas
    :layout="layout"
    :resolver="resolveArea"
    @layoutchange="onLayoutChange"
  />
</template>
```

## Layout Format

```ts
type AreasLayout = {
  areas: Array<{
    tag: string
    rect: { left: number; right: number; top: number; bottom: number }
  }>
}
```

Coordinates are normalized (0 to 1). `top: 1` is top edge, `bottom: 0` is bottom edge.

## Events

- `sliced-areas:layoutchange` / `@layoutchange` - Fired when layout changes
- `sliced-areas:cornerclick` / `@cornerclick` - Fired when corner is clicked

## License

MIT
