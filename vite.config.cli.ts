import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * The `tinyfly` command's library: `validateEmbed` and `renderFrame`, which need
 * no DOM, bundled for Node. `bin/tinyfly.mjs` imports it.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed/tools.ts'),
      fileName: () => 'tools.js',
      formats: ['es'],
    },
    target: 'node18',
    minify: false,
    outDir: 'lib/cli',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
