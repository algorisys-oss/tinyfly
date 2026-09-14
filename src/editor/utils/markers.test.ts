import { describe, it, expect } from 'vitest'
import {
  insertMarker,
  patchMarker,
  removeMarker,
  setCaption,
  captionLanguages,
  removeCaptionLanguage,
  normaliseLanguage,
  normaliseMarkerId,
  neighbourMarker,
  nextStepName,
} from './markers'

const steps = [
  { id: 'step-1', time: 0, label: 'Step 1' },
  { id: 'grow', time: 1000, label: 'grow' },
]

describe('marker helpers', () => {
  it('inserts in order with the next free step name, and reuses a marker at the same time', () => {
    const { markers, id } = insertMarker(steps, 500.4)
    expect(id).toBe('step-3')
    expect(markers.map((marker) => marker.time)).toEqual([0, 500, 1000])
    expect(insertMarker(steps, 1000).id).toBe('grow')
    expect(nextStepName([{ id: 'step-2', time: 0 }]).id).toBe('step-3')
  })

  it('renames a marker and its captions, refusing empty or taken ids', () => {
    const captions = { es: { grow: 'crece', 'step-1': 'paso' } }
    const renamed = patchMarker(steps, captions, 'grow', { id: 'Cap Full!' }, 3000)
    expect(renamed.id).toBe('cap-full')
    expect(renamed.captions).toEqual({ es: { 'cap-full': 'crece', 'step-1': 'paso' } })
    expect(patchMarker(steps, captions, 'grow', { id: 'step-1' }, 3000).error).toMatch(/already/)
    expect(patchMarker(steps, captions, 'grow', { id: '!!' }, 3000).error).toMatch(/letter or digit/)
  })

  it('clamps time to the scene, re-sorts, and drops empty text', () => {
    const moved = patchMarker(steps, undefined, 'step-1', { time: 9000, label: '  ', question: 'Why?', pause: true }, 2000)
    expect(moved.markers).toEqual([
      { id: 'grow', time: 1000, label: 'grow' },
      { id: 'step-1', time: 2000, question: 'Why?', pause: true },
    ])
    const unpaused = patchMarker(moved.markers, undefined, 'step-1', { pause: false, question: '' }, 2000)
    expect(unpaused.markers[1]).toEqual({ id: 'step-1', time: 2000 })
  })

  it('removes a marker with its captions', () => {
    const result = removeMarker(steps, { es: { grow: 'crece' }, fr: { grow: 'grandit', 'step-1': 'étape' } }, 'grow')
    expect(result.markers.map((marker) => marker.id)).toEqual(['step-1'])
    expect(result.captions).toEqual({ fr: { 'step-1': 'étape' } })
  })

  it('edits captions and languages', () => {
    let captions = setCaption(undefined, 'es', 'grow', 'crece')
    expect(captions).toEqual({ es: { grow: 'crece' } })
    captions = setCaption(captions, 'es', 'grow', '   ')
    expect(captions).toEqual({ es: {} })
    expect(captionLanguages({ es: {} }, ['pt-BR', 'es'])).toEqual(['es', 'pt-BR'])
    expect(removeCaptionLanguage({ es: { a: 'x' }, fr: { a: 'y' } }, 'es')).toEqual({ fr: { a: 'y' } })
    expect(normaliseLanguage('PT_br')).toBe('pt-BR')
    expect(normaliseLanguage('zh-hans')).toBe('zh-hans')
    expect(normaliseLanguage('english!')).toBeUndefined()
    expect(normaliseMarkerId(' Step Two ')).toBe('step-two')
  })

  it('finds the neighbouring step', () => {
    expect(neighbourMarker(steps, 0, 1)?.id).toBe('grow')
    expect(neighbourMarker(steps, 1000, 1)).toBeUndefined()
    expect(neighbourMarker(steps, 1000, -1)?.id).toBe('step-1')
  })
})
