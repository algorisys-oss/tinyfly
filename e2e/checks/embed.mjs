/**
 * Teaching embeds in a real browser: a figure built with tinyfly/teach, mounted
 * declaratively, stepped with the keyboard (only in the focused figure), SVG
 * fill painted, captions announced, reduced motion honoured, and playback
 * paused off screen.
 */
export default {
  name: 'embed',
  async run({ page, base }) {
    const results = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(`${base}/e2e/harness.html`)
    await page.evaluate(async () => {
      const teach = await import('/src/teach/index.ts')
      const build = () => {
        const slice = teach.cells({ id: 's', values: [1, 2, 3, ''], x: 20, y: 20 })
        const len = teach.pointer({ id: 'len', label: 'len', x: slice.center(2).x, y: 90 })
        const l = teach.lesson({ id: 'append' })
        l.marker('before', { label: 'len 3', captions: { es: 'len 3 (es)' } })
        l.wait(300)
        slice.write(l, 3, 4)
        len.moveTo(l, slice.center(3).x)
        l.marker('after', { label: 'len 4', captions: { es: 'len 4 (es)' } })
        slice.highlight(l, 3, '#ff0000', { duration: 200 })
        l.marker('lit', { label: 'lit' })
        return { markup: teach.figure({ width: 300, height: 150, children: [slice, len] }), definition: l.definition() }
      }
      const figureHtml = (id, extra = '') => {
        const { markup, definition } = build()
        return `<figure id="${id}" lang="es" data-tinyfly-embed ${extra}>${markup}<script type="application/json" data-tinyfly-timeline>${JSON.stringify(definition)}</script><figcaption>Appending</figcaption></figure>`
      }
      document.body.innerHTML = figureHtml('one') + figureHtml('two') + '<div style="height: 3000px"></div>' + figureHtml('far', `data-options='{"autoplay": true}'`)
      window.__build = build
      window.__figureHtml = figureHtml
      const embed = await import('/src/embed/index.ts')
      window.__embed = embed
      window.__mounted = await embed.mountAll()
    })

    // Keyboard steps the focused figure only.
    await page.focus('#one')
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => window.__mounted[0].player.currentMarker?.id === 'after' && !window.__mounted[0].player.isPlaying, null, { timeout: 5000 }).catch(() => {})
    const stepped = await page.evaluate(() => ({
      one: window.__mounted[0].player.currentMarker?.id,
      two: window.__mounted[1].player.currentTime,
      caption: document.querySelector('#one .tf-ctl-caption').textContent,
      step: document.querySelector('#one .tf-ctl-step').textContent,
    }))
    results.push({ label: 'embed: → steps the focused figure to its next marker, and only that figure', ok: stepped.one === 'after' && stepped.two === 0, detail: JSON.stringify(stepped) })
    results.push({ label: 'embed: the caption follows the step in the page language', ok: stepped.caption === 'len 4 (es)' && stepped.step === '2 / 3', detail: `${stepped.caption} · ${stepped.step}` })

    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => window.__mounted[0].player.currentMarker?.id === 'lit' && !window.__mounted[0].player.isPlaying, null, { timeout: 5000 }).catch(() => {})
    const fill = await page.evaluate(() => getComputedStyle(document.querySelector('#one [data-tinyfly="s-cell-3"]')).fill)
    results.push({ label: 'embed: SVG fill is painted as SVG paint', ok: /rgb\(255, 0, 0\)|#ff0000/.test(fill), detail: fill })

    const named = await page.evaluate(() => {
      const svg = document.querySelector('#one svg')
      return { role: svg.getAttribute('role'), labelledBy: document.getElementById(svg.getAttribute('aria-labelledby'))?.textContent }
    })
    results.push({ label: 'embed: the SVG is a labelled image', ok: named.role === 'img' && named.labelledBy === 'Appending', detail: JSON.stringify(named) })

    // Off screen: autoplay waits; scrolled into view it plays.
    const far = await page.evaluate(async () => {
      const player = window.__mounted[2].player
      const before = player.isPlaying
      document.getElementById('far').scrollIntoView()
      await new Promise((resolve) => setTimeout(resolve, 400))
      const seen = player.isPlaying
      window.scrollTo(0, 0)
      await new Promise((resolve) => setTimeout(resolve, 400))
      return { before, seen, after: player.isPlaying }
    })
    results.push({ label: 'embed: autoplay waits until seen, and pauses off screen', ok: !far.before && far.seen && !far.after, detail: JSON.stringify(far) })

    // Reduced motion: a new embed shows its final frame and does not play.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = await page.evaluate(async () => {
      const holder = document.createElement('div')
      holder.innerHTML = window.__figureHtml('calm', `data-options='{"autoplay": true}'`)
      document.body.prepend(holder)
      const [entry] = await window.__embed.mountAll(holder)
      return { playing: entry.player.isPlaying, atEnd: entry.player.currentTime === entry.player.duration }
    })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    results.push({ label: 'embed: reduced motion shows the final frame without playing', ok: !reduced.playing && reduced.atEnd, detail: JSON.stringify(reduced) })

    results.push({ label: 'embed: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
