import { defineConfig, type Plugin } from 'vite'
import { resolve, dirname } from 'path'

const ENGINE_DIR = resolve(__dirname, 'src/engine')

/**
 * Rewrite imports that resolve into the engine to the bare `tinyfly` specifier
 * and mark them external.
 *
 * Without this each add-on inlines its own copy of the engine, so a consumer
 * importing both `tinyfly` and `tinyfly/gsap-compat` ends up with two
 * `Timeline` classes and `instanceof` checks that silently fail.
 *
 * Adapters are deliberately *not* externalised — they have no public entry
 * point of their own, so the small amount of adapter code an add-on uses is
 * bundled in.
 */
function externaliseEngine(): Plugin {
  return {
    name: 'tinyfly-externalise-engine',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return null
      const resolved = resolve(dirname(importer), source)
      if (!resolved.startsWith(ENGINE_DIR)) return null
      return { id: 'tinyfly', external: true }
    },
  }
}

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
        drivers: resolve(__dirname, 'src/drivers/index.ts'),
        interaction: resolve(__dirname, 'src/interaction/index.ts'),
        'gsap-compat': resolve(__dirname, 'src/compat/gsap/index.ts'),
      },
      formats: ['es'],
    },
    minify: 'esbuild',
    outDir: 'lib/addons',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
