<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentDef, Scope } from '@nine1ie/a2ui-vue-core'
import ComponentResolver from '../../ComponentResolver.vue'
import { useCSSVars } from '../../theme/provide'

const props = defineProps<{
  componentDef: ComponentDef
  scope?: Scope
}>()

const visible = ref(false)
const cssVars = useCSSVars()

function openModal() {
  visible.value = true
}

function closeModal() {
  visible.value = false
}

function handleTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openModal()
  }
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

watch(visible, (isVisible) => {
  if (isVisible) {
    window.addEventListener('keydown', handleWindowKeydown)
  } else {
    window.removeEventListener('keydown', handleWindowKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
  <div class="a2-modal-wrapper">
    <div
      v-if="componentDef.trigger"
      class="a2-modal-trigger"
      role="button"
      tabindex="0"
      @click="openModal"
      @keydown="handleTriggerKeydown"
    >
      <ComponentResolver
        :component-id="componentDef.trigger"
        :scope="scope"
      />
    </div>
    <Teleport to="body">
      <div v-if="visible" class="a2-modal-overlay" :style="cssVars" @click.self="closeModal">
        <div class="a2-modal-content">
          <button class="a2-modal-close" type="button" @click="closeModal">
            Close
          </button>
          <ComponentResolver
            v-if="componentDef.child"
            :component-id="componentDef.child"
            :scope="scope"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.a2-modal-wrapper {
  width: 100%;
}

.a2-modal-trigger {
  width: fit-content;
  max-width: 100%;
  cursor: pointer;
}

.a2-modal-trigger:focus-visible {
  outline: none;
  box-shadow: var(--a2-shadow-focus);
  border-radius: var(--a2-radius-lg);
}

.a2-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--a2-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--a2-space-6);
  z-index: 1000;
}
.a2-modal-content {
  position: relative;
  background: var(--a2-bg-elevated);
  border: 1px solid color-mix(in srgb, var(--a2-border-default) 80%, transparent);
  border-radius: var(--a2-radius-xl);
  padding: var(--a2-space-7);
  max-width: 90vw;
  max-height: 80vh;
  min-width: min(36rem, 90vw);
  overflow: auto;
  box-shadow: var(--a2-shadow-xl);
}

.a2-modal-close {
  position: absolute;
  top: var(--a2-space-4);
  right: var(--a2-space-4);
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0 var(--a2-space-3);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-full);
  background: var(--a2-bg-surface);
  color: var(--a2-text-secondary);
  font: inherit;
  cursor: pointer;
  transition:
    background-color var(--a2-transition-fast),
    border-color var(--a2-transition-fast),
    color var(--a2-transition-fast);
}

.a2-modal-close:hover {
  background: var(--a2-bg-subtle);
  border-color: var(--a2-border-strong);
  color: var(--a2-text-primary);
}
</style>
