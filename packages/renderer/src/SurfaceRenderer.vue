<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import ComponentResolver from './ComponentResolver.vue'
import { SURFACE_KEY, REGISTRY_KEY, DATAMODEL_KEY } from './composables/useSurface'

const props = defineProps<{
  surface: any
}>()

const surfaceRef = toRef(props, 'surface')
const surfaceVersion = computed(() => props.surface._version)
const dataModel = computed(() => {
  void surfaceVersion.value
  return props.surface.dataModel
})
const registry = computed(() => {
  void surfaceVersion.value
  return props.surface.componentRegistry
})

provide(SURFACE_KEY, surfaceRef)
provide(REGISTRY_KEY, registry)
provide(DATAMODEL_KEY, dataModel)

const hasRoot = computed(() => registry.value.hasComponent('root'))
</script>

<template>
  <div class="a2ui-surface" :data-surface-id="surface.id">
    <div class="a2ui-surface-meta">
      <span class="a2ui-surface-badge">{{ surface.id }}</span>
      <span v-if="surface.theme?.agentDisplayName" class="a2ui-surface-agent">
        {{ surface.theme.agentDisplayName }}
      </span>
    </div>
    <ComponentResolver v-if="hasRoot" component-id="root" />
    <div v-else class="a2ui-surface-placeholder">
      Waiting for root component...
    </div>
  </div>
</template>

<style scoped>
.a2ui-surface {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--a2-space-5);
  width: 100%;
  min-width: 0;
  padding: var(--a2-space-5);
  border: 1px solid var(--a2-border-default);
  border-radius: var(--a2-radius-xl);
  background:
    linear-gradient(180deg, var(--a2-bg-surface) 0%, var(--a2-bg-subtle) 100%);
  box-shadow: var(--a2-shadow-panel);
}

.a2ui-surface-meta {
  display: flex;
  align-items: center;
  gap: var(--a2-space-3);
  flex-wrap: wrap;
}

.a2ui-surface-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 var(--a2-space-3);
  border-radius: var(--a2-radius-full);
  background: var(--a2-bg-tint);
  color: var(--a2-color-primary);
  font-size: var(--a2-font-size-xs);
  font-weight: var(--a2-font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.a2ui-surface-agent {
  color: var(--a2-text-secondary);
  font-size: var(--a2-font-size-sm);
  font-weight: var(--a2-font-weight-medium);
}

.a2ui-surface-placeholder {
  padding: var(--a2-space-4);
  color: var(--a2-text-muted);
  font-style: italic;
}
</style>
