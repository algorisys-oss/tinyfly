export default {
  name: 'cricket-story',
  async run({ page, base }) {
    const results = []
    for (const mode of ['demo', 'standalone']) {
      await page.setViewportSize({ width: 1280, height: 900 })
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
        for (const option of [...document.querySelector('.crkt-action').options].filter(option => !option.value.startsWith('play/'))) {
          set('.crkt-action', option.value)
          const phases = [1400, 1900, 2500, 2900, 3900, 4500, 5500].map(time => { set('.crkt-time', String(time), 'input'); return hash() })
          actions.add(phases.join(','))
        }
        set('.crkt-action', 'defend')
        let blockContact = true
        for (const cast of ['adults', 'men', 'children', 'mixed']) {
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
      for (const [key, expected] of Object.entries({ actions: 16, views: 11, casts: 4, formats: 3, blockContact: true, eventSeek: true, angles: 4, closure: true, stable: true, replay: true, slow: true })) results.push({ label: `${mode}: ${key}`, ok: data[key] === expected, detail: String(data[key]) })
      const zoomChecks = await page.evaluate(() => {
        const set = (selector, value, type = 'change') => { const node = document.querySelector(selector); node.value = value; node.dispatchEvent(new Event(type, { bubbles: true })) }
        const canvas = document.querySelector('.crkt-canvas')
        const hash = () => { let h = 2166136261; for (const value of canvas.getContext('2d').getImageData(0, 0, 1280, 720).data) h = Math.imul(h ^ value, 16777619); return h >>> 0 }
        let views = 0, stable = true
        set('.crkt-time', '2500', 'input')
        for (const option of document.querySelector('.crkt-view').options) {
          set('.crkt-view', option.value); document.querySelector('.crkt-zoom-reset').click()
          const base = hash(), basePixels = canvas.getContext('2d').getImageData(0, 0, 1280, 720).data, time = document.querySelector('.crkt-time').value
          document.querySelector('.crkt-zoom-in').click()
          const enlarged = hash()
          stable &&= document.querySelector('.crkt-time').value === time && !document.querySelector('.crkt-play').checked
          set('.crkt-zoom', '25', 'input')
          const reduced = hash(), minimum = document.querySelector('.crkt-zoom-out').disabled
          set('.crkt-zoom', '400', 'input')
          const maximum = document.querySelector('.crkt-zoom-in').disabled
          document.querySelector('.crkt-zoom-reset').click()
          const resetPixels = canvas.getContext('2d').getImageData(0, 0, 1280, 720).data
          let changedPixels = 0, maxError = 0
          for (let i = 0; i < basePixels.length; i += 4) {
            let pixelError = 0
            for (let channel = 0; channel < 4; channel++) pixelError = Math.max(pixelError, Math.abs(basePixels[i + channel] - resetPixels[i + channel]))
            if (pixelError) changedPixels++
            maxError = Math.max(maxError, pixelError)
          }
          // WebKit can vary a few antialiased edge pixels after changing projection.
          // Keep the reset framing check tight; native tests require exact camera state.
          const restored = changedPixels <= 64 && maxError <= 64
          if (base !== enlarged && base !== reduced && restored && minimum && maximum && document.querySelector('.crkt-zoom-label').value === '100%') views++
        }
        set('.crkt-zoom', '200', 'input'); set('.crkt-view', 'field'); set('.crkt-cast', 'men')
        set('.crkt-time', '3900', 'input')
        return { views, stable, persistent: document.querySelector('.crkt-zoom').value === '200' && document.querySelector('.crkt-zoom-label').value === '200%' }
      })
      for (const [key, expected] of Object.entries({ views: 11, stable: true, persistent: true })) results.push({ label: `${mode}: camera zoom ${key}`, ok: zoomChecks[key] === expected, detail: String(zoomChecks[key]) })
      const markingChecks = await page.evaluate(() => {
        const set = (selector, value) => { const node = document.querySelector(selector); node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })) }
        const time = document.querySelector('.crkt-time').value
        const profiles = [...document.querySelector('.crkt-markings').options].map(option => option.value).join(',') === 'mcc,icc-men,icc-women'
        set('.crkt-markings', 'mcc')
        const mcc = document.querySelector('.crkt-area-review').disabled && document.querySelector('.crkt-marking-note').textContent.includes('MCC minimum')
        set('.crkt-markings', 'icc-women')
        const women = !document.querySelector('.crkt-area-review').disabled && document.querySelector('.crkt-marking-note').textContent.includes('23 m')
        const preserved = document.querySelector('.crkt-time').value === time && !document.querySelector('.crkt-play').checked && document.querySelector('.crkt-zoom').value === '200'
        const review = document.querySelector('.crkt-area-review'); review.checked = true; review.dispatchEvent(new Event('change', { bubbles: true }))
        const markers = !document.querySelector('.crkt-area-note').hidden && document.querySelector('.crkt-area-note').textContent.includes('9 inside') && document.querySelector('.crkt-area-note').textContent.includes('2 outside (orange): Fine leg, Third man') && document.querySelector('.crkt-time').value === time
        set('.crkt-format', 'test')
        const test = document.querySelector('.crkt-area-review').disabled && document.querySelector('.crkt-area-note').hidden
        set('.crkt-format', 't20')
        const restored = document.querySelector('.crkt-area-review').checked && !document.querySelector('.crkt-area-review').disabled && !document.querySelector('.crkt-area-note').hidden
        document.querySelector('[data-event="wicket"]').click()
        return { profiles, mcc, women, preserved, markers, test, restored }
      })
      for (const [key, ok] of Object.entries(markingChecks)) results.push({ label: `${mode}: field markings ${key}`, ok })
      await page.locator('.crkt-teams summary').focus()
      await page.keyboard.press('Enter')
      results.push({ label: `${mode}: accessible teams guide uses eleven exported labels`, ok: await page.evaluate(async () => {
        const { CRICKET_FIELDING_POSITIONS } = await import('/src/sports/index.ts')
        const guide = document.querySelector('.crkt-teams'), items = [...guide.querySelectorAll('li')]
        return guide.open && items.length === 11 && items.every(item => item.textContent === CRICKET_FIELDING_POSITIONS[item.dataset.player]) && guide.textContent.includes('nine teammates wait off-field') && guide.textContent.includes('Long-on is its deeper boundary alternative')
      }) })
      await page.keyboard.press('Enter')
      await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0) })
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 768 })
        results.push({ label: `${mode}: controls fit ${width}px`, ok: await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.crkt-controls select, .crkt-controls input, .crkt-controls button')].filter(node => node.getClientRects().length && (!node.closest('details') || node.closest('details').open)).every(node => node.getBoundingClientRect().right <= innerWidth)) })
      }
      await page.setViewportSize({ width: 1280, height: 768 })
      results.push({ label: `${mode}: desktop controls share the scene viewport`, ok: await page.evaluate(() => {
        const scene = document.querySelector('.crkt-canvas').getBoundingClientRect()
        return [...document.querySelectorAll('.crkt-controls select, .crkt-controls input, .crkt-controls button')].filter(node => node.getClientRects().length && (!node.closest('details') || node.closest('details').open)).every(node => {
          const rect = node.getBoundingClientRect()
          return rect.left >= scene.right && rect.top >= 0 && rect.bottom <= innerHeight
        })
      }) })
      await page.setViewportSize({ width: 390, height: 768 })
      results.push({ label: `${mode}: phone controls are available before the scene`, ok: await page.evaluate(() => {
        const scene = document.querySelector('.crkt-canvas').getBoundingClientRect()
        return [...document.querySelectorAll('.crkt-controls select, .crkt-controls input, .crkt-controls button')].filter(node => node.getClientRects().length && (!node.closest('details') || node.closest('details').open)).every(node => {
          const rect = node.getBoundingClientRect()
          return rect.top >= 0 && rect.bottom <= scene.top && rect.bottom <= innerHeight
        })
      }) })
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.crkt-export').evaluate(node => node.click())])
      const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk)
      const story = JSON.parse(Buffer.concat(chunks).toString())
      results.push({ label: `${mode}: JSON includes scene, action, camera and captions`, ok: story.scene.objects.filter(o => o.kind === 'character').length === 15 && story.timeline.tracks.some(t => t.target.endsWith('/camera')) && Boolean(story.timeline.captions.en.wicket) && story.scene.objects.find(o => o.id === 'fielder').name === 'Extra cover' && story.timeline.tracks.some(t => t.target.endsWith('/camera') && t.property === 'fov' && Math.abs(Math.tan(48 * Math.PI / 360) / Math.tan(t.keyframes[0].value * Math.PI / 360) - 2) < 1e-10) })
      results.push({ label: `${mode}: JSON preserves profile, capsule and setup overlay`, ok: story.markingProfile === 'icc-women' && story.fieldingArea.radius === 23 && story.fieldingArea.centres[0][2] === -10.06 && story.fieldingArea.centres[1][2] === 10.06 && story.scene.objects.find(o => o.id === 'fielding-circle').points.length === 130 && story.scene.objects.filter(o => o.id.startsWith('fielding-review-')).length === 11 && story.scene.objects.find(o => o.id === 'fielding-review-third-man').name.includes('outside') })
      const composedChecks = await page.evaluate(() => {
        const set = (selector, value, type = 'change') => { const node = document.querySelector(selector); node.value = value; node.dispatchEvent(new Event(type, { bubbles: true })) }
        set('.crkt-format', 't20')
        const group = document.querySelector('.crkt-action optgroup[label="Composed plays"]')
        const examples = group.children.length === 5
        let verdicts = true, physical = true
        for (const [id, event, label, count] of [
          ['no-ball-stumps', 'wicket', 'Stumps hit', '0 runs · 1 extras · 0 wickets'],
          ['free-hit-catch', 'catch', 'Catch controlled', '0 runs · 0 extras · 0 wickets'],
          ['no-ball-four', 'boundary', 'Four runs', '4 runs · 1 extras · 0 wickets'],
          ['free-hit-run-out', 'wicket', 'Wicket broken', '0 runs · 0 extras · 1 wickets'],
          ['free-hit-wide', 'keeper', 'Keeper gathers', '0 runs · 1 extras · 0 wickets'],
        ]) {
          set('.crkt-action', `play/${id}`)
          document.querySelector(`[data-event="${event}"]`).click()
          physical &&= document.querySelector('.crkt-caption strong').textContent === label
          document.querySelector('[data-event="result"]').click()
          verdicts &&= document.querySelector('.crkt-caption strong').textContent === (id === 'free-hit-run-out' ? 'Out' : 'Not out') && document.querySelector('.crkt-result').textContent.includes(count)
        }
        const carry = document.querySelector('.crkt-result').textContent.includes('free hit next')
        set('.crkt-action', 'play/free-hit-catch'); set('.crkt-format', 'test')
        const test = document.querySelector('.crkt-action').value === 'play/no-ball-stumps' && [...group.children].filter(option => option.disabled).length === 3
        set('.crkt-format', 'odi')
        const restored = [...group.children].every(option => !option.disabled)
        set('.crkt-action', 'play/free-hit-catch'); document.querySelector('[data-event="result"]').click()
        set('.crkt-markings', 'icc-men')
        const preserved = document.querySelector('.crkt-time').value === '5700' && document.querySelector('.crkt-zoom').value === '200' && document.querySelector('.crkt-caption strong').textContent === 'Not out'
        return { examples, physical, verdicts, carry, test, restored, preserved }
      })
      for (const [key, ok] of Object.entries(composedChecks)) results.push({ label: `${mode}: composed plays ${key}`, ok })
      const [composedDownload] = await Promise.all([page.waitForEvent('download'), page.locator('.crkt-export').evaluate(node => node.click())])
      const composedStream = await composedDownload.createReadStream(), composedChunks = []
      for await (const chunk of composedStream) composedChunks.push(chunk)
      const composedStory = JSON.parse(Buffer.concat(composedChunks).toString())
      results.push({ label: `${mode}: composed JSON preserves context, candidate and not-out ruling`, ok: composedStory.play.delivery.legality === 'legal' && composedStory.play.context.freeHit && composedStory.play.decision.dismissal === 'caught' && composedStory.ruling.dismissal === null && composedStory.ruling.reason === 'free-hit' && composedStory.result.wickets === 0 && !composedStory.result.freeHitNext && composedStory.timeline.captions.en.result.includes('Not out') && composedStory.timeline.tracks.some(t => t.target.endsWith('/camera')) && composedDownload.suggestedFilename() === 'cricket-odi-play-free-hit-catch.json' })
      await page.setViewportSize({ width: 1280, height: 900 })
      const reviewChecks = await page.evaluate(() => {
        const set = (q, v, type = 'change') => { const n = document.querySelector(q); n.value = v; n.dispatchEvent(new Event(type, { bubbles: true })) }
        const hash = () => { let h = 2166136261; for (const value of document.querySelector('.crkt-canvas').getContext('2d').getImageData(0, 0, 1280, 720).data) h = Math.imul(h ^ value, 16777619); return h >>> 0 }
        document.querySelector('.crkt-framing').open = true
        set('.crkt-action', 'play/no-ball-stumps'); set('.crkt-time', '2900', 'input')
        set('.crkt-view', 'front-foot')
        const preserved = document.querySelector('.crkt-time').value === '2900' && !document.querySelector('.crkt-play').checked
        document.querySelector('.crkt-review-event').click()
        const foot = document.querySelector('.crkt-time').value === '1900'
        const before = hash()
        set('.crkt-pitch', '45', 'input'); set('.crkt-distance', '1.5', 'input'); set('.crkt-fov', '55', 'input')
        const framed = before !== hash() && document.querySelector('.crkt-time').value === '1900'
        document.querySelector('.crkt-framing-reset').click()
        const reset = document.querySelector('.crkt-distance').value === '1' && document.querySelector('.crkt-pitch').value === '25' && document.querySelector('.crkt-zoom').value === '100'
        set('.crkt-view', 'striker-crease'); document.querySelector('.crkt-review-event').click()
        const striker = document.querySelector('.crkt-time').value === '3200'
        set('.crkt-action', 'run-out'); set('.crkt-view', 'bowler-crease'); document.querySelector('.crkt-review-event').click()
        const bowler = document.querySelector('.crkt-time').value === '5000'
        set('.crkt-view', 'follow-ball')
        const first = hash(); set('.crkt-yaw', '165', 'input')
        const follow = first !== hash() && document.querySelector('.crkt-review-event').disabled && document.querySelector('.crkt-review-overlay').disabled
        set('.crkt-view', 'bowler-crease'); document.querySelector('.crkt-review-event').click()
        const overlay = document.querySelector('.crkt-review-overlay'); overlay.checked = true; overlay.dispatchEvent(new Event('change', { bubbles: true }))
        set('.crkt-pitch', '25', 'input'); set('.crkt-distance', '1.5', 'input'); set('.crkt-fov', '55', 'input')
        set('.crkt-markings', 'icc-women')
        const retained = document.querySelector('.crkt-time').value === '5000' && document.querySelector('.crkt-pitch').value === '25' && document.querySelector('.crkt-distance').value === '1.5'
        return { preserved, foot, framed, reset, striker, bowler, follow, retained }
      })
      for (const [key, ok] of Object.entries(reviewChecks)) results.push({ label: `${mode}: decision camera ${key}`, ok })
      const [reviewDownload] = await Promise.all([page.waitForEvent('download'), page.locator('.crkt-export').evaluate(node => node.click())])
      const reviewStream = await reviewDownload.createReadStream(), reviewChunks = []
      for await (const chunk of reviewStream) reviewChunks.push(chunk)
      const reviewed = JSON.parse(Buffer.concat(reviewChunks).toString())
      results.push({ label: `${mode}: review JSON includes framing, far plane and crease reference`, ok: reviewed.cameraOptions.view === 'bowler-crease' && reviewed.cameraOptions.pitch === 25 && reviewed.cameraOptions.fov === 55 && reviewed.cameraOptions.distance > 4 && reviewed.scene.objects.some(o => o.id === 'decision-review-bowler-crease') && reviewed.timeline.tracks.some(t => t.property === 'far') })
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
