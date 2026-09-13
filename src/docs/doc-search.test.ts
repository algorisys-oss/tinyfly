import { describe, it, expect } from 'vitest'
import { splitSections, searchDocs } from './doc-search'

const guide = {
  id: 'guide',
  title: 'Guide',
  content: [
    '# Guide',
    'Intro text.',
    '## Motion Paths',
    'Move an element along a path with `align`.',
    '```js',
    '# not a heading',
    'live.to(el, { motionPath: path })',
    '```',
    '## Stagger',
    'Fan one tween across many targets. Motion is offset per element.',
  ].join('\n'),
}

describe('splitSections', () => {
  it('splits at headings, not at # lines inside code fences', () => {
    const sections = splitSections(guide)
    expect(sections.map((s) => s.heading)).toEqual(['Guide', 'Motion Paths', 'Stagger'])
    expect(sections[1].anchor).toBe('motion-paths')
    expect(sections[1].text).toContain('# not a heading')
  })
})

describe('searchDocs', () => {
  it('needs every word, and ranks heading matches above body matches', () => {
    const hits = searchDocs([guide], 'motion')
    expect(hits.map((hit) => hit.heading)).toEqual(['Motion Paths', 'Stagger'])
    expect(searchDocs([guide], 'motion align').map((hit) => hit.heading)).toEqual(['Motion Paths'])
  })

  it('returns a snippet around the match, and nothing for an empty query', () => {
    expect(searchDocs([guide], 'targets')[0].snippet).toContain('many targets')
    expect(searchDocs([guide], '   ')).toEqual([])
  })
})
