import { describe, it, expect } from 'vitest'
import { toSRT, toWebVTT, captionCuesFromTimeline } from './captions'
import type { TimelineDefinition } from '../types'

const cues = [
  { start: 350, end: 1350.4, text: 'one' },
  { start: 3_725_001, end: 3_726_000, text: 'two\n\nlines' },
]

describe('captions', () => {
  it('writes SubRip', () => {
    expect(toSRT(cues)).toBe(
      '1\n00:00:00,350 --> 00:00:01,350\none\n\n2\n01:02:05,001 --> 01:02:06,000\ntwo\nlines\n'
    )
  })

  it('writes WebVTT', () => {
    expect(toWebVTT(cues)).toBe(
      'WEBVTT\n\n00:00:00.350 --> 00:00:01.350\none\n\n01:02:05.001 --> 01:02:06.000\ntwo\nlines\n'
    )
  })

  it('writes an empty file for no cues', () => {
    expect(toSRT([])).toBe('')
    expect(toWebVTT([])).toBe('WEBVTT\n\n')
  })

  it('derives cues from markers, captions and the timeline end', () => {
    const definition: TimelineDefinition = {
      id: 't',
      config: {
        duration: 5000,
        markers: [
          { id: 'b', time: 2000, label: 'second' },
          { id: 'a', time: 0, label: 'first' },
          { id: 'silent', time: 3000 },
          { id: 'c', time: 4000, label: 'third' },
        ],
      },
      tracks: [],
      captions: { es: { a: 'primero' } },
    }
    expect(captionCuesFromTimeline(definition)).toEqual([
      { start: 0, end: 2000, text: 'first' },
      { start: 2000, end: 3000, text: 'second' },
      { start: 4000, end: 5000, text: 'third' },
    ])
    expect(captionCuesFromTimeline(definition, { language: 'es' })[0].text).toBe('primero')
  })
})
