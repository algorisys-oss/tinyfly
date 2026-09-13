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
      const clickables = await page.locator('#demo button, #demo .fe-block, #demo .cs-stack, #demo .sg-thumb, #demo .pt-row').all()
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

    // Split text: lines follow the browser's own wrapping, and the text is unchanged.
    await mount(page, 'live-line-mask-reveal')
    const lines = await page.evaluate(() => {
      const copy = document.querySelector('.lm-copy')
      const lineEls = [...copy.querySelectorAll('.line')]
      const tops = lineEls.map((line) => [...line.querySelectorAll('span')].filter((s) => !s.className).map((w) => w.offsetTop))
      // Within a line every word shares a top (offsetTop ignores the lines' animated transforms).
      const flat = tops.every((t) => new Set(t).size <= 1)
      const text = copy.textContent.replace(/\s+/g, ' ').trim()
      return { count: lineEls.length, flat, text, label: copy.getAttribute('aria-label'), masks: copy.querySelectorAll('.line-mask').length }
    })
    results.push({
      label: 'split text: lines match the browser wrapping, text and aria-label intact',
      ok: lines.count >= 3 && lines.flat && lines.masks === lines.count && lines.text === lines.label && lines.text.startsWith('Motion that reads'),
      detail: `${lines.count} lines, masks ${lines.masks}, words level ${lines.flat}, text ${lines.text === lines.label}`,
    })
    await page.evaluate(() => window.__teardown?.())

    // Scroll pinning: the section holds still while the panels travel, snaps to a
    // whole panel when scrolling stops, and titles rise in as panels arrive.
    await mount(page, 'live-pinned-horizontal')
    await page.waitForTimeout(100)
    const pin = await page.evaluate(async () => {
      const scroller = document.querySelector('.ph-scroller')
      const section = document.querySelector('.ph-section')
      const track = document.querySelector('.ph-track')
      const distance = track.scrollWidth - section.clientWidth
      const settle = () => new Promise((r) => setTimeout(r, 2000))
      const offset = () => section.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      const trackX = () => new DOMMatrix(getComputedStyle(track).transform).m41
      const titleOpacities = () => [...document.querySelectorAll('.ph-panel strong')].map((t) => Number(getComputedStyle(t).opacity))

      const pinStart = 90 // the note above the section is 90px tall
      // Scroll gently to 40% of the travel; scrolling stops there.
      for (let y = 0; y <= pinStart + distance * 0.4; y += 12) {
        scroller.scrollTop = y
        scroller.dispatchEvent(new Event('scroll'))
        await new Promise((r) => requestAnimationFrame(r))
      }
      await settle()
      const snapped = { offset: offset(), progress: (scroller.scrollTop - pinStart) / distance, x: trackX(), titles: titleOpacities() }

      scroller.scrollTop = pinStart + distance + 60
      scroller.dispatchEvent(new Event('scroll'))
      await settle()
      return { distance, snapped, after: { offset: offset(), x: trackX(), titles: titleOpacities() } }
    })
    const third = Math.round(pin.snapped.progress * 3)
    results.push({
      label: 'scroll pin + snap: pinned, settles on a whole panel, released after',
      ok:
        pin.distance > 100 &&
        Math.abs(pin.snapped.offset) < 1 &&
        Math.abs(pin.snapped.progress * 3 - third) < 0.02 &&
        Math.abs(pin.snapped.x + pin.distance * (third / 3)) < 3 &&
        Math.abs(pin.after.offset + 60) < 1.5 &&
        Math.abs(pin.after.x + pin.distance) < 1,
      detail: `distance ${pin.distance}px; snapped to progress ${pin.snapped.progress.toFixed(3)} (x ${pin.snapped.x.toFixed(1)}); after offset ${pin.after.offset.toFixed(1)}`,
    })
    results.push({
      label: 'containerAnimation: panel titles are shown once their panel has slid in',
      ok: pin.after.titles.every((o) => o > 0.99) && pin.snapped.titles.at(-1) < 0.01,
      detail: `at snap ${pin.snapped.titles.map((o) => o.toFixed(2)).join(' ')}; at end ${pin.after.titles.map((o) => o.toFixed(2)).join(' ')}`,
    })
    await page.evaluate(() => window.__teardown?.())

    // Image sequence: scrolling through the pin scrubs to the last frame.
    await mount(page, 'live-image-sequence-scrub')
    await page.waitForTimeout(600)
    const sequence = await page.evaluate(async () => {
      const scroller = document.querySelector('.sq-scroller')
      const canvas = document.querySelector('.sq-canvas')
      const pixel = () => [...canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data].join(',')
      const first = pixel()
      scroller.scrollTop = 80 + 160 // halfway through the 320px scrub
      scroller.dispatchEvent(new Event('scroll'))
      await new Promise((r) => setTimeout(r, 900))
      return { first, middle: pixel(), painted: canvas.width > 0 && pixel() !== '0,0,0,0' }
    })
    results.push({ label: 'imageSequence: scrolling scrubs to a different frame on the canvas', ok: sequence.painted && sequence.first !== sequence.middle, detail: `centre pixel ${sequence.first} → ${sequence.middle}` })
    await page.evaluate(() => window.__teardown?.())

    // drawSVG: a real path's measured length, drawn to a segment in each browser.
    const draw = await page.evaluate(async () => {
      const { createLive, Stage } = await import('/src/compat/gsap/index.ts')
      const root = document.getElementById('root')
      root.innerHTML = '<svg width="300" height="120"><path id="dp" d="M10 60 C 60 0, 120 120, 290 60" fill="none" stroke="#000" stroke-width="4"/></svg>'
      const path = document.getElementById('dp')
      const stage = new Stage({ root })
      createLive(stage).fromTo(path, { drawSVG: 0 }, { drawSVG: '20% 70%', duration: 0.3 })
      await new Promise((r) => setTimeout(r, 600))
      const length = path.getTotalLength()
      const style = getComputedStyle(path)
      const dashes = style.strokeDasharray.split(/[\s,]+/).map(parseFloat)
      const offset = parseFloat(style.strokeDashoffset)
      stage.destroy()
      return { length, dashes, offset }
    })
    const drawOk = Math.abs(draw.dashes[0] - draw.length * 0.5) < 0.5 && Math.abs(draw.dashes[1] - draw.length) < 0.5 && Math.abs(draw.offset + draw.length * 0.2) < 0.5
    results.push({ label: 'drawSVG: measured stroke drawn to the requested segment', ok: drawOk, detail: `length ${draw.length.toFixed(1)}, dasharray ${draw.dashes.map((d) => d.toFixed(1)).join(' ')}, offset ${draw.offset.toFixed(1)}` })

    // Springs: a fling springs the card home past centre (overshoot) and settles on it.
    await mount(page, 'live-spring-release')
    await page.waitForTimeout(100)
    const cardBox = await page.locator('.sr-card').boundingBox()
    const cx = cardBox.x + cardBox.width / 2
    const cy = cardBox.y + cardBox.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 60, cy, { steps: 4 })
    await page.mouse.move(cx + 90, cy, { steps: 2 })
    await page.mouse.up()
    const path = await page.evaluate(async () => {
      const card = document.querySelector('.sr-card')
      const xs = []
      const start = performance.now()
      while (performance.now() - start < 2500) {
        await new Promise((r) => requestAnimationFrame(r))
        xs.push(new DOMMatrix(getComputedStyle(card).transform).m41)
      }
      return { min: Math.min(...xs), last: xs[xs.length - 1], first: xs[0] }
    })
    results.push({
      label: 'spring release: flung card overshoots centre and settles on it',
      ok: path.first > 30 && path.min < -2 && Math.abs(path.last) < 0.5,
      detail: `released at ${path.first.toFixed(1)}px, overshoot ${path.min.toFixed(1)}px, settled ${path.last.toFixed(2)}px`,
    })
    await page.evaluate(() => window.__teardown?.())

    // Shared elements: the hero starts exactly over the clicked thumbnail, lands on its own layout, and returns.
    await mount(page, 'live-shared-element-gallery')
    await page.waitForTimeout(100)
    const shared = await page.evaluate(async () => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
      const rect = (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }
      const diff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
      const thumb = document.querySelectorAll('.sg-thumb')[2]
      const hero = document.querySelector('.sg-hero')
      const thumbRect = rect(thumb)
      thumb.click()
      await frame()
      const startGap = diff(rect(hero), thumbRect)
      await new Promise((r) => setTimeout(r, 900))
      hero.style.transform = 'none'
      const heroLayout = rect(hero)
      hero.style.transform = ''
      const landGap = diff(rect(hero), heroLayout)
      document.querySelector('.sg-detail').click()
      await new Promise((r) => setTimeout(r, 800))
      return { startGap, landGap, backGap: diff(rect(thumb), thumbRect), thumbOpacity: getComputedStyle(thumb).opacity, grew: heroLayout[2] > thumbRect[2] * 1.5 }
    })
    results.push({
      label: 'shared-element flip: hero starts on the thumbnail, lands on its layout, thumbnail returns',
      ok: shared.grew && shared.startGap < 1 && shared.landGap < 0.5 && shared.backGap < 0.5 && shared.thumbOpacity === '1',
      detail: `start ${shared.startGap.toFixed(2)}px, land ${shared.landGap.toFixed(2)}px, back ${shared.backGap.toFixed(2)}px, thumb opacity ${shared.thumbOpacity}`,
    })
    await page.evaluate(() => window.__teardown?.())

    // Page transition: the hero starts over the clicked thumbnail and ends on its own layout.
    await mount(page, 'live-page-transition')
    await page.waitForTimeout(100)
    const route = await page.evaluate(async () => {
      const rect = (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }
      const diff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
      const thumb = document.querySelectorAll('.pt-thumb')[1]
      const thumbRect = rect(thumb)
      thumb.closest('[data-open]').click()
      // Wait for the leave phase and the swap.
      let hero = null
      for (let i = 0; i < 120 && !hero; i++) {
        await new Promise((r) => requestAnimationFrame(r))
        hero = document.querySelector('.pt-hero')
      }
      await new Promise((r) => requestAnimationFrame(r))
      const start = diff(rect(hero), thumbRect)
      await new Promise((r) => setTimeout(r, 900))
      hero.style.transform = 'none'
      const layout = rect(hero)
      hero.style.transform = ''
      return { start, land: diff(rect(hero), layout), title: document.querySelector('.pt-page h3')?.textContent, opacity: getComputedStyle(document.querySelector('.pt-page')).opacity }
    })
    results.push({
      label: 'pageTransition: shared image carried across the route swap, new page fully in',
      ok: route.start < 2 && route.land < 0.5 && route.title === 'Oslo' && route.opacity === '1',
      detail: `start ${route.start.toFixed(2)}px, land ${route.land.toFixed(2)}px, ${route.title}, opacity ${route.opacity}`,
    })
    await page.evaluate(() => window.__teardown?.())

    // Object targets + ticker: the canvas is drawn from a tweened object.
    await mount(page, 'live-canvas-object-tween')
    await page.waitForTimeout(700)
    const canvas = await page.evaluate(() => {
      const c = document.querySelector('.co-canvas')
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let painted = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++
      return { painted, readout: document.querySelector('.co-readout').textContent }
    })
    results.push({ label: 'object tweens drive a canvas through the ticker', ok: canvas.painted > 500 && canvas.readout !== 'radius 30 · spread 0.00', detail: `${canvas.painted} painted px, "${canvas.readout}"` })
    await page.evaluate(() => window.__teardown?.())
    return results
  },
}
