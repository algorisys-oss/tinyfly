export default {
  name: 'cricket-story',
  async run({ page, base }) {
    const results = []
    for (const mode of ['demo', 'standalone']) {
      await page.goto(`${base}/e2e/harness.html`)
      await page.evaluate(async mode => {
        const demo = await import('/src/examples/live-demos/cricket-story.js')
        const { extractCode } = await import('/src/examples/live-demos/index.ts')
        const { createLive, Stage } = await import('/src/compat/gsap/index.ts')
        const tinyfly = { ...await import('/src/browser/index.ts'), ...await import('/src/scene-3d/index.ts') }
        let pending, now = 0
        const scheduler = { request: cb => { pending = cb; return 1 }, cancel: () => { pending = null } }
        window.cricketAdvance = ms => { const cb = pending; pending = null; now += ms; cb?.(now) }
        const root = document.getElementById('root'); root.innerHTML = demo.html
        const stage = new Stage({ root, scheduler }), live = createLive(stage)
        const cleanup = mode === 'demo' ? demo.run(live, root) : new Function('tinyfly', 'live', 'root', extractCode(demo.run.toString()))(tinyfly, live, root)
        window.cricketCleanup = () => { cleanup?.(); stage.destroy() }
      }, mode)
      await page.uncheck('.crkt-play')
      const data = await page.evaluate(() => {
        const set = (selector, value, type = 'change') => { const node = document.querySelector(selector); node.value = value; node.dispatchEvent(new Event(type, { bubbles: true })) }
        const hash = () => { let h = 2166136261; for (const value of document.querySelector('.crkt-canvas').getContext('2d').getImageData(0, 0, 1280, 720).data) h = Math.imul(h ^ value, 16777619); return h >>> 0 }
        const actions = new Set(), views = new Set(), casts = new Set(), formats = new Set()
        for (const option of document.querySelector('.crkt-action').options) {
          set('.crkt-action', option.value)
          const phases = [1400, 1900, 2500, 2900, 3900, 4500, 5500].map(time => { set('.crkt-time', String(time), 'input'); return hash() })
          actions.add(phases.join(','))
        }
        set('.crkt-action', 'defend')
        let blockContact = true
        for (const cast of ['adults', 'children', 'mixed']) {
          set('.crkt-cast', cast); set('.crkt-time', '2900', 'input'); casts.add(hash())
          blockContact &&= document.querySelector('.crkt-caption strong').textContent === 'Bat contact' && document.querySelector('.crkt-caption').textContent.includes('The ball meets the blade')
        }
        set('.crkt-action', 'no-ball')
        for (const format of ['test', 'odi', 't20']) { set('.crkt-format', format); set('.crkt-time', '5700', 'input'); formats.add(document.querySelector('.crkt-format-note').textContent); if ((format !== 'test') !== document.querySelector('.crkt-result').textContent.includes('free hit next')) throw new Error('Incorrect format free hit result') }
        set('.crkt-action', 'stumping'); document.querySelector('[data-event="wicket"]').click()
        const eventSeek = document.querySelector('.crkt-time').value === '3900' && document.querySelector('.crkt-caption strong').textContent === 'Stumped'
        for (const option of document.querySelector('.crkt-view').options) { set('.crkt-view', option.value); views.add(hash()) }
        set('.crkt-view', 'field')
        const angles = new Set()
        for (const yaw of [0, 90, 180, 270]) { set('.crkt-yaw', String(yaw), 'input'); angles.add(hash()) }
        set('.crkt-yaw', '0', 'input'); const start = hash(); set('.crkt-yaw', '360', 'input'); const closure = start === hash()
        const paused = hash(); window.cricketAdvance(1000); const stable = paused === hash()
        document.querySelector('.crkt-replay').click(); window.cricketAdvance(16); window.cricketAdvance(500); const replay = Number(document.querySelector('.crkt-time').value) > 0
        const beforeSlow = Number(document.querySelector('.crkt-time').value)
        set('.crkt-speed', '0.25'); window.cricketAdvance(1000)
        const slow = Math.abs(Number(document.querySelector('.crkt-time').value) - beforeSlow - 250) < 2
        document.querySelector('.crkt-play').checked = false; document.querySelector('.crkt-play').dispatchEvent(new Event('change'))
        return { actions: actions.size, views: views.size, casts: casts.size, formats: formats.size, blockContact, eventSeek, angles: angles.size, closure, stable, replay, slow }
      })
      for (const [key, expected] of Object.entries({ actions: 16, views: 8, casts: 3, formats: 3, blockContact: true, eventSeek: true, angles: 4, closure: true, stable: true, replay: true, slow: true })) results.push({ label: `${mode}: ${key}`, ok: data[key] === expected, detail: String(data[key]) })
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 980 })
        results.push({ label: `${mode}: controls fit ${width}px`, ok: await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.crkt-controls select, .crkt-controls input, .crkt-controls button')].every(node => node.getBoundingClientRect().right <= innerWidth)) })
      }
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.crkt-export').evaluate(node => node.click())])
      const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk)
      const story = JSON.parse(Buffer.concat(chunks).toString())
      results.push({ label: `${mode}: JSON includes scene, action, camera and captions`, ok: story.scene.objects.filter(o => o.kind === 'character').length === 15 && story.timeline.tracks.some(t => t.target.endsWith('/camera')) && Boolean(story.timeline.captions.en.wicket) })
      await page.evaluate(() => window.cricketCleanup())
    }
    await page.goto(`${base}/examples/live-cricket-story/full`)
    const preview = page.frameLocator('.full-example-frame')
    await preview.locator('.crkt-action option').last().waitFor({ state: 'attached' })
    await preview.locator('.crkt-play').uncheck()
    await preview.locator('.crkt-action').selectOption('six')
    await preview.locator('[data-event="boundary"]').click()
    results.push({ label: 'local full-page preview loads sports and scene addons', ok: await preview.locator('.crkt-time').inputValue() === '5000' && await preview.locator('.crkt-caption strong').textContent() === 'Six runs' })
    return results
  },
}
