/**
 * The editor: add elements, play in each renderer, and persistence — a project
 * saved to IndexedDB must survive a reload (the path where a DataCloneError bug
 * once silently lost work).
 */
export default {
  name: 'editor',
  async run({ page, context, base }) {
    await context.addInitScript(() => localStorage.setItem('tinyfly-onboarding', JSON.stringify({ completed: true, currentStep: 0, dismissed: true })))
    await page.goto(`${base}/studio`)
    await page.waitForSelector('.toolbar-btn-myfiles', { timeout: 30000 })
    await page.waitForTimeout(500)
    const results = []

    await page.locator('.toolbar-btn', { hasText: 'New' }).first().click()
    await page.waitForTimeout(300)
    const discard = page.locator('button', { hasText: /Discard|Don.t save/ })
    if (await discard.count()) await discard.first().click()

    await page.locator('.element-type-btn[title="Add Rectangle"]').click()
    await page.locator('.element-type-btn[title="Add Text"]').click()
    const contentInput = page.locator('.property-row', { has: page.locator('label', { hasText: /^Content$/ }) }).locator('input').first()
    await contentInput.click()
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a')
    // Slower than the Content field's 150ms debounce, so each keystroke reaches the
    // store while typing — which used to rebuild the field and drop focus (issue #1).
    await page.keyboard.type('Persisted', { delay: 200 })
    const stillFocused = await contentInput.evaluate((el) => el === document.activeElement)
    const typed = await contentInput.inputValue()
    results.push({ label: 'typing into Content keeps focus across store updates', ok: stillFocused && typed === 'Persisted', detail: `focused: ${stillFocused}, value: ${JSON.stringify(typed)}` })
    await page.locator('.preview-panel').click({ position: { x: 5, y: 5 } })
    await page.waitForTimeout(300)
    const elements = await page.locator('.preview-panel [data-element-type]').count()
    results.push({ label: 'adding elements and typing content', ok: elements >= 2 && (await page.locator('.preview-panel [data-element-type="text"]').first().innerText()) === 'Persisted' })

    // Play in each renderer.
    const renderer = page.locator('.preview-panel select').first()
    const rendered = []
    for (const name of ['canvas', 'svg', 'dom']) {
      await renderer.selectOption(name)
      await page.waitForTimeout(300)
      await page.locator('.play-btn').first().click()
      await page.waitForTimeout(400)
      await page.locator('.play-btn').first().click()
      rendered.push(name)
    }
    results.push({ label: 'switching and playing DOM, Canvas and SVG renderers', ok: rendered.length === 3 })

    // On-stage editing in the Canvas and SVG previews: a transparent hit layer over the drawing
    // carries the DOM preview's handlers, so a click selects and a drag moves the element.
    for (const name of ['canvas', 'svg']) {
      await renderer.selectOption(name)
      await page.waitForTimeout(400)
      const hit = page.locator('.preview-hit-layer [data-element-type="rect"]').first()
      const box = await hit.boundingBox()
      if (!box) {
        results.push({ label: `${name}: hit layer over the drawing`, ok: false, detail: 'no hit box for the rectangle' })
        continue
      }
      const before = await hit.evaluate((el) => `${el.style.left} ${el.style.top}`)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 10, { steps: 6 })
      await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20, { steps: 6 })
      await page.mouse.up()
      await page.waitForTimeout(300)
      const after = await hit.evaluate((el) => `${el.style.left} ${el.style.top}`)
      const selected = await hit.evaluate((el) => el.classList.contains('selected'))
      const handles = await page.locator('.preview-hit-layer .resize-handle').count()
      results.push({ label: `${name}: click selects and drag moves on stage`, ok: selected && handles >= 8 && before !== after, detail: `selected=${selected} handles=${handles} ${before} -> ${after}` })
    }
    await renderer.selectOption('dom')
    await page.waitForTimeout(300)

    // Persistence across reload.
    await page.locator('.toolbar-btn', { hasText: 'Save' }).first().click().catch(() => {})
    await page.waitForTimeout(1500)
    await page.reload()
    await page.waitForSelector('.toolbar-btn-myfiles', { timeout: 30000 })
    await page.waitForTimeout(1000)
    const texts = await page.locator('.preview-panel [data-element-type="text"]').allInnerTexts()
    results.push({ label: 'project persists across a reload (IndexedDB)', ok: texts.includes('Persisted'), detail: `text elements after reload: ${JSON.stringify(texts)}` })
    return results
  },
}
