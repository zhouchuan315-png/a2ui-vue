<script setup lang="ts">
import type { ComponentDef } from '@a2ui/vue-core'
import type { Scope } from '@a2ui/vue-core'
import ComponentResolver from '../../ComponentResolver.vue'

defineProps<{
  componentDef: ComponentDef
  scope?: Scope
}>()
</script>

<template>
  <div class="a2-card">
    <ComponentResolver
      v-if="componentDef.child"
      :component-id="componentDef.child"
      :scope="scope"
    />
  </div>
</template>

<style scoped>
.a2-card {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  background: var(--a2-bg-surface);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-lg);
  padding: var(--a2-space-5);
  box-shadow: var(--a2-shadow-card);
}
</style>
