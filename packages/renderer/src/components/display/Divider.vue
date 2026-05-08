<script setup lang="ts">
import type { ComponentDef } from '@a2ui/vue-core'

defineProps<{
  componentDef: ComponentDef
}>()
</script>

<template>
  <hr class="a2-divider" />
</template>

<style scoped>
.a2-divider {
  border: none;
  border-top: 1px solid var(--a2-border-color, #e5e7eb);
  margin: 0.5rem 0;
}
</style>
