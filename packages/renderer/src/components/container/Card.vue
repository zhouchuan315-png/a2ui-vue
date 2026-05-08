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
  background: var(--a2-bg-surface);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-base);
  padding: var(--a2-space-4);
  box-shadow: var(--a2-shadow-sm);
}
</style>
