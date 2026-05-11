<script setup lang="ts">
import type { ComponentDef } from '@a2ui/vue-core'

defineProps<{
  componentDef: ComponentDef
}>()
</script>

<template>
  <hr class="a2-divider" aria-orientation="horizontal" />
</template>

<style scoped>
.a2-divider {
  display: block;
  align-self: stretch;
  flex: 0 0 auto;
  width: 100%;
  min-width: 100%;
  height: 0;
  box-sizing: border-box;
  border: none;
  border-top: 1px solid var(--a2-border-default);
  margin: var(--a2-space-3) 0;
}
</style>
