export default {
  name: 'organic-characters',
  async run({ page, context, base }) {
    const results = []
    for (const width of [1280, 390]) for (const mode of ['demo', 'standalone']) {
      await page.setViewportSize({ width, height: 980 })
      await page.goto(`${base}/e2e/harness.html`)
      await page.evaluate(async mode => {
        const { html, run } = await import('/src/examples/live-demos/organic-characters.js')
        const { extractCode } = await import('/src/examples/live-demos/index.ts')
        const tinyfly = { ...await import('/src/characters/index.ts'), ...await import('/src/engine/index.ts') }
        const root = document.getElementById('root'); root.innerHTML = html
        const live = { to: clock => { window.organicClock = clock; return { kill() {} } }, ticker: { add: draw => { window.organicDraw = draw }, remove() {} } }
        window.organicCleanup = mode === 'demo' ? run(live, root) : new Function('tinyfly', 'live', 'root', extractCode(run.toString()))(tinyfly, live, root)
      }, mode)
      const prefix = `${mode} at ${width}px`
      const hash = side => page.evaluate(side => {
        const area = side === 'left' ? [0, 75, 480, 410] : side === 'right' ? [480, 75, 480, 410] : [0, 0, 960, 900]
        const pixels = document.querySelector('.oc-canvas').getContext('2d').getImageData(...area).data
        let result = 2166136261
        for (const value of pixels) result = Math.imul(result ^ value, 16777619)
        return result >>> 0
      }, side)
      const fit = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.oc-controls select, .oc-controls input')].every(node => {
        const bounds = node.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth
      }))
      results.push({ label: `${prefix}: controls and canvas fit`, ok: fit })
      await page.uncheck('.oc-play')
      await page.locator('.oc-time').evaluate(node => { node.value = '3300'; node.dispatchEvent(new Event('input')) })
      const actions = new Set()
      for (const action of ['story', 'walk', 'turn', 'gesture', 'sit', 'cheek', 'crossed']) {
        await page.selectOption('.oc-action', action); actions.add(await hash())
      }
      results.push({ label: `${prefix}: seven distinct actions render`, ok: actions.size === 7 })
      const adult = await hash()
      await page.selectOption('.oc-actors', 'children')
      const child = await hash()
      await page.selectOption('.oc-actors', 'family')
      results.push({ label: `${prefix}: adults, children and family pairs render`, ok: new Set([adult, child, await hash()]).size === 3 })
      await page.selectOption('.oc-actors', 'children')
      const childActions = new Set()
      for (const action of ['story', 'walk', 'turn', 'gesture', 'sit', 'cheek', 'crossed']) {
        await page.selectOption('.oc-action', action); childActions.add(await hash())
      }
      results.push({ label: `${prefix}: children use all seven actions`, ok: childActions.size === 7 })
      const categories = new Set()
      for (const category of ['everyday', 'formal', 'casual']) { await page.selectOption('.oc-clothes', category); categories.add(await hash()) }
      results.push({ label: `${prefix}: everyday, formal and casual render distinctly`, ok: categories.size === 3 })
      await page.selectOption('.oc-clothes', 'formal')
      await page.selectOption('.oc-outfit-target', '1')
      const leftBefore = await hash('left'), rightBefore = await hash('right')
      await page.selectOption('.oc-top', 'dress')
      results.push({ label: `${prefix}: editing the right outfit leaves the left actor unchanged`, ok: leftBefore === await hash('left') && rightBefore !== await hash('right') })
      results.push({ label: `${prefix}: dress uses its top colour and disables separate bottoms`, ok: await page.locator('.oc-bottom').isDisabled() && await page.locator('.oc-bottom-color').isDisabled() })
      const colourBefore = await hash('right')
      await page.locator('.oc-top-color').evaluate(node => { node.value = '#b84e80'; node.dispatchEvent(new Event('input')) })
      results.push({ label: `${prefix}: garment colour redraws the selected actor`, ok: colourBefore !== await hash('right') && leftBefore === await hash('left') })
      await page.selectOption('.oc-outfit-target', '0')
      const styles = new Set()
      for (const value of ['plain', 'jeans', 'cargo']) { await page.selectOption('.oc-trouser-style', value); styles.add(await hash('left')) }
      results.push({ label: `${prefix}: plain trousers, jeans and cargo have visible details`, ok: styles.size === 3 })
      const accessories = await hash('left')
      await page.uncheck('.oc-tie')
      const untied = await hash('left')
      await page.check('.oc-tie')
      await page.locator('.oc-tie-color').evaluate(node => { node.value = '#166d53'; node.dispatchEvent(new Event('input')) })
      results.push({ label: `${prefix}: tie toggles and its colour redraw`, ok: accessories !== untied && untied !== await hash('left') && accessories !== await hash('left') })
      await page.selectOption('.oc-outfit-target', 'both')
      await page.selectOption('.oc-clothes', 'everyday')
      const before = await hash()
      await page.selectOption('.oc-clothes', 'leaves')
      results.push({ label: `${prefix}: leaf clothing redraws the actors`, ok: before !== await hash() })
      const faces = new Set(), hairs = new Set()
      for (const value of ['expressive', 'soft', 'simple']) { await page.selectOption('.oc-face', value); faces.add(await hash()) }
      for (const value of ['softSweep', 'flowingBob', 'cascadingWaves']) { await page.selectOption('.oc-hair', value); hairs.add(await hash()) }
      results.push({ label: `${prefix}: three faces and three flowing hairstyles`, ok: faces.size === 3 && hairs.size === 3 })
      const material = await hash()
      await page.uncheck('.oc-shade')
      results.push({ label: `${prefix}: cel shading switches to flat fill`, ok: material !== await hash() })
      const skin = await hash()
      await page.locator('.oc-skin').evaluate(node => { node.value = '#a87350'; node.dispatchEvent(new Event('input')) })
      results.push({ label: `${prefix}: shared skin changes the characters`, ok: skin !== await hash() })
      const outline = await hash()
      await page.locator('.oc-outline').evaluate(node => { node.value = '4'; node.dispatchEvent(new Event('input')) })
      results.push({ label: `${prefix}: outline control redraws`, ok: outline !== await hash() })
      await page.selectOption('.oc-action', 'story'); await page.check('.oc-play')
      const start = await hash()
      await page.evaluate(() => { window.organicClock.time = 6000; window.organicDraw() })
      results.push({ label: `${prefix}: timeline playback changes the rendered story`, ok: start !== await hash() })
      if (mode === 'demo') {
        const beforeCleanup = await hash()
        await page.evaluate(() => window.organicCleanup())
        await page.selectOption('.oc-face', 'expressive')
        results.push({ label: `${prefix}: cleanup removes control listeners`, ok: beforeCleanup === await hash() })
      }
    }
    await page.goto(`${base}/examples/live-organic-characters`)
    await page.locator('.oc-canvas').waitFor({ state: 'visible' })
    results.push({ label: 'example route is accessible', ok: await page.locator('.oc-canvas').count() === 1 })
    await page.goto(`${base}/examples/live-organic-characters/full`)
    await page.frameLocator('.full-example-frame').locator('.oc-canvas').waitFor({ state: 'visible' })
    results.push({ label: 'local full-page preview uses current APIs', ok: await page.frameLocator('.full-example-frame').locator('.oc-action').inputValue() === 'story' })
    await page.setViewportSize({ width: 1280, height: 980 })
    await context.addInitScript(() => localStorage.setItem('tinyfly-onboarding', JSON.stringify({ completed: true, currentStep: 0, dismissed: true })))
    await page.goto(`${base}/studio`)
    await page.locator('.element-type-btn[title="Add Character"]').click()
    const row = label => page.locator('.property-row', { has: page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
    await row('Figure').locator('select').selectOption('organic')
    const height = Number(await row('Height').locator('input').first().inputValue())
    const width = Number(await row('Line width').locator('input').inputValue())
    results.push({ label: 'editor: Organic shows the rendered hands, face, iris and outline defaults', ok:
      await row('Hands').locator('select').inputValue() === 'natural' &&
      await row('Face style').locator('select').inputValue() === 'anime' &&
      await row('Iris colour').locator('input').inputValue() === '#66422e' && Math.abs(width - height * .005) < 1e-6 })
    await row('Line width').locator('input').fill(String(width + .1))
    await row('Line width').locator('input').press('Tab')
    results.push({ label: 'editor: changing the Organic outline advances from its actual width', ok: Math.abs(Number(await row('Line width').locator('input').inputValue()) - width - .1) < 1e-6 })
    await row('Hands').locator('select').selectOption('dot')
    await row('Face style').locator('select').selectOption('simple')
    await row('Figure').locator('select').selectOption('fluid')
    await row('Figure').locator('select').selectOption('organic')
    results.push({ label: 'editor: figure changes preserve explicit appearance choices', ok: await row('Hands').locator('select').inputValue() === 'dot' && await row('Face style').locator('select').inputValue() === 'simple' })
    await page.goto(`${base}/e2e/harness.html`)
    await page.evaluate(async () => {
      const { render } = await import('/node_modules/solid-js/web/dist/web.js')
      const { PropertyPanel } = await import('/src/editor/components/property-panel.tsx')
      const { createSceneStore } = await import('/src/editor/stores/scene-store.ts')
      const { createEditorStore } = await import('/src/editor/stores/editor-store.ts')
      const { createProjectStore } = await import('/src/editor/stores/project-store.ts')
      const { characterOf } = await import('/src/editor/utils/character-element.ts')
      const { drawCharacter, humanPose } = await import('/src/characters/index.ts')
      const sceneStore = createSceneStore()
      sceneStore.addElement('character', { figure: 'organic', height: 250, skin: '#ffffff', ink: '#000000', outfit: 'none', body: { fill: '#a86443', outline: { color: '#543210', width: 1 }, depth: .6, shading: { mode: 'none' } } })
      const imported = JSON.parse(JSON.stringify(sceneStore.exportElements()))
      sceneStore.loadElements(imported)
      sceneStore.selectElement(imported[0].id)
      const store = createEditorStore()
      store.createNewTimeline('colour-overrides')
      window.organicImported = imported
      window.organicImportedBefore = JSON.stringify(imported)
      window.organicSceneStore = sceneStore
      window.organicColourSnapshot = () => {
        const element = sceneStore.exportElements()[0], who = characterOf(element)
        const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 400
        const ctx = canvas.getContext('2d'); ctx.translate(200, 350)
        drawCharacter(ctx, who, humanPose())
        return { element: JSON.parse(JSON.stringify(element)), skin: who.skin, ink: who.ink, image: canvas.toDataURL() }
      }
      render(() => PropertyPanel({ store, sceneStore, projectStore: createProjectStore() }), document.getElementById('root'))
    })
    results.push({ label: 'editor: imported Skin and Line controls display the rendered body overrides', ok:
      await row('Skin').locator('input').inputValue() === '#a86443' && await row('Line').locator('input').inputValue() === '#543210' &&
      await page.evaluate(() => JSON.stringify(window.organicImported) === window.organicImportedBefore) })
    const importedBefore = await page.evaluate(() => window.organicColourSnapshot())
    await row('Skin').locator('input').evaluate(node => { node.value = '#fedcba'; node.dispatchEvent(new Event('input', { bubbles: true })) })
    const skinEdited = await page.evaluate(() => window.organicColourSnapshot())
    await row('Line').locator('input').evaluate(node => { node.value = '#123456'; node.dispatchEvent(new Event('input', { bubbles: true })) })
    const coloursEdited = await page.evaluate(() => window.organicColourSnapshot())
    results.push({ label: 'editor: colour edits update active body overrides, redraw and preserve imported JSON', ok:
      skinEdited.skin === '#fedcba' && skinEdited.element.skin === '#fedcba' && skinEdited.element.body.fill === '#fedcba' && skinEdited.image !== importedBefore.image &&
      coloursEdited.ink === '#123456' && coloursEdited.element.ink === '#123456' && coloursEdited.element.body.outline.color === '#123456' && coloursEdited.image !== skinEdited.image &&
      coloursEdited.element.body.depth === .6 && coloursEdited.element.body.shading.mode === 'none' && coloursEdited.element.body.outline.width === 1 &&
      await page.evaluate(() => JSON.stringify(window.organicImported) === window.organicImportedBefore) })
    await page.evaluate(() => {
      const saved = JSON.parse(JSON.stringify(window.organicSceneStore.exportElements()))
      window.organicSceneStore.loadElements(saved)
      window.organicSceneStore.selectElement(saved[0].id)
    })
    const restored = await page.evaluate(() => window.organicColourSnapshot())
    results.push({ label: 'editor: edited body colours survive saved JSON and display correctly after reimport', ok:
      restored.image === coloursEdited.image && JSON.stringify(restored.element) === JSON.stringify(coloursEdited.element) &&
      await row('Skin').locator('input').inputValue() === '#fedcba' && await row('Line').locator('input').inputValue() === '#123456' })
    return results
  },
}
