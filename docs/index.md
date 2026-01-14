---
layout: home

hero:
  name: Sliced Areas
  text: Blender-like Layout System for professional,<br />multi-panel interfaces
  tagline:
  actions:
    - theme: brand
      text: Quick Start
      link: /#quick-start
    - theme: alt
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/pavel-voronin/sliced-areas
---

<section class="home-hero-copy">
  <div class="home-hero-copy-inner">
    <h2>Build Blender-grade workspaces on the web</h2>
    <p>
      Sliced Areas manages full-bleed, multi-panel layouts inspired by Blender, Resolve,
      and other professional tools. It handles the layout logic so you can focus on content.
    </p>
    <p>
      You supply a resolver that renders each area. The library takes care of docking,
      splitting, joining, swapping, replacing, resizing, and maximize/restore.
    </p>
  </div>
</section>

<section class="home-showcase">
  <p>Try the live layout below. Drag splitters, then drag any corner to dock areas.</p>
  <HomeShowcase />
</section>

## Quick Start {#quick-start}

### Web Component

```bash
npm install sliced-areas
```

```js
import 'sliced-areas'
import 'sliced-areas/styles.css'

const el = document.querySelector('sliced-areas')
el.layout = {
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
  ],
}

el.setResolver((tag) => {
  const div = document.createElement('div')
  div.textContent = tag
  return div
})
```

### Vue 3

```bash
npm install sliced-areas
```

```vue
<script setup>
import { ref } from 'vue'
import { SlicedAreas } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const layout = ref({
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
  ],
})

const resolveArea = (tag, areaId) => {
  const div = document.createElement('div')
  div.textContent = tag
  return {
    element: div,
    cleanup: () => console.log(`Cleanup ${areaId}`)
  }
}
</script>

<template>
  <SlicedAreas :layout="layout" :resolver="resolveArea" />
</template>
```

## Release Notes

Catch up on updates in the [Changelog](/guide/changelog).

## License

MIT © Pavel Voronin

## Credits

Favicon icon by [Iconoir](https://github.com/iconoir-icons/iconoir), MIT License.
