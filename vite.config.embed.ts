import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * `tinyfly/embed`: the player with teaching controls and declarative mounting,
 * as one script for CMS pages (`tinyfly-embed.iife.js`, global `tinyfly`), plus
 * an ES build of the same entry.
 *
 * The player and engine are bundled in, so one script tag is enough; the plain
 * player build stays as small as it was.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed/index.ts'),
      name: 'tinyfly',
      fileName: (format) => `tinyfly-embed.${format === 'es' ? 'js' : `${format}.js`}`,
      formats: ['iife', 'es'],
    },
    minify: 'esbuild',
    outDir: 'lib/embed',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
