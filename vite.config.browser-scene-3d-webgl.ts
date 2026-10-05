import { defineConfig } from 'vite'
import { resolve } from 'path'

// The WebGL2 renderer for 3D scenes, for pages with no build step: load it
// after tinyfly.iife.js and tinyfly-scene-3d.iife.js; it adds WebGL2Renderer
// to the same `tinyfly` global.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/scene-3d/webgl/index.ts'),
      name: 'tinyfly',
      formats: ['iife'],
      fileName: () => 'tinyfly-scene-3d-webgl.iife.js',
    },
    minify: 'esbuild',
    rollupOptions: { output: { extend: true } },
    outDir: 'lib/browser',
    emptyOutDir: false,
    copyPublicDir: false,
  },
})
