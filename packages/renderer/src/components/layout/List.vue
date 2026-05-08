<script setup lang="ts">
import type { ComponentDef } from '@a2ui/vue-core'

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
}
</style>
