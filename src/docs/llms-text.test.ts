import { describe, it, expect } from 'vitest'
import { DOCS, DOC_SECTIONS } from './doc-manifest'
import { buildLlmsTxt, buildLlmsFullTxt } from './llms-text'
import { repoLlmsTxt } from './repo-llms'
import { allSteps, course, stepKey } from '../learn/course'
import { courseMarkdown } from '../learn/course-text'

const files = import.meta.glob<string>('../../docs/*.md', { query: '?raw', import: 'default', eager: true })
const contents = new Map(Object.entries(files).map(([path, text]) => [path.replace(/^.*\/|\.md$/g, ''), text]))
const readDoc = (id: string) => contents.get(id) ?? ''

/** Files in docs/ that are design notes or launch material, not user docs. */
const INTERNAL_DOCS = ['2d-animation-roadmap', 'camera', 'symbols-and-library', 'producthunt-launch']

describe('doc manifest', () => {
  it('points at files that exist', () => {
    for (const doc of DOCS) expect(contents.has(doc.id), doc.id).toBe(true)
  })

  it('covers every doc that is not marked internal', () => {
    const listed = new Set([...DOCS.map((doc) => doc.id), ...INTERNAL_DOCS])
    expect([...contents.keys()].filter((id) => !listed.has(id))).toEqual([])
  })

  it('files each doc under a known section, once', () => {
    const ids = DOCS.map((doc) => doc.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const doc of DOCS) expect(DOC_SECTIONS).toContain(doc.section)
  })
})

describe('CDN pins in the docs', () => {
  // The docs and README show script tags pinned to a release. They drift a release
  // behind unless the pin is bumped with the version, so check it here.
  const readme = import.meta.glob<string>('../../README.md', { query: '?raw', import: 'default', eager: true })
  const texts = [...contents.entries(), ...Object.values(readme).map((text) => ['README', text] as const)]

  it(`point at this version (v${__APP_VERSION__})`, () => {
    const stale = texts.flatMap(([id, text]) =>
      [...text.matchAll(/algorisys-oss\/tinyfly@v(\d+\.\d+\.\d+)/g)].filter((match) => match[1] !== __APP_VERSION__).map((match) => `${id}: v${match[1]}`)
    )
    expect(stale).toEqual([])
  })
})

describe('llms.txt', () => {
  const text = buildLlmsTxt({ docUrl: (id) => `docs/${id}.md`, fullUrl: 'llms-full.txt' })

  it('follows the llmstxt.org shape: title, summary, then link sections', () => {
    const lines = text.split('\n')
    expect(lines[0]).toBe('# tinyfly')
    expect(lines[2].startsWith('> ')).toBe(true)
    expect(text).toMatch(/^## Start here$/m)
    expect(text).not.toMatch(/^# (?!tinyfly$)/m) // a single H1
  })

  it('links every doc with its summary', () => {
    for (const doc of DOCS) expect(text).toContain(`- [${doc.title}](docs/${doc.id}.md): ${doc.summary}`)
    expect(text).toContain('[llms-full.txt](llms-full.txt)')
  })

  it('in the repo root is up to date (run `npx vitest run -u src/docs` to refresh)', async () => {
    await expect(repoLlmsTxt()).toMatchFileSnapshot('../../llms.txt')
  })
})

describe('llms-full.txt', () => {
  it('contains every doc in manifest order, each marked with its file', () => {
    const full = buildLlmsFullTxt(readDoc)
    let last = -1
    for (const doc of DOCS) {
      const at = full.indexOf(`<!-- docs/${doc.id}.md -->`)
      expect(at, doc.id).toBeGreaterThan(last)
      last = at
    }
    expect(full).toContain(readDoc('api-reference').trim())
  })

  it('ends with the course, every step linked with its solution', () => {
    const full = buildLlmsFullTxt(readDoc, courseMarkdown(course))
    const at = full.indexOf('<!-- learn: the interactive course -->')
    expect(at).toBeGreaterThan(full.indexOf(`<!-- docs/${DOCS[DOCS.length - 1].id}.md -->`))
    for (const location of allSteps) {
      expect(full).toContain(`Step: \`/learn/${stepKey(location)}\``)
      expect(full).toContain(location.step.solution.trim())
    }
  })
})
