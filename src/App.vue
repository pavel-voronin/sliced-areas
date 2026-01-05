<script setup lang="ts">
import { ref } from 'vue'
import WebComponentDemo from './demos/WebComponentDemo.vue'
import VueComponentDemo from './demos/VueComponentDemo.vue'

const activeDemo = ref<'web' | 'vue'>('web')
</script>

<template>
  <main class="app-shell">
    <header class="app-toolbar">
      <div class="app-title">Sliced Areas Demos</div>
      <div class="demo-switch">
        <button
          class="demo-switch-button"
          :class="{ active: activeDemo === 'web' }"
          type="button"
          @click="activeDemo = 'web'"
        >
          Web Component
        </button>
        <button
          class="demo-switch-button"
          :class="{ active: activeDemo === 'vue' }"
          type="button"
          @click="activeDemo = 'vue'"
        >
          Vue Component
        </button>
      </div>
    </header>
    <section class="demo-stage">
      <WebComponentDemo v-if="activeDemo === 'web'" />
      <VueComponentDemo v-else />
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  width: 100vw;
  background: #0b1120;
  padding: 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.app-toolbar {
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

.app-title {
  flex: 1 1 auto;
}

.demo-switch {
  display: flex;
  gap: 8px;
}

.demo-switch-button {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #bae6fd;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.demo-switch-button.active {
  background: rgba(56, 189, 248, 0.35);
  color: #0b1120;
}

.demo-switch-button:hover {
  background: rgba(56, 189, 248, 0.25);
}

.demo-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}
</style>
