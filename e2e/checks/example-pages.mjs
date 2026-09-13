/**
 * Each example on its own page (`/examples/<id>`): live, timeline and editable
 * examples open directly, play without hovering, link to related examples, and
 * the grid's titles link to them.
 */
export default {
  name: 'example-pages',
  async run({ page, base }) {
    const results = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    const snapshot = (selector) => page.evaluate((sel) => document.querySelector(sel)?.innerHTML ?? '', selector)

    for (const [id, stage] of [
      ['live-stagger-grid', '.live-demo-stage'],
      ['scroll-reveal', '.preview-container'],
    ]) {
      await page.goto(`${base}/examples/${id}`)
      await page.waitForSelector(`.example-single ${stage}`, { timeout: 30000 })
      await page.waitForTimeout(300)
      const before = await snapshot(`.example-single ${stage}`)
      await page.mouse.move(2, 2) // not hovering the card
      await page.waitForTimeout(900)
      const after = await snapshot(`.example-single ${stage}`)
      const related = await page.locator('.example-related li').count()
      const title = await page.title()
      results.push({
        label: `example page: ${id} opens directly, plays without hover, lists related examples`,
        ok: before !== after && related > 0 && title.includes('tinyfly examples'),
        detail: `related ${related}, title "${title}"`,
      })
    }

    await page.goto(`${base}/examples`)
    await page.waitForSelector('.example-title-link', { timeout: 30000 })
    const href = await page.locator('.example-title-link').first().getAttribute('href')
    await page.locator('.example-title-link').first().click()
    await page.waitForSelector('.example-single .example-card', { timeout: 30000 })
    results.push({ label: 'example page: grid titles link to each example', ok: new URL(page.url()).pathname === href, detail: href })

    await page.goto(`${base}/examples/does-not-exist`)
    await page.waitForSelector('.example-single', { timeout: 30000 })
    results.push({ label: 'example page: an unknown id says so', ok: (await page.textContent('.example-single')).includes('No example called') })

    results.push({ label: 'example page: no page errors', ok: errors.length === 0, detail: errors.join('; ') })
    return results
  },
}
