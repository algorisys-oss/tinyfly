import type { Timeline, AnimationState, AnimatableValue } from '../../engine'
import { DOMAdapter } from '../../adapters/dom'

/**
 * The shared runtime behind the live facade: one frame loop, one DOM adapter,
 * and a record of the values currently applied to each element.
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
 * most recently wins. This mirrors the engine's own "last track added wins".
 *
 * The stage holds only *playing* timelines. A timeline that finishes or pauses
 * drops out after its last frame is applied — its final values stay in the
 * applied map, so later tweens compose with (and start from) them — and is
 * re-activated by playing it again. Nothing is retained for finished one-off
 * tweens beyond their element's last values.
 */

/** Anything the live facade accepts as a target. */
export type TargetInput = string | Element | ArrayLike<Element> | ReadonlyArray<string | Element>

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

export class Stage {
  private readonly adapter = new DOMAdapter()
  private readonly scheduler: FrameScheduler
  private readonly rootOption?: ParentNode

  /** Element → engine target name. The engine only ever sees names. */
  private names = new WeakMap<Element, string>()
  private readonly elements = new Map<string, Element>()
  private nameCounter = 0

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
   * Resolve selectors, elements and lists of either to engine target names,
   * registering each element with the adapter the first time it is seen.
   * Returns an empty array when nothing matches.
   */
  resolveTargets(input: TargetInput): string[] {
    const names: string[] = []
    for (const element of this.elementsOf(input)) {
      names.push(this.nameFor(element))
    }
    return names
  }

  /** Find one element the way selector targets are found: within the stage's root. */
  query(selector: string): Element | null {
    return this.root.querySelector(selector)
  }

  /** The element registered under a target name. */
  elementFor(name: string): Element | undefined {
    return this.elements.get(name)
  }

  /** Last value the stage applied to a target's property, if any. */
  appliedValue(name: string, property: string): AnimatableValue | undefined {
    return this.applied.get(name)?.get(property)
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
    if (this.active.size === 0) this.stopLoop()
  }

  /**
   * Stop everything on this stage and release its elements. Animations that
   * are still running stop where they are; elements keep the styles last
   * applied. A destroyed stage ignores later playback, so a timeline whose
   * autoplay was already queued cannot restart the loop.
   */
  destroy(): void {
    this.destroyed = true
    for (const timeline of this.active.keys()) timeline.stop()
    this.active.clear()
    this.stopLoop()
    this.adapter.clearTargets()
    this.elements.clear()
    this.names = new WeakMap()
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
    for (const [timeline, entry] of [...this.active]) {
      // The engine does not advance (or emit) a zero-length timeline, which
      // would otherwise stay "playing" forever and keep the loop alive.
      if (timeline.duration <= 0) {
        this.write(timeline.getStateAtTime(0))
        timeline.stop()
      } else {
        timeline.tick(deltaMs)
      }
      entry.onUpdate?.()

      if (timeline.playbackState !== 'playing') this.active.delete(timeline)
    }
    this.flush()
    if (this.active.size === 0) this.stopLoop()
  }

  // --- internals ----------------------------------------------------------

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
    for (const name of this.dirty) values.set(name, this.applied.get(name)!)
    this.dirty.clear()

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
    if (this.active.size > 0 && this.frameId === null) {
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

  private elementsOf(input: TargetInput): Element[] {
    if (typeof input === 'string') {
      return Array.from(this.root.querySelectorAll(input))
    }
    if (isElement(input)) return [input]

    const result: Element[] = []
    for (const item of Array.from(input as ArrayLike<string | Element>)) {
      result.push(...this.elementsOf(item))
    }
    return result
  }

  private nameFor(element: Element): string {
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
