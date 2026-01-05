<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'

const SlicedAreas = defineAsyncComponent(async () => {
  const module = await import('../../../src/plugin/vue')
  await import('../../../src/plugin/styles.css')
  return module.SlicedAreas
})

const layout = ref({
  areas: [
    { tag: 'viewport', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
    { tag: 'outliner', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
    { tag: 'console', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } }
  ]
})

const resolver = ref<any>(null)

const handleLayoutChange = (detail: any) => {
  layout.value = detail.layout
}

onMounted(() => {
  // Create resolver only on client side
  resolver.value = (tag: string) => {
    const container = document.createElement('div')
    container.style.cssText = 'width: 100%; height: 100%; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;'

    const titleEl = document.createElement('div')
    titleEl.style.cssText = 'font-weight: 600; font-size: 0.875rem; color: #a0a0a0;'

    const content = document.createElement('div')
    content.style.cssText = 'flex: 1; overflow: auto; font-size: 0.75rem; color: #666;'

    if (tag === 'viewport') {
      titleEl.textContent = 'VIEWPORT'
      content.textContent = 'Main viewport area. This uses the Vue wrapper!'
    } else if (tag === 'outliner') {
      titleEl.textContent = 'OUTLINER'
      content.textContent = 'Sidebar for navigation. Resize by dragging the splitter.'
    } else if (tag === 'console') {
      titleEl.textContent = 'CONSOLE'
      content.textContent = 'Console output area. Click corners for context menu.'
    }

    container.appendChild(titleEl)
    container.appendChild(content)
    return container
  }
})
</script>

<template>
  <ClientOnly>
    <div class="demo-container">
      <SlicedAreas
        :layout="layout"
        :resolver="resolver"
        @layoutchange="handleLayoutChange"
        class="demo-areas"
      />
    </div>
  </ClientOnly>
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
