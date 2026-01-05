<script setup lang="ts">
const props = defineProps<{
  tag: string
  options: Array<{ value: string; label: string }>
}>()

const requestRetag = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  if (!value || value === props.tag) return
  const detail = { tag: value }
  const retagEvent = new CustomEvent('sliced-areas:retag', {
    detail,
    bubbles: true,
    composed: true,
  })
  event.currentTarget?.dispatchEvent(retagEvent)
}
</script>

<template>
  <section class="example-area">
    <div class="example-area-body">
      <select class="example-area-select" :value="tag" @change="requestRetag">
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </section>
</template>

<style scoped>
.example-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  color: #e2e8f0;
  font-family: 'Trebuchet MS', sans-serif;
}

.example-area-select {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
  font-size: 10px;
  letter-spacing: 0.12em;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.example-area-body {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
