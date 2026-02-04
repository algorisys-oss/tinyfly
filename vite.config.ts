import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [solid()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
