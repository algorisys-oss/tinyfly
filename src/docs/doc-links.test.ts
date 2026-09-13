import { describe, it, expect } from 'vitest'
import { resolveDocLink, rewriteDocLinks } from './doc-links'

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
