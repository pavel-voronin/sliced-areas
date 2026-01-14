# Installation

## Package Manager

Install `sliced-areas` using your preferred package manager:

::: code-group

```bash [npm]
npm install sliced-areas
```

```bash [pnpm]
pnpm add sliced-areas
```

```bash [yarn]
yarn add sliced-areas
```

```bash [bun]
bun add sliced-areas
```

:::

## CDN

You can also use sliced-areas directly from a CDN:

### ES Module

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/sliced-areas@latest/dist/index.js'
  import 'https://cdn.jsdelivr.net/npm/sliced-areas@latest/dist/styles.css'
</script>
```

### unpkg

```html
<script type="module" src="https://unpkg.com/sliced-areas@latest/dist/index.js"></script>
<link rel="stylesheet" href="https://unpkg.com/sliced-areas@latest/dist/styles.css">
```

## Usage

### Web Component

For vanilla JavaScript or any framework that supports Web Components:

```js
import 'sliced-areas'
import 'sliced-areas/styles.css'

// The <sliced-areas> element is now available
```

Learn more in the [Web Components guide](/guide/web-components).

### Vue 3

For Vue 3 applications:

```js
import { SlicedAreas } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

// Use <SlicedAreas> component in your templates
```

Or register globally:

```js
import { createApp } from 'vue'
import { SlicedAreasPlugin } from 'sliced-areas/vue'
import 'sliced-areas/styles.css'

const app = createApp(App)
app.use(SlicedAreasPlugin)
```

Learn more in the [Vue 3 guide](/guide/vue).

## Dependencies

### Zero Dependencies

The core Web Component has **zero dependencies**. It's a standalone library that works everywhere.

### Vue (Optional)

Vue 3.5+ is required only if you're using the Vue wrapper component. It's declared as an optional peer dependency, so you won't install it unless you already have Vue in your project.

```json
{
  "peerDependencies": {
    "vue": "^3.5.25"
  },
  "peerDependenciesMeta": {
    "vue": {
      "optional": true
    }
  }
}
```

## TypeScript

Sliced Areas is written in TypeScript and includes full type definitions. No additional `@types` packages needed.

```ts
import type { AreasLayout, AreaResolver, AreaResolverResult, SlicedAreasElement } from 'sliced-areas'
import type { SlicedAreas } from 'sliced-areas/vue'
```

## Bundler Configuration

### Vite

For Vue projects using Vite, you need to tell Vite to treat `<sliced-areas>` as a custom element:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'sliced-areas'
        }
      }
    })
  ]
})
```

### Vue CLI / Webpack

For Vue CLI or Webpack projects:

```js
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          isCustomElement: (tag) => tag === 'sliced-areas'
        }
      }))
  }
}
```

### Other Frameworks

Sliced Areas works with any framework that supports Web Components:

- **React**: Use directly in JSX (works out of the box)
- **Angular**: Add to `CUSTOM_ELEMENTS_SCHEMA`
- **Svelte**: Use directly in templates
- **Solid**: Use directly in JSX

## Next Steps

- [Core Concepts](/guide/concepts) - Understand the layout model
- [Web Components Guide](/guide/web-components) - Learn Web Component usage
- [Vue 3 Guide](/guide/vue) - Learn Vue integration
- [API Reference](/api/) - Explore the full API
