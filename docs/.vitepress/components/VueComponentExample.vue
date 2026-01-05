<script setup lang="ts">
import { ref } from 'vue'
import { SlicedAreas } from '../../../src/plugin/vue'
import type { AreasLayout } from '../../../src/plugin/vue'
import '../../../src/plugin/styles.css'

// Create area content with DOM
const createAreaContent = (tag: string, title: string, description: string): HTMLElement => {
  const container = document.createElement('div')
  container.style.cssText = 'width: 100%; height: 100%; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;'

  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-weight: 600; font-size: 0.875rem; color: #a0a0a0;'
  titleEl.textContent = title

  const content = document.createElement('div')
  content.style.cssText = 'flex: 1; overflow: auto; font-size: 0.75rem; color: #666;'
  content.textContent = description

  container.appendChild(titleEl)
  container.appendChild(content)

  return container
}

const layout = ref<AreasLayout>({
  areas: [
    { tag: 'viewport', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
    { tag: 'outliner', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
    { tag: 'console', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } }
  ]
})

const resolveArea = (tag: string) => {
  if (tag === 'viewport') {
    return createAreaContent(tag, 'VIEWPORT', 'Main viewport area. This uses the Vue wrapper!')
  } else if (tag === 'outliner') {
    return createAreaContent(tag, 'OUTLINER', 'Sidebar for navigation. Resize by dragging the splitter.')
  } else if (tag === 'console') {
    return createAreaContent(tag, 'CONSOLE', 'Console output area. Click corners for context menu.')
  }
  return null
}

const handleLayoutChange = (detail: { layout: AreasLayout }) => {
  layout.value = detail.layout
}
</script>

<template>
  <div class="demo-container">
    <SlicedAreas
      :layout="layout"
      :resolver="resolveArea"
      @layoutchange="handleLayoutChange"
      class="demo-areas"
    />
  </div>
</template>

<style scoped>
.demo-container {
  width: 100%;
  height: 600px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.demo-areas {
  width: 100%;
  height: 100%;
}
</style>
