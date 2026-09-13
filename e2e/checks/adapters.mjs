/**
 * Adapter output checked by what actually renders: transform composition,
 * shine clipped to glyphs (background-clip: text), SVG rotation about its own
 * centre (transform-box: fill-box), and canvas drawing.
 */
export default {
  name: 'adapters',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    await page.evaluate(async () => {
      const { DOMAdapter, SVGAdapter } = await import('/src/adapters/index.ts')
      const root = document.getElementById('root')
      root.innerHTML = `
        <div id="box" style="position:absolute;left:40px;top:40px;width:50px;height:50px;background:#4a9eff"></div>
        <div id="shine" data-element-type="text" style="position:absolute;left:40px;top:140px;width:400px;height:60px;font:900 48px sans-serif;color:#ff0000">I</div>
        <svg id="svg" width="300" height="300" style="position:absolute;left:500px;top:40px"><rect id="bar" x="100" y="130" width="100" height="40" fill="#3ecf7a"/></svg>
        <canvas id="canvas" width="120" height="80" style="position:absolute;left:40px;top:240px"></canvas>`
      const state = (target, props) => ({ values: new Map([[target, new Map(Object.entries(props))]]), currentTime: 0, playbackState: 'playing', direction: 'forward', loopIteration: 0 })

      const dom = new DOMAdapter()
      dom.registerTarget('box', document.getElementById('box'))
      dom.applyState(state('box', { x: 30, y: 10, rotate: 45, scale: 1.5 }))
      dom.registerTarget('shine', document.getElementById('shine'))
      dom.applyState(state('shine', { shine: 0.5 }))

      const svgAdapter = new SVGAdapter()
      svgAdapter.registerTarget('bar', document.getElementById('bar'))
      svgAdapter.applyState(state('bar', { rotate: 90 }))
    })
    await page.waitForTimeout(100)

    const results = []
    const box = await page.locator('#box').boundingBox()
    // A 50px square rotated 45° and scaled 1.5 has a bounding box of 50·1.5·√2 ≈ 106px,
    // centred at its layout centre (65,65) plus the translate (30,10).
    const size = 50 * 1.5 * Math.SQRT2
    results.push({
      label: 'DOM transform composition',
      ok: Math.abs(box.width - size) < 1.5 && Math.abs(box.x + box.width / 2 - 95) < 1.5 && Math.abs(box.y + box.height / 2 - 75) < 1.5,
      detail: `box ${box.width.toFixed(1)} at (${(box.x + box.width / 2).toFixed(1)}, ${(box.y + box.height / 2).toFixed(1)})`,
    })

    // Shine: with background-clip:text the gradient shows only inside the "I"
    // glyph; far to the right of it the page background must show through.
    const shine = await page.locator('#shine').screenshot()
    const bar = await page.locator('#bar').boundingBox()
    const pixels = await page.evaluate(async (bytes) => {
      const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' })
      const bitmap = await createImageBitmap(blob)
      const c = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = c.getContext('2d')
      ctx.drawImage(bitmap, 0, 0)
      const at = (x, y) => [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data]
      return { outside: at(bitmap.width * 0.8, bitmap.height / 2), width: bitmap.width }
    }, [...shine])
    const outsideDark = pixels.outside[0] < 40 && pixels.outside[1] < 40 && pixels.outside[2] < 40
    results.push({ label: 'shine is clipped to the text (background-clip: text)', ok: outsideDark, detail: `pixel beside the glyph rgb(${pixels.outside.slice(0, 3).join(',')})` })

    // SVG: a 100x40 bar rotated 90° about its own centre (150,150) becomes 40x100, same centre.
    const svgBox = await page.locator('#svg').boundingBox()
    const cx = bar.x + bar.width / 2 - svgBox.x
    const cy = bar.y + bar.height / 2 - svgBox.y
    results.push({
      label: 'SVG rotates about its own centre (transform-box: fill-box)',
      ok: Math.abs(bar.width - 40) < 1.5 && Math.abs(bar.height - 100) < 1.5 && Math.abs(cx - 150) < 1.5 && Math.abs(cy - 150) < 1.5,
      detail: `${bar.width.toFixed(1)}x${bar.height.toFixed(1)} centred at (${cx.toFixed(1)}, ${cy.toFixed(1)})`,
    })

    const drawn = await page.evaluate(async () => {
      const { CanvasAdapter } = await import('/src/adapters/index.ts')
      const canvas = document.getElementById('canvas')
      const ctx = canvas.getContext('2d')
      const adapter = new CanvasAdapter()
      adapter.registerTarget('dot', { type: 'rect', x: 10, y: 10, width: 30, height: 30, fillStyle: '#ff00ff' })
      adapter.applyState({ values: new Map([['dot', new Map([['x', 50]])]]), currentTime: 0, playbackState: 'playing', direction: 'forward', loopIteration: 0 })
      adapter.render(ctx)
      const moved = [...ctx.getImageData(75, 25, 1, 1).data]
      const origin = [...ctx.getImageData(25, 25, 1, 1).data]
      return { moved, origin }
    })
    results.push({ label: 'canvas adapter draws at the animated offset', ok: drawn.moved[0] > 200 && drawn.moved[2] > 200 && drawn.origin[3] === 0, detail: `at offset rgba(${drawn.moved.join(',')})` })
    return results
  },
}
