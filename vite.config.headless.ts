import { defineConfig } from 'vite'
import { resolve } from 'path'
import { externaliseEngine } from './vite-externalise-engine-plugin'

/**
 * `@algorisys/tinyfly/headless`: video and stills rendering for Node.
 *
 * Built for Node, not the browser: it spawns ffmpeg and loads the optional
 * `@napi-rs/canvas` peer at run time, so both stay external. The engine is
 * external too, so scenes built with `@algorisys/tinyfly` share one copy.
 */
export default defineConfig({
  plugins: [externaliseEngine()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/headless/index.ts'),
      fileName: () => 'headless.js',
      formats: ['es'],
    },
    target: 'node18',
    minify: false,
    outDir: 'lib/headless',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      external: [/^node:/, '@napi-rs/canvas'],
    },
  },
})
