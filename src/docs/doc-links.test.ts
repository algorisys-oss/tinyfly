import { describe, it, expect } from 'vitest'
import { resolveDocLink, rewriteDocImages, rewriteDocLinks } from './doc-links'
import { renderMarkdown } from './markdown'

const pages = new Set(['api-reference', 'file-format'])

describe('resolveDocLink', () => {
  it('sends links to shown docs to their app page, keeping the anchor', () => {
    expect(resolveDocLink('file-format.md#animatable-properties', pages)).toEqual({ kind: 'page', href: '/docs/file-format#animatable-properties' })
    expect(resolveDocLink('./api-reference.md', pages)).toEqual({ kind: 'page', href: '/docs/api-reference' })
  })

  it('opens docs the app does not show, and repo files, on GitHub', () => {
    expect(resolveDocLink('camera.md', pages).href).toBe('https://github.com/algorisys-oss/tinyfly/blob/main/docs/camera.md')
    expect(resolveDocLink('../todo.md', pages).href).toBe('https://github.com/algorisys-oss/tinyfly/blob/main/todo.md')
  })

  it('leaves same-page anchors and absolute URLs alone', () => {
    expect(resolveDocLink('#stagger', pages)).toEqual({ kind: 'anchor', href: '#stagger' })
    expect(resolveDocLink('https://llmstxt.org', pages)).toEqual({ kind: 'external', href: 'https://llmstxt.org' })
  })
})

describe('rewriteDocLinks', () => {
  it('rewrites hrefs and opens outside links in a new tab', () => {
    const html = '<a href="file-format.md">a</a> <a href="https://x.dev">b</a>'
    expect(rewriteDocLinks(html, pages)).toBe('<a href="/docs/file-format">a</a> <a href="https://x.dev" target="_blank" rel="noopener">b</a>')
  })
})

describe('rewriteDocImages', () => {
  it('loads bundled model sheets from the app and other images from the repository', () => {
    const html = renderMarkdown('![The sheet](model-sheet/appearance.png) and ![x](other/pic.png) ![y](https://x.dev/a.png)')
    expect(html).toContain('<img src="model-sheet/appearance.png" alt="The sheet"')
    const rewritten = rewriteDocImages(html, new Map([['model-sheet/appearance.png', '/assets/appearance-abc.png']]))
    expect(rewritten).toContain('<img src="/assets/appearance-abc.png"')
    expect(rewritten).toContain('<img src="https://raw.githubusercontent.com/algorisys-oss/tinyfly/main/docs/other/pic.png"')
    expect(rewritten).toContain('<img src="https://x.dev/a.png"')
  })
})
