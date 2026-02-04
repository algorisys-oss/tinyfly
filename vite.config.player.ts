import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/player/index.ts'),
      name: 'tinyfly',
      fileName: 'tinyfly-player',
      formats: ['iife', 'es', 'umd']
    },
    minify: 'esbuild',
    outDir: 'dist/player',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      output: {
        // Ensure consistent naming
        entryFileNames: 'tinyfly-player.[format].js',
      }
    }
  }
})
