<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const areasRef = ref<HTMLElement | null>(null)

const layout = {
  areas: [
    { tag: 'editor', rect: { left: 0, right: 0.55, top: 1, bottom: 0.4 } },
    { tag: 'preview', rect: { left: 0.55, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'inspector', rect: { left: 0, right: 1, top: 0.4, bottom: 0 } },
  ],
}

const PANEL_CONFIG: Record<
  string,
  { title: string; detail: string; accent: string; background: string }
> = {
  editor: {
    title: 'Editor',
    detail: 'Type, drag splitters, and reshape the layout.',
    accent: '#22c55e',
    background: 'linear-gradient(155deg, rgba(34, 197, 94, 0.2), rgba(15, 23, 42, 0.1))',
  },
  preview: {
    title: 'Preview',
    detail: 'Live output stays in sync with layout edits.',
    accent: '#38bdf8',
    background: 'linear-gradient(155deg, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.12))',
  },
  inspector: {
    title: 'Inspector',
    detail: 'Use corner drag to split, join, or replace areas.',
    accent: '#f97316',
    background: 'linear-gradient(155deg, rgba(249, 115, 22, 0.2), rgba(124, 45, 18, 0.1))',
  },
}

const createPanel = (tag: string): HTMLElement => {
  const config = PANEL_CONFIG[tag] ?? {
    title: tag,
    detail: 'Custom content',
    accent: '#94a3b8',
    background: 'linear-gradient(155deg, rgba(148, 163, 184, 0.2), rgba(15, 23, 42, 0.1))',
  }

  const panel = document.createElement('div')
  panel.className = 'sa-panel'
  panel.style.setProperty('--sa-panel-accent', config.accent)
  panel.style.setProperty('--sa-panel-bg', config.background)

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

onMounted(async () => {
  await import('../../../src/plugin/sliced-areas')
  await import('../../../src/plugin/styles.css')

  if (!areasRef.value) return

  const element = areasRef.value as any
  element.setResolver(createPanel)
  element.layout = layout
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
      <sliced-areas ref="areasRef" class="sa-demo-root" />
    </div>
  </ClientOnly>
</template>
