<script setup lang="ts">
import { onMounted, ref } from 'vue'

const areasRef = ref<any>(null)

onMounted(async () => {
  // Import only on client side
  await import('../../../src/plugin/sliced-areas')
  await import('../../../src/plugin/styles.css')

  if (areasRef.value) {
    // Set resolver FIRST
    areasRef.value.setResolver((tag: string) => {
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
  <ClientOnly>
    <div class="example-container">
      <sliced-areas ref="areasRef" />
    </div>
  </ClientOnly>
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
