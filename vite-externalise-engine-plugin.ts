import type { Plugin } from 'vite'
import { resolve, dirname } from 'path'

const ENGINE_DIR = resolve(__dirname, 'src/engine')
/** The exporters live under the engine but ship as their own entry, `tinyfly/export`. */
const EXPORT_DIR = resolve(__dirname, 'src/engine/export')

/**
 * Rewrite imports that resolve into the engine to the bare `@algorisys/tinyfly` specifier
 * and mark them external.
 *
 * Without this each add-on inlines its own copy of the engine, so a consumer
 * importing both `tinyfly` and `tinyfly/gsap-compat` ends up with two
 * `Timeline` classes and `instanceof` checks that silently fail.
 *
 * Adapters are *not* externalised: `tinyfly/adapters` is its own entry, but
 * the small amount of adapter code another add-on uses is bundled into it so
 * add-ons do not depend on each other. Exporters (`src/engine/export`) are
 * treated the same way.
 */
export function externaliseEngine(): Plugin {
  return {
    name: 'tinyfly-externalise-engine',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return null
      const resolved = resolve(dirname(importer), source)
      if (!resolved.startsWith(ENGINE_DIR)) return null
      // Exporters are bundled into whichever entry imports them (like adapters);
      // their own engine imports still resolve to the external engine.
      if (resolved.startsWith(EXPORT_DIR)) return null
      return { id: '@algorisys/tinyfly', external: true }
    },
  }
}
