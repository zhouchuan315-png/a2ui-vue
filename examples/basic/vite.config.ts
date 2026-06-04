import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@nine1ie/a2ui-vue': resolve(__dirname, '../../packages/renderer/src'),
      '@nine1ie/a2ui-vue-core': resolve(__dirname, '../../packages/core/src'),
      '@nine1ie/a2ui-vue-transport': resolve(__dirname, '../../packages/transport/src'),
      '@nine1ie/a2ui-vue-a2a': resolve(__dirname, '../../packages/a2a/src'),
    },
  },
  server: {
    port: 3200,
  },
})
