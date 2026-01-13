<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const areasRef = ref<HTMLElement | null>(null)
const areaCount = ref(0)
const events = ref<string[]>([])
const toggles = reactive({
  resize: true,
  split: true,
  join: true,
  replace: true,
  swap: true,
  maximize: true,
  restore: true,
})

const layout = {
  areas: [
    { tag: 'workspace', rect: { left: 0, right: 0.7, top: 1, bottom: 0 } },
    { tag: 'details', rect: { left: 0.7, right: 1, top: 1, bottom: 0.4 } },
    { tag: 'stats', rect: { left: 0.7, right: 1, top: 0.4, bottom: 0 } },
  ],
}

const PANEL_CONFIG: Record<string, { title: string; detail: string; accent: string }> = {
  workspace: {
    title: 'Workspace',
    detail: 'Drag splitters or corners to test operations.',
    accent: '#22c55e',
  },
  details: {
    title: 'Details',
    detail: 'Try disabling join or swap to feel the constraints.',
    accent: '#38bdf8',
  },
  stats: {
    title: 'Stats',
    detail: 'Layout events update this log live.',
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

const applyOperations = () => {
  if (!areasRef.value) return
  const element = areasRef.value as any
  const disabled = Object.entries(toggles)
    .filter(([, enabled]) => !enabled)
    .map(([key]) => key)
  element.operations = disabled.length ? { disable: disabled } : null
}

const onLayoutChange = (event: Event) => {
  const detail = (event as CustomEvent<{ layout: { areas: Array<any> } }>).detail
  const count = detail?.layout?.areas?.length ?? 0
  areaCount.value = count
  const time = new Date().toLocaleTimeString()
  events.value = [`${time} - layout changed (${count} areas)`, ...events.value].slice(0, 4)
}

onMounted(async () => {
  await import('../../../src/plugin/sliced-areas')
  await import('../../../src/plugin/styles.css')

  if (!areasRef.value) return

  const element = areasRef.value as any
  element.setResolver(createPanel)
  element.layout = layout
  element.addEventListener('sliced-areas:layoutchange', onLayoutChange)
  areaCount.value = layout.areas.length
  applyOperations()
})

onBeforeUnmount(() => {
  if (!areasRef.value) return
  const element = areasRef.value as any
  element.removeEventListener('sliced-areas:layoutchange', onLayoutChange)
  element.setResolver(null)
})

watch(toggles, applyOperations, { deep: true })
</script>

<template>
  <ClientOnly>
    <div class="sa-doc-demo">
      <div class="sa-demo-toolbar">
        <label v-for="(value, key) in toggles" :key="key" class="sa-demo-toggle">
          <input v-model="toggles[key]" type="checkbox" />
          <span>{{ key }}</span>
        </label>
        <div class="sa-demo-pill">Areas: {{ areaCount }}</div>
      </div>
      <sliced-areas ref="areasRef" class="sa-demo-root" />
      <div class="sa-demo-log">
        <div class="sa-demo-log-title">Recent events</div>
        <div v-if="events.length === 0" class="sa-demo-log-empty">Interact to generate events.</div>
        <div v-for="entry in events" :key="entry" class="sa-demo-log-entry">
          {{ entry }}
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
