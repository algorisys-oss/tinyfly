import type { Timeline, AnimationState, AnimatableValue } from '../../engine'
import { DOMAdapter } from '../../adapters/dom'
import type { ContextCollector, ContextHost } from './live-context'

/**
 * The shared runtime behind the live facade: one frame loop, one DOM adapter,
 * and a record of the values currently applied to each element. Plain objects
 * are targets too — their values are assigned straight onto them — and the
 * ticker lets other rendering (canvas, WebGL) run on the same frame.
 *
 * Why one stage rather than a loop per animation. The DOM adapter composes
 * `transform` from the properties in the state it is given, so two independent
 * timelines — one moving `x`, one turning `rotate` — would each write a
 * transform that omits the other's property, and the element would flicker
 * between them. The stage merges every active timeline's values per element
 * before applying, so they compose instead of overwriting.
 *
 * Merge rule: timelines are ticked in activation order and write into the same
 * per-element map, so when two drive the same property at once, the one played
 * most recently wins. This mirrors the engine's own rule for tracks, where
 * the one that started most recently wins.
 *
 * The stage holds only *playing* timelines. A timeline that finishes or pauses
 * drops out after its last frame is applied — its final values stay in the
 * applied map, so later tweens compose with (and start from) them — and is
 * re-activated by playing it again. Nothing is retained for finished one-off
 * tweens beyond their element's last values.
 */

/**
 * A plain JavaScript object animated directly: its numeric (or colour) properties
 * are written back onto it each frame — `{ x: 0 }`, a Three.js `mesh.position`,
 * a shader uniform. Arrays and node lists are lists of targets, not objects.
 */
export type ObjectTarget = object

/** Anything the live facade accepts as a target. */
export type TargetInput =
  | string
  | Element
  | ObjectTarget
  | ArrayLike<Element>
  | ReadonlyArray<string | Element | ObjectTarget>

/**
 * Called once per frame, after that frame's values are applied — the place to
 * render a canvas or a WebGL scene from objects tinyfly is animating.
 * `time` is seconds since the ticker started, `deltaTime` milliseconds since the
 * previous frame, `frame` a frame counter (GSAP's ticker signature).
 */
export type TickerCallback = (time: number, deltaTime: number, frame: number) => void

export interface Ticker {
  add(callback: TickerCallback): void
  remove(callback: TickerCallback): void
}

/** Frame scheduling, injectable so the stage can be driven by tests. */
export interface FrameScheduler {
  request(callback: (timestamp: number) => void): number
  cancel(id: number): void
}

export interface StageOptions {
  scheduler?: FrameScheduler
  /** Document used to resolve selector targets (default: the global document) */
  root?: ParentNode
}

interface ActiveEntry {
  onUpdate?: () => void
}

const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
}

export class Stage implements ContextHost {
  private readonly adapter = new DOMAdapter()
  private readonly scheduler: FrameScheduler
  private readonly rootOption?: ParentNode

  /** Element → engine target name. The engine only ever sees names. */
  private names = new WeakMap<Element, string>()
  private readonly elements = new Map<string, Element>()
  private nameCounter = 0

  /** Plain-object targets, named like elements but written directly. */
  private objectNames = new WeakMap<object, string>()
  private readonly objects = new Map<string, ObjectTarget>()

  /** Things created for this stage that outlive a timeline (scroll triggers, pins). */
  private readonly owned = new Set<{ destroy(): void }>()

  private currentCollector: ContextCollector | undefined

  private readonly tickerCallbacks = new Set<TickerCallback>()
  private tickerTime = 0
  private tickerFrame = 0

  /**
   * Live timelines that may still move something — playing, paused or scroll
   * driven — for `live.killTweensOf`. Finished one-off timelines leave it.
   */
  readonly liveTimelines = new Set<{ killTweensOf(names: string[], properties?: string[]): void }>()

