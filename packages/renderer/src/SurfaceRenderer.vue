<script setup lang="ts">
import { provide, toRef, computed, ref } from 'vue'
import ComponentResolver from './ComponentResolver.vue'
import { SURFACE_KEY, REGISTRY_KEY, DATAMODEL_KEY } from './composables/useSurface'

const props = defineProps<{
  surface: any
}>()

const surfaceRef = toRef(props, 'surface')
const dataModel = computed(() => props.surface.dataModel)
const registry = computed(() => props.surface.componentRegistry)

provide(SURFACE_KEY, surfaceRef)
provide(REGISTRY_KEY, registry.value)
provide(DATAMODEL_KEY, dataModel)

const hasRoot = computed(() => registry.value.hasComponent('root'))
</script>

<template>
  <div class="a2ui-surface" :data-surface-id="surface.id">
    <ComponentResolver v-if="hasRoot" component-id="root" />
    <div v-else class="a2ui-surface-placeholder">
      Waiting for root component...
    </div>
  </div>
</template>

<style scoped>
.a2ui-surface {
  container-type: inline-size;
}
.a2ui-surface-placeholder {
  padding: 1rem;
  color: #888;
  font-style: italic;
}
</style>
