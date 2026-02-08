/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TinyflySequencer, playSequence } from './sequencer'
import type { SequenceDefinition, SequenceScene } from './sequence-types'

// Mock DOM environment
function createContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function createSequenceScene(id: string, name: string, overrides: Partial<SequenceScene> = {}): SequenceScene {
  return {
    id,
    name,
    elements: [
      {
        type: 'rect',
        name: 'box',
        x: 0, y: 0, width: 50, height: 50,
        rotation: 0, opacity: 1,
        html: '<div data-tinyfly="box" style="position: absolute; left: 0px; top: 0px; width: 50px; height: 50px; background: #4a9eff;"></div>',
      },
    ],
    timeline: {
      id: `timeline-${id}`,
      config: { duration: 100, loop: 0 },
      tracks: [
        {
          id: `track-${id}`,
          target: 'box',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 100, value: 1 },
          ],
        },
      ],
    },
    transition: { type: 'none', duration: 0 },
    ...overrides,
  }
}

function createTestSequence(sceneCount = 2): SequenceDefinition {
  return {
    id: 'test-seq',
    name: 'Test Sequence',
    canvas: { width: 300, height: 200 },
    scenes: Array.from({ length: sceneCount }, (_, i) =>
      createSequenceScene(`scene-${i}`, `Scene ${i + 1}`)
    ),
  }
}

