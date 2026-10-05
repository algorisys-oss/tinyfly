/**
 * The WebGL2 scene renderer in a real browser: its shaders compile, it draws
 * the same objects in the same places as the Canvas 2D renderer, and its
 * depth buffer gets right what painter's order cannot (a plane through a box).
 */
export default {
  name: 'scene-3d-webgl',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    const measured = await page.evaluate(async () => {
      const { loadScene3D, resolveScene3D, drawResolvedScene } = await import('/src/scene-3d/index.ts')
      const { WebGL2Renderer } = await import('/src/scene-3d/webgl/index.ts')
      const W = 320
      const H = 200
      const root = document.getElementById('root')
      root.innerHTML = `<canvas id="gl" width="${W}" height="${H}"></canvas><canvas id="c2" width="${W}" height="${H}"></canvas>`
      const gl = document.getElementById('gl').getContext('webgl2', { preserveDrawingBuffer: true, antialias: false })
      if (!gl) return { noWebGL: true }
      const scene = (objects) =>
        loadScene3D({
          id: 'stage',
          camera: 'cam',
          materials: { red: { color: '#ff0000', shading: 'unlit' }, blue: { color: '#0000ff', shading: 'unlit' } },
          objects: [{ id: 'cam', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 50, position: [0, 0, 6], lookAt: [0, 0, 0] }, ...objects],
        })
      const coverage = (data) => Array.from({ length: W * H }, (_, i) => data[i * 4 + 3] > 127)
      const readGL = () => {
        const pixels = new Uint8Array(W * H * 4)
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        // Rows bottom-up: flip to the canvas's top-down order.
        const out = new Uint8Array(W * H * 4)
        for (let y = 0; y < H; y++) out.set(pixels.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4)
        return out
      }
      let compiled = true
      let renderer
      try {
        renderer = new WebGL2Renderer(gl)
      } catch (error) {
        return { compileError: String(error) }
      }

      // Same objects, both renderers: their silhouettes agree.
      const shapes = scene([
        { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1.2, 1.2, 1.2] }, material: 'red', position: [-1.2, 0, 0], rotation: [20, 30, 0] },
        { id: 'ball', kind: 'mesh', geometry: { type: 'sphere', radius: 0.8, segments: 32 }, material: 'blue', position: [1.2, 0.2, 0] },
      ])
      const frame = resolveScene3D(shapes, new Map(), { width: W, height: H })
      renderer.render(frame)
      const glCover = coverage(readGL())
      const ctx = document.getElementById('c2').getContext('2d')
      drawResolvedScene(ctx, frame)
      const c2Cover = coverage(ctx.getImageData(0, 0, W, H).data)
      let both = 0
      let either = 0
      for (let i = 0; i < W * H; i++) {
        if (glCover[i] && c2Cover[i]) both++
        if (glCover[i] || c2Cover[i]) either++
      }

      // A wide blue plate through the middle of a red box: the box's front face is nearer, so its centre is red.
      const crossing = scene([
        { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red' },
        { id: 'plate', kind: 'mesh', geometry: { type: 'box', size: [4, 4, 0.05] }, material: 'blue' },
      ])
      renderer.render(resolveScene3D(crossing, new Map(), { width: W, height: H }))
      const centre = readGL().slice(((H / 2) * W + W / 2) * 4, ((H / 2) * W + W / 2) * 4 + 4)
      return { compiled, overlap: both / either, centre: [...centre] }
    })
    if (measured.noWebGL) return [{ label: 'WebGL2 scene renderer', ok: 'note', detail: 'no WebGL2 in this browser' }]
    if (measured.compileError) return [{ label: 'WebGL2 shaders compile and link', ok: false, detail: measured.compileError }]
    return [
      { label: 'WebGL2 shaders compile and link', ok: measured.compiled, detail: '' },
      { label: 'WebGL2 and Canvas 2D draw the same silhouettes', ok: measured.overlap > 0.95, detail: `overlap ${(measured.overlap * 100).toFixed(1)}%` },
      { label: 'the depth buffer: a plate through a box shows the box in front', ok: measured.centre[0] > 200 && measured.centre[2] < 60, detail: `centre rgba(${measured.centre.join(',')})` },
    ]
  },
}
