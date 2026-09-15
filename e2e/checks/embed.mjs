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

    // A figure whose steps have no question and no caption shows neither row.
    const plain = await page.evaluate(async () => {
      const holder = document.createElement('div')
      const definition = { id: 'plain', config: { duration: 1000 }, tracks: [{ id: 'x', target: 'dot', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 50 }] }] }
      holder.innerHTML = `<figure data-tinyfly-embed data-markers="0, 400, 900" data-labels='{"stepFormat":"Step {index} of {total}"}'><svg viewBox="0 0 100 20"><circle data-tinyfly="dot" cx="10" cy="10" r="5"/></svg><script type="application/json" data-tinyfly-timeline>${JSON.stringify(definition)}</script></figure>`
      document.body.prepend(holder)
      const [entry] = await window.__embed.mountAll(holder)
      entry.player.goToMarker('step-2')
      const bar = entry.controls.element
      return {
        question: getComputedStyle(bar.querySelector('.tf-ctl-question')).display,
        caption: getComputedStyle(bar.querySelector('.tf-ctl-caption')).display,
        step: bar.querySelector('.tf-ctl-step').textContent,
        markers: entry.player.markers.map((marker) => marker.time).join(','),
      }
    })
    results.push({
      label: 'embed: no question or caption row when steps have none; data-markers and stepFormat',
      ok: plain.question === 'none' && plain.caption === 'none' && plain.step === 'Step 2 of 3' && plain.markers === '0,400,900',
      detail: JSON.stringify(plain),
    })

    // Scenarios: the reader chooses which timeline plays, by option, slider or hotspot.
    await page.evaluate(async () => {
      const holder = document.createElement('div')
      holder.id = 'scenario-holder'
      const svg = '<svg viewBox="0 0 300 80" width="300" height="80"><rect data-tinyfly="box" x="10" y="10" width="60" height="60" style="fill: rgb(200, 200, 200)"/><text data-tinyfly="ms" x="100" y="45">idle</text><circle data-tinyfly-choose="down" cx="250" cy="40" r="20" fill="#333"/></svg>'
      const slow = { id: 'up', config: { duration: 600, markers: [{ id: 'go', time: 0 }, { id: 'done', time: 600 }] }, tracks: [
        { id: 'f', target: 'box', property: 'fill', keyframes: [{ time: 0, value: '#00ff00' }, { time: 600, value: '#00ff00' }] },
        { id: 't', target: 'ms', property: 'text', keyframes: [{ time: 0, value: '0 ms' }, { time: 600, value: '600 ms' }] } ] }
      const down = { id: 'down', config: { duration: 400, markers: [{ id: 'go', time: 0 }, { id: 'done', time: 400 }] }, tracks: [
        { id: 'x', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 40 }] } ] }
      const scripts = (a, b) => `<script type="application/json" data-tinyfly-timeline data-scenario="up" data-scenario-label="${a}">${JSON.stringify(slow)}</script><script type="application/json" data-tinyfly-timeline data-scenario="down" data-scenario-label="${b}">${JSON.stringify(down)}</script>`
      holder.innerHTML =
        `<figure id="pick" data-tinyfly-embed data-scenario-legend="Leader" data-options='{"initialFrame":"end"}'>${svg}${scripts('Healthy', 'Leader down')}</figure>` +
        `<figure id="scale" data-tinyfly-embed data-scenario-control="slider" data-scenario-legend="Servers">${svg.replace(/<circle[^>]*\/>/, '')}${scripts('1', '10')}</figure>`
      document.body.prepend(holder)
      window.__scenarioEmbeds = await window.__embed.mountAll(holder)
    })

    const radioSwitch = await page.evaluate(() => {
      const figure = document.getElementById('pick')
      const before = { fill: getComputedStyle(figure.querySelector('[data-tinyfly="box"]')).fill, text: figure.querySelector('[data-tinyfly="ms"]').textContent }
      return { before, legend: figure.querySelector('.tf-ctl-choices legend').textContent }
    })
    // A real click on the visible option label.
    await page.click('#pick .tf-ctl-choice:nth-of-type(2) span')
    const afterRadio = await page.evaluate(() => {
      const figure = document.getElementById('pick')
      const box = figure.querySelector('[data-tinyfly="box"]')
      return {
        scenario: window.__scenarioEmbeds[0].player.scenario,
        fill: getComputedStyle(box).fill,
        text: figure.querySelector('[data-tinyfly="ms"]').textContent,
        transform: box.style.transform,
        pressed: figure.querySelector('[data-tinyfly-choose]').getAttribute('aria-pressed'),
      }
    })
    results.push({
      label: 'embed scenarios: clicking an option switches, undoing the previous scenario’s paint and text',
      ok: radioSwitch.before.fill === 'rgb(0, 255, 0)' && radioSwitch.before.text === '600 ms' && afterRadio.scenario === 'down' &&
        afterRadio.fill === 'rgb(200, 200, 200)' && afterRadio.text === 'idle' && afterRadio.transform === 'translateX(40px)' && afterRadio.pressed === 'true',
      detail: JSON.stringify({ radioSwitch, afterRadio }),
    })

    // Keyboard: arrow keys move within the radio group, natively.
    await page.focus('#pick .tf-ctl-choice:nth-of-type(2) input')
    await page.keyboard.press('ArrowLeft')
    const arrowed = await page.evaluate(() => window.__scenarioEmbeds[0].player.scenario)
    results.push({ label: 'embed scenarios: arrow keys move through the options', ok: arrowed === 'up', detail: arrowed })

    // Hotspot: a real click on the SVG circle, then Enter from the keyboard.
    await page.click('#pick [data-tinyfly-choose]')
    const clicked = await page.evaluate(() => window.__scenarioEmbeds[0].player.scenario)
    await page.evaluate(() => window.__scenarioEmbeds[0].player.setScenario('up'))
    await page.focus('#pick [data-tinyfly-choose]')
    await page.keyboard.press('Enter')
    const entered = await page.evaluate(() => ({ scenario: window.__scenarioEmbeds[0].player.scenario, playing: window.__scenarioEmbeds[0].player.isPlaying }))
    results.push({
      label: 'embed scenarios: an SVG hotspot chooses by click and by Enter',
      ok: clicked === 'down' && entered.scenario === 'down',
      detail: JSON.stringify({ clicked, entered }),
    })

    // Slider: keyboard on a real range input.
    await page.focus('#scale .tf-ctl-choice-slider input')
    await page.keyboard.press('ArrowRight')
    const slid = await page.evaluate(() => ({
      scenario: window.__scenarioEmbeds[1].player.scenario,
      output: document.querySelector('#scale .tf-ctl-choice-slider output').textContent,
      valuetext: document.querySelector('#scale .tf-ctl-choice-slider input').getAttribute('aria-valuetext'),
    }))
    results.push({
      label: 'embed scenarios: the stepped slider chooses by keyboard and names the value',
      ok: slid.scenario === 'down' && slid.output === '10' && slid.valuetext === '10',
      detail: JSON.stringify(slid),
    })
    await page.evaluate(() => document.getElementById('scenario-holder').remove())

    // Full screen: native where the browser allows it, an overlay where it doesn't. Host CSS that
    // constrains figures (like a blog's max-width and a phone min-width) must not shrink the drawing.
    const fsFigure = async (id, removeApi) => page.evaluate(async ({ id, removeApi }) => {
      if (removeApi) { Element.prototype.requestFullscreen = undefined; Element.prototype.webkitRequestFullscreen = undefined }
      const holder = document.createElement('div')
      holder.id = `${id}-holder`
      const definition = { id: 'fs', config: { duration: 400 }, tracks: [{ id: 'x', target: 'dot', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 50 }] }] }
      holder.innerHTML = `<style>.host-fig{max-width:30rem;margin:2em auto}.host-fig svg{display:block;width:100%;min-width:640px}</style>` +
        `<figure id="${id}" class="host-fig" data-tinyfly-embed data-fullscreen="true"><svg viewBox="0 0 720 360"><circle data-tinyfly="dot" cx="20" cy="20" r="10"/></svg><script type="application/json" data-tinyfly-timeline>${JSON.stringify(definition)}</script></figure>`
      document.body.prepend(holder)
      await window.__embed.mountAll(holder)
    }, { id, removeApi })
    const fsState = (id) => page.evaluate((id) => {
      const fig = document.getElementById(id)
      const svg = fig.querySelector('svg').getBoundingClientRect()
      const box = fig.getBoundingClientRect()
      return { native: document.fullscreenElement === fig, overlay: fig.classList.contains('tf-fullscreen-overlay'), active: fig.classList.contains('tf-fullscreen'),
        figW: Math.round(box.width), figH: Math.round(box.height), svgW: Math.round(svg.width), svgH: Math.round(svg.height),
        vw: window.innerWidth, vh: window.innerHeight, pressed: fig.querySelector('.tf-ctl-fullscreen').getAttribute('aria-pressed') }
    }, id)

    await fsFigure('fs-native', false)
    const before = await fsState('fs-native')
    await page.click('#fs-native .tf-ctl-fullscreen')
    await page.waitForTimeout(600)
    const during = await fsState('fs-native')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    if ((await fsState('fs-native')).active) { await page.click('#fs-native .tf-ctl-fullscreen'); await page.waitForTimeout(400) }
    const after = await fsState('fs-native')
    const fills = (s) => s.active && s.figW >= s.vw - 2 && s.figH >= s.vh - 2 && s.svgW > before.svgW
    results.push({
      label: 'embed fullscreen: the button fills the screen (native or overlay) over host figure CSS, and Esc or the button leaves it',
      ok: !before.active && fills(during) && during.pressed === 'true' && !after.active && !after.native,
      detail: JSON.stringify({ before, during, after }),
    })
    await page.evaluate(() => document.getElementById('fs-native-holder').remove())

    await fsFigure('fs-overlay', true)
    await page.click('#fs-overlay .tf-ctl-fullscreen')
    await page.waitForTimeout(300)
    const overlay = await fsState('fs-overlay')
    const scrollLocked = await page.evaluate(() => document.documentElement.style.overflow)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const overlayAfter = await fsState('fs-overlay')
    results.push({
      label: 'embed fullscreen: without the Fullscreen API (iPhone) an overlay covers the viewport and locks scrolling; Esc restores',
      ok: overlay.overlay && !overlay.native && overlay.figW >= overlay.vw - 2 && overlay.figH >= overlay.vh - 2 && overlay.svgW >= Math.min(overlay.vw - 40, 640 * 0.5) && scrollLocked === 'hidden' && !overlayAfter.active,
      detail: JSON.stringify({ overlay, scrollLocked, overlayAfter }),
    })

    results.push({ label: 'embed: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
