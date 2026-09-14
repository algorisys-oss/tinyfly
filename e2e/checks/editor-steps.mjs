/**
 * Steps (markers) and captions in the studio, done through the UI: add steps with
 * M and the + button, edit one in the Properties panel (label, id, question,
 * captions), drag a flag, step with ] and [, undo, and require Copy JSON to carry
 * it all — the JSON a teaching embed plays.
 */
export default {
  name: 'editor-steps',
  async run({ page, context, base }) {
    const results = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await context.addInitScript(() => {
      localStorage.setItem('tinyfly-onboarding', JSON.stringify({ completed: true, currentStep: 0, dismissed: true }))
      const clipboard = { writeText: async (text) => void (window.__copied = text), readText: async () => window.__copied ?? '' }
      Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => clipboard })
    })

    const copyJson = async () => {
      await page.locator('.toolbar-btn', { hasText: 'More' }).first().click()
      await page.locator('.toolbar-more-item', { hasText: 'Copy JSON' }).click()
      await page.waitForTimeout(900)
      return JSON.parse(await page.evaluate(() => window.__copied))
    }
    const row = (label) => page.locator('.marker-inspector .property-row', { has: page.locator('label', { hasText: new RegExp(`^${label}`) }) })

    await page.goto(`${base}/studio`)
    await page.waitForSelector('.toolbar-btn-myfiles', { timeout: 30000 })
    await page.waitForTimeout(3500)
    await page.locator('.toolbar-btn', { hasText: 'New' }).first().click()
    await page.waitForTimeout(300)
    const discard = page.locator('button', { hasText: /Discard|Don.t save/ })
    if (await discard.count()) await discard.first().click()
    await page.waitForTimeout(300)

    // M adds a step at the playhead (0); the + button adds another after seeking.
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('m')
    await page.waitForSelector('.step-flag')
    await page.evaluate(() => {
      const slider = document.querySelector('.seek-slider')
      slider.value = '1500'
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.locator('.steps-add').click()
    const flags = await page.locator('.step-flag').count()
    const inspector = await page.locator('.marker-inspector h4').first().innerText()
    results.push({ label: 'editor-steps: M and + add steps, and the new step opens in Properties', ok: flags === 2 && /Step 2 of 2/i.test(inspector), detail: `${flags} flags · ${inspector}` })

    // Edit the second step in the inspector.
    await row('Label').locator('input').fill('cap is full')
    await row('Label').locator('input').press('Enter')
    await row('Id').locator('input').fill('Cap Full')
    await row('Id').locator('input').press('Enter')
    await page.locator('#marker-question').fill('What happens on the next append?')
    await page.locator('#marker-question').blur()
    await page.locator('.marker-add-language input').fill('es')
    await page.locator('.marker-add-language button').click()
    await page.locator('.marker-caption textarea').fill('la capacidad está llena')
    await page.locator('.marker-caption textarea').blur()
    await page.waitForTimeout(200)
    let json = await copyJson()
    const second = json.config.markers?.[1]
    results.push({
      label: 'editor-steps: label, id, question (which pauses) and a caption export in the JSON',
      ok: second?.id === 'cap-full' && second.label === 'cap is full' && second.pause === true && /next append/.test(second.question ?? '') && json.captions?.es?.['cap-full'] === 'la capacidad está llena',
      detail: JSON.stringify({ markers: json.config.markers, captions: json.captions }),
    })

    // Drag the first flag right, then undo the drag in one step.
    const firstFlag = page.locator('.step-flag').first()
    const box = await firstFlag.boundingBox()
    await page.mouse.move(box.x + 1, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 4 })
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 4 })
    await page.mouse.up()
    json = await copyJson()
    const dragged = json.config.markers?.[0]?.time
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(200)
    json = await copyJson()
    const undone = json.config.markers?.[0]?.time
    results.push({ label: 'editor-steps: dragging a flag retimes it, and one undo puts it back', ok: dragged > 100 && undone === 0, detail: `dragged to ${dragged}ms, undone to ${undone}ms` })

    // ] and [ move the playhead between steps.
    await page.keyboard.press(']')
    const atNext = await page.locator('.current-time').innerText()
    await page.keyboard.press('[')
    const atPrev = await page.locator('.current-time').innerText()
    results.push({ label: 'editor-steps: ] and [ step the playhead between steps', ok: atNext === '1.500' && atPrev === '0.000', detail: `] → ${atNext}, [ → ${atPrev}` })

    // Delete removes the selected step and its captions.
    await page.locator('.step-flag').nth(1).click()
    await page.keyboard.press('Delete')
    json = await copyJson()
    results.push({ label: 'editor-steps: Delete removes the selected step and its captions', ok: json.config.markers?.length === 1 && !json.captions?.es?.['cap-full'], detail: JSON.stringify({ markers: json.config.markers, captions: json.captions }) })

    results.push({ label: 'editor-steps: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
