import { defineConfig } from 'vite'
import { resolve } from 'path'

// The maths add-on for pages with no build step: figures, equations, lesson
// steps, the math embed and explorables. A separate script, so pages that do
// not teach maths never download it. It works on its own (it carries the
// embed player it needs) or after tinyfly.iife.js, adding to the same
// `tinyfly` global.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/math/browser-entry.ts'),
      name: 'tinyfly',
      formats: ['iife'],
      fileName: () => 'tinyfly-math.iife.js',
    },
    minify: 'esbuild',
    rollupOptions: { output: { extend: true } },
    outDir: 'lib/browser',
    // The browser bundle is built into the same folder first: keep it.
    emptyOutDir: false,
    copyPublicDir: false,
  },
})
