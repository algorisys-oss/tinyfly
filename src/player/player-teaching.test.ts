/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TinyflyPlayer } from './player'
import { deserializeTimeline, type TimelineDefinition } from '../engine'

/**
 * Teaching behaviour: a frame on load, markers and stepping, captions,
 * reduced motion, play-when-visible, and SVG paint.
 */

let frameCallbacks: Array<(time: number) => void> = []
let now = 0
function runFrames(count: number, stepMs = 50) {
  for (let i = 0; i < count; i++) {
    const callbacks = frameCallbacks
    frameCallbacks = []
    now += stepMs
    for (const callback of callbacks) callback(now)
  }
}

let reduce = false
const mediaListeners: Array<() => void> = []

const lesson: TimelineDefinition = {
  id: 'slice',
  config: {
    duration: 3000,
    markers: [
      { id: 'append', time: 1000, label: 'append 4' },
      { id: 'grow', time: 2000, label: 'cap is full' },
    ],
  },
  captions: { es: { append: 'añadir 4', grow: 'la capacidad se llena' } },
  tracks: [
    { id: 'x', target: 'cell', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 300 }] },
    { id: 'fill', target: 'cell', property: 'fill', keyframes: [{ time: 0, value: '#ffffff' }, { time: 3000, value: '#ff0000' }] },
  ],
}

let container: HTMLElement
let cell: HTMLElement

beforeEach(() => {
  frameCallbacks = []
  now = 0
  reduce = false
  mediaListeners.length = 0
  vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => (frameCallbacks.push(callback), frameCallbacks.length))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('reduce') && reduce
    },
    addEventListener: (_: string, listener: () => void) => mediaListeners.push(listener),
    removeEventListener: () => {},
  }))
  document.body.innerHTML = '<div id="figure"><svg viewBox="0 0 400 100"><rect data-tinyfly="cell" width="50" height="50"/></svg></div>'
  container = document.getElementById('figure')!
  cell = container.querySelector('rect') as unknown as HTMLElement
})

afterEach(() => vi.unstubAllGlobals())

const x = () => cell.style.transform

describe('teaching player', () => {
  it('shows the first frame on load, or the end, or leaves the markup', async () => {
    await new TinyflyPlayer(container).load(lesson)
    expect(x()).toBe('translateX(0px)')
    await new TinyflyPlayer(container, { initialFrame: 'end' }).load(lesson)
    expect(x()).toBe('translateX(300px)')
    cell.style.transform = ''
    await new TinyflyPlayer(container, { initialFrame: 'none' }).load(lesson)
    expect(x()).toBe('')
  })

  it('paints SVG fill as a presentation style, not a background', async () => {
    await new TinyflyPlayer(container, { initialFrame: 'end' }).load(lesson)
    expect(cell.style.getPropertyValue('fill')).toMatch(/#ff0000|rgb\(255, 0, 0\)/)
    expect(cell.style.backgroundColor).toBe('')
  })

  it('steps: play() stops at each marker in step mode, next() animates to the next, prev() jumps back', async () => {
    const seen: Array<string | undefined> = []
    const player = new TinyflyPlayer(container, { stepMode: true, onMarker: (marker) => seen.push(marker?.id) })
    await player.load(lesson)
    player.play()
    runFrames(40)
    expect(player.currentTime).toBe(1000)
    expect(player.isPlaying).toBe(false)
    expect(player.currentMarker?.id).toBe('append')

    player.next()
    runFrames(40)
    expect(player.currentTime).toBe(2000)
    player.next()
    runFrames(40)
    expect(player.currentTime).toBe(3000)

    player.prev()
    expect(player.currentTime).toBe(2000)
    player.prev()
    expect(player.currentTime).toBe(1000)
    player.goToMarker('grow')
    expect(player.currentTime).toBe(2000)
    expect(seen).toEqual([undefined, 'append', 'grow', 'append', 'grow'])
  })

  it('stops at pause markers even when not stepping', async () => {
    const withQuestion: TimelineDefinition = { ...lesson, config: { ...lesson.config, markers: [{ id: 'q', time: 1500, pause: true, question: 'What is len(s)?' }] } }
    const player = new TinyflyPlayer(container)
    await player.load(withQuestion)
    player.play()
    runFrames(60)
    expect(player.currentTime).toBe(1500)
    player.play()
    runFrames(60)
    expect(player.currentTime).toBe(3000)
  })

  it('captions follow the page language, falling back to labels', async () => {
    const player = new TinyflyPlayer(container)
    await player.load(lesson)
    player.goToMarker('append')
    expect(player.caption()).toBe('append 4')
    container.setAttribute('lang', 'es-MX')
    expect(player.caption()).toBe('añadir 4')
    expect(player.caption('grow', 'en')).toBe('cap is full')
    const translated = new TinyflyPlayer(container, { captions: { 'pt-BR': { append: 'acrescentar 4' } } })
    await translated.load(lesson)
    expect(translated.caption('append', 'pt-BR')).toBe('acrescentar 4')
    expect(translated.caption('grow', 'pt-BR')).toBe('cap is full')
  })

  it('under reduced motion: no autoplay, the final frame, and stepping jumps', async () => {
    reduce = true
    const player = new TinyflyPlayer(container, { autoplay: true })
    await player.load(lesson)
    expect(player.isPlaying).toBe(false)
    expect(x()).toBe('translateX(300px)')
    player.prev()
    expect(player.currentTime).toBe(2000)
    player.prev()
    player.next()
    expect(player.currentTime).toBe(2000)
    expect(player.isPlaying).toBe(false)
  })

  it('stops and shows the end when reduced motion is switched on while playing', async () => {
    const player = new TinyflyPlayer(container, { autoplay: true })
    await player.load(lesson)
    runFrames(5)
    expect(player.isPlaying).toBe(true)
    reduce = true
    mediaListeners.forEach((listener) => listener())
    expect(player.isPlaying).toBe(false)
    expect(player.currentTime).toBe(3000)
  })

  it('pauses off screen and resumes on return; autoplay waits to be seen', async () => {
    let report: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          report = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    container.getBoundingClientRect = () => ({ top: 5000, bottom: 5100, left: 0, right: 400, width: 400, height: 100 }) as DOMRect
    const player = new TinyflyPlayer(container, { autoplay: true, playWhenVisible: true })
    await player.load(lesson)
    expect(player.isPlaying).toBe(false)
    report!([{ isIntersecting: true }])
    expect(player.isPlaying).toBe(true)
    report!([{ isIntersecting: false }])
    expect(player.isPlaying).toBe(false)
    report!([{ isIntersecting: true }])
    expect(player.isPlaying).toBe(true)
    player.destroy()
  })
})

describe('format', () => {
  it('writes its format version and refuses newer ones', () => {
    const timeline = deserializeTimeline(lesson)
    const definition = timeline.toDefinition()
    expect(definition.formatVersion).toBe(1)
    expect(definition.captions?.es?.grow).toBe('la capacidad se llena')
    expect(definition.config.markers).toHaveLength(2)
    expect(() => deserializeTimeline({ ...lesson, formatVersion: 99 })).toThrow(/format version 99/)
  })
})
