/**
 * The full-page showcase, on the real window scroll: it builds without errors,
 * pins its work section to the pixel, counts its stats up, and leaves no pin or
 * page-mode behind when you navigate away.
 */
export default {
  name: 'showcase',
  async run({ page, base }) {
    const results = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(`${base}/showcase/agency-landing`)
    await page.waitForSelector('.ag-title .line', { timeout: 30000 })
    await page.waitForTimeout(1500)

    // Smooth scrolling: a wheel turn eases the real scroll position over several frames.
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, 600)
    const wheel = await page.evaluate(async () => {
      const samples = []
      const started = performance.now()
      await new Promise((resolve) => {
        const frame = () => {
          samples.push(Math.round(scrollY))
          if (performance.now() - started < 1800) requestAnimationFrame(frame)
          else resolve()
        }
        requestAnimationFrame(frame)
      })
      const between = samples.filter((y) => y > 30 && y < 570).length
      return { final: samples[samples.length - 1], between }
    })
    results.push({
      label: 'showcase: the wheel scrolls smoothly, easing the real scroll position',
      ok: Math.abs(wheel.final - 600) <= 2 && wheel.between >= 5,
      detail: `ends at ${wheel.final}px after ${wheel.between} in-between frames`,
    })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)

    const pin = await page.evaluate(async () => {
      const settle = (ms) => new Promise((r) => setTimeout(r, ms))
      const spacer = document.querySelector('.pin-spacer')
      const section = document.querySelector('.ag-work')
      const start = spacer.getBoundingClientRect().top + scrollY
      const travel = parseFloat(spacer.style.height) - section.offsetHeight
      window.scrollTo(0, start + travel * 0.5)
      await settle(2500)
      return {
        travel,
        top: section.getBoundingClientRect().top,
        x: new DOMMatrix(getComputedStyle(document.querySelector('.ag-work-track')).transform).m41,
      }
    })
    // The track allows 2% of the travel: scrub: 0.5 is still easing in its last percent after 2.5s.
    results.push({
      label: 'showcase: work section pinned while its track travels with scroll',
      ok: pin.travel > 100 && Math.abs(pin.top) < 1 && Math.abs(pin.x + pin.travel * 0.5) < pin.travel * 0.02,
      detail: `travel ${pin.travel}px, section top ${pin.top.toFixed(1)}, track x ${pin.x.toFixed(1)}`,
    })

    const parallax = await page.evaluate(async () => {
      const settle = (ms) => new Promise((r) => setTimeout(r, ms))
      const heading = document.querySelector('.ag-gallery h2')
      const shiftOf = () => Number.parseFloat(heading.style.getPropertyValue('translate').split(' ')[1] ?? '0') || 0
      // Scroll so its natural top (without its own shift) sits 20% down the viewport.
      window.scrollTo(0, heading.getBoundingClientRect().top - shiftOf() + scrollY - innerHeight * 0.2)
      await settle(400)
      const shift = shiftOf()
      const naturalTop = heading.getBoundingClientRect().top - shift
      // data-speed 0.8: offset is 20% of how far past centre the page has scrolled.
      const expected = (innerHeight / 2 - naturalTop - heading.offsetHeight / 2) * (1 - 0.8)
      return { shift, expected }
    })
    results.push({
      label: 'showcase: data-speed layers move at their own speed',
      ok: parallax.expected > 10 && Math.abs(parallax.shift - parallax.expected) < 1.5,
      detail: `shifted ${parallax.shift.toFixed(1)}px, expected ${parallax.expected.toFixed(1)}px`,
    })

    const stats = await page.evaluate(async () => {
      const el = document.querySelector('.ag-stats')
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 200)
      await new Promise((r) => setTimeout(r, 2400))
      return [...document.querySelectorAll('.ag-stat-value')].map((v) => v.textContent)
    })
    results.push({ label: 'showcase: stats count up from plain objects on entering', ok: stats.join() === '48,12M,97%', detail: stats.join(' ') })

    // Resize and rotation: the pinned distance is measured again and the track still ends flush.
    const travelBefore = await page.evaluate(
      () => document.querySelector('.ag-work-track').scrollWidth - document.querySelector('.ag-work').clientWidth
    )
    await page.setViewportSize({ width: 700, height: 800 })
    await page.waitForTimeout(600)
    const afterResize = await page.evaluate(async () => {
      const settle = (ms) => new Promise((r) => setTimeout(r, ms))
      const spacer = document.querySelector('.pin-spacer')
      const section = document.querySelector('.ag-work')
      const track = document.querySelector('.ag-work-track')
      const travel = track.scrollWidth - section.clientWidth
      const start = spacer.getBoundingClientRect().top + scrollY
      window.scrollTo(0, start + travel + 5) // just past the end of the pin
      await settle(2500)
      const trackRight = track.getBoundingClientRect().right
      const sectionRight = section.getBoundingClientRect().right
      const padding = parseFloat(getComputedStyle(track).paddingRight)
      return { travel, spacerTravel: parseFloat(spacer.style.height) - section.offsetHeight, flush: trackRight - sectionRight, padding }
    })
    await page.setViewportSize({ width: 1280, height: 800 })
    results.push({
      label: 'showcase: after a resize the pin distance is re-measured and the track still ends flush',
      ok:
        afterResize.travel !== travelBefore &&
        Math.abs(afterResize.spacerTravel - afterResize.travel) < 1 &&
        Math.abs(afterResize.flush) < afterResize.travel * 0.02 + 1,
      detail: `travel ${travelBefore} → ${afterResize.travel}px, spacer ${afterResize.spacerTravel}px, right edge off by ${afterResize.flush.toFixed(1)}px`,
    })

    // Reduced motion: switching the preference reverts the full setup (no pin) and back.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(400)
    const reduced = await page.evaluate(() => ({ spacer: !!document.querySelector('.pin-spacer'), mode: !!document.querySelector('.ag-reduced') }))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForTimeout(400)
    const restored = await page.evaluate(() => ({ spacer: !!document.querySelector('.pin-spacer'), reducedClass: !!document.querySelector('.ag-reduced') }))
    results.push({
      label: 'showcase: reduced motion removes the pin and motion; switching back restores them',
      ok: !reduced.spacer && reduced.mode && restored.spacer && !restored.reducedClass,
      detail: `reduce: ${JSON.stringify(reduced)}; back: ${JSON.stringify(restored)}`,
    })

    await page.locator('.showcase-bar-link').click()
    await page.waitForSelector('.showcase-card', { timeout: 10000 })
    const left = await page.evaluate(() => ({ spacer: !!document.querySelector('.pin-spacer'), mode: document.documentElement.classList.contains('showcase-mode') }))
    results.push({ label: 'showcase: leaving removes pins and page scrolling mode', ok: !left.spacer && !left.mode, detail: JSON.stringify(left) })
    results.push({ label: 'showcase: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
