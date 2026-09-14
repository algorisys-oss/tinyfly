import { describe, it, expect } from 'vitest'
import markupCss from './code-examples.css?raw'
import { BROWSER_BUNDLE_URL, editableExamplePage, lessonPage, liveDemoPage, timelineExamplePage } from './standalone-page'
import { allSteps, stepKey } from '../learn/course'
import { liveDemos } from './live-demos'
import { codeExamples } from './code-examples'
import { sampleDefinitions } from '../editor/samples'

/**
 * "Copy code" must produce a page that works when pasted. These tests check
 * every generated page and compile its inline script, so TypeScript syntax or
 * a top-level `return` fails here rather than in someone's browser.
 * (standalone-page-run.test.ts runs the live demo scripts.)
 */

/** The bundle `<script src>` and the inline script of a generated page. */
function scriptsOf(html: string) {
  const src = html.match(/<script src="([^"]+)"><\/script>/)?.[1]
  const inline = html.match(/<script>\n([\s\S]*?)\n\s*<\/script>/)?.[1] ?? ''
  return { src, inline }
}

describe('standalone pages', () => {
  const pages = [
    ...liveDemos.map((demo) => [demo.id, liveDemoPage(demo)] as const),
    ...codeExamples.map((example) => [example.id, timelineExamplePage(example, markupCss)] as const),
    ...sampleDefinitions.map((sample) => [sample.id, editableExamplePage(sample)] as const),
    ...allSteps.map((location) => [`learn/${stepKey(location)}`, lessonPage(location.step.title, location.step.markup, location.step.solution)] as const),
  ]

  it('pins the GitHub CDN bundle to this version', () => {
    expect(BROWSER_BUNDLE_URL).toBe(
      `https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v${__APP_VERSION__}/cdn/tinyfly.iife.js`
    )
  })

  it('covers every example', () => {
    expect(pages).toHaveLength(liveDemos.length + codeExamples.length + sampleDefinitions.length + allSteps.length)
  })

  for (const [id, html] of pages) {
    it(`${id}: is a complete page that loads the bundle and has a valid script`, () => {
      const { src, inline } = scriptsOf(html)
      expect(html.startsWith('<!doctype html>'), id).toBe(true)
      expect(html, id).toMatch(/<title>.+ — tinyfly<\/title>/)
      expect(src, id).toBe(BROWSER_BUNDLE_URL)
      expect(inline.trim(), id).not.toBe('')
      expect(() => new Function('tinyfly', inline), id).not.toThrow()
    })
  }

  it('live pages define live and root before the demo code', () => {
    for (const demo of liveDemos) {
      const { inline } = scriptsOf(liveDemoPage(demo))
      const lastCodeLine = demo.code.trim().split('\n').pop()!.trim()
      expect(inline.indexOf('const live = tinyfly.live'), demo.id).toBeLessThan(inline.lastIndexOf(lastCodeLine))
      expect(inline, demo.id).toContain("const root = document.getElementById('demo')")
    }
  })

  it('timeline pages include the markup CSS their elements need', () => {
    expect(timelineExamplePage(codeExamples[0], markupCss)).toContain('.preview-container .animated-box')
  })

  it('scroll examples carry their scroll-driver snippet as a comment', () => {
    const scroll = codeExamples.find((example) => example.driverSnippet)!
    const { inline } = scriptsOf(timelineExamplePage(scroll, markupCss))
    expect(inline).toContain('// This example is meant to be driven by scroll')
  })

  it('editable pages embed every animated target', () => {
    for (const sample of sampleDefinitions) {
      const html = editableExamplePage(sample)
      for (const track of sample.tracks) {
        expect(html, `${sample.id} / ${track.target}`).toContain(`data-tinyfly="${track.target}"`)
      }
    }
  })
})
