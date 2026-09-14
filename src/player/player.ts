import { Timeline, deserializeTimeline, playheadCrossings } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import type { TimelineDefinition, AnimationState, TimelineMarker, Playhead } from '../engine'
import { MediaSync, syncMediaElement, type SyncableMedia, type MediaSyncOptions } from './media-sync'

interface MediaTarget {
  el: HTMLMediaElement
  startTime: number
  sync: MediaSync
}

export interface PlayerOptions {
  /** Playback speed multiplier (default: 1) */
  speed?: number
  /** Number of times to loop (-1 for infinite, 0 for no loop) */
  loop?: number
  /** Alternate direction on each loop (ping-pong effect) */
  alternate?: boolean
  /** Auto-play on load (default: false) */
  autoplay?: boolean
  /**
   * Which frame to show as soon as the animation loads, before anything plays:
   * `'start'` (default), `'end'`, a time in milliseconds, or `'none'` to leave the
   * markup as it is.
   */
  initialFrame?: 'start' | 'end' | 'none' | number
  /**
   * Under `prefers-reduced-motion: reduce`, never autoplay, show the final frame,
   * and make stepping jump instead of animate. Follows changes to the setting.
   * Default `true`.
   */
  respectReducedMotion?: boolean
  /**
   * Pause while the container is off screen or the tab is hidden, and resume
   * when it comes back. With `autoplay`, playback waits until it is first seen.
   * Default `false`.
   */
  playWhenVisible?: boolean
  /** `play()` runs to the next marker and stops there. Default `false`. */
  stepMode?: boolean
  /** Called when the current marker changes (undefined before the first one) */
  onMarker?: (marker: TimelineMarker | undefined) => void
  /**
   * Captions per language, per marker id, from a separate file: merged over the
   * timeline's own captions, so translations can ship without touching its JSON.
   */
  captions?: Record<string, Record<string, string>>
  /** Callback when animation completes */
  onComplete?: () => void
  /** Callback on each frame update */
  onUpdate?: (state: AnimationState) => void
  /**
   * Nested-symbol timelines keyed by symbol id. When the container has symbol
   * instances (`[data-tinyfly-symbol="id"]`), each instance's inner elements are
   * animated by the matching symbol timeline, looped over its duration and synced
   * to the main playhead. Emitted by the editor's embed export.
   */
  symbols?: SymbolAnimation[]
}

/** A symbol's nested timeline, keyed by its id (for embedded symbol instances). */
export interface SymbolAnimation {
  id: string
  timeline: TimelineDefinition
}

interface SymbolInstance {
  adapter: DOMAdapter
  timeline: Timeline
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
  private mediaSync: MediaSync | undefined
  private mediaTargets: MediaTarget[] = []
  private symbolInstances: SymbolInstance[] = []

  private markerList: TimelineMarker[] = []
  private readonly listeners = new Set<() => void>()
  /** Where the playhead was when marker crossings were last worked out */
  private playhead: Playhead = { time: 0, iteration: 0, direction: 'forward' }
  /** Stop at the next marker crossed (step mode, or `next()`) */
  private stepping = false
  private lastMarkerId: string | undefined | null = null
  private reducedQuery: MediaQueryList | undefined
  private readonly onReducedChange = () => this.applyReducedMotion()
  private visibilityObserver: IntersectionObserver | undefined
  private onScreen = true
  /** Playback was paused by leaving the screen, and resumes on return */
  private pausedByVisibility = false
  /** `autoplay` waits for the first time the container is seen */
  private autoplayWhenSeen = false
  private readonly onDocumentVisibility = () => this.updateVisibility()

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
    this.markerList = this.timeline.markers
    this.lastMarkerId = null

    // Set up callbacks
    if (this.options.onComplete) {
      this.timeline.onComplete = this.options.onComplete
    }
    if (this.options.onUpdate) {
      this.timeline.onUpdate = this.options.onUpdate
    }

    // Auto-register targets from container
    this.autoRegisterTargets()

    // Set up nested playback for any embedded symbol instances
    this.setupSymbolInstances()

