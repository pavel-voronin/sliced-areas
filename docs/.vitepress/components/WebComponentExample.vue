<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type { AreasLayout, SlicedAreasElement } from '../../../src/plugin/sliced-areas'
import '../../../src/plugin/styles.css'

// Import and register the web component
import '../../../src/plugin/sliced-areas'

const areasRef = ref<SlicedAreasElement | null>(null)

const initialLayout: AreasLayout = {
  areas: [
    { tag: 'viewport', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
    { tag: 'outliner', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
    { tag: 'console', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } }
  ]
}

const createAreaNode = (tag: string): HTMLElement => {
  const container = document.createElement('div')
  container.style.cssText = 'width: 100%; height: 100%; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;'

  const title = document.createElement('div')
  title.style.cssText = 'font-weight: 600; font-size: 0.875rem; color: #a0a0a0;'
  title.textContent = tag.toUpperCase()

  const content = document.createElement('div')
  content.style.cssText = 'flex: 1; overflow: auto; font-size: 0.75rem; color: #666;'

  if (tag === 'viewport') {
    content.textContent = 'Main viewport area for rendering content. Drag corners to split/join areas.'
  } else if (tag === 'outliner') {
    content.textContent = 'Sidebar for navigation. Try dragging the splitter to resize.'
  } else if (tag === 'console') {
    content.textContent = 'Console output area. Click corners for context menu.'
  }

  container.appendChild(title)
  container.appendChild(content)

  return container
}

onMounted(() => {
  if (areasRef.value) {
    areasRef.value.setResolver(createAreaNode)
    areasRef.value.layout = initialLayout
  }
})

onBeforeUnmount(() => {
  if (areasRef.value) {
    areasRef.value.setResolver(null)
  }
})
</script>

<template>
  <div class="demo-container">
    <sliced-areas ref="areasRef" class="demo-areas" />
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
