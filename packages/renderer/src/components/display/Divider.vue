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
  border-top: 1px solid var(--a2-border-default);
  margin: var(--a2-space-2) 0;
}
</style>
