import type { Plugin } from 'vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Writes `404.html` next to `index.html` in the build. Hosts without rewrite rules
 * (GitHub Pages, many plain static servers) serve 404.html for unknown addresses;
 * since it is the app itself, refreshing /studio or /learn/… still opens the page.
 * Hosts with rules use `public/_redirects` (Netlify, Cloudflare Pages) or
 * `vercel.json` (Vercel) instead.
 */
export function spaFallbackPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'tinyfly-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
  }
}
