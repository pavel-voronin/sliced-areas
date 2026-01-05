<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { AreasLayout, CornerClickDetail, SlicedAreasElement } from '../plugin/sliced-areas'
import { createAreaNode, initialLayout, loadLayout, saveLayout } from './area-registry'

const STORAGE_KEY = 'sliced-areas:layout:web'

const areasRef = ref<SlicedAreasElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const menuState = ref({
  open: false,
  x: 0,
  y: 0,
  areaId: null as string | null,
})

const onLayoutChange = (event: CustomEvent<{ layout: AreasLayout }>): void => {
  const layout = event.detail?.layout
  if (!layout) return
  saveLayout(STORAGE_KEY, layout)
}

const resetLayout = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  if (areasRef.value) {
    areasRef.value.layout = initialLayout
  }
}

const closeMenu = (): void => {
  menuState.value.open = false
  menuState.value.areaId = null
}

const onCornerClick = (event: CustomEvent<CornerClickDetail>): void => {
  const detail = event.detail
  if (!detail) return
  menuState.value = {
    open: true,
    x: detail.clientX,
    y: detail.clientY,
    areaId: detail.areaId,
  }
}

const closeArea = (): void => {
  const areaId = menuState.value.areaId
  if (!areaId || !areasRef.value) return
  areasRef.value.close(areaId)
  closeMenu()
}

const onWindowPointerDown = (event: PointerEvent): void => {
  if (!menuState.value.open) return
  const target = event.target
  if (menuRef.value && target instanceof Node && menuRef.value.contains(target)) return
  closeMenu()
}

onMounted(() => {
  window.addEventListener('pointerdown', onWindowPointerDown)
  if (!areasRef.value) return
  areasRef.value.setResolver((tag) => createAreaNode(tag))
  const stored = loadLayout(STORAGE_KEY)
  areasRef.value.layout = stored ?? initialLayout
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onWindowPointerDown)
})
</script>

<template>
  <section class="demo-shell">
    <header class="demo-toolbar">
      <div class="demo-title">Web Component Demo</div>
      <button class="demo-reset" type="button" @click="resetLayout">Reset Layout</button>
    </header>
    <sliced-areas
      ref="areasRef"
      class="areas-root"
      @sliced-areas:layoutchange="onLayoutChange"
      @sliced-areas:cornerclick="onCornerClick"
    />
    <div
      v-if="menuState.open"
      ref="menuRef"
      class="area-menu"
      :style="{ left: `${menuState.x}px`, top: `${menuState.y}px` }"
    >
      <button class="area-menu-item" type="button" @click="closeArea">Close panel</button>
    </div>
  </section>
</template>

<style scoped>
.demo-shell {
  height: 100%;
  width: 100%;
  background: #0b1120;
  padding: 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  font-family: 'Trebuchet MS', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 11px;
}

.demo-title {
  flex: 1 1 auto;
}

.demo-reset {
  background: rgba(248, 113, 113, 0.16);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #fecaca;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.demo-reset:hover {
  background: rgba(248, 113, 113, 0.32);
}

.areas-root {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 100%;
}

.area-menu {
  position: fixed;
  min-width: 160px;
  padding: 6px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.45);
  z-index: 40;
}

.area-menu-item {
  width: 100%;
  background: transparent;
  border: none;
  color: #f1f5f9;
  text-align: left;
  padding: 8px 10px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.area-menu-item:hover {
  background: rgba(148, 163, 184, 0.2);
}

:global(.area-host) {
  height: 100%;
  width: 100%;
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
}
</style>
