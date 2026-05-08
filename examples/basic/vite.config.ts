import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@a2ui/vue': resolve(__dirname, '../../packages/renderer/src'),
      '@a2ui/vue-core': resolve(__dirname, '../../packages/core/src'),
      '@a2ui/vue-transport': resolve(__dirname, '../../packages/transport/src'),
    },
  },
  server: {
    port: 3200,
  },
})
