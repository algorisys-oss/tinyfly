import { defineConfig } from 'vite'
import { resolve } from 'path'

// The maps add-on for pages with no build step. It is a separate script, not
// part of the all-in-one browser bundle, because the offline world outline it
// carries would add about 33 KB (gzipped) for everyone: load it after
// tinyfly.iife.js on pages that draw maps, and it adds the maps functions to
// the same `tinyfly` global.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/maps/index.ts'),
      name: 'tinyfly',
      formats: ['iife'],
      fileName: () => 'tinyfly-maps.iife.js',
    },
    minify: 'esbuild',
    rollupOptions: { output: { extend: true } },
    outDir: 'lib/browser',
    // The browser bundle is built into the same folder first: keep it.
    emptyOutDir: false,
    copyPublicDir: false,
  },
})
