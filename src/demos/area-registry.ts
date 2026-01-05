import { h, render } from 'vue'
import type { Component } from 'vue'
import ConsoleArea from '../components/ConsoleArea.vue'
import NodeManagerArea from '../components/NodeManagerArea.vue'
import OutlinerArea from '../components/OutlinerArea.vue'
import ViewportArea from '../components/ViewportArea.vue'
import type { AreasLayout } from '../plugin/vue'

export const areaOptions = [
  { value: 'viewport', label: 'Viewport' },
  { value: 'outliner', label: 'Outliner' },
  { value: 'console', label: 'Console' },
  { value: 'node-manager', label: 'Node Manager' },
]

export const areaComponents: Record<string, Component> = {
  viewport: ViewportArea,
  outliner: OutlinerArea,
  console: ConsoleArea,
  'node-manager': NodeManagerArea,
}

export const initialLayout: AreasLayout = {
  areas: [
    { tag: 'viewport', rect: { left: 0, right: 0.75, top: 1, bottom: 1 / 3 } },
    { tag: 'outliner', rect: { left: 0.75, right: 1, top: 1, bottom: 0 } },
    { tag: 'console', rect: { left: 0, right: 0.5, top: 1 / 3, bottom: 0 } },
    { tag: 'node-manager', rect: { left: 0.5, right: 0.75, top: 1 / 3, bottom: 0 } },
  ],
}

export const isValidLayout = (value: unknown): value is AreasLayout => {
  if (!value || typeof value !== 'object') return false
  const record = value as { areas?: unknown }
  if (!Array.isArray(record.areas)) return false
  return record.areas.every((area) => {
    if (!area || typeof area !== 'object') return false
    const entry = area as { tag?: unknown; rect?: unknown }
    if (typeof entry.tag !== 'string') return false
    if (!areaComponents[entry.tag]) return false
    if (!entry.rect || typeof entry.rect !== 'object') return false
    const rect = entry.rect as Record<string, unknown>
    const keys = ['left', 'right', 'top', 'bottom'] as const
    return keys.every((key) => typeof rect[key] === 'number' && Number.isFinite(rect[key]))
  })
}

export const loadLayout = (storageKey: string): AreasLayout | null => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidLayout(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const saveLayout = (storageKey: string, layout: AreasLayout): void => {
  localStorage.setItem(storageKey, JSON.stringify(layout))
}

export const createAreaNode = (tag: string): HTMLElement | null => {
  const component = areaComponents[tag]
  if (!component) return null
  const host = document.createElement('div')
  host.classList.add('area-host')
  render(h(component, { options: areaOptions }), host)
  return host
}
