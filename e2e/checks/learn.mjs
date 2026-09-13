/**
 * The course at /learn: every step opens, its solution passes all checks in this
 * browser, progress is remembered, and a phone-width step fits the screen.
 */
export default {
  name: 'learn',
  async run({ page, base }) {
    const results = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(`${base}/learn`)
    await page.waitForSelector('.learn-intro', { timeout: 30000 })
    await page.evaluate(() => localStorage.removeItem('tinyfly-learn-completed'))
    const firstStep = await page.locator('.learn-lesson').first().getAttribute('href')

    const failing = []
    let steps = 0
    await page.goto(`${base}${firstStep}`)
    for (;;) {
      await page.waitForSelector('.learn-step textarea', { timeout: 30000 })
      steps++
      await page.getByRole('button', { name: 'Show solution' }).click()
      const passed = await page
        .waitForFunction(() => {
          const checks = [...document.querySelectorAll('.learn-checks li')]
          return checks.length > 0 && checks.every((li) => li.classList.contains('passed'))
        }, null, { timeout: 5000 })
        .then(() => true, () => false)
      if (!passed) failing.push(new URL(page.url()).pathname)
      const next = page.getByRole('button', { name: /Next step|Skip/ })
      if ((await next.count()) === 0) break
      await next.click()
      await page.waitForTimeout(150)
    }
    results.push({ label: `learn: every step's solution passes its checks (${steps} steps)`, ok: failing.length === 0 && steps > 5, detail: failing.join(', ') })

    await page.goto(`${base}/learn`)
    await page.waitForSelector('.learn-dots')
    const dots = await page.evaluate(() => ({ done: document.querySelectorAll('.learn-dots i.done').length, total: document.querySelectorAll('.learn-dots i').length }))
    results.push({ label: 'learn: progress is remembered on the course map', ok: dots.total > 0 && dots.done === dots.total, detail: `${dots.done}/${dots.total}` })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${base}${firstStep}`)
    await page.waitForSelector('.learn-step textarea')
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    await page.setViewportSize({ width: 1280, height: 800 })
    results.push({ label: 'learn: a step fits a phone-width screen', ok: width <= 390, detail: `${width}px` })

    results.push({ label: 'learn: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
