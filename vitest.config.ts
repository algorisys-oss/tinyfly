import { defineConfig } from 'vitest/config'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  // Resolve solid-js to its client build. Under the default (server) build
  // `createEffect` is a no-op, so reactive wiring — auto-save, thumbnails —
  // cannot be tested at all.
  // The package name maps to the engine source, so the example scenes under
  // examples/ (which import '@algorisys/tinyfly' like a user would) run in tests
  // without building lib/ first.
  resolve: {
    conditions: ['browser', 'development'],
    alias: [{ find: /^@algorisys\/tinyfly$/, replacement: new URL('./src/engine/index.ts', import.meta.url).pathname }],
  },
  // Same as vite.config.ts, so code that reads the version works under test.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // CSS is stubbed out in tests by default, which also empties `?raw` imports.
    // The code examples' markup CSS is copied into standalone pages, so its
    // tests need the real file.
    css: { include: [/code-examples\.css/] },
  },
})
