<script setup lang="ts">
import type { ComponentDef } from '@nine1ie/a2ui-vue-core'

defineProps<{
  componentDef: ComponentDef
}>()
</script>

<template>
  <div class="a2-list">
    <slot />
  </div>
</template>

<style scoped>
.a2-list {
  display: flex;
  flex-direction: column;
  gap: var(--a2-space-3);
  width: 100%;
  min-width: 0;
}
</style>
