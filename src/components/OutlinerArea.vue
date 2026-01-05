<script setup lang="ts">
import AreaPanel from './AreaPanel.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <AreaPanel tag="outliner" :options="options" class="bg-emerald-800"></AreaPanel>
</template>
