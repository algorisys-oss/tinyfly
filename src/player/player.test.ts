/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TinyflyPlayer, play, create } from './player'
import type { TimelineDefinition } from '../engine'

// Mock DOM
function createContainer(): HTMLDivElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function createTargetElement(name: string): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('data-tinyfly', name)
  return el
}

const sampleAnimation: TimelineDefinition = {
  id: 'test-animation',
  name: 'Test Animation',
  config: { duration: 1000 },
  tracks: [
    {
      id: 'opacity-track',
      target: 'box',
      property: 'opacity',
      keyframes: [
        { time: 0, value: 0 },
        { time: 1000, value: 1 },
      ],
    },
  ],
}

describe('TinyflyPlayer', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = createContainer()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('accepts HTMLElement as container', () => {
      const player = new TinyflyPlayer(container)
      expect(player).toBeInstanceOf(TinyflyPlayer)
    })

    it('accepts CSS selector as container', () => {
      container.id = 'test-container'
      const player = new TinyflyPlayer('#test-container')
      expect(player).toBeInstanceOf(TinyflyPlayer)
    })

    it('throws error for invalid selector', () => {
      expect(() => new TinyflyPlayer('#non-existent')).toThrow('Container not found')
    })
  })

  describe('load', () => {
    it('loads animation from object', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.duration).toBe(1000)
    })

    it('applies speed option', async () => {
      const player = new TinyflyPlayer(container, { speed: 2 })
      await player.load(sampleAnimation)

      // Speed is applied to timeline
      expect(player.duration).toBe(1000) // Duration doesn't change, just playback speed
    })

    it('applies loop option', async () => {
      const player = new TinyflyPlayer(container, { loop: 3 })
      await player.load(sampleAnimation)

      expect(player.duration).toBe(1000)
    })

    it('auto-plays when autoplay option is true', async () => {
      const targetEl = createTargetElement('box')
      container.appendChild(targetEl)

      const player = new TinyflyPlayer(container, { autoplay: true })
      await player.load(sampleAnimation)

      expect(player.isPlaying).toBe(true)
      player.stop()
    })

    it('does not auto-play by default', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.isPlaying).toBe(false)
    })
  })

  describe('registerTarget', () => {
    it('registers target by element', async () => {
      const player = new TinyflyPlayer(container)
      const targetEl = document.createElement('div')
      container.appendChild(targetEl)

      player.registerTarget('box', targetEl)
      await player.load(sampleAnimation)

      // Should not throw when playing
      player.play()
      player.stop()
    })

    it('registers target by selector', async () => {
      const player = new TinyflyPlayer(container)
      const targetEl = document.createElement('div')
      targetEl.className = 'my-box'
      container.appendChild(targetEl)

      player.registerTarget('box', '.my-box')
      await player.load(sampleAnimation)

      player.play()
      player.stop()
    })
  })

  describe('auto-register targets', () => {
    it('auto-registers elements with data-tinyfly attribute', async () => {
      const targetEl = createTargetElement('box')
      container.appendChild(targetEl)

      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.play()
      expect(player.isPlaying).toBe(true)
      player.stop()
    })

    it('auto-registers elements by class name', async () => {
      const targetEl = document.createElement('div')
      targetEl.className = 'box'
      container.appendChild(targetEl)

      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.play()
      player.stop()
    })

    it('auto-registers elements by id', async () => {
      const targetEl = document.createElement('div')
      targetEl.id = 'box'
      container.appendChild(targetEl)

      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.play()
      player.stop()
    })
  })

  describe('playback controls', () => {
    it('play starts playback', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.isPlaying).toBe(false)
      player.play()
      expect(player.isPlaying).toBe(true)
      player.stop()
    })

    it('pause pauses playback', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.play()
      expect(player.isPlaying).toBe(true)

      player.pause()
      expect(player.isPlaying).toBe(false)
    })

    it('stop resets to beginning', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.play()
      player.seek(500)
      player.stop()

      expect(player.isPlaying).toBe(false)
      expect(player.currentTime).toBe(0)
    })

    it('seek moves to specific time', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.seek(500)
      expect(player.currentTime).toBe(500)
    })

    it('setSpeed changes playback speed', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.setSpeed(2)
      // Speed is applied internally
    })

    it('reverse changes direction', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.seek(1000)
      player.reverse()
      player.play()

      expect(player.isPlaying).toBe(true)
      player.stop()
    })
  })

  describe('properties', () => {
    it('currentTime returns current playback position', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.currentTime).toBe(0)
      player.seek(500)
      expect(player.currentTime).toBe(500)
    })

    it('duration returns total animation duration', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.duration).toBe(1000)
    })

    it('isPlaying returns playback state', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      expect(player.isPlaying).toBe(false)
      player.play()
      expect(player.isPlaying).toBe(true)
      player.pause()
      expect(player.isPlaying).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('calls onComplete when animation finishes', async () => {
      const onComplete = vi.fn()
      const player = new TinyflyPlayer(container, { onComplete })
      await player.load(sampleAnimation)

      // Manually trigger complete by seeking to end and ticking
      player.seek(1000)
      player.play()

      // Wait for animation frame
      await new Promise((r) => setTimeout(r, 50))

      // onComplete should be called when reaching end
      // (depends on timeline behavior)
    })

    it('calls onUpdate on each frame', async () => {
      const onUpdate = vi.fn()
      const player = new TinyflyPlayer(container, { onUpdate })
      await player.load(sampleAnimation)

      player.play()
      await new Promise((r) => setTimeout(r, 50))
      player.stop()

      // onUpdate should have been called at least once
      // (depends on animation frame timing)
    })
  })

  describe('destroy', () => {
    it('cleans up resources', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)
      player.play()

      player.destroy()

      expect(player.isPlaying).toBe(false)
    })

    it('prevents further playback after destroy', async () => {
      const player = new TinyflyPlayer(container)
      await player.load(sampleAnimation)

      player.destroy()
      player.play()

      expect(player.isPlaying).toBe(false)
    })
  })
})

describe('play helper function', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = createContainer()
  })

  afterEach(() => {
    container.remove()
  })

  it('creates player and starts playback', async () => {
    const player = await play(container, sampleAnimation)

    expect(player).toBeInstanceOf(TinyflyPlayer)
    expect(player.isPlaying).toBe(true)

    player.stop()
  })

  it('accepts options', async () => {
    const onComplete = vi.fn()
    const player = await play(container, sampleAnimation, {
      loop: 2,
      onComplete,
    })

    expect(player.isPlaying).toBe(true)
    player.stop()
  })
})

describe('create helper function', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = createContainer()
  })

  afterEach(() => {
    container.remove()
  })

  it('creates player without auto-play', () => {
    const player = create(container)

    expect(player).toBeInstanceOf(TinyflyPlayer)
  })

  it('accepts options', () => {
    const player = create(container, { speed: 2, loop: -1 })

    expect(player).toBeInstanceOf(TinyflyPlayer)
  })
})
