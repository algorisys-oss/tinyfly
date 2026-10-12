export default {
  name: 'flowing-hair',
  async run({ page, base }) {
    const results = []
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const mode of ['demo', 'standalone']) {
        await page.goto(`${base}/e2e/harness.html`)
        await page.evaluate(async mode => {
          const { html, run } = await import('/src/examples/live-demos/flowing-hair.js')
          const { extractCode } = await import('/src/examples/live-demos/index.ts')
          const tinyfly = { ...await import('/src/characters/index.ts'), ...await import('/src/engine/index.ts') }
          const root = document.getElementById('root')
          root.innerHTML = html
          const live = { to: clock => { window.hairClock = clock; return { kill() {} } }, ticker: { add: draw => { window.hairDraw = draw }, remove() {} } }
          window.hairCleanup = mode === 'demo' ? run(live, root) : new Function('tinyfly', 'live', 'root', extractCode(run.toString()))(tinyfly, live, root)
        }, mode)
        const prefix = `${mode} at ${width}px`
        const hash = () => page.evaluate(() => {
          const ctx = document.querySelector('.fh-canvas').getContext('2d')
          const fingerprint = (y, height) => {
            const pixels = ctx.getImageData(0, y, 960, height).data
            let hash = 2166136261
            for (const value of pixels) hash = Math.imul(hash ^ value, 16777619)
            return hash >>> 0
          }
          return [fingerprint(80, 250), fingerprint(394, 175)]
        })
        const controlsFit = await page.evaluate(() => {
          const selects = [...document.querySelectorAll('select')]
          return selects[0].className === 'fh-face' && selects[1].className === 'fh-style'
            && [...document.querySelectorAll('.fh-controls select, .fh-controls input')].every(node => {
              const bounds = node.getBoundingClientRect()
              return bounds.left >= 0 && bounds.right <= innerWidth
            }) && document.documentElement.scrollWidth <= innerWidth
        })
        results.push({ label: `${prefix}: Face type before Hairstyle; controls fit`, ok: controlsFit })
        await page.selectOption('.fh-style', 'softSweep')
        const animatedFaces = new Set(), restingFaces = new Set()
        for (const face of ['simpleRound', 'expressiveRound', 'softAngular', 'broadJaw', 'olderExpressive']) {
          await page.selectOption('.fh-face', face)
          const [animated, resting] = await hash()
          animatedFaces.add(animated); restingFaces.add(resting)
        }
        results.push({ label: `${prefix}: five distinct faces in animated and resting views`, ok: animatedFaces.size === 5 && restingFaces.size === 5 })
        const hairstyles = new Set()
        for (const hair of ['softSweep', 'flowingBob', 'cascadingWaves']) {
          await page.selectOption('.fh-style', hair)
          hairstyles.add((await hash())[1])
          const selected = await page.evaluate(() => {
            const face = document.querySelector('.fh-face'), hair = document.querySelector('.fh-style')
            return document.querySelector('.fh-readout').textContent.includes(`${face.options[face.selectedIndex].textContent} · ${hair.options[hair.selectedIndex].textContent}`)
          })
          results.push({ label: `${prefix}: selected ${hair} combination is named`, ok: selected })
        }
        results.push({ label: `${prefix}: three distinct resting hairstyles`, ok: hairstyles.size === 3 })
        const looks = new Set()
        for (const look of ['clean', 'pencil', 'silhouette']) {
          await page.selectOption('.fh-look', look)
          looks.add((await hash())[0])
        }
        results.push({ label: `${prefix}: clean, pencil and silhouette controls redraw`, ok: looks.size === 3 })
        await page.selectOption('.fh-look', 'clean')
        const beforeColor = await hash()
        await page.locator('.fh-color').evaluate(node => { node.value = '#123456'; node.dispatchEvent(new Event('input')) })
        results.push({ label: `${prefix}: colour changes both rows`, ok: (await hash()).every((value, i) => value !== beforeColor[i]) })
        await page.evaluate(() => { window.hairClock.time = 1200; window.hairDraw() })
        const following = await hash()
        await page.uncheck('.fh-motion')
        const held = await hash()
        results.push({ label: `${prefix}: follow-through changes animation only`, ok: following[0] !== held[0] && following[1] === held[1] })
        await page.check('.fh-turn')
        results.push({ label: `${prefix}: full-turn control redraws animation`, ok: (await hash())[0] !== held[0] })
        if (mode === 'demo') {
          const before = await page.textContent('.fh-readout')
          await page.evaluate(() => window.hairCleanup())
          await page.selectOption('.fh-face', 'simpleRound')
          results.push({ label: `${prefix}: cleanup removes control listeners`, ok: await page.textContent('.fh-readout') === before })
        }
      }
    }
    return results
  },
}
