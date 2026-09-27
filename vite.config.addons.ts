import { defineConfig } from 'vite'
import { resolve } from 'path'
import { externaliseEngine } from './vite-externalise-engine-plugin'

// Library build of the optional add-on entry points: drivers (scroll /
// visibility), the interaction layer (Observer / Draggable) and the
// GSAP-flavoured compat facade.
//
// These are kept out of the engine bundle on purpose — the engine must stay
// framework-agnostic and DOM-free, and none of these belong in an embed that
// only plays an animation. Each is its own entry so it tree-shakes away when
// unused.
export default defineConfig({
  plugins: [externaliseEngine()],
  build: {
    lib: {
      entry: {
        adapters: resolve(__dirname, 'src/adapters/index.ts'),
        export: resolve(__dirname, 'src/engine/export/index.ts'),
        drivers: resolve(__dirname, 'src/drivers/index.ts'),
        interaction: resolve(__dirname, 'src/interaction/index.ts'),
        'gsap-compat': resolve(__dirname, 'src/compat/gsap/index.ts'),
        teach: resolve(__dirname, 'src/teach/index.ts'),
      },
      formats: ['es'],
    },
    minify: 'esbuild',
    outDir: 'lib/addons',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
