<script setup lang="ts">
import { ref } from 'vue'
import type { ComponentDef } from '@a2ui/vue-core'

defineProps<{
  componentDef: ComponentDef
}>()

const visible = ref(false)
</script>

<template>
  <div class="a2-modal-wrapper">
    <slot name="trigger" />
    <Teleport to="body">
      <div v-if="visible" class="a2-modal-overlay" @click.self="visible = false">
        <div class="a2-modal-content">
          <slot />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.a2-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--a2-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.a2-modal-content {
  background: var(--a2-bg-elevated);
  border-radius: var(--a2-radius-lg);
  padding: var(--a2-space-6);
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  box-shadow: var(--a2-shadow-xl);
}
</style>
