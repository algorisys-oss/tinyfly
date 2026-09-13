/**
 * Where a link inside a doc should go when the doc is shown in the app.
 *
 * The markdown links other docs as `file-format.md#animatable-properties`, which
 * is right on GitHub but wrong in the app, where pages live at `/docs/<id>`.
 * Docs the app does not show (design notes) and repo files outside `docs/`
 * open on GitHub instead.
 */

const REPO = 'https://github.com/algorisys-oss/tinyfly/blob/main'

export type ResolvedLink =
  | { kind: 'page'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'anchor'; href: string }

export function resolveDocLink(href: string, pageIds: ReadonlySet<string>): ResolvedLink {
  if (href.startsWith('#')) return { kind: 'anchor', href }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { kind: 'external', href }

  const [path, hash] = href.split('#', 2)
  const suffix = hash ? `#${hash}` : ''
  const docMatch = path.match(/^(?:\.\/)?([\w-]+)\.md$/)
  if (docMatch && pageIds.has(docMatch[1])) return { kind: 'page', href: `/docs/${docMatch[1]}${suffix}` }

  // Anything else is relative to docs/ in the repository.
  const segments: string[] = ['docs']
  for (const part of path.split('/')) {
    if (part === '..') segments.pop()
    else if (part && part !== '.') segments.push(part)
  }
  return { kind: 'external', href: `${REPO}/${segments.join('/')}${suffix}` }
}

/** Rewrite every `<a href>` in rendered doc HTML; outside links open in a new tab. */
export function rewriteDocLinks(html: string, pageIds: ReadonlySet<string>): string {
  return html.replace(/<a href="([^"]*)">/g, (_, href: string) => {
    const link = resolveDocLink(href.replace(/&amp;/g, '&'), pageIds)
    return link.kind === 'external'
      ? `<a href="${link.href}" target="_blank" rel="noopener">`
      : `<a href="${link.href}">`
  })
}
