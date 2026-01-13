<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'

const SlicedAreas = defineAsyncComponent(async () => {
  const module = await import('../../../src/plugin/vue')
  await import('../../../src/plugin/styles.css')
  return module.SlicedAreas
})

const layout = ref({
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.55, top: 1, bottom: 0.4 } },
    { tag: 'preview', rect: { left: 0.55, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'inspector', rect: { left: 0, right: 1, top: 0.4, bottom: 0 } },
  ],
})

const PANEL_CONFIG: Record<string, { title: string; detail: string; accent: string }> = {
  editor: { title: 'Editor', detail: 'Vue wrapper drives layout reactivity.', accent: '#22c55e' },
  preview: { title: 'Preview', detail: 'Props flow into the web component.', accent: '#38bdf8' },
  inspector: { title: 'Inspector', detail: 'Drag splitters to emit layout events.', accent: '#f97316' },
}

const resolver = ref<((tag: string) => HTMLElement) | null>(null)

const handleLayoutChange = (detail: any) => {
  layout.value = detail.layout
}

onMounted(() => {
  resolver.value = (tag: string) => {
    const config = PANEL_CONFIG[tag] ?? {
      title: tag,
      detail: 'Area content',
      accent: '#94a3b8',
    }

    const panel = document.createElement('div')
    panel.className = 'sa-panel'
    panel.style.setProperty(
      '--sa-panel-bg',
      'linear-gradient(155deg, rgba(15, 23, 42, 0.08), rgba(148, 163, 184, 0.12))',
    )

    const title = document.createElement('div')
    title.className = 'sa-panel-title'
    title.textContent = config.title

    const detail = document.createElement('div')
    detail.className = 'sa-panel-detail'
    detail.textContent = config.detail

    panel.style.setProperty('--sa-panel-accent', config.accent)

    panel.appendChild(title)
    panel.appendChild(detail)
    return panel
  }
})
</script>

<template>
  <ClientOnly>
    <div class="sa-doc-demo">
      <SlicedAreas
        :layout="layout"
        :resolver="resolver"
        class="sa-demo-root"
        @layoutchange="handleLayoutChange"
      />
    </div>
  </ClientOnly>
</template>
