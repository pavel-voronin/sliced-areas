---
layout: home

hero:
  name: Sliced Areas
  text: Blender-like Layout System
  tagline: Resizable and splittable areas layout system for modern web applications
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/pavel-voronin/sliced-areas

features:
  - icon: 🧩
    title: Web Component
    details: Framework-agnostic Web Component that works everywhere - vanilla JS, React, Vue, Angular, or any other framework.

  - icon: 🎨
    title: Vue 3 Integration
    details: First-class Vue 3 support with reactive props, typed events, and seamless component integration.

  - icon: ✂️
    title: Flexible Layout
    details: Resize, split, join, swap, and maximize areas. Intuitive corner drag gestures inspired by Blender's interface.

  - icon: 📘
    title: Type Safe
    details: Written in TypeScript with full type definitions. Get IntelliSense and type checking out of the box.

  - icon: 🪶
    title: Zero Dependencies
    details: No external dependencies. Lightweight and performant. Vue is optional for the Vue wrapper.

  - icon: ✅
    title: Well Tested
    details: 100% code coverage with comprehensive test suite. Reliable and production-ready.
---

## Interactive Demo

Try it yourself - drag the splitter to resize, drag corners to split/join areas:

<SimpleExample />

## Quick Start

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
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
  ]
}
el.setResolver(tag => {
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
    { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
  ]
})

const resolveArea = (tag) => {
  const div = document.createElement('div')
  div.textContent = tag
  return div
}
</script>

<template>
  <SlicedAreas :layout="layout" :resolver="resolveArea" />
</template>
```

## Features

### Resize Areas

Drag the splitters between areas to resize them. The layout automatically adjusts to maintain the structure.

### Split & Join

Drag area corners to create drop zones:
- **Join**: Merge two adjacent areas
- **Split**: Divide an area horizontally or vertically
- **Replace**: Swap content between areas
- **Swap**: Exchange positions of two areas

### Maximize & Restore

Click the maximize button to full-screen an area, hiding others. Click restore to return to the previous layout.

### Persistent Layouts

Layouts are serializable JSON objects. Save them to localStorage, a database, or sync across devices.

## License

MIT © Pavel Voronin
