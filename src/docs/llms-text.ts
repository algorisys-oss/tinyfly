import { DOCS, DOC_SECTIONS } from './doc-manifest'

/**
 * `llms.txt` and `llms-full.txt` for tinyfly, following https://llmstxt.org:
 * a short markdown index a language model can read first, and the whole
 * documentation in one file for tools that want everything at once.
 *
 * Both are built from the doc manifest, so they cannot drift from the docs the
 * app shows. These are pure functions; where the text is written (the repo
 * root, the built site) is up to the caller.
 */

export interface LlmsTxtOptions {
  /** URL of a doc's markdown, from its id */
  docUrl: (id: string) => string
  /** URL of `llms-full.txt`, when one is published next to this file */
  fullUrl?: string
  /** Links listed under "Optional": secondary material a model may skip */
  optional?: { title: string; url: string; summary: string }[]
}

const SUMMARY =
  'tinyfly is a lightweight, framework-agnostic animation engine with an optional visual editor. ' +
  'Animations are plain JSON (timelines, tracks, keyframes) and play deterministically in browsers, Web Workers and Node. ' +
  'A GSAP-style API (`live.to`, `live.timeline`) drives real DOM and SVG elements.'

const KEY_FACTS = `Key facts:

- Package: \`tinyfly\` (prepared for npm but not yet published; until then use the script tag below, or build the repo and install it locally). Entry points: \`tinyfly\` (engine), \`tinyfly/export\` (CSS, Lottie, GIF, video exporters), \`tinyfly/player\`, \`tinyfly/adapters\` (DOM, Canvas, SVG, WebGL), \`tinyfly/gsap-compat\` (GSAP-style API), \`tinyfly/drivers\` (scroll, visibility), \`tinyfly/interaction\` (Observer, Draggable), \`tinyfly/browser\` (the GSAP-style runtime plus engine, player, drivers and interaction — no exporters — for script tags).
- Script tag: \`https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v{version}/cdn/tinyfly.iife.js\` defines a global \`tinyfly\`, e.g. \`tinyfly.to('.box', { x: 200, duration: 1 })\`. Replace \`{version}\` with a release tag.
- The GSAP-style \`live\` API covers \`scrollTrigger\` (scrub, pin, toggleActions), \`splitText\` (chars, words, lines, masks), \`drawSVG\`, \`spring\`, \`morphSVG\`, \`motionPath\`, text/scramble, inertia and Draggable, Flip (including shared elements by \`data-flip-id\`), plain-object targets and \`live.ticker\`.
- Times in JSON timelines are milliseconds; durations in the GSAP-style API are seconds, as in GSAP.
- The GSAP-style API is familiar, not compatible: GSAP code does not run unchanged. \`docs/gsap-compat.md\` lists every supported option and each difference.
- Track kinds: keyframe tracks, spring (\`kind: 'spring'\`), inertia (\`kind: 'inertia'\`), motion path (\`property: 'motionPath'\`) and text (\`property: 'text'\`). All serialize to JSON; \`docs/file-format.md\` defines them.
- Source: https://github.com/algorisys-oss/tinyfly. License: AGPL-3.0, with a commercial license for proprietary and SaaS use (see the README).`

export function buildLlmsTxt(options: LlmsTxtOptions): string {
  const lines: string[] = ['# tinyfly', '', `> ${SUMMARY}`, '', KEY_FACTS, '']

  if (options.fullUrl) {
    lines.push(`All documentation in a single file: [llms-full.txt](${options.fullUrl})`, '')
  }

  for (const section of DOC_SECTIONS) {
    lines.push(`## ${section}`, '')
    for (const doc of DOCS.filter((entry) => entry.section === section)) {
      lines.push(`- [${doc.title}](${options.docUrl(doc.id)}): ${doc.summary}`)
    }
    lines.push('')
  }

  if (options.optional?.length) {
    lines.push('## Optional', '')
    for (const link of options.optional) lines.push(`- [${link.title}](${link.url}): ${link.summary}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Every doc in manifest order, each under a marker naming its file, so a model
 * reading one long file still knows where each part came from.
 */
export function buildLlmsFullTxt(readDoc: (id: string) => string): string {
  const parts = [`# tinyfly — full documentation\n\n> ${SUMMARY}\n\n${KEY_FACTS}\n`]
  for (const doc of DOCS) {
    parts.push(`<!-- docs/${doc.id}.md -->\n\n${readDoc(doc.id).trim()}\n`)
  }
  return parts.join('\n---\n\n')
}
