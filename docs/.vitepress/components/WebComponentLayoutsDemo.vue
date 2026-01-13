<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const areasRef = ref<HTMLElement | null>(null)
const activeLayout = ref('studio')

const layouts: Record<string, { label: string; layout: { areas: Array<any> } }> = {
  studio: {
    label: 'Studio',
    layout: {
      areas: [
        { tag: 'canvas', rect: { left: 0, right: 0.7, top: 1, bottom: 0.3 } },
        { tag: 'layers', rect: { left: 0.7, right: 1, top: 1, bottom: 0.3 } },
        { tag: 'timeline', rect: { left: 0, right: 1, top: 0.3, bottom: 0 } },
      ],
    },
  },
  columns: {
    label: 'Columns',
    layout: {
      areas: [
        { tag: 'left', rect: { left: 0, right: 0.33, top: 1, bottom: 0 } },
        { tag: 'middle', rect: { left: 0.33, right: 0.66, top: 1, bottom: 0 } },
        { tag: 'right', rect: { left: 0.66, right: 1, top: 1, bottom: 0 } },
      ],
    },
  },
  grid: {
    label: 'Grid',
    layout: {
      areas: [
        { tag: 'a', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
        { tag: 'b', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
        { tag: 'c', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
        { tag: 'd', rect: { left: 0.5, right: 1, top: 0.5, bottom: 0 } },
      ],
    },
  },
}

const PANEL_CONFIG: Record<string, { title: string; detail: string; accent: string }> = {
  canvas: { title: 'Canvas', detail: 'Normalized layout coordinates scale automatically.', accent: '#22c55e' },
  layers: { title: 'Layers', detail: 'Layouts are pure JSON and serialize easily.', accent: '#38bdf8' },
  timeline: { title: 'Timeline', detail: 'Store layouts to persist complex setups.', accent: '#f97316' },
  left: { title: 'Left', detail: 'Drag splitters to resize columns.', accent: '#facc15' },
  middle: { title: 'Center', detail: 'Split an area by dragging its corner.', accent: '#f43f5e' },
  right: { title: 'Right', detail: 'Swap areas by dragging into the middle zone.', accent: '#14b8a6' },
  a: { title: 'A', detail: 'Quadrants share the same layout graph.', accent: '#f97316' },
  b: { title: 'B', detail: 'Areas stay addressable across updates.', accent: '#22c55e' },
  c: { title: 'C', detail: 'Coordinates are 0..1 values.', accent: '#38bdf8' },
  d: { title: 'D', detail: 'Serialize and restore layouts.', accent: '#ef4444' },
}

const createPanel = (tag: string): HTMLElement => {
  const config = PANEL_CONFIG[tag] ?? {
    title: tag,
    detail: 'Area content',
    accent: '#94a3b8',
  }

  const panel = document.createElement('div')
  panel.className = 'sa-panel'
  panel.style.setProperty('--sa-panel-accent', config.accent)
  panel.style.setProperty(
    '--sa-panel-bg',
    'linear-gradient(155deg, rgba(15, 23, 42, 0.1), rgba(148, 163, 184, 0.12))',
  )

  const title = document.createElement('div')
  title.className = 'sa-panel-title'
  title.textContent = config.title

  const detail = document.createElement('div')
  detail.className = 'sa-panel-detail'
  detail.textContent = config.detail

  panel.appendChild(title)
  panel.appendChild(detail)
  return panel
}

const applyLayout = (key: string) => {
  activeLayout.value = key
  if (!areasRef.value) return
  const element = areasRef.value as any
  element.layout = layouts[key].layout
}

onMounted(async () => {
  await import('../../../src/plugin/sliced-areas')
  await import('../../../src/plugin/styles.css')

  if (!areasRef.value) return

  const element = areasRef.value as any
  element.setResolver(createPanel)
  element.layout = layouts[activeLayout.value].layout
})

onBeforeUnmount(() => {
  if (!areasRef.value) return
  const element = areasRef.value as any
  element.setResolver(null)
})
</script>

<template>
  <ClientOnly>
    <div class="sa-doc-demo">
      <div class="sa-demo-toolbar">
        <button
          v-for="(item, key) in layouts"
          :key="key"
          class="sa-demo-button"
          :class="{ 'is-active': activeLayout === key }"
          type="button"
          @click="applyLayout(key)"
        >
          {{ item.label }}
        </button>
      </div>
      <sliced-areas ref="areasRef" class="sa-demo-root" />
    </div>
  </ClientOnly>
</template>
