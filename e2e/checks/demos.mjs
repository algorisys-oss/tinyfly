/**
 * Every GSAP-style demo, mounted the way its Examples card mounts it, driven
 * with real mouse input, and required to animate. Plus two precision checks
 * that depend on each browser's own layout and SVG geometry.
 */

async function mount(page, id) {
  return page.evaluate(async (id) => {
    const { liveDemos } = await import('/src/examples/live-demos/index.ts')
    const { createLive, Stage } = await import('/src/compat/gsap/index.ts')
    window.__teardown?.()
    const root = document.getElementById('root')
    const demo = liveDemos.find((d) => d.id === id)
    root.innerHTML = `<div id="demo" style="display:inline-block;padding:16px">${demo.html}</div>`
    const host = document.getElementById('demo')
    const stage = new Stage({ root: host })
    const cleanup = demo.run(createLive(stage), host)
    window.__teardown = () => {
      cleanup?.()
      stage.destroy()
    }
    return { requiresLayout: !!demo.requiresLayout }
  }, id)
}

export default {
  name: 'demos',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    const ids = await page.evaluate(async () => (await import('/src/examples/live-demos/index.ts')).liveDemos.map((d) => d.id))
    const results = []
    const failures = []

    for (const id of ids) {
      await mount(page, id)
      await page.waitForTimeout(100)
      const snap = () => page.evaluate(() => document.getElementById('demo').innerHTML)
      const seen = new Set([await snap()])

      // Interact the way a person would: press buttons and clickable parts, then drag and scroll.
      const clickables = await page.locator('#demo button, #demo .fe-block, #demo .cs-stack').all()
      for (const el of clickables.slice(0, 3)) {
        try {
          await el.click({ timeout: 1000 })
        } catch {
          // overlapped by another element mid-animation; the drag below still exercises the demo
        }
        await page.waitForTimeout(120)
        seen.add(await snap())
      }
      const box = await page.locator('#demo').boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 10, { steps: 6 })
      await page.mouse.up()
      await page.mouse.wheel(0, 150)
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(110)
        seen.add(await snap())
      }
      if (seen.size < 2) failures.push(id)
    }
    await page.evaluate(() => window.__teardown?.())
    results.push({ label: `all ${ids.length} GSAP-style demos animate under real input`, ok: failures.length === 0, detail: failures.length ? `static: ${failures.join(', ')}` : '' })

    // Motion path: followers stay on the drawn path.
    await mount(page, 'live-motion-path-align')
    let worst = 0
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(120)
      worst = Math.max(worst, await page.evaluate(() => {
        const path = document.querySelector('.mp-route')
        const m = path.getScreenCTM()
        const len = path.getTotalLength()
        const points = []
        for (let k = 0; k <= 600; k++) {
          const p = path.getPointAtLength((len * k) / 600)
          points.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f])
        }
        const distance = (node) => {
          const r = node.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          return Math.min(...points.map(([x, y]) => Math.hypot(x - cx, y - cy)))
        }
        return Math.max(distance(document.querySelector('.mp-arrow')), ...[...document.querySelectorAll('.mp-dot')].map(distance))
      }))
    }
    results.push({ label: 'motion path followers stay on the drawn path', ok: worst < 1.5, detail: `worst ${worst.toFixed(2)}px` })

    // Flip: nothing visibly jumps at the first frame, and tiles land on their layout.
    await mount(page, 'live-flip-shuffle')
    const flip = await page.evaluate(async () => {
      const measure = (layout) => Object.fromEntries([...document.querySelectorAll('.fs-tile')].map((n) => {
        const previous = n.style.transform
        if (layout) n.style.transform = 'none'
        const r = n.getBoundingClientRect()
        if (layout) n.style.transform = previous
        return [n.dataset.n, [r.left, r.top]]
      }))
      const worst = (a, b) => Math.max(...Object.keys(a).map((k) => Math.max(Math.abs(a[k][0] - b[k][0]), Math.abs(a[k][1] - b[k][1]))))
      const before = measure(false)
      document.querySelector('button[data-action=shuffle]').click()
      await new Promise((r) => requestAnimationFrame(() => r()))
      const jump = worst(before, measure(false))
      const moved = worst(before, measure(true))
      await new Promise((r) => setTimeout(r, 1000))
      return { jump, moved, landing: worst(measure(false), measure(true)) }
    })
    results.push({ label: 'flip: no jump at the first frame', ok: flip.jump < 1 && flip.moved > 10, detail: `jump ${flip.jump.toFixed(2)}px while layout moved ${flip.moved.toFixed(0)}px` })
    results.push({ label: 'flip: lands exactly on the new layout', ok: flip.landing < 0.5, detail: `${flip.landing.toFixed(2)}px` })
    await page.evaluate(() => window.__teardown?.())
    return results
  },
}
