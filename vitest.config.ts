import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolve solid-js to its client build. Under the default (server) build
  // `createEffect` is a no-op, so reactive wiring — auto-save, thumbnails —
  // cannot be tested at all.
  resolve: { conditions: ['browser', 'development'] },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
