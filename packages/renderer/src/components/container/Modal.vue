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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.a2-modal-content {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
</style>
