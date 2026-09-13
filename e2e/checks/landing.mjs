/**
 * The landing page at `/`: it renders without downloading the editor or the
 * exporters, its playground compiles code, its calls to action route to the
 * editor at /app, it pins its story section, and reduced motion drops the pin.
 */
export default {
  name: 'landing',
  async run({ page, base }) {
    const results = []
    const errors = []
    const scripts = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => request.resourceType() === 'script' && scripts.push(new URL(request.url()).pathname))

    await page.goto(`${base}/`)
    await page.waitForSelector('.lp-title .line', { timeout: 30000 })
    await page.waitForTimeout(800)
    const heavy = scripts.filter((path) => path.includes('/src/editor/') || path.includes('/engine/export/'))
    results.push({ label: 'landing: renders without loading the editor or exporters', ok: heavy.length === 0, detail: heavy.slice(0, 3).join(', ') })

    const playground = await page.evaluate(() => {
      const json = document.querySelector('.lp-json').textContent
      return { boxes: document.querySelectorAll('.lp-preview .box').length, compiled: json.includes('"tracks"') }
    })
    await page.locator('.lp-editor textarea').fill("live.to('.box', { y: 30, duration: 0.5 })")
    await page.waitForTimeout(700)
    const edited = await page.evaluate(() => document.querySelector('.lp-json').textContent.includes('"property": "y"'))
    results.push({ label: 'landing: playground runs and recompiles edited code', ok: playground.boxes === 3 && playground.compiled && edited, detail: JSON.stringify({ ...playground, edited }) })

    const pinned = await page.evaluate(async () => {
      const spacer = document.querySelector('.pin-spacer')
      if (!spacer) return { spacer: false }
      window.scrollTo(0, spacer.getBoundingClientRect().top + scrollY + innerHeight)
      await new Promise((r) => setTimeout(r, 1200))
      return { spacer: true, top: document.querySelector('.lp-story').getBoundingClientRect().top }
    })
    results.push({ label: 'landing: the story section pins while it plays', ok: pinned.spacer && Math.abs(pinned.top) < 1, detail: JSON.stringify(pinned) })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(400)
    const reduced = await page.evaluate(() => ({ spacer: !!document.querySelector('.pin-spacer'), mode: !!document.querySelector('.lp-reduced') }))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    results.push({ label: 'landing: reduced motion drops the pin', ok: !reduced.spacer && reduced.mode, detail: JSON.stringify(reduced) })

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('.lp-hero .lp-button-primary').click()
    await page.waitForURL(/\/app$/, { timeout: 10000 })
    // The editor loads on demand; wait for it rather than navigating away mid-import.
    const editorLoaded = await page.waitForSelector('.toolbar-btn-myfiles', { timeout: 30000 }).then(() => true, () => false)
    results.push({ label: 'landing: "Open the editor" loads the editor at /app', ok: new URL(page.url()).pathname === '/app' && editorLoaded })

    await page.goto(`${base}/?example=bouncing-ball`)
    await page.waitForURL(/\/app/, { timeout: 10000 })
    results.push({ label: 'landing: old /?example= links reach the editor', ok: new URL(page.url()).pathname === '/app', detail: page.url() })

    results.push({ label: 'landing: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