describe('TinyflySequencer', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
    // Mock performance.now for RAF
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should accept HTMLElement container', () => {
      const seq = new TinyflySequencer(container)
      expect(seq).toBeDefined()
      expect(seq.currentSceneIndex).toBe(0)
      expect(seq.sceneCount).toBe(0)
      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })

    it('should accept string selector', () => {
      container.id = 'test-container'
      const seq = new TinyflySequencer('#test-container')
      expect(seq).toBeDefined()
      seq.destroy()
    })

    it('should throw for invalid selector', () => {
      expect(() => new TinyflySequencer('#nonexistent')).toThrow('Container not found')
    })

    it('should create dual scene containers', () => {
      const seq = new TinyflySequencer(container)
      // Container should have 2 child divs (scene containers A and B)
      expect(container.children.length).toBe(2)
      seq.destroy()
    })
  })

  describe('load', () => {
    it('should load a sequence definition', async () => {
      const seq = new TinyflySequencer(container)
      const definition = createTestSequence()

      await seq.load(definition)

      expect(seq.sceneCount).toBe(2)
      expect(seq.currentSceneIndex).toBe(0)
      seq.destroy()
    })

    it('should set container dimensions from canvas', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      expect(container.style.width).toBe('300px')
      expect(container.style.height).toBe('200px')
      seq.destroy()
    })

    it('should render first scene elements', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      // First scene container (container A) should have the box element
      const containerA = container.children[0] as HTMLElement
      const box = containerA.querySelector('[data-tinyfly="box"]')
      expect(box).not.toBeNull()
      seq.destroy()
    })

    it('should autoplay when option is set', async () => {
      const seq = new TinyflySequencer(container, { autoplay: true })
      await seq.load(createTestSequence())

      expect(seq.isPlaying).toBe(true)
      seq.destroy()
    })

    it('should not autoplay by default', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })
  })

  describe('play/pause/stop', () => {
    it('should start playing', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.play()
      expect(seq.isPlaying).toBe(true)
      expect(seq.state).toBe('playing-scene')
      seq.destroy()
    })

    it('should pause playback', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.play()
      seq.pause()
      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })

    it('should stop and reset to beginning', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.play()
      seq.stop()
      expect(seq.isPlaying).toBe(false)
      expect(seq.currentSceneIndex).toBe(0)
      expect(seq.state).toBe('idle')
      seq.destroy()
    })

    it('should do nothing when playing without loaded sequence', () => {
      const seq = new TinyflySequencer(container)
      seq.play()
      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })

    it('should do nothing when playing empty sequence', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load({
        id: 'empty', name: 'Empty', canvas: { width: 100, height: 100 }, scenes: [],
      })
      seq.play()
      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })
  })

  describe('goToScene', () => {
    it('should jump to a specific scene', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence(3))

      seq.goToScene(2)
      expect(seq.currentSceneIndex).toBe(2)
      seq.destroy()
    })

    it('should ignore invalid index (negative)', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.goToScene(-1)
      expect(seq.currentSceneIndex).toBe(0)
      seq.destroy()
    })

    it('should ignore invalid index (too large)', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.goToScene(10)
      expect(seq.currentSceneIndex).toBe(0)
      seq.destroy()
    })

    it('should continue playing after jump if was playing', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence(3))

      seq.play()
      seq.goToScene(1)
      expect(seq.isPlaying).toBe(true)
      expect(seq.currentSceneIndex).toBe(1)
      seq.destroy()
    })

    it('should not start playing after jump if was not playing', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence(3))

      seq.goToScene(1)
      expect(seq.isPlaying).toBe(false)
      seq.destroy()
    })
  })

  describe('callbacks', () => {
    it('should call onSceneChange when play starts', async () => {
      const onSceneChange = vi.fn()
      const seq = new TinyflySequencer(container, { onSceneChange })
      await seq.load(createTestSequence())

      seq.play()
      expect(onSceneChange).toHaveBeenCalledWith(0)
      seq.destroy()
    })

    it('should call onSceneChange on goToScene', async () => {
      const onSceneChange = vi.fn()
      const seq = new TinyflySequencer(container, { onSceneChange })
      await seq.load(createTestSequence(3))

      seq.goToScene(2)
      expect(onSceneChange).toHaveBeenCalledWith(2)
      seq.destroy()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())
      seq.play()

      seq.destroy()
      expect(seq.isPlaying).toBe(false)
      expect(seq.sceneCount).toBe(0)
      // Scene containers should be removed
      expect(container.children.length).toBe(0)
    })

    it('should not respond to play after destroy', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())
      seq.destroy()

      seq.play()
      expect(seq.isPlaying).toBe(false)
    })
  })

  describe('scenes with no timeline', () => {
    it('should handle scene with null timeline', async () => {
      const seq = new TinyflySequencer(container)
      const definition: SequenceDefinition = {
        id: 'test',
        name: 'Test',
        canvas: { width: 100, height: 100 },
        scenes: [
          createSequenceScene('s1', 'Scene 1', { timeline: null }),
          createSequenceScene('s2', 'Scene 2'),
        ],
      }

      await seq.load(definition)
      seq.play()
      // Should advance past the null-timeline scene
      // (onSceneComplete fires immediately)
      expect(seq.isPlaying).toBe(true)
      seq.destroy()
    })
  })

  describe('transitions', () => {
    it('should handle fade transition between scenes', async () => {
      const seq = new TinyflySequencer(container)
      const definition: SequenceDefinition = {
        id: 'test',
        name: 'Test',
        canvas: { width: 100, height: 100 },
        scenes: [
          createSequenceScene('s1', 'Scene 1'),
          createSequenceScene('s2', 'Scene 2', {
            transition: { type: 'fade', duration: 200 },
          }),
        ],
      }

      await seq.load(definition)
      expect(seq.sceneCount).toBe(2)
      seq.destroy()
    })

    it('should handle slide transition types', async () => {
      const seq = new TinyflySequencer(container)
      const definition: SequenceDefinition = {
        id: 'test',
        name: 'Test',
        canvas: { width: 100, height: 100 },
        scenes: [
          createSequenceScene('s1', 'Scene 1'),
          createSequenceScene('s2', 'Scene 2', {
            transition: { type: 'slide-left', duration: 300 },
          }),
          createSequenceScene('s3', 'Scene 3', {
            transition: { type: 'slide-right', duration: 300 },
          }),
        ],
      }

      await seq.load(definition)
      expect(seq.sceneCount).toBe(3)
      seq.destroy()
    })
  })

  describe('state property', () => {
    it('should be idle before play', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      expect(seq.state).toBe('idle')
      seq.destroy()
    })

    it('should be playing-scene during playback', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.play()
      expect(seq.state).toBe('playing-scene')
      seq.destroy()
    })

    it('should return to idle after stop', async () => {
      const seq = new TinyflySequencer(container)
      await seq.load(createTestSequence())

      seq.play()
      seq.stop()
      expect(seq.state).toBe('idle')
      seq.destroy()
    })
  })
})

describe('playSequence helper', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('should create and auto-play a sequencer', async () => {
    const seq = await playSequence(container, createTestSequence())
    expect(seq).toBeInstanceOf(TinyflySequencer)
    expect(seq.isPlaying).toBe(true)
    seq.destroy()
  })
})
