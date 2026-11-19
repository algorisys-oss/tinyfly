/**
 * Turn a deck's page and the files it loads into one HTML file that works
 * offline from `file://`: scripts and stylesheets inlined, images, fonts and
 * media as data URIs.
 *
 * It reads no files itself: the caller passes `readText` and `readBase64`, so
 * it runs anywhere (the `tinyfly present` command passes Node's `fs`). Paths
 * given to them are relative to the page, with `/` separators.
 *
 * Whatever would still need the network or another file is reported, not
 * guessed at: `missing` (a local file that could not be read), `remote` (a
 * script, stylesheet or media URL on the network) and `unsupported` (`srcset`,
 * `@import`, module scripts that import other files). A deck is safe to take
 * to a venue when all three are empty.
 */

export interface InlineDeckOptions {
  /** A file's text, or null when it cannot be read */
  readText: (path: string) => string | null
  /** A file's bytes as base64, or null when it cannot be read */
  readBase64: (path: string) => string | null
}

export interface InlineDeckResult {
  html: string
  /** Files written into the page, in the order they were first met */
  inlined: string[]
  missing: string[]
  remote: string[]
  unsupported: string[]
}

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi
const LINK_TAG = /<link\b[^>]*>/gi
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined
}

const isRemote = (url: string) => /^(https?:)?\/\//i.test(url)
/** Data URIs, fragments and other schemes that load no file. */
const isInert = (url: string) => url === '' || /^(data:|blob:|about:|javascript:|mailto:|tel:|#)/i.test(url)

/** `dir` + a relative URL, as a normalised path without its query or fragment. */
function resolvePath(dir: string, url: string): string {
  const clean = decodeURIComponent(url.replace(/[?#].*$/, ''))
  const parts: string[] = []
  for (const part of `${clean.startsWith('/') ? '' : `${dir}/`}${clean}`.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..' && parts.length > 0 && parts[parts.length - 1] !== '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

const dirOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '')
const extensionOf = (path: string) => (/\.([a-z0-9]+)$/i.exec(path)?.[1] ?? '').toLowerCase()

export function inlineDeck(html: string, options: InlineDeckOptions): InlineDeckResult {
  const result: InlineDeckResult = { html: '', inlined: [], missing: [], remote: [], unsupported: [] }
  const note = (list: string[], item: string) => {
    if (!list.includes(item)) list.push(item)
  }

  /** A data URI for a local file, or the URL unchanged (and reported) when it cannot be one. */
  function dataUri(url: string, dir: string): string {
    if (isInert(url)) return url
    if (isRemote(url)) {
      note(result.remote, url)
      return url
    }
    const path = resolvePath(dir, url)
    const mime = MIME[extensionOf(path)]
    const data = mime ? options.readBase64(path) : null
    if (!mime) note(result.unsupported, `${path} (unknown file type)`)
    else if (data === null) note(result.missing, path)
    if (!mime || data === null) return url
    note(result.inlined, path)
    return `data:${mime};base64,${data}`
  }

  function inlineCss(css: string, dir: string): string {
    if (/@import\b/i.test(css)) note(result.unsupported, '@import in a stylesheet')
    return css.replace(CSS_URL, (_whole, double: string, single: string, bare: string) => `url("${dataUri(double ?? single ?? bare, dir)}")`)
  }

  function inlineScript(whole: string, attributes: string): string {
    const src = attribute(attributes, 'src')
    if (src === undefined || isInert(src)) return whole
    if (isRemote(src)) {
      note(result.remote, src)
      return whole
    }
    const path = resolvePath('', src)
    const code = options.readText(path)
    if (code === null) {
      note(result.missing, path)
      return whole
    }
    if (/\btype\s*=\s*["']?module/i.test(attributes) && /^\s*(import|export)\b[^;]*\bfrom\b|^\s*import\s*["']/m.test(code)) {
      note(result.unsupported, `${path} (a module that imports other files; bundle it first)`)
    }
    note(result.inlined, path)
    const kept = attributes.replace(/\s*\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '')
    // A closing tag or an HTML comment opener inside the code would end the script early.
    const safe = code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')
    return `<script${kept}>/* ${path} */\n${safe}\n</script>`
  }

  function inlineLink(tag: string): string {
    const href = attribute(tag, 'href')
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase()
    if (href === undefined || isInert(href)) return tag
    if (rel.split(/\s+/).includes('stylesheet')) {
      if (isRemote(href)) {
        note(result.remote, href)
        return tag
      }
      const path = resolvePath('', href)
      const css = options.readText(path)
      if (css === null) {
        note(result.missing, path)
        return tag
      }
      note(result.inlined, path)
      return `<style>/* ${path} */\n${inlineCss(css, dirOf(path)).replace(/<\/style/gi, '<\\/style')}\n</style>`
    }
    if (/icon/.test(rel)) return tag.replace(href, dataUri(href, ''))
    if (isRemote(href) && /^(preload|modulepreload|prefetch|preconnect|dns-prefetch)$/.test(rel)) note(result.remote, href)
    return tag
  }

  /** Markup between scripts: stylesheets, `<style>` blocks, and `src` / `poster` / `style` attributes. */
  function inlineMarkup(markup: string): string {
    if (/\ssrcset\s*=/i.test(markup)) note(result.unsupported, 'srcset (use one src)')
    return markup
      .replace(LINK_TAG, inlineLink)
      .replace(STYLE_BLOCK, (_whole, open: string, css: string, close: string) => `${open}${inlineCss(css, '')}${close}`)
      .replace(/(\s(?:src|poster)\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (_whole, lead: string, double: string, single: string) => {
        return `${lead}"${dataUri(double ?? single, '')}"`
      })
      .replace(/(\sstyle\s*=\s*)"([^"]*)"/gi, (_whole, lead: string, css: string) => `${lead}"${inlineCss(css, '').replace(/"/g, "'")}"`)
  }

  let cursor = 0
  for (const match of html.matchAll(SCRIPT_BLOCK)) {
    result.html += inlineMarkup(html.slice(cursor, match.index))
    result.html += inlineScript(match[0], match[1])
    cursor = match.index + match[0].length
  }
  result.html += inlineMarkup(html.slice(cursor))
  return result
}
