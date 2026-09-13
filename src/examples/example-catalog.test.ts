import { describe, it, expect } from 'vitest'
import { examples, exampleCategories, filterExamples, getExample } from './example-catalog'
import { buildSamplePreview } from './sample-preview'
import { sampleDefinitions } from '../editor/samples'
import { codeExamples } from './code-examples'
import { liveDemos } from './live-demos'

/**
 * The Examples page is one catalog built from two sources. These checks keep
 * the merge honest: nothing dropped, ids unambiguous (the editor opens an
 * example by id), and every editable example actually previews.
 */

describe('example catalog', () => {
  it('includes every editor sample and every code example', () => {
    expect(examples).toHaveLength(sampleDefinitions.length + codeExamples.length + liveDemos.length)
  })

  it('has unique ids across both sources', () => {
    const ids = examples.map((example) => example.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('files every example under a listed category', () => {
    const listed = new Set(exampleCategories.map((c) => c.id))
    for (const example of examples) {
      expect(listed.has(example.category), example.id).toBe(true)
    }
  })

  it('includes the camera samples the old Samples dialog never listed', () => {
    expect(examples.filter((e) => e.category === 'camera').length).toBeGreaterThan(0)
  })

  it('looks examples up by id', () => {
    expect(getExample('letter-drop-bounce')?.kind).toBe('editable')
    expect(getExample('scroll-reveal')?.kind).toBe('code')
    expect(getExample('nope')).toBeUndefined()
  })
})

describe('filterExamples', () => {
  it('filters by kind', () => {
    const code = filterExamples(examples, { kind: 'code' })
    expect(code.length).toBe(codeExamples.length + liveDemos.length)
    expect(code.every((e) => e.kind === 'code')).toBe(true)
  })

  it('filters by category', () => {
    expect(filterExamples(examples, { category: 'scroll' }).every((e) => e.category === 'scroll')).toBe(true)
  })

  it('searches names, descriptions and tags, case-insensitively', () => {
    expect(filterExamples(examples, { query: 'PARALLAX' }).map((e) => e.id)).toContain('scroll-parallax')
  })

  it('treats "all" and an empty query as no filter', () => {
    expect(filterExamples(examples, { category: 'all', kind: 'all', query: '  ' })).toHaveLength(examples.length)
  })
})

describe('buildSamplePreview', () => {
  it('builds a playable preview for every editable example', () => {
    for (const sample of sampleDefinitions) {
      const preview = buildSamplePreview(sample)
      expect(preview.timeline.duration, sample.id).toBeGreaterThan(0)
      expect(preview.width, sample.id).toBeGreaterThan(0)
    }
  })

  it('renders a data-tinyfly target for every animated element', () => {
    for (const sample of sampleDefinitions) {
      const { html } = buildSamplePreview(sample)
      for (const track of sample.tracks) {
        expect(html, `${sample.id} / ${track.target}`).toContain(`data-tinyfly="${track.target}"`)
      }
    }
  })

  it('uses the sample canvas size when it declares one', () => {
    const vertical = sampleDefinitions.find((s) => s.canvas)!
    const preview = buildSamplePreview(vertical)
    expect(preview.width).toBe(vertical.canvas!.width)
    expect(preview.height).toBe(vertical.canvas!.height)
  })
})
