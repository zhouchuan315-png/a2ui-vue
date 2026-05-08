<script setup lang="ts">
import type { ComponentDef } from '@a2ui/vue-core'

defineProps<{
  componentDef: ComponentDef
}>()
</script>

<template>
  <div class="a2-card">
    <slot />
  </div>
</template>

<style scoped>
.a2-card {
  background: var(--a2-card-bg, #fff);
  border: 1px solid var(--a2-border-color, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
