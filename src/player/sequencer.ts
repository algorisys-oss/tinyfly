import { Timeline, deserializeTimeline } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import type {
  SequenceDefinition,
  SequenceScene,
  SequencerOptions,
  TransitionType,
} from './sequence-types'

type SequencerState = 'idle' | 'playing-scene' | 'transitioning'

/**
 * Multi-scene animation player that plays scenes in sequence with transitions.
 *
 * Uses a dual-container approach: during transitions, both the outgoing and
 * incoming scenes render simultaneously in separate containers, and CSS
 * handles the visual transition effect.
 */
export class TinyflySequencer {
  private container: HTMLElement
  private containerA: HTMLElement
  private containerB: HTMLElement
  private adapterA: DOMAdapter
  private adapterB: DOMAdapter
  private timelineA: Timeline | null = null
  private timelineB: Timeline | null = null
  private sequence: SequenceDefinition | null = null
  private options: SequencerOptions

  private _currentSceneIndex = 0
  private _state: SequencerState = 'idle'
  private _isPlaying = false
  private _isDestroyed = false
  private loopIteration = 0

  private animationFrameId: number | undefined
  private lastTime: number | undefined
  private transitionTimer: number | undefined

  constructor(container: HTMLElement | string, options: SequencerOptions = {}) {
    if (typeof container === 'string') {
      const el = document.querySelector(container) as HTMLElement
      if (!el) throw new Error(`Container not found: ${container}`)
      this.container = el
    } else {
      this.container = container
    }

    this.options = options

    // Set up container for absolute positioning
    this.container.style.position = 'relative'
    this.container.style.overflow = 'hidden'

    // Create dual scene containers
    this.containerA = this.createSceneContainer()
    this.containerB = this.createSceneContainer()
    this.container.appendChild(this.containerA)
    this.container.appendChild(this.containerB)

    // Initially hide container B
    this.containerB.style.visibility = 'hidden'

    this.adapterA = new DOMAdapter()
    this.adapterB = new DOMAdapter()
  }

  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(source: string | SequenceDefinition): Promise<void> {
    let definition: SequenceDefinition

    if (typeof source === 'string') {
      const response = await fetch(source)
      if (!response.ok) {
        throw new Error(`Failed to load sequence: ${response.statusText}`)
      }
      definition = await response.json()
    } else {
      definition = source
    }

    this.sequence = definition

    // Set container dimensions from canvas
    this.container.style.width = `${definition.canvas.width}px`
    this.container.style.height = `${definition.canvas.height}px`

    // Load first scene
    if (definition.scenes.length > 0) {
      this.renderScene(definition.scenes[0], this.containerA, this.adapterA)
      this.timelineA = this.createTimeline(definition.scenes[0])
    }

    if (this.options.autoplay) {
      this.play()
    }
  }

  /**
   * Start or resume playback.
   */
  play(): void {
    if (!this.sequence || this._isDestroyed) return
    if (this.sequence.scenes.length === 0) return

    this._isPlaying = true

    if (this._state === 'idle') {
      this._state = 'playing-scene'
      this._currentSceneIndex = 0

      // Start the first scene's timeline
      if (this.timelineA) {
        this.timelineA.onComplete = () => this.onSceneComplete()
        this.timelineA.play()
      } else {
        // Scene has no timeline — immediately advance
        this.onSceneComplete()
        return
      }

      this.options.onSceneChange?.(0)
    } else if (this._state === 'playing-scene' && this.timelineA) {
      this.timelineA.play()
    }

    this.startAnimationLoop()
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this._isPlaying) return
    this._isPlaying = false

