import { defineConfig } from 'vite'
import { resolve } from 'path'

// The all-in-one browser bundle for pages with no build step: engine, player,
// the live GSAP-style facade, drivers and interaction behind one `tinyfly`
// global. Bundler users should prefer the individual entry points, which
// tree-shake.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/browser/index.ts'),
      name: 'tinyfly',
      formats: ['iife', 'umd', 'es'],
      fileName: (format) => `tinyfly.${format === 'es' ? 'js' : `${format}.js`}`,
    },
    minify: 'esbuild',
    // Several tinyfly bundles on one page (the player on some pages, the embed on
    // others, or two plugins) add to one `tinyfly` global instead of replacing it.
    rollupOptions: { output: { extend: true } },
    outDir: 'lib/browser',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
