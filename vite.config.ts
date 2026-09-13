import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { readFileSync } from 'fs'
import { llmsPlugin } from './vite-llms-plugin.ts'
import { spaFallbackPlugin } from './vite-spa-fallback-plugin.ts'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [solid(), llmsPlugin(), spaFallbackPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
