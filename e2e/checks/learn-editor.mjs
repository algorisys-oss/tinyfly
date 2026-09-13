/**
 * The editor module, done for real: follow each step's instructions in the studio,
 * use More → Copy JSON, paste the JSON into the step, and require every check to
 * pass. This proves the written instructions match the UI and the checks accept
 * what the studio actually exports.
 */
export default {
  name: 'learn-editor',
  async run({ page, context, base }) {
    const results = []
    // Capture what Copy JSON puts on the clipboard, in any browser, without permissions.
    await context.addInitScript(() => {
      localStorage.setItem('tinyfly-onboarding', JSON.stringify({ completed: true, currentStep: 0, dismissed: true }))
      const clipboard = { writeText: async (text) => void (window.__copied = text), readText: async () => window.__copied ?? '' }
      Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => clipboard })
    })

    const row = (label) => page.locator('.property-row', { has: page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
    const newProject = async () => {
      await page.locator('.toolbar-btn', { hasText: 'New' }).first().click()
      await page.waitForTimeout(300)
      const discard = page.locator('button', { hasText: /Discard|Don.t save/ })
      if (await discard.count()) await discard.first().click()
      await page.waitForTimeout(300)
    }
    const addRectangle = async () => {
      await page.locator('.element-type-btn[title="Add Rectangle"]').click()
      await page.waitForTimeout(300)
      return (await page.locator('.element-item .element-name').first().innerText()).trim()
    }
    const copyJson = async () => {
      await page.locator('.toolbar-btn', { hasText: 'More' }).first().click()
      await page.locator('.toolbar-more-item', { hasText: 'Copy JSON' }).click()
      await page.waitForTimeout(1100)
      return page.evaluate(() => window.__copied)
    }
    const addTrack = async (target, property) => {
      await page.locator('.track-panel .add-btn').click()
      await page.fill('input[placeholder="Target (e.g., box)"]', target)
      await page.fill('input[placeholder="Property (e.g., opacity)"]', property)
      await page.locator('.add-track-form .confirm-btn', { hasText: 'Add Track' }).click()
      await page.waitForTimeout(300)
    }
    // New tracks add two keyframes each, listed in track order.
    const selectKeyframe = async (trackIndex, which) => {
      await page.locator('.keyframe').nth(trackIndex * 2 + (which === 'end' ? 1 : 0)).click()
      await page.waitForTimeout(200)
    }

    await page.goto(`${base}/studio`)
    await page.waitForSelector('.toolbar-btn-myfiles', { timeout: 30000 })
    await page.waitForTimeout(3500) // the splash

    await newProject()
    const name = await addRectangle()
    await addTrack(name, 'x')
    await selectKeyframe(0, 'end')
    await row('Value').locator('input').fill('200')
    const firstTrack = await copyJson()
    await row('Easing').locator('select').selectOption('ease-out')
    const eased = await copyJson()
    await addTrack(name, 'opacity')
    await selectKeyframe(1, 'start')
    await row('Value').locator('input').fill('0')
    await selectKeyframe(1, 'end')
    await row('Value').locator('input').fill('1')
    const faded = await copyJson()

    await newProject()
    await addRectangle()
    await page.locator('.element-item').first().click()
    await page.locator('.preset-item', { hasText: 'Fade In Up' }).first().click()
    await page.waitForTimeout(400)
    const preset = await copyJson()

    for (const [step, json] of [
      ['build-visually/first-track', firstTrack],
      ['build-visually/ease-keyframe', eased],
      ['build-visually/fade-track', faded],
      ['same-data/preset', preset],
    ]) {
      await page.goto(`${base}/learn/editor/${step}`)
      await page.waitForSelector('.learn-step textarea', { timeout: 30000 })
      await page.fill('.learn-step textarea', `play(${json})`)
      const passed = await page
        .waitForFunction(() => {
          const checks = [...document.querySelectorAll('.learn-checks li')]
          return checks.length > 0 && checks.every((li) => li.classList.contains('passed'))
        }, null, { timeout: 5000 })
        .then(() => true, () => false)
      const failing = passed ? [] : await page.locator('.learn-checks li:not(.passed)').allInnerTexts()
      results.push({ label: `learn-editor: ${step} passes with JSON copied from the studio`, ok: passed, detail: failing.join(' | ').slice(0, 160) })
    }
    return results
  },
}
