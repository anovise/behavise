import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/behavise/example/',
  resolve: {
    alias: {
      '@anovise/behavise': resolve(__dirname, '../../packages/behavise/src/index.ts'),
      '@anovise/behavise-core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@anovise/behavise-pointer': resolve(__dirname, '../../packages/pointer/src/index.ts'),
      '@anovise/behavise-page': resolve(__dirname, '../../packages/page/src/index.ts'),
      '@anovise/behavise-interaction': resolve(__dirname, '../../packages/interaction/src/index.ts'),
    },
  },
  build: {
    target: 'es2017',
    outDir: 'dist',
  },
})