    if (this.timelineA) this.timelineA.pause()
    if (this.timelineB) this.timelineB.pause()
    this.stopAnimationLoop()
  }

  /**
   * Stop playback and reset to beginning.
   */
  stop(): void {
    this._isPlaying = false
    this._state = 'idle'
    this._currentSceneIndex = 0
    this.loopIteration = 0

    if (this.transitionTimer !== undefined) {
      clearTimeout(this.transitionTimer)
      this.transitionTimer = undefined
    }

    if (this.timelineA) this.timelineA.stop()
    if (this.timelineB) this.timelineB.stop()
    this.stopAnimationLoop()

    // Reset to first scene
    if (this.sequence && this.sequence.scenes.length > 0) {
      this.clearContainer(this.containerA)
      this.clearContainer(this.containerB)
      this.adapterA.clearTargets()
      this.adapterB.clearTargets()
      this.containerB.style.visibility = 'hidden'
      this.resetTransitionStyles(this.containerA)
      this.resetTransitionStyles(this.containerB)

      this.renderScene(this.sequence.scenes[0], this.containerA, this.adapterA)
      this.timelineA = this.createTimeline(this.sequence.scenes[0])

      // Apply initial state
      if (this.timelineA) {
        const state = this.timelineA.getStateAtTime(0)
        this.adapterA.applyState(state)
      }
    }
  }

  /**
   * Jump to a specific scene by index.
   */
  goToScene(index: number): void {
    if (!this.sequence) return
    if (index < 0 || index >= this.sequence.scenes.length) return

    const wasPlaying = this._isPlaying

    // Clean up current state
    if (this.transitionTimer !== undefined) {
      clearTimeout(this.transitionTimer)
      this.transitionTimer = undefined
    }
    this.stopAnimationLoop()
    if (this.timelineA) this.timelineA.stop()
    if (this.timelineB) this.timelineB.stop()

    // Set up the target scene
    this._currentSceneIndex = index
    this._state = wasPlaying ? 'playing-scene' : 'idle'

    this.clearContainer(this.containerA)
    this.clearContainer(this.containerB)
    this.adapterA.clearTargets()
    this.adapterB.clearTargets()
    this.containerB.style.visibility = 'hidden'
    this.resetTransitionStyles(this.containerA)
    this.resetTransitionStyles(this.containerB)

    const scene = this.sequence.scenes[index]
    this.renderScene(scene, this.containerA, this.adapterA)
    this.timelineA = this.createTimeline(scene)

    this.options.onSceneChange?.(index)

    if (wasPlaying) {
      if (this.timelineA) {
        this.timelineA.onComplete = () => this.onSceneComplete()
        this.timelineA.play()
        this.startAnimationLoop()
      } else {
        this.onSceneComplete()
      }
    } else if (this.timelineA) {
      const state = this.timelineA.getStateAtTime(0)
      this.adapterA.applyState(state)
    }
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this._isDestroyed = true
    this._isPlaying = false

    if (this.transitionTimer !== undefined) {
      clearTimeout(this.transitionTimer)
      this.transitionTimer = undefined
    }
    this.stopAnimationLoop()

    this.adapterA.clearTargets()
    this.adapterB.clearTargets()

    if (this.timelineA) this.timelineA.stop()
    if (this.timelineB) this.timelineB.stop()
    this.timelineA = null
    this.timelineB = null

    // Remove scene containers
    if (this.containerA.parentNode) this.containerA.remove()
    if (this.containerB.parentNode) this.containerB.remove()

    this.sequence = null
  }

  get currentSceneIndex(): number {
    return this._currentSceneIndex
  }

  get sceneCount(): number {
    return this.sequence?.scenes.length ?? 0
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get state(): SequencerState {
    return this._state
  }

  // --- Private methods ---

  private createSceneContainer(): HTMLElement {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.top = '0'
    el.style.left = '0'
    el.style.width = '100%'
    el.style.height = '100%'
    return el
  }

  private renderScene(scene: SequenceScene, container: HTMLElement, adapter: DOMAdapter): void {
    container.innerHTML = ''
    adapter.clearTargets()

    for (const element of scene.elements) {
      if (!element.html) continue

      // Parse the HTML string into DOM nodes
      const temp = document.createElement('div')
      temp.innerHTML = element.html.trim()
      const node = temp.firstElementChild as HTMLElement
      if (node) {
        container.appendChild(node)

        // Register target for the adapter
        const tinyflyAttr = node.getAttribute('data-tinyfly')
        if (tinyflyAttr) {
          adapter.registerTarget(tinyflyAttr, node)
        }
      }
    }
  }

  private clearContainer(container: HTMLElement): void {
    container.innerHTML = ''
  }

  private createTimeline(scene: SequenceScene): Timeline | null {
    if (!scene.timeline) return null
    return deserializeTimeline(scene.timeline)
  }

  private onSceneComplete(): void {
    if (this._isDestroyed || !this.sequence) return

    const nextIndex = this._currentSceneIndex + 1

    if (nextIndex >= this.sequence.scenes.length) {
      // End of sequence
      const loop = this.options.loop ?? this.sequence.loop ?? 0

      if (loop === -1 || (loop > 0 && this.loopIteration < loop - 1)) {
        // Loop: restart from scene 0
        this.loopIteration++
        this.beginTransitionTo(0)
      } else {
        // Sequence complete
        this._isPlaying = false
        this._state = 'idle'
        this.stopAnimationLoop()
        this.options.onComplete?.()
      }
    } else {
      this.beginTransitionTo(nextIndex)
    }
  }

  private beginTransitionTo(nextIndex: number): void {
    if (!this.sequence || this._isDestroyed) return

    const nextScene = this.sequence.scenes[nextIndex]
    const transition = nextScene.transition

    if (transition.type === 'none' || transition.duration <= 0) {
      // No transition — jump directly
      this.switchToScene(nextIndex)
      return
    }

    // Begin transition
    this._state = 'transitioning'

    // Prepare container B with the next scene
    this.containerB.style.visibility = 'visible'
    this.renderScene(nextScene, this.containerB, this.adapterB)
    this.timelineB = this.createTimeline(nextScene)

    // Start next scene's timeline during transition
    if (this.timelineB) {
      this.timelineB.play()
    }

    // Apply CSS transition
    this.applyTransition(transition.type, transition.duration)

    // After transition ends, finalize
    this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(nextIndex)
    }, transition.duration)
  }

  private applyTransition(type: TransitionType, duration: number): void {
    const durationSec = `${duration}ms`
    const easing = 'ease-in-out'

    // Reset positions
    this.resetTransitionStyles(this.containerA)
    this.resetTransitionStyles(this.containerB)

    // Set initial positions for incoming container
    switch (type) {
      case 'fade':
        this.containerB.style.opacity = '0'
        break
      case 'slide-left':
        this.containerB.style.transform = 'translateX(100%)'
        break
      case 'slide-right':
        this.containerB.style.transform = 'translateX(-100%)'
        break
      case 'slide-up':
        this.containerB.style.transform = 'translateY(100%)'
        break
      case 'slide-down':
        this.containerB.style.transform = 'translateY(-100%)'
        break
    }

    // Force reflow so initial state is applied before transition starts
    void this.containerB.offsetHeight

    // Set transition property on both containers
    this.containerA.style.transition = `opacity ${durationSec} ${easing}, transform ${durationSec} ${easing}`
    this.containerB.style.transition = `opacity ${durationSec} ${easing}, transform ${durationSec} ${easing}`

    // Apply final states
    switch (type) {
      case 'fade':
        this.containerA.style.opacity = '0'
        this.containerB.style.opacity = '1'
        break
      case 'slide-left':
        this.containerA.style.transform = 'translateX(-100%)'
        this.containerB.style.transform = 'translateX(0)'
        break
      case 'slide-right':
        this.containerA.style.transform = 'translateX(100%)'
        this.containerB.style.transform = 'translateX(0)'
        break
      case 'slide-up':
        this.containerA.style.transform = 'translateY(-100%)'
        this.containerB.style.transform = 'translateY(0)'
        break
      case 'slide-down':
        this.containerA.style.transform = 'translateY(100%)'
        this.containerB.style.transform = 'translateY(0)'
        break
    }
  }

  private resetTransitionStyles(container: HTMLElement): void {
    container.style.transition = ''
    container.style.opacity = '1'
    container.style.transform = ''
  }

  private finishTransition(nextIndex: number): void {
    this.transitionTimer = undefined

    // Stop old timeline
    if (this.timelineA) {
      this.timelineA.stop()
      this.timelineA = null
    }
    this.adapterA.clearTargets()
    this.clearContainer(this.containerA)

    // Swap containers: B becomes the active container
    const tempContainer = this.containerA
    this.containerA = this.containerB
    this.containerB = tempContainer

    const tempAdapter = this.adapterA
    this.adapterA = this.adapterB
    this.adapterB = tempAdapter

    this.timelineA = this.timelineB
    this.timelineB = null

    // Hide the now-empty container B
    this.containerB.style.visibility = 'hidden'
    this.resetTransitionStyles(this.containerA)
    this.resetTransitionStyles(this.containerB)

    // Update state
    this._currentSceneIndex = nextIndex
    this._state = 'playing-scene'

    this.options.onSceneChange?.(nextIndex)

    // Set up completion handler for the new scene
    if (this.timelineA) {
      this.timelineA.onComplete = () => this.onSceneComplete()

      // If not already playing (shouldn't happen, but be safe)
      if (this.timelineA.playbackState !== 'playing') {
        this.timelineA.play()
      }
    } else {
      // No timeline — immediately advance
      this.onSceneComplete()
    }
  }

  private switchToScene(nextIndex: number): void {
    if (!this.sequence || this._isDestroyed) return

    // Stop old timeline
    if (this.timelineA) this.timelineA.stop()
    this.adapterA.clearTargets()
    this.clearContainer(this.containerA)

    // Load new scene directly into container A
    const scene = this.sequence.scenes[nextIndex]
    this.renderScene(scene, this.containerA, this.adapterA)
    this.timelineA = this.createTimeline(scene)

    this._currentSceneIndex = nextIndex
    this._state = 'playing-scene'

    this.options.onSceneChange?.(nextIndex)

    if (this.timelineA) {
      this.timelineA.onComplete = () => this.onSceneComplete()
      this.timelineA.play()
    } else {
      this.onSceneComplete()
    }
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== undefined) return

    this.lastTime = performance.now()

    const animate = (currentTime: number) => {
      if (this._isDestroyed || !this._isPlaying) return

      const delta = currentTime - (this.lastTime ?? currentTime)
      this.lastTime = currentTime

      // Tick active timelines
      if (this.timelineA && this.timelineA.playbackState === 'playing') {
        this.timelineA.tick(delta)
        const stateA = this.timelineA.getStateAtTime(this.timelineA.currentTime)
        this.adapterA.applyState(stateA)
      }

      if (this._state === 'transitioning' && this.timelineB && this.timelineB.playbackState === 'playing') {
        this.timelineB.tick(delta)
        const stateB = this.timelineB.getStateAtTime(this.timelineB.currentTime)
        this.adapterB.applyState(stateB)
      }

      if (this._isPlaying) {
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
}

/**
 * Simple function to play a multi-scene animation sequence.
 *
 * Usage:
 * ```ts
 * const seq = await playSequence('#container', 'sequence.json', { loop: -1 })
 * ```
 */
export async function playSequence(
  container: HTMLElement | string,
  source: string | SequenceDefinition,
  options: SequencerOptions = {}
): Promise<TinyflySequencer> {
  const sequencer = new TinyflySequencer(container, { ...options, autoplay: true })
  await sequencer.load(source)
  return sequencer
}