  /** Playing timelines, in activation order. */
  private readonly active = new Map<Timeline, ActiveEntry>()

  /** Last applied value per target name and property. */
  private readonly applied = new Map<string, Map<string, AnimatableValue>>()
  /** Targets written since the last apply. */
  private readonly dirty = new Set<string>()

  private frameId: number | null = null
  private lastTimestamp: number | null = null
  private destroyed = false

  constructor(options: StageOptions = {}) {
    this.scheduler = options.scheduler ?? browserScheduler
    this.rootOption = options.root
  }

  // --- targets ------------------------------------------------------------

  /**
   * Where selector targets are resolved: the given root, or the document.
   * Read lazily so a stage can be created where there is no document (Node, a
   * Worker) as long as nothing is resolved there.
   */
  get root(): ParentNode {
    return this.rootOption ?? document
  }

  /**
   * Resolve selectors, elements, plain objects and lists of them to engine
   * target names, registering each element with the adapter (and each object
   * with the stage) the first time it is seen.
   * Returns an empty array when nothing matches.
   */
  resolveTargets(input: TargetInput): string[] {
    const names: string[] = []
    for (const target of this.targetsOf(input)) {
      const name = this.nameFor(target)
      if (isElement(target)) this.currentCollector?.touch(target, name)
      names.push(name)
    }
    return names
  }

  /** Find one element the way selector targets are found: within the stage's root (or the collecting context's scope). */
  query(selector: string): Element | null {
    return this.selectorRoot.querySelector(selector)
  }

  // --- contexts -----------------------------------------------------------

  /** The context collecting what is created right now, if any (see live-context.ts). */
  get collector(): ContextCollector | undefined {
    return this.currentCollector
  }

  setCollector(collector: ContextCollector | undefined): void {
    this.currentCollector = collector
  }

  /** Drop the values applied to a target, so the next animation starts from its natural state. */
  forget(name: string): void {
    this.applied.delete(name)
    this.dirty.delete(name)
  }

  private get selectorRoot(): ParentNode {
    return this.currentCollector?.scope ?? this.root
  }

  /** The element registered under a target name. */
  elementFor(name: string): Element | undefined {
    return this.elements.get(name)
  }

  /** The plain object registered under a target name. */
  objectFor(name: string): ObjectTarget | undefined {
    return this.objects.get(name)
  }

  /** Last value the stage applied to a target's property, if any. */
  appliedValue(name: string, property: string): AnimatableValue | undefined {
    return this.applied.get(name)?.get(property)
  }

  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(name: string, property: string): number | undefined {
    const STEP_MS = 4
    for (const timeline of [...this.active.keys()].reverse()) {
      if (timeline.getTracks({ target: name, property }).length === 0) continue
      const time = timeline.currentTime
      if (time < STEP_MS) return 0
      const now = timeline.getStateAtTime(time).values.get(name)?.get(property)
      const before = timeline.getStateAtTime(time - STEP_MS).values.get(name)?.get(property)
      if (typeof now !== 'number' || typeof before !== 'number') return undefined
      const perMs = (now - before) / STEP_MS
      return (timeline.direction === 'reverse' ? -perMs : perMs) * 1000
    }
    return undefined
  }

  /**
   * Run a callback every frame, after animations are applied. The frame loop
   * keeps going while any callback is registered, even with nothing playing.
   */
  readonly ticker: Ticker = {
    add: (callback) => {
      if (this.destroyed) return
      if (this.tickerCallbacks.size === 0) {
        this.tickerTime = 0
        this.tickerFrame = 0
      }
      this.tickerCallbacks.add(callback)
      this.currentCollector?.track({ revert: () => this.ticker.remove(callback) })
      this.startLoop()
    },
    remove: (callback) => {
      this.tickerCallbacks.delete(callback)
      if (!this.running) this.stopLoop()
    },
  }

  // --- playback -----------------------------------------------------------

