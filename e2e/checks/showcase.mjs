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

    const stats = await page.evaluate(async () => {
      const el = document.querySelector('.ag-stats')
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 200)
      await new Promise((r) => setTimeout(r, 2400))
      return [...document.querySelectorAll('.ag-stat-value')].map((v) => v.textContent)
    })
    results.push({ label: 'showcase: stats count up from plain objects on entering', ok: stats.join() === '48,12M,97%', detail: stats.join(' ') })

    await page.locator('.showcase-bar-link').click()
    await page.waitForSelector('.showcase-card', { timeout: 10000 })
    const left = await page.evaluate(() => ({ spacer: !!document.querySelector('.pin-spacer'), mode: document.documentElement.classList.contains('showcase-mode') }))
    results.push({ label: 'showcase: leaving removes pins and page scrolling mode', ok: !left.spacer && !left.mode, detail: JSON.stringify(left) })
    results.push({ label: 'showcase: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
