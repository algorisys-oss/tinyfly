import { defineConfig } from 'vite'
import { resolve } from 'path'

// The 3D scenes add-on for pages with no build step: cameras, lights and
// meshes drawn by the Canvas 2D renderer. A separate script, so pages that do
// not use 3D never download it: load it after tinyfly.iife.js and it adds the
// scene-3d functions to the same `tinyfly` global.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/scene-3d/index.ts'),
      name: 'tinyfly',
      formats: ['iife'],
      fileName: () => 'tinyfly-scene-3d.iife.js',
    },
    minify: 'esbuild',
    rollupOptions: { output: { extend: true } },
    outDir: 'lib/browser',
    // The browser bundle is built into the same folder first: keep it.
    emptyOutDir: false,
    copyPublicDir: false,
  },
})
