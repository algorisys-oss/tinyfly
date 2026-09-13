/**
 * The docs: pages deep-link and open at their anchor, links between docs stay
 * in the app, search jumps to a section, and the files for language models
 * (llms.txt, llms-full.txt, raw markdown) are served as text.
 */
export default {
  name: 'docs',
  async run({ page, base }) {
    const results = []

    await page.goto(`${base}/docs/getting-started#going-further`)
    await page.waitForSelector('.docs-content h1', { timeout: 30000 })
    await page.waitForTimeout(300)
    const pages = await page.locator('.docs-nav-item').count()
    const scrolled = await page.locator('.docs-content').evaluate((el) => el.scrollTop)
    results.push({ label: 'a deep link opens the page at its anchor', ok: pages >= 10 && scrolled > 0, detail: `pages ${pages}, scrollTop ${scrolled}` })

    await page.locator('.docs-content a[href^="/docs/file-format"]').first().click()
    await page.waitForTimeout(300)
    const title = await page.locator('.docs-content h1').innerText()
    results.push({ label: 'a link to another doc opens it in the app', ok: page.url().includes('/docs/file-format') && /File Format/.test(title), detail: page.url() })

    await page.locator('.docs-search').fill('stagger')
    await page.waitForTimeout(200)
    await page.locator('.docs-search-hit').first().click()
    await page.waitForTimeout(300)
    const hitScrolled = await page.locator('.docs-content').evaluate((el) => el.scrollTop)
    results.push({ label: 'search jumps to a matching section', ok: page.url().includes('#') && hitScrolled > 0, detail: page.url() })

    const served = []
    for (const path of ['/llms.txt', '/llms-full.txt', '/docs/api-reference.md']) {
      const response = await page.request.get(`${base}${path}`)
      const type = response.headers()['content-type'] ?? ''
      const text = await response.text()
      served.push(response.ok() && /^text\/(plain|markdown)/.test(type) && text.startsWith('# '))
    }
    results.push({ label: 'llms.txt, llms-full.txt and raw markdown are served as text', ok: served.every(Boolean), detail: JSON.stringify(served) })

    return results
  },
}
