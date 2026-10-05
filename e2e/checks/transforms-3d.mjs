/**
 * CSS-style 3D: one card, turned in 3D with perspective, drawn by the DOM
 * adapter (the browser's own CSS), the Canvas adapter (a mesh of triangles)
 * and the WebGL adapter (a 4x4 matrix). All three must land where the browser
 * puts the CSS card, and the shared projection maths must agree with it.
 */
const CASES = [
  { label: 'rotateY 60 in perspective', props: { rotateY: 60, perspective: 500 } },
  { label: 'rotateX + rotateY + z in perspective', props: { rotateX: 25, rotateY: -40, z: 30, perspective: 600 } },
  { label: 'quaternion in perspective', quaternion: [0.2, 0.35, 0.05], props: { perspective: 450 } },
]

export default {
  name: 'transforms-3d',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    const results = []
    for (const testCase of CASES) {
      const measured = await page.evaluate(async (testCase) => {
        const { DOMAdapter, CanvasAdapter, WebGLAdapter } = await import('/src/adapters/index.ts')
        const { quat } = await import('/src/engine/index.ts')
        const { elementMatrix, projectPoint } = await import('/src/adapters/transform-3d.ts')
        const props = { ...testCase.props }
        if (testCase.quaternion) props.quaternion = quat.normalize([...testCase.quaternion, 1])
        const W = 400
        const H = 300
        const root = document.getElementById('root')
        root.innerHTML = `
          <div id="stage" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px">
            <div id="card" style="position:absolute;left:100px;top:100px;width:200px;height:100px;background:#000"></div>
          </div>
          <canvas id="c2d" width="${W}" height="${H}" style="position:absolute;left:0;top:${H + 20}px"></canvas>
          <canvas id="cgl" width="${W}" height="${H}" style="position:absolute;left:0;top:${2 * H + 40}px"></canvas>`
        const state = (target) => ({ values: new Map([[target, new Map(Object.entries(props))]]), currentTime: 0, playbackState: 'playing', direction: 'forward', loopIteration: 0 })

        // The browser's own CSS 3D.
        const dom = new DOMAdapter()
        dom.registerTarget('card', document.getElementById('card'))
        dom.applyState(state('card'))
        const rect = document.getElementById('card').getBoundingClientRect()
        const css = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }

        // The shared maths, projecting the four corners.
        const m = elementMatrix(props, { x: 0, y: 0 }, { x: 200, y: 150 })
        const corners = [[100, 100], [300, 100], [100, 200], [300, 200]].map(([x, y]) => projectPoint(m, x, y))
        const maths = {
          left: Math.min(...corners.map((c) => c.x)),
          right: Math.max(...corners.map((c) => c.x)),
          top: Math.min(...corners.map((c) => c.y)),
          bottom: Math.max(...corners.map((c) => c.y)),
        }

        // Painted extents: the bounding box of pixels with any coverage over half.
        const extents = (data) => {
          let left = W, right = -1, top = H, bottom = -1
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (data(x, y) > 127) { left = Math.min(left, x); right = Math.max(right, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1) }
          }
          return { left, right, top, bottom }
        }

        const c2d = document.getElementById('c2d').getContext('2d')
        const canvasAdapter = new CanvasAdapter()
        canvasAdapter.registerTarget('card', { type: 'rect', x: 100, y: 100, width: 200, height: 100, fillStyle: '#000' })
        canvasAdapter.applyState(state('card'))
        canvasAdapter.render(c2d)
        const pixels2d = c2d.getImageData(0, 0, W, H).data
        const canvas = extents((x, y) => pixels2d[(y * W + x) * 4 + 3])

        let webgl = null
        const gl = document.getElementById('cgl').getContext('webgl', { preserveDrawingBuffer: true })
        if (gl) {
          const glAdapter = new WebGLAdapter(gl)
          glAdapter.registerTarget('card', { x: 200, y: 150, width: 200, height: 100, fill: '#000000' })
          glAdapter.applyState({ values: new Map([['card', new Map(Object.entries(props).filter(([k]) => k !== 'x' && k !== 'y'))]]), currentTime: 0, playbackState: 'playing', direction: 'forward', loopIteration: 0 })
          glAdapter.render()
          const buffer = new Uint8Array(W * H * 4)
          gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buffer)
          // readPixels rows run bottom-up.
          webgl = extents((x, y) => buffer[((H - 1 - y) * W + x) * 4 + 3])
        }
        return { css, maths, canvas, webgl }
      }, testCase)

      const off = (a, b) => Math.max(Math.abs(a.left - b.left), Math.abs(a.right - b.right), Math.abs(a.top - b.top), Math.abs(a.bottom - b.bottom))
      const show = (box) => `${box.left.toFixed(1)}..${box.right.toFixed(1)} × ${box.top.toFixed(1)}..${box.bottom.toFixed(1)}`
      results.push({ label: `projection maths matches CSS: ${testCase.label}`, ok: off(measured.maths, measured.css) < 0.5, detail: `css ${show(measured.css)}, maths ${show(measured.maths)}` })
      results.push({ label: `Canvas adapter matches CSS: ${testCase.label}`, ok: off(measured.canvas, measured.css) <= 1.5, detail: `canvas ${show(measured.canvas)}` })
      if (measured.webgl) {
        results.push({ label: `WebGL adapter matches CSS: ${testCase.label}`, ok: off(measured.webgl, measured.css) <= 1.5, detail: `webgl ${show(measured.webgl)}` })
      } else {
        results.push({ label: `WebGL: ${testCase.label}`, ok: 'note', detail: 'no WebGL in this browser' })
      }
    }
    return results
  },
}
