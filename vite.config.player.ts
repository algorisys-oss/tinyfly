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
    // Output outside the app's dist/ so the app build (which empties dist) does
    // not wipe the published player bundle.
    outDir: 'lib/player',
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
