<script setup lang="ts">
import AreaPanel from './AreaPanel.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <AreaPanel tag="viewport" :options="options" class="bg-slate-800"></AreaPanel>
</template>
