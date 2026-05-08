<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { A2UIRenderer } from '@a2ui/vue'
import type { ActionMessage } from '@a2ui/vue-core'
import { registrationForm, taskList, agentDashboard } from './mock-data'

const rendererRef = ref<InstanceType<typeof A2UIRenderer> | null>(null)
const activeDemo = ref<string>('registration')
const actionLog = ref<string[]>([])

const demos: Record<string, { label: string; messages: any[] }> = {
  registration: { label: 'Registration Form', messages: registrationForm },
  tasks: { label: 'Task List', messages: taskList },
  dashboard: { label: 'Agent Dashboard', messages: agentDashboard },
}

function loadDemo(name: string) {
  activeDemo.value = name
  actionLog.value = []
  nextTick(() => {
    const renderer = rendererRef.value
    if (!renderer) return
    for (const msg of demos[name].messages) {
      renderer.processMessage(msg)
    }
  })
}

function handleAction(action: ActionMessage) {
  const log = `[${action.timestamp}] ${action.name} → ${JSON.stringify(action.context)}`
  actionLog.value.unshift(log)
  console.log('[A2UI Action]', action)
}

onMounted(() => {
  loadDemo('registration')
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>A2UI Vue 3 Demo</h1>
      <p>Based on A2UI v0.9 Protocol</p>
    </header>

    <nav class="demo-nav">
      <button
        v-for="(demo, key) in demos"
        :key="key"
        class="nav-btn"
        :class="{ 'nav-btn--active': activeDemo === key }"
        @click="loadDemo(key)"
      >
        {{ demo.label }}
      </button>
    </nav>

    <main class="app-main">
      <div class="renderer-panel">
        <div class="panel-header">
          <span class="panel-tag">Surface: {{ activeDemo }}</span>
        </div>
        <div class="renderer-container">
          <A2UIRenderer ref="rendererRef" @action="handleAction" />
        </div>
      </div>

      <aside class="action-panel">
        <div class="panel-header">
          <span class="panel-tag">Actions</span>
        </div>
        <div class="action-log">
          <p v-if="!actionLog.length" class="action-empty">Interact with the UI to see actions here</p>
          <div v-for="(log, i) in actionLog" :key="i" class="action-entry">
            {{ log }}
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}
.app-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}
.app-header p {
  color: #64748b;
  margin-top: 0.5rem;
}

.demo-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}
.nav-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  color: #475569;
  transition: all 0.15s;
}
.nav-btn:hover {
  background: #f8fafc;
}
.nav-btn--active {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.app-main {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

.renderer-panel, .action-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.panel-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.panel-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.renderer-container {
  padding: 1.5rem;
}

.action-log {
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}
.action-empty {
  color: #94a3b8;
  font-size: 0.85rem;
  text-align: center;
  padding: 2rem 0;
}
.action-entry {
  font-size: 0.8rem;
  font-family: 'SF Mono', Monaco, monospace;
  color: #334155;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  word-break: break-all;
}
</style>
