<script setup lang="ts">
import AreaPanel from './AreaPanel.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <AreaPanel tag="node-manager" :options="options" class="bg-red-800"></AreaPanel>
</template>
