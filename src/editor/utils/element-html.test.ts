import { describe, it, expect } from 'vitest'
import { generateElementHtml } from './element-html'
import type { AudioElement, VideoElement } from '../stores/scene-store'

const base = {
  id: 'x',
  name: 'Clip',
  x: 10,
  y: 20,
  width: 180,
  height: 120,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
}

function audio(overrides: Partial<AudioElement> = {}): AudioElement {
  return { ...base, type: 'audio', src: 'a.mp3', volume: 0.8, muted: false, loop: false, startTime: 500, ...overrides }
}

function video(overrides: Partial<VideoElement> = {}): VideoElement {
  return { ...base, type: 'video', src: 'v.mp4', objectFit: 'cover', volume: 1, muted: true, loop: true, startTime: 0, ...overrides }
}

describe('generateElementHtml — media', () => {
  it('emits a hidden, syncable <audio> tag', () => {
    const html = generateElementHtml(audio())
    expect(html).toContain('<audio')
    expect(html).toContain('data-tinyfly-media')
    expect(html).toContain('data-tinyfly-start="500"')
    expect(html).toContain('src="a.mp3"')
    expect(html).toContain('data-volume="0.8"')
    expect(html).toContain('display: none')
  })

  it('emits a positioned, syncable <video> with fit and loop/mute', () => {
    const html = generateElementHtml(video())
    expect(html).toContain('<video')
    expect(html).toContain('data-tinyfly="Clip"') // also a timeline target
    expect(html).toContain('data-tinyfly-media')
    expect(html).toContain('object-fit: cover')
    expect(html).toContain('muted')
    expect(html).toContain('loop')
    expect(html).toContain('src="v.mp4"')
  })

  it('omits audio with no source', () => {
    expect(generateElementHtml(audio({ src: '' }))).toBe('')
  })

  it('renders a placeholder div for a sourceless video', () => {
    const html = generateElementHtml(video({ src: '' }))
    expect(html).toContain('<div')
    expect(html).not.toContain('<video')
  })
})
