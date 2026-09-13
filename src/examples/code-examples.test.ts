import { describe, it, expect } from 'vitest'
import { codeExamples, getExamplesByCategory } from './code-examples'
import { deserializeTimeline } from '../engine'

/**
 * Structural checks over the code examples. These caught a real defect once already:
 * an array hole from a stray comma, which typechecks as `undefined` slipping
 * into the list.
 */

describe('codeExamples', () => {
  it('has no holes', () => {
    expect(codeExamples.every((ex) => ex !== undefined && ex !== null)).toBe(true)
  })

  it('has unique ids', () => {
    const ids = codeExamples.map((ex) => ex.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every example a name, description and at least one tag', () => {
    for (const ex of codeExamples) {
      expect(ex.name, ex.id).toBeTruthy()
      expect(ex.description, ex.id).toBeTruthy()
      expect(ex.tags.length, ex.id).toBeGreaterThan(0)
    }
  })

  it('every timeline deserializes and has a positive duration', () => {
    for (const ex of codeExamples) {
      const timeline = deserializeTimeline(ex.timeline)
      expect(timeline.duration, ex.id).toBeGreaterThan(0)
    }
  })

  it('every track targets something the DOM markup exposes', () => {
    for (const ex of codeExamples) {
      for (const track of ex.timeline.tracks) {
        expect(ex.domHtml, `${ex.id} / ${track.target}`).toContain(`data-tinyfly="${track.target}"`)
      }
    }
  })

  it('canvas targets, where present, cover every animated target', () => {
    for (const ex of codeExamples) {
      if (!ex.canvasTargets) continue
      const names = new Set(ex.canvasTargets.map((t) => t.name))
      for (const track of ex.timeline.tracks) {
        expect(names.has(track.target), `${ex.id} / ${track.target}`).toBe(true)
      }
    }
  })
})

describe('scroll examples', () => {
  const scroll = () => getExamplesByCategory('Scroll')

  it('ships at least two', () => {
    expect(scroll().length).toBeGreaterThanOrEqual(2)
  })

  it('each carries a driver snippet — that is the point of the category', () => {
    for (const ex of scroll()) {
      expect(ex.driverSnippet, ex.id).toBeTruthy()
    }
  })

  it('each snippet imports from the drivers entry point', () => {
    for (const ex of scroll()) {
      expect(ex.driverSnippet, ex.id).toContain("from 'tinyfly/drivers'")
    }
  })

  it('each snippet names a real driver', () => {
    for (const ex of scroll()) {
      expect(/ScrollDriver|VisibilityDriver/.test(ex.driverSnippet!), ex.id).toBe(true)
    }
  })

  it('non-scroll examples carry no driver snippet', () => {
    const others = codeExamples.filter((ex) => ex.category !== 'Scroll')
    expect(others.every((ex) => ex.driverSnippet === undefined)).toBe(true)
  })
})

describe('getExamplesByCategory', () => {
  it('returns only that category', () => {
    for (const ex of getExamplesByCategory('Loaders')) {
      expect(ex.category).toBe('Loaders')
    }
  })
})
