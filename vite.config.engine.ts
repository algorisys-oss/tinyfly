import { defineConfig } from 'vite'
import { resolve } from 'path'

// Library build of the framework-agnostic engine. The engine has no runtime
// dependencies, so this produces a self-contained ESM + UMD bundle that can be
// published to npm and imported anywhere (browser, Web Worker, Node).
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/engine/index.ts'),
      name: 'tinyfly',
      fileName: (format) => `tinyfly-engine.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd'],
    },
    minify: 'esbuild',
    // Output outside the app's dist/ so `npm run build` (which empties dist) does
    // not wipe the published library artifacts.
    outDir: 'lib/engine',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
