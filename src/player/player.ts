import { Timeline, deserializeTimeline } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import type { TimelineDefinition, AnimationState } from '../engine'

export interface PlayerOptions {
  /** Playback speed multiplier (default: 1) */
  speed?: number
  /** Number of times to loop (-1 for infinite, 0 for no loop) */
  loop?: number
  /** Alternate direction on each loop (ping-pong effect) */
  alternate?: boolean
  /** Auto-play on load (default: false) */
  autoplay?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Callback on each frame update */
  onUpdate?: (state: AnimationState) => void
}

export interface TargetMapping {
  [targetName: string]: HTMLElement | string
}

/**
 * Lightweight animation player for embedding tinyfly animations.
 *
 * Usage:
 * ```ts
 * const player = new TinyflyPlayer(container)
 * await player.load('animation.json')
 * player.play()
 * ```
 */
export class TinyflyPlayer {
  private container: HTMLElement
  private timeline: Timeline | null = null
  private adapter: DOMAdapter
  private animationFrameId: number | undefined
  private lastTime: number | undefined
  private options: PlayerOptions
  private targets: TargetMapping = {}
  private isDestroyed = false

  constructor(container: HTMLElement | string, options: PlayerOptions = {}) {
    // Resolve container
    if (typeof container === 'string') {
      const el = document.querySelector(container) as HTMLElement
      if (!el) {
        throw new Error(`Container not found: ${container}`)
      }
      this.container = el
    } else {
      this.container = container
    }

    this.options = options
    this.adapter = new DOMAdapter()
  }

  /**
   * Load animation from a URL or JSON object.
   */
  async load(source: string | TimelineDefinition): Promise<void> {
    let definition: TimelineDefinition

    if (typeof source === 'string') {
      // Fetch from URL
      const response = await fetch(source)
      if (!response.ok) {
        throw new Error(`Failed to load animation: ${response.statusText}`)
      }
      definition = await response.json()
    } else {
      definition = source
    }

    // Apply options to config
    if (this.options.speed !== undefined) {
      definition.config = { ...definition.config, speed: this.options.speed }
    }
    if (this.options.loop !== undefined) {
      definition.config = { ...definition.config, loop: this.options.loop }
    }
    if (this.options.alternate !== undefined) {
      definition.config = { ...definition.config, alternate: this.options.alternate }
    }

    // Create timeline from definition
    this.timeline = deserializeTimeline(definition)

    // Set up callbacks
    if (this.options.onComplete) {
      this.timeline.onComplete = this.options.onComplete
    }
    if (this.options.onUpdate) {
      this.timeline.onUpdate = this.options.onUpdate
    }

    // Auto-register targets from container
    this.autoRegisterTargets()

    // Auto-play if enabled
    if (this.options.autoplay) {
      this.play()
    }
  }

  /**
   * Load animation from inline JSON string.
   */
  loadFromString(json: string): void {
    const definition = JSON.parse(json) as TimelineDefinition
    this.load(definition)
  }

  /**
   * Register a target element by name.
   */
  registerTarget(name: string, element: HTMLElement | string): void {
    if (typeof element === 'string') {
      const el = this.container.querySelector(element) as HTMLElement
      if (el) {
        this.targets[name] = el
        this.adapter.registerTarget(name, el)
      }
    } else {
      this.targets[name] = element
      this.adapter.registerTarget(name, element)
    }
  }

  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  private autoRegisterTargets(): void {
    // Find elements with data-tinyfly attribute
    const elements = this.container.querySelectorAll('[data-tinyfly]')
    elements.forEach((el) => {
      const name = el.getAttribute('data-tinyfly')
      if (name) {
        this.registerTarget(name, el as HTMLElement)
      }
    })

    // Also look for elements matching target names from timeline
    if (this.timeline) {
      const targetNames = new Set(this.timeline.tracks.map((t) => t.target))
      targetNames.forEach((name) => {
        if (!this.targets[name]) {
          // Try to find by class, id, or data attribute
          const el =
            this.container.querySelector(`[data-tinyfly="${name}"]`) ||
            this.container.querySelector(`.${name}`) ||
            this.container.querySelector(`#${name}`)
          if (el) {
            this.registerTarget(name, el as HTMLElement)
          }
        }
      })
    }
  }

  /**
   * Start or resume playback.
   */
  play(): void {
    if (!this.timeline || this.isDestroyed) return

    this.timeline.play()
    this.startAnimationLoop()
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this.timeline) return
    this.timeline.pause()
    this.stopAnimationLoop()
  }

  /**
   * Stop playback and reset to beginning.
   */
  stop(): void {
    if (!this.timeline) return
    this.timeline.stop()
    this.stopAnimationLoop()
    this.applyState()
  }

  /**
   * Seek to a specific time (in milliseconds).
   */
  seek(time: number): void {
    if (!this.timeline) return
    this.timeline.seek(time)
    this.applyState()
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    if (!this.timeline) return
    this.timeline.speed = speed
  }

  /**
   * Reverse playback direction.
   */
  reverse(): void {
    if (!this.timeline) return
    this.timeline.reverse()
  }

  /**
   * Get current playback time.
   */
  get currentTime(): number {
    return this.timeline?.currentTime ?? 0
  }

  /**
   * Get total duration.
   */
  get duration(): number {
    return this.timeline?.duration ?? 0
  }

  /**
   * Check if currently playing.
   */
  get isPlaying(): boolean {
    return this.timeline?.playbackState === 'playing'
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.isDestroyed = true
    this.stopAnimationLoop()
    this.adapter.clearTargets()
    this.timeline = null
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== undefined) return

    this.lastTime = performance.now()

    const animate = (currentTime: number) => {
      if (this.isDestroyed || !this.timeline) return

      const delta = currentTime - (this.lastTime ?? currentTime)
      this.lastTime = currentTime

      this.timeline.tick(delta)
      this.applyState()

      if (this.timeline.playbackState === 'playing') {
        this.animationFrameId = requestAnimationFrame(animate)
      } else {
        this.animationFrameId = undefined
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = undefined
    }
  }

  private applyState(): void {
    if (!this.timeline) return
    const state = this.timeline.getStateAtTime(this.timeline.currentTime)
    this.adapter.applyState(state)
  }
}

/**
 * Simple function to play an animation on a container.
 *
 * Usage:
 * ```ts
 * tinyfly.play('#my-element', 'animation.json', { loop: -1 })
 * ```
 */
export async function play(
  container: HTMLElement | string,
  source: string | TimelineDefinition,
  options: PlayerOptions = {}
): Promise<TinyflyPlayer> {
  const player = new TinyflyPlayer(container, { ...options, autoplay: true })
  await player.load(source)
  return player
}

/**
 * Create a player without auto-playing.
 */
export function create(
  container: HTMLElement | string,
  options: PlayerOptions = {}
): TinyflyPlayer {
  return new TinyflyPlayer(container, options)
}

// Default export for convenience
export default { TinyflyPlayer, play, create }
