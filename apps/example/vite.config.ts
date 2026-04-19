import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/showcase/behavier/',
  resolve: {
    alias: {
      'behavier': resolve(__dirname, '../../packages/behavier/src/index.ts'),
      '@behavier/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@behavier/pointer': resolve(__dirname, '../../packages/pointer/src/index.ts'),
      '@behavier/page': resolve(__dirname, '../../packages/page/src/index.ts'),
      '@behavier/interaction': resolve(__dirname, '../../packages/interaction/src/index.ts'),
    },
  },
  build: {
    target: 'es2017',
    outDir: 'dist',
  },
})