  /**
   * Add a timeline to the running set and make sure the loop is going. The
   * timeline must already be playing; activating an already active timeline
   * moves it to the end of the order, so it wins merges.
   */
  activate(timeline: Timeline, entry: ActiveEntry = {}): void {
    if (this.destroyed) return

    // The engine evaluates state once per tick and hands it to `onUpdate`;
    // capturing it there avoids evaluating the same frame twice.
    timeline.onUpdate = (state) => this.write(state)

    this.active.delete(timeline)
    this.active.set(timeline, entry)
    this.startLoop()
  }

  /** Remove a timeline from the running set. Its applied values remain. */
  deactivate(timeline: Timeline): void {
    this.active.delete(timeline)
    if (!this.running) this.stopLoop()
  }

  /** Destroy `resource` along with the stage. Returns it. */
  own<T extends { destroy(): void }>(resource: T): T {
    if (this.destroyed) resource.destroy()
    else this.owned.add(resource)
    return resource
  }

  /**
   * Stop everything on this stage and release its elements. Animations that
   * are still running stop where they are; elements keep the styles last
   * applied. A destroyed stage ignores later playback, so a timeline whose
   * autoplay was already queued cannot restart the loop.
   */
  destroy(): void {
    this.destroyed = true
    for (const resource of this.owned) resource.destroy()
    this.owned.clear()
    for (const timeline of this.active.keys()) timeline.stop()
    this.active.clear()
    this.stopLoop()
    this.adapter.clearTargets()
    this.elements.clear()
    this.names = new WeakMap()
    this.objects.clear()
    this.objectNames = new WeakMap()
    this.tickerCallbacks.clear()
    this.liveTimelines.clear()
    this.applied.clear()
    this.dirty.clear()
  }

  /**
   * Write values for one target straight away, without a timeline — for direct
   * manipulation such as dragging, where every pointer move sets a position.
   * The values join the applied state, so later tweens start from them.
   */
  apply(name: string, values: Record<string, AnimatableValue>): void {
    if (this.destroyed) return
    const properties = new Map<string, AnimatableValue>(Object.entries(values))
    this.write({ values: new Map([[name, properties]]), currentTime: 0, playbackState: 'idle', direction: 'forward', loopIteration: 0 })
    this.flush()
  }

  /** Apply a timeline's state at its current time, immediately. */
  render(timeline: Timeline): void {
    if (this.destroyed) return
    this.write(timeline.getStateAtTime(timeline.currentTime))
    this.flush()
  }

  /**
   * Advance every active timeline by `deltaMs` and apply the merged result.
   * The frame loop calls this; it is public so hosts that own their own loop
   * (or tests) can drive the stage directly.
   */
  tick(deltaMs: number): void {
    const ticked = [...this.active]
    for (const [timeline] of ticked) {
      // The engine does not advance (or emit) a zero-length timeline, which
      // would otherwise stay "playing" forever and keep the loop alive.
      if (timeline.duration <= 0) {
        this.write(timeline.getStateAtTime(0))
        timeline.stop()
      } else {
        timeline.tick(deltaMs)
      }
    }
    // Apply the frame before callbacks run, so they read this frame's values
    // (an onUpdate writing a counted-up number, a tween driving a playhead).
    this.flush()
    for (const [timeline, entry] of ticked) {
      entry.onUpdate?.()
      if (timeline.playbackState !== 'playing' && this.active.get(timeline) === entry) this.active.delete(timeline)
    }
    this.flush()
    this.runTicker(deltaMs)
    if (!this.running) this.stopLoop()
  }

  // --- internals ----------------------------------------------------------

  /** Whether the frame loop has work: something playing, or a ticker callback. */
  private get running(): boolean {
    return this.active.size > 0 || this.tickerCallbacks.size > 0
  }

