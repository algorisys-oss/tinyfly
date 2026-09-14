import { defineConfig, type Plugin } from 'vite'
import { resolve, dirname } from 'path'

const COMPAT_DIR = resolve(__dirname, 'src/compat')

/**
 * Framework wrappers (`tinyfly/react`, `/vue`, `/svelte`, `/solid`).
 *
 * Each is a few lines around `live.context()`. Imports of the GSAP-style layer
 * become the published `tinyfly/gsap-compat` entry, and the frameworks stay
 * external (they are optional peer dependencies), so a wrapper adds almost
 * nothing to a bundle and shares the one `live` the app already uses.
 */
function externaliseCompat(): Plugin {
  return {
    name: 'tinyfly-externalise-compat',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return null
      const resolved = resolve(dirname(importer), source)
      if (!resolved.startsWith(COMPAT_DIR)) return null
      return { id: 'tinyfly/gsap-compat', external: true }
    },
  }
}

export default defineConfig({
  plugins: [externaliseCompat()],
  build: {
    lib: {
      entry: {
        react: resolve(__dirname, 'src/frameworks/react.ts'),
        vue: resolve(__dirname, 'src/frameworks/vue.ts'),
        svelte: resolve(__dirname, 'src/frameworks/svelte.ts'),
        solid: resolve(__dirname, 'src/frameworks/solid.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'vue', 'solid-js', 'tinyfly/gsap-compat'],
    },
    minify: 'esbuild',
    outDir: 'lib/frameworks',
    emptyOutDir: true,
    copyPublicDir: false,
  },
})
