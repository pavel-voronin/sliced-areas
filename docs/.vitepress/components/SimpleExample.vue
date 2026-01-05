<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SlicedAreasElement } from '../../../src/plugin/sliced-areas'
import '../../../src/plugin/styles.css'
import '../../../src/plugin/sliced-areas'

const areasRef = ref<SlicedAreasElement | null>(null)

onMounted(() => {
  if (areasRef.value) {
    // Set resolver FIRST
    areasRef.value.setResolver((tag) => {
      const container = document.createElement('div')
      container.style.cssText = 'padding: 2rem; height: 100%; display: flex; align-items: center; justify-content: center;'

      const text = document.createElement('div')
      text.style.cssText = 'font-size: 1rem; color: #888; text-align: center;'
      text.textContent = tag === 'editor' ? '📝 Editor' : '👁 Preview'

      container.appendChild(text)
      return container
    })

    // Then set layout
    areasRef.value.layout = {
      areas: [
        { tag: 'editor', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
        { tag: 'preview', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } }
      ]
    }
  }
})
</script>

<template>
  <div class="example-container">
    <sliced-areas ref="areasRef" />
  </div>
</template>

<style scoped>
.example-container {
  width: 100%;
  height: 400px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}
</style>
