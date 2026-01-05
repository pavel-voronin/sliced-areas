# API Reference

Complete API documentation for Sliced Areas.

## Overview

- **[Web Component API](/api/web-component)** - Native Web Component for vanilla JS and all frameworks
- **[Vue Component API](/api/vue)** - Vue 3 wrapper component
- **[TypeScript Types](/api/types)** - Type definitions and interfaces

## Quick Links

### Web Component

```js
import 'sliced-areas'

const el = document.querySelector('sliced-areas')
el.layout = { areas: [...] }
el.setResolver(tag => ...)
```

[Full Web Component API →](/api/web-component)

### Vue Component

```vue
<script setup>
import { SlicedAreas } from 'sliced-areas/vue'
</script>

<template>
  <SlicedAreas :layout="layout" :resolver="resolver" />
</template>
```

[Full Vue API →](/api/vue)

### TypeScript

```ts
import type {
  AreasLayout,
  AreaResolver,
  SlicedAreasElement,
  CornerClickDetail
} from 'sliced-areas'
```

[Full Type Reference →](/api/types)

## Package Structure

The library is distributed as ES modules:

```
sliced-areas/
├── dist/
│   ├── index.js           # Web Component
│   ├── index.d.ts         # Web Component types
│   ├── vue.js             # Vue wrapper
│   ├── vue.d.ts           # Vue types
│   └── styles.css         # Styles
```

### Imports

**Web Component:**
```js
import 'sliced-areas'                    // Register element
import 'sliced-areas/styles.css'        // Styles
import type { ... } from 'sliced-areas' // Types
```

**Vue Component:**
```js
import { SlicedAreas } from 'sliced-areas/vue'          // Component
import { SlicedAreasPlugin } from 'sliced-areas/vue'    // Plugin
import 'sliced-areas/styles.css'                         // Styles
import type { ... } from 'sliced-areas/vue'             // Types
```

## Browser Support

Sliced Areas works in all modern browsers that support:

- Custom Elements (Web Components)
- ES2020+ features
- ResizeObserver API

Supported browsers:
- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+
- Opera 67+

For older browsers, you'll need polyfills for:
- Custom Elements
- ResizeObserver

## License

MIT © Pavel Voronin
