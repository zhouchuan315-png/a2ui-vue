import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@nine1ie/a2ui-vue-core': resolve(__dirname, 'packages/core/src'),
      '@nine1ie/a2ui-vue': resolve(__dirname, 'packages/renderer/src'),
      '@nine1ie/a2ui-vue-transport': resolve(__dirname, 'packages/transport/src'),
    },
  },
})
