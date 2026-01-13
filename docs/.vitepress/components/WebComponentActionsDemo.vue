<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const areasRef = ref<HTMLElement | null>(null)
const areaIds = ref<string[]>([])

const layout = {
  areas: [
    { tag: 'primary', rect: { left: 0, right: 0.6, top: 1, bottom: 0 } },
    { tag: 'secondary', rect: { left: 0.6, right: 1, top: 1, bottom: 0.5 } },
    { tag: 'notes', rect: { left: 0.6, right: 1, top: 0.5, bottom: 0 } },
  ],
}

const PANEL_CONFIG: Record<string, { title: string; detail: string; accent: string }> = {
  primary: {
    title: 'Primary',
    detail: 'Trigger methods to change the graph programmatically.',
    accent: '#22c55e',
  },
  secondary: {
    title: 'Secondary',
    detail: 'Swap or join with another area.',
    accent: '#38bdf8',
  },
  notes: {
    title: 'Notes',
    detail: 'Maximize and restore the current focus.',
    accent: '#f97316',
  },
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
    'linear-gradient(155deg, rgba(15, 23, 42, 0.08), rgba(148, 163, 184, 0.14))',
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

const updateAreaIds = () => {
  const element = areasRef.value as any
  if (!element?.graph) return
  areaIds.value = Object.keys(element.graph.areas ?? {})
}

const splitPrimary = () => {
  const element = areasRef.value as any
  const [firstId] = areaIds.value
  if (element && firstId) {
    element.split(firstId, 'right')
  }
}

const joinFirstTwo = () => {
  const element = areasRef.value as any
  const [firstId, secondId] = areaIds.value
  if (element && firstId && secondId) {
    element.join(firstId, secondId)
  }
}

const swapFirstTwo = () => {
  const element = areasRef.value as any
  const [firstId, secondId] = areaIds.value
  if (element && firstId && secondId) {
    element.swap(firstId, secondId)
  }
}

const maximizeFirst = () => {
  const element = areasRef.value as any
  const [firstId] = areaIds.value
  if (element && firstId) {
    element.maximize(firstId)
  }
}

const restoreLayout = () => {
  const element = areasRef.value as any
  if (element?.restore) {
    element.restore()
  }
}

const resetLayout = () => {
  const element = areasRef.value as any
  if (element) {
    element.layout = layout
  }
}

onMounted(async () => {
  await import('../../../src/plugin/sliced-areas')
  await import('../../../src/plugin/styles.css')

  if (!areasRef.value) return

  const element = areasRef.value as any
  element.setResolver(createPanel)
  element.layout = layout
  element.addEventListener('sliced-areas:layoutchange', updateAreaIds)
  updateAreaIds()
})

onBeforeUnmount(() => {
  if (!areasRef.value) return
  const element = areasRef.value as any
  element.removeEventListener('sliced-areas:layoutchange', updateAreaIds)
  element.setResolver(null)
})
</script>

<template>
  <ClientOnly>
    <div class="sa-doc-demo">
      <div class="sa-demo-toolbar">
        <button class="sa-demo-button" type="button" @click="splitPrimary">Split</button>
        <button class="sa-demo-button" type="button" @click="joinFirstTwo">Join</button>
        <button class="sa-demo-button" type="button" @click="swapFirstTwo">Swap</button>
        <button class="sa-demo-button" type="button" @click="maximizeFirst">Maximize</button>
        <button class="sa-demo-button" type="button" @click="restoreLayout">Restore</button>
        <button class="sa-demo-button" type="button" @click="resetLayout">Reset</button>
      </div>
      <sliced-areas ref="areasRef" class="sa-demo-root" />
    </div>
  </ClientOnly>
</template>
