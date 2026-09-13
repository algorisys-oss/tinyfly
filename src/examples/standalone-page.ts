import type { SampleDefinition } from '../editor/samples'
import type { CodeExample } from './code-examples'
import type { LiveDemoWithCode } from './live-demos'
import { buildSamplePreview } from './sample-preview'

/**
 * "Copy code" on the Examples page: a complete HTML page for an example that
 * you can save as a file and open, with nothing else to wire up.
 *
 * Every page loads the all-in-one browser bundle, which puts tinyfly on a
 * `tinyfly` global. Pure string building, so it is testable without a browser.
 */

/**
 * The browser bundle on the GitHub CDN, pinned to this build's version. Every
 * release publishes bundles to the OSS repo's cdn/ folder under a `v<version>`
 * tag (scripts/publish-oss.sh), and jsDelivr serves them from there. Pinning
 * means a copied page keeps working exactly as it did, whatever ships later.
 */
export const CDN_BASE = `https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v${__APP_VERSION__}/cdn`
export const BROWSER_BUNDLE_URL = `${CDN_BASE}/tinyfly.iife.js`

const BUNDLE_NOTE = `tinyfly v${__APP_VERSION__}, served from GitHub by jsDelivr. For offline use, save the file and point this at your copy.`

interface PageParts {
  title: string
  style: string
  body: string
  script: string
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces)
  return text
    .trim()
    .split('\n')
    .map((line) => (line.trim() ? pad + line : ''))
    .join('\n')
}

function page({ title, style, body, script }: PageParts): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — tinyfly</title>
  <style>
${indent(style, 4)}
  </style>
</head>
<body>
${indent(body, 2)}

  <!-- ${BUNDLE_NOTE} -->
  <script src="${BROWSER_BUNDLE_URL}"></script>
  <script>
${indent(script, 4)}
  </script>
</body>
</html>
`
}

const BASE_STYLE = `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #111;
  color: #e0e0e0;
  font-family: system-ui, sans-serif;
}`

/** A GSAP-style demo: its markup plus its `live` code, unchanged. */
export function liveDemoPage(demo: LiveDemoWithCode): string {
  return page({
    title: demo.name,
    style: BASE_STYLE,
    body: `<div id="demo">\n${indent(demo.html, 2)}\n</div>`,
    script: `// \`live\` plays GSAP-style animations on real elements.
const live = tinyfly.live
// The element the demo's markup lives in.
const root = document.getElementById('demo')

${demo.code}`,
  })
}

/** A timeline example: its markup, the CSS that markup needs, and its JSON. */
export function timelineExamplePage(example: CodeExample, markupCss: string): string {
  const scrollNote = example.driverSnippet
    ? `\n\n// This example is meant to be driven by scroll. To do that instead of looping:\n${example.driverSnippet
        .trim()
        .split('\n')
        .map((line) => `// ${line}`)
        .join('\n')}`
    : ''

  return page({
    title: example.name,
    style: `${BASE_STYLE}\n\n#stage {\n  width: 280px;\n  height: 180px;\n}\n\n${markupCss}`,
    body: `<div id="stage" class="preview-container">\n${indent(example.domHtml, 2)}\n</div>`,
    script: `const animation = ${JSON.stringify(example.timeline, null, 2)}

// Elements with data-tinyfly="name" are the animation's targets.
tinyfly.play('#stage', animation, { loop: -1 })${scrollNote}`,
  })
}

/** An editable example, exported the way the editor's Embed does. */
export function editableExamplePage(sample: SampleDefinition): string {
  const preview = buildSamplePreview(sample)

  return page({
    title: sample.name,
    style: `${BASE_STYLE}\n\n#stage {\n  position: relative;\n  width: ${preview.width}px;\n  height: ${preview.height}px;\n  overflow: hidden;\n  background: #252525;\n}`,
    body: `<div id="stage">\n${indent(preview.html, 2)}\n</div>`,
    script: `const animation = ${JSON.stringify(preview.timeline.toDefinition(), null, 2)}

// Elements with data-tinyfly="name" are the animation's targets.
tinyfly.play('#stage', animation, { loop: -1 })`,
  })
}
