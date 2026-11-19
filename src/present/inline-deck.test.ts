import { describe, it, expect } from 'vitest'
import { inlineDeck } from './inline-deck'

const files: Record<string, string> = {
  'vendor/tinyfly.iife.js': 'var tinyfly = {}; var s = "</script>"; // <!-- note',
  'scenes.js': 'window.SCENES = {}',
  'css/deck.css': '.logo { background: url(../assets/logo.png) } @font-face { src: url("fonts/a.woff2") }',
  'assets/logo.png': 'PNG',
  'assets/team.jpg': 'JPG',
  'css/fonts/a.woff2': 'WOFF',
}
const read = {
  readText: (path: string) => files[path] ?? null,
  readBase64: (path: string) => (path in files ? `b64(${files[path]})` : null),
}

describe('inlineDeck', () => {
  it('inlines scripts, stylesheets and images into one page', () => {
    const page = `<!doctype html><link rel="stylesheet" href="css/deck.css">
<style>.hero { background: url('assets/team.jpg') }</style>
<img src="./assets/logo.png?v=2" alt=""><div style="background-image: url(assets/team.jpg)"></div>
<script src="vendor/tinyfly.iife.js"></script><script defer src='scenes.js'></script>
<script>const keep = '<img src="assets/untouched.png">'</script>`
    const result = inlineDeck(page, read)
    expect(result.missing).toEqual([])
    expect(result.remote).toEqual([])
    expect(result.unsupported).toEqual([])
    expect(result.inlined).toEqual(['css/deck.css', 'assets/logo.png', 'css/fonts/a.woff2', 'assets/team.jpg', 'vendor/tinyfly.iife.js', 'scenes.js'])
    expect(result.html).toContain('<style>/* css/deck.css */\n.logo { background: url("data:image/png;base64,b64(PNG)") }')
    expect(result.html).toContain('url("data:font/woff2;base64,b64(WOFF)")')
    expect(result.html).toContain('<img src="data:image/png;base64,b64(PNG)" alt="">')
    expect(result.html).toContain(`style="background-image: url('data:image/jpeg;base64,b64(JPG)')"`)
    expect(result.html).toContain('<script defer>/* scenes.js */\nwindow.SCENES = {}\n</script>')
    // Code that is already inline is left exactly as written.
    expect(result.html).toContain(`<script>const keep = '<img src="assets/untouched.png">'</script>`)
    expect(result.html.replace(/<script>const keep[^\n]*/, '')).not.toMatch(/(src|href)="(?!data:)[^"]/)
  })

  it('keeps a script from ending early on a closing tag or comment inside its code', () => {
    const { html } = inlineDeck('<script src="vendor/tinyfly.iife.js"></script>', read)
    expect(html).toContain('var s = "<\\/script>"; // <\\!-- note')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })

  it('reports what would still need a file or the network, and leaves it in place', () => {
    const page = `<script src="https://cdn.example.com/tinyfly.js"></script>
<link rel="stylesheet" href="//fonts.example.com/a.css"><link rel="stylesheet" href="gone.css">
<img src="assets/gone.png"><img src="assets/photo.heic"><img srcset="a.png 2x" src="data:image/png;base64,AAAA">
<style>@import "more.css";</style><a href="https://example.com">a link is fine</a><a href="#3">and so is this</a>`
    const result = inlineDeck(page, read)
    expect(result.remote).toEqual(['https://cdn.example.com/tinyfly.js', '//fonts.example.com/a.css'])
    expect(result.missing).toEqual(['gone.css', 'assets/gone.png'])
    expect(result.unsupported).toEqual(['srcset (use one src)', '@import in a stylesheet', 'assets/photo.heic (unknown file type)'])
    expect(result.inlined).toEqual([])
    expect(result.html).toContain('<img src="assets/gone.png">')
    expect(result.html).toContain('<a href="https://example.com">')
  })

  it('reports a module script that imports other files', () => {
    const result = inlineDeck('<script type="module" src="main.js"></script>', {
      ...read,
      readText: () => "import { createDeck } from './deck.js'\ncreateDeck('#deck')",
    })
    expect(result.unsupported).toEqual(['main.js (a module that imports other files; bundle it first)'])
  })
})
