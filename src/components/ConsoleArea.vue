<script setup lang="ts">
import AreaPanel from './AreaPanel.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <AreaPanel tag="console" :options="options" class="bg-rose-800"></AreaPanel>
</template>