  private runTicker(deltaMs: number): void {
    if (this.tickerCallbacks.size === 0) return
    this.tickerTime += deltaMs
    this.tickerFrame += 1
    for (const callback of [...this.tickerCallbacks]) {
      callback(this.tickerTime / 1000, deltaMs, this.tickerFrame)
    }
  }

  private write(state: AnimationState): void {
    for (const [name, properties] of state.values) {
      let target = this.applied.get(name)
      if (!target) {
        target = new Map()
        this.applied.set(name, target)
      }
      for (const [property, value] of properties) target.set(property, value)
      this.dirty.add(name)
    }
  }

  private flush(): void {
    if (this.dirty.size === 0) return

    const values = new Map<string, Map<string, AnimatableValue>>()
    for (const name of this.dirty) {
      const properties = this.applied.get(name)!
      const object = this.objects.get(name)
      if (object) {
        for (const [property, value] of properties) (object as Record<string, unknown>)[property] = value
      } else {
        values.set(name, properties)
      }
    }
    this.dirty.clear()
    if (values.size === 0) return

    // The adapter reads only `values`; the rest is filled to satisfy the type.
    this.adapter.applyState({
      values,
      currentTime: 0,
      playbackState: 'playing',
      direction: 'forward',
      loopIteration: 0,
    })
  }

  private readonly frame = (timestamp: number): void => {
    this.frameId = null
    const delta = this.lastTimestamp === null ? 0 : timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    if (delta > 0) this.tick(delta)

    // A callback run during the tick (an onComplete that plays something else)
    // may already have scheduled the next frame.
    if (this.running && this.frameId === null) {
      this.frameId = this.scheduler.request(this.frame)
    }
  }

  private startLoop(): void {
    if (this.frameId !== null) return
    this.lastTimestamp = null
    this.frameId = this.scheduler.request(this.frame)
  }

  private stopLoop(): void {
    if (this.frameId !== null) this.scheduler.cancel(this.frameId)
    this.frameId = null
    this.lastTimestamp = null
  }

  private targetsOf(input: TargetInput): (Element | ObjectTarget)[] {
    if (typeof input === 'string') {
      return Array.from(this.selectorRoot.querySelectorAll(input))
    }
    if (isElement(input)) return [input]
    if (!isTargetList(input)) return [input as ObjectTarget]

    const result: (Element | ObjectTarget)[] = []
    for (const item of Array.from(input as ArrayLike<string | Element | ObjectTarget>)) {
      result.push(...this.targetsOf(item))
    }
    return result
  }

  private nameFor(target: Element | ObjectTarget): string {
    return isElement(target) ? this.elementName(target) : this.objectName(target)
  }

  private objectName(object: ObjectTarget): string {
    const existing = this.objectNames.get(object)
    if (existing) return existing
    let name: string
    do {
      this.nameCounter += 1
      name = `obj-${this.nameCounter}`
    } while (this.objects.has(name) || this.elements.has(name))
    this.objectNames.set(object, name)
    this.objects.set(name, object)
    return name
  }

  private elementName(element: Element): string {
    const existing = this.names.get(element)
    if (existing) return existing

    // An element's id makes the compiled JSON readable; fall back to a counter
    // when there is none or it is already taken by another element.
    let name = element.id ? `#${element.id}` : ''
    if (!name || this.elements.has(name)) {
      do {
        this.nameCounter += 1
        name = `el-${this.nameCounter}`
      } while (this.elements.has(name))
    }

    this.names.set(element, name)
    this.elements.set(name, element)
    this.adapter.registerTarget(name, element as HTMLElement)
    return name
  }
}

function isElement(value: unknown): value is Element {
  return typeof value === 'object' && value !== null && (value as Node).nodeType === 1
}

/** Arrays, NodeLists and HTMLCollections hold targets; any other object is one. */
function isTargetList(value: unknown): boolean {
  if (Array.isArray(value)) return true
  const list = value as { length?: unknown; item?: unknown }
  return typeof list.length === 'number' && typeof list.item === 'function'
}
