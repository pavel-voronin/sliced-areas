<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const areasRef = ref<HTMLElement | null>(null)

const PANEL_CONFIG: Record<
  string,
  {
    title: string
    accent: string
    background: string
  }
> = {
  toolbox: {
    title: 'Toolbox',
    accent: '#f97316',
    background: 'linear-gradient(160deg, rgba(249, 115, 22, 0.2), rgba(255, 255, 255, 0.06))',
  },
  viewport: {
    title: 'Viewport',
    accent: '#22c55e',
    background: 'linear-gradient(160deg, rgba(34, 197, 94, 0.2), rgba(255, 255, 255, 0.06))',
  },
  outliner: {
    title: 'Outliner',
    accent: '#38bdf8',
    background: 'linear-gradient(160deg, rgba(56, 189, 248, 0.2), rgba(255, 255, 255, 0.06))',
  },
  timeline: {
    title: 'Timeline',
    accent: '#facc15',
    background: 'linear-gradient(160deg, rgba(250, 204, 21, 0.2), rgba(255, 255, 255, 0.06))',
  },
  console: {
    title: 'Console',
    accent: '#f43f5e',
    background: 'linear-gradient(160deg, rgba(244, 63, 94, 0.2), rgba(255, 255, 255, 0.06))',
  },
}

const layout = {
  areas: [
    { tag: 'toolbox', rect: { left: 0, right: 0.18, top: 1, bottom: 0.45 } },
    { tag: 'console', rect: { left: 0, right: 0.18, top: 0.45, bottom: 0 } },
    { tag: 'viewport', rect: { left: 0.18, right: 0.75, top: 1, bottom: 0.25 } },
    { tag: 'outliner', rect: { left: 0.75, right: 1, top: 1, bottom: 0.25 } },
    { tag: 'timeline', rect: { left: 0.18, right: 1, top: 0.25, bottom: 0 } },
  ],
}

const createPanel = (tag: string): HTMLElement => {
  const config = PANEL_CONFIG[tag] ?? {
    title: tag,
    accent: '#94a3b8',
    background: 'linear-gradient(160deg, rgba(148, 163, 184, 0.2), rgba(15, 23, 42, 0.1))',
  }

  const panel = document.createElement('div')
  panel.className = 'sa-panel'
  panel.style.setProperty('--sa-panel-accent', config.accent)
  panel.style.setProperty('--sa-panel-bg', config.background)

  const title = document.createElement('div')
  title.className = 'sa-panel-title'
  title.textContent = config.title

  panel.appendChild(title)

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
    <div class="sa-home-demo">
      <sliced-areas ref="areasRef" class="sa-demo-root" />
    </div>
  </ClientOnly>
</template>