    // Discover embedded media (audio/video) to sync with the timeline
    this.scanMedia()

    // Show a real frame straight away, so the figure is right before anyone interacts.
    this.showInitialFrame()
    this.watchReducedMotion()
    this.watchVisibility()

    if (this.options.autoplay && !this.reducedMotion) {
      if (this.options.playWhenVisible && !this.onScreen) this.autoplayWhenSeen = true
      else this.play()
    }
  }

  // --- teaching: frames, markers, reduced motion, visibility -----------------

  /**
   * Be told whenever the time, play state or current marker may have changed —
   * for controls and captions. Returns a function that stops it.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }

  /** Whether the reader asked for reduced motion (and the player respects it). */
  get reducedMotion(): boolean {
    return this.reducedQuery?.matches === true
  }

  /** The timeline's markers, in time order. */
  get markers(): TimelineMarker[] {
    return this.markerList
  }

  /** The last marker at or before the playhead. */
  get currentMarker(): TimelineMarker | undefined {
    const time = this.currentTime
    let current: TimelineMarker | undefined
    for (const marker of this.markers) {
      if (marker.time <= time + 0.5) current = marker
      else break
    }
    return current
  }

  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(markerId?: string, lang?: string): string | undefined {
    const marker = markerId ? this.markers.find((candidate) => candidate.id === markerId) : this.currentMarker
    if (!marker) return undefined
    const language = lang ?? this.language()
    const lookup = (captions: Record<string, Record<string, string>> | undefined) =>
      captions?.[language]?.[marker.id] ?? captions?.[language.split('-')[0]]?.[marker.id]
    return lookup(this.options.captions) ?? lookup(this.timeline?.captions) ?? marker.label
  }

  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next(): void {
    if (!this.timeline) return
    const time = this.currentTime
    const upcoming = this.markers.find((marker) => marker.time > time + 0.5)
    if (this.reducedMotion) {
      this.seek(upcoming ? upcoming.time : this.duration)
      return
    }
    if (time >= this.duration - 0.5) return
    this.stepping = upcoming !== undefined
    this.startPlaying()
  }

  /** Jump back to the previous marker (or the start). */
  prev(): void {
    if (!this.timeline) return
    const time = this.currentTime
    const earlier = [...this.markers].reverse().find((marker) => marker.time < time - 0.5)
    this.pause()
    this.seek(earlier ? earlier.time : 0)
  }

  /** Jump to a marker by id, paused there. */
  goToMarker(id: string): void {
    const marker = this.markers.find((candidate) => candidate.id === id)
    if (!marker) return
    this.pause()
    this.seek(marker.time)
  }

  private language(): string {
    const withLang = this.container.closest('[lang]')
    return withLang?.getAttribute('lang') || (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'en'
  }

  private showInitialFrame(): void {
    if (!this.timeline) return
    const frame = this.options.initialFrame ?? 'start'
    if (frame === 'none') return
    const time = frame === 'end' ? this.timeline.duration : frame === 'start' ? 0 : frame
    this.timeline.seek(Math.max(0, Math.min(this.timeline.duration, time)))
    this.applyState()
  }

  private watchReducedMotion(): void {
    if (this.options.respectReducedMotion === false || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    this.reducedQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedQuery.addEventListener?.('change', this.onReducedChange)
    if (this.reducedQuery.matches) this.applyReducedMotion()
  }

  /** Under reduced motion: stop, and show the finished state. */
  private applyReducedMotion(): void {
    if (!this.reducedMotion || !this.timeline) return
    this.autoplayWhenSeen = false
    this.pause()
    this.seek(this.timeline.duration)
  }

  private watchVisibility(): void {
    if (!this.options.playWhenVisible || typeof window === 'undefined') return
    if (typeof IntersectionObserver === 'function') {
      this.visibilityObserver?.disconnect()
    this.listeners.clear()
      this.visibilityObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) this.onScreen = entry.isIntersecting
        this.updateVisibility()
      })
      this.visibilityObserver.observe(this.container)
      // Until the observer reports, assume it is not visible if it is laid out off screen.
      const box = this.container.getBoundingClientRect?.()
      if (box && (box.width > 0 || box.height > 0)) {
        this.onScreen = box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
      }
    }
    document.addEventListener('visibilitychange', this.onDocumentVisibility)
  }

  private updateVisibility(): void {
    const visible = this.onScreen && document.visibilityState !== 'hidden'
    if (!visible && this.isPlaying) {
      this.pausedByVisibility = true
      this.pause()
    } else if (visible && (this.pausedByVisibility || this.autoplayWhenSeen) && !this.reducedMotion) {
      this.pausedByVisibility = false
      this.autoplayWhenSeen = false
      this.startPlaying()
    }
  }

  /** Report the current marker if it changed since the last frame. */
  private announceMarker(): void {
    if (!this.options.onMarker) return
    const marker = this.currentMarker
    const id = marker?.id
    if (id === this.lastMarkerId) return
    this.lastMarkerId = id
    this.options.onMarker(marker)
  }

  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  private scanMedia(): void {
    this.mediaTargets = []
    const nodes = this.container.querySelectorAll('[data-tinyfly-media]')
    nodes.forEach((node) => {
      const el = node as HTMLMediaElement
      const startTime = Number(el.getAttribute('data-tinyfly-start') ?? '0') || 0
      const vol = el.getAttribute('data-volume')
      if (vol !== null) el.volume = Math.max(0, Math.min(1, Number(vol) || 0))
      this.mediaTargets.push({ el, startTime, sync: new MediaSync(el) })
    })
  }

  /** Sync all discovered media targets to a timeline time. */
  private syncAllMedia(timeMs: number, isPlaying: boolean): void {
    for (const target of this.mediaTargets) {
      syncMediaElement(target.sync, target.el, timeMs, isPlaying, target.startTime)
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
    // Find elements with data-tinyfly attribute. Skip elements *inside* a symbol
    // instance container — those are driven by the instance's own nested timeline
    // (see setupSymbolInstances), not the main one. The instance container itself
    // (which carries both data-tinyfly and data-tinyfly-symbol) is still
    // registered so the scene timeline can move the whole instance.
    const elements = this.container.querySelectorAll('[data-tinyfly]')
    elements.forEach((el) => {
      const symContainer = el.closest('[data-tinyfly-symbol]')
      if (symContainer && symContainer !== el) return
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
   * Bind each embedded symbol instance (`[data-tinyfly-symbol="id"]`) to its
   * symbol's nested timeline: a private adapter drives the instance's inner
   * elements, looped over the symbol's duration and synced to the main playhead.
   */
  private setupSymbolInstances(): void {
    this.symbolInstances = []
    const symbols = this.options.symbols
    if (!symbols || symbols.length === 0) return
    const byId = new Map(symbols.map((s) => [s.id, s]))

    this.container.querySelectorAll('[data-tinyfly-symbol]').forEach((container) => {
      const id = container.getAttribute('data-tinyfly-symbol')
      if (!id) return
      const sym = byId.get(id)
      if (!sym || !sym.timeline.tracks?.length) return

      const adapter = new DOMAdapter()
      container.querySelectorAll('[data-tinyfly]').forEach((node) => {
        const name = node.getAttribute('data-tinyfly')
        if (name) adapter.registerTarget(name, node as HTMLElement)
      })
      this.symbolInstances.push({ adapter, timeline: deserializeTimeline(sym.timeline) })
    })
  }

  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(media: SyncableMedia, options?: MediaSyncOptions): void {
    this.mediaSync = new MediaSync(media, options)
    if (this.timeline) {
      this.mediaSync.setRate(this.timeline.speed)
      this.mediaSync.update(this.timeline.currentTime, this.isPlaying)
    }
  }

  /** Detach and pause the currently synced media, if any. */
  detachMedia(): void {
    this.mediaSync?.dispose()
    this.mediaSync = undefined
  }

  /**
   * Start or resume playback.
   */
  play(): void {
    if (!this.timeline || this.isDestroyed) return
    this.autoplayWhenSeen = false
    // A step in step mode, or all the way; a figure at its end plays again from the start.
    this.stepping = this.options.stepMode === true
    this.startPlaying()
  }

  private startPlaying(): void {
    if (!this.timeline || this.isDestroyed) return
    const wasIdle = this.timeline.playbackState === 'idle'
    this.timeline.play()
    if (wasIdle && this.timeline.currentTime === 0) this.applyState()
    this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }
    this.mediaSync?.update(this.timeline.currentTime, true)
    this.syncAllMedia(this.timeline.currentTime, true)
    this.startAnimationLoop()
    this.notify()
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this.timeline) return
    this.stepping = false
    this.timeline.pause()
    this.notify()
    this.mediaSync?.update(this.timeline.currentTime, false)
    this.syncAllMedia(this.timeline.currentTime, false)
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
    this.mediaSync?.update(this.timeline.currentTime, false)
    this.syncAllMedia(this.timeline.currentTime, false)
  }

  /**
   * Seek to a specific time (in milliseconds).
   */
  seek(time: number): void {
    if (!this.timeline) return
    this.timeline.seek(time)
    this.applyState()
    this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }
    this.mediaSync?.seek(this.timeline.currentTime)
    this.syncAllMedia(this.timeline.currentTime, this.isPlaying)
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    if (!this.timeline) return
    this.timeline.speed = speed
    this.mediaSync?.setRate(speed)
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
    this.reducedQuery?.removeEventListener?.('change', this.onReducedChange)
    this.visibilityObserver?.disconnect()
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onDocumentVisibility)
    this.mediaSync?.dispose()
    this.mediaSync = undefined
    for (const target of this.mediaTargets) {
      if (!target.el.paused) target.el.pause()
    }
    this.mediaTargets = []
    this.adapter.clearTargets()
    for (const inst of this.symbolInstances) inst.adapter.clearTargets()
    this.symbolInstances = []
    this.timeline = null
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== undefined) return

    this.lastTime = performance.now()

    const animate = (currentTime: number) => {
      if (this.isDestroyed || !this.timeline) return

      const delta = currentTime - (this.lastTime ?? currentTime)
      this.lastTime = currentTime

      const from = this.playhead
      this.timeline.tick(delta)
      this.stopAtMarker(from)
      this.applyState()
      const playing = this.timeline.playbackState === 'playing'
      this.mediaSync?.update(this.timeline.currentTime, playing)
      this.syncAllMedia(this.timeline.currentTime, playing)

      if (this.timeline.playbackState === 'playing') {
        this.animationFrameId = requestAnimationFrame(animate)
      } else {
        this.animationFrameId = undefined
        this.notify()
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }

  /**
   * If this frame crossed a marker it should stop at — the next one while
   * stepping, or any marker with `pause` — put the playhead exactly there and pause.
   */
  private stopAtMarker(from: Playhead): void {
    const timeline = this.timeline!
    const to: Playhead = { time: timeline.currentTime, iteration: timeline.loopIteration, direction: timeline.direction }
    this.playhead = to
    const markers = this.markers
    if (markers.length === 0) return
    const { crossings } = playheadCrossings(
      markers.map((marker) => marker.time),
      from,
      to,
      { duration: timeline.duration, alternate: timeline.config.alternate === true, holding: timeline.repeatDelayRemaining > 0 }
    )
    for (const crossing of crossings) {
      if (crossing.kind !== 'event') continue
      const marker = markers[crossing.index]
      if (!(this.stepping || marker.pause)) continue
      this.stepping = false
      timeline.pause()
      timeline.seek(marker.time)
      this.playhead = { time: marker.time, iteration: timeline.loopIteration, direction: timeline.direction }
      return
    }
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = undefined
    }
  }

  private applyState(): void {
    if (!this.timeline) return
    const t = this.timeline.currentTime
    this.adapter.applyState(this.timeline.getStateAtTime(t))
    this.announceMarker()
    this.notify()

    // Drive nested symbol instances, looped over each symbol's duration.
    for (const inst of this.symbolInstances) {
      const dur = inst.timeline.duration
      inst.adapter.applyState(inst.timeline.getStateAtTime(dur > 0 ? t % dur : t))
    }
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
