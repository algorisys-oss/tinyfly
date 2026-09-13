import type { Timeline, TimelineDefinition } from '../../engine'
import { CompatTimeline, type CompatTimelineOptions } from './timeline'
import type { Position } from './position'
import { splitVars, type TweenVars } from './vars'
import { Stage, type TargetInput } from './stage'
import { resolveLiveMotionPath } from './live-motion-path'
import { convertToPath, pathDataOf, resolveMorphShape } from './live-morph'
import { toMs } from './vars'
import { createLiveDraggable, type LiveDraggable, type LiveDraggableOptions } from './live-draggable'

/**
 * The live facade: GSAP-style calls that play on real elements straight away.
 *
 *     live.to('.box', { x: 200, duration: 1, ease: 'power2.out' })
 *
 * `tf` (in index.ts) compiles an animation and leaves playback to you; `live`
 * compiles the same way and then plays it on a shared {@link Stage}. The
 * compilation is identical — `toDefinition()` returns the same plain JSON — so
 * everything that makes tinyfly deterministic still holds for what is built.
 * What `live` adds is only the runtime: selector resolution, the frame loop,
 * and composing concurrent animations on one element.
 *
 * Differences from `tf`, all in the runtime:
 * - Targets are CSS selectors, elements, or lists of them. A selector matching
 *   several elements animates all of them (and `stagger` fans them out).
 * - A start value the timeline has not authored comes from the value the stage
 *   last applied to that element, before the static defaults. It is resolved
 *   once, when the tween is built — never read back per frame.
 * - Playback starts on the next microtask, so tweens chained synchronously onto
 *   a timeline are all in place first. `paused: true` (or calling any playback
 *   method before then) opts out.
 */

export interface LiveTimelineOptions extends Omit<CompatTimelineOptions, 'startValue'> {
  /** Do not start automatically (GSAP's `paused`) */
  paused?: boolean
  onStart?: () => void
  /** Called after each frame this timeline is applied */
  onUpdate?: () => void
  onComplete?: () => void
}

export class LiveTimeline {
  /** The compiled compat timeline. */
  readonly compat: CompatTimeline

  private readonly stage: Stage
  private readonly options: LiveTimelineOptions
  /** Cleared once playback has been started or explicitly controlled. */
  private autoplayPending: boolean
  private started = false

  constructor(stage: Stage, options: LiveTimelineOptions = {}) {
    this.stage = stage
    this.options = options
    this.compat = new CompatTimeline({
      ...options,
      startValue: (target, property) => {
        const applied = stage.appliedValue(target, property)
        if (applied !== undefined) return applied
        // A shape's starting point is whatever the element draws right now,
        // and a text tween starts from the text it shows.
        if (property === 'd') return pathDataOf(stage.elementFor(target)) ?? undefined
        if (property === 'text') return stage.elementFor(target)?.textContent ?? undefined
        return undefined
      },
    })

    this.compat.timeline.onComplete = () => options.onComplete?.()

    this.autoplayPending = !options.paused
    if (this.autoplayPending) {
      queueMicrotask(() => {
        if (this.autoplayPending) this.play()
      })
    }
  }

  /** The engine timeline. */
  get timeline(): Timeline {
    return this.compat.timeline
  }

  // --- building -----------------------------------------------------------

  to(target: TargetInput, vars: TweenVars, position?: Position): this {
    const names = this.resolve(target)
    if (names) this.perElementStarts(names, vars, position, (n, v, p) => this.compat.to(n, v, p))
    return this
  }

  from(target: TargetInput, vars: TweenVars, position?: Position): this {
    const names = this.resolve(target)
    if (names) this.perElementStarts(names, vars, position, (n, v, p) => this.compat.from(n, v, p))
    return this
  }

  fromTo(target: TargetInput, fromVars: TweenVars, toVars: TweenVars, position?: Position): this {
    const names = this.resolve(target)
    if (names) this.compat.fromTo(names, this.prepare(fromVars, names), this.prepare(toVars, names), position)
    return this
  }

  set(target: TargetInput, vars: TweenVars, position?: Position): this {
    const names = this.resolve(target)
    if (names) this.compat.set(names, this.prepare(vars, names), position)
    return this
  }

  addLabel(name: string, position?: Position): this {
    this.compat.addLabel(name, position)
    return this
  }

  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(child: LiveTimeline, position?: Position): this {
    // The child's tracks now play as part of this timeline, not on their own.
    child.autoplayPending = false
    child.timeline.stop()
    child.stage.deactivate(child.timeline)
    this.compat.add(child.compat, position)
    return this
  }

  // --- playback -----------------------------------------------------------

  play(): this {
    this.autoplayPending = false
    if (!this.started) {
      this.started = true
      this.options.onStart?.()
    }
    this.timeline.play()
    this.stage.render(this.timeline)
    this.stage.activate(this.timeline, { onUpdate: this.options.onUpdate })
    return this
  }

  pause(): this {
    this.autoplayPending = false
    this.timeline.pause()
    this.stage.deactivate(this.timeline)
    return this
  }

  /** Continue from the current position (GSAP's `resume`). */
  resume(): this {
    return this.play()
  }

  /** Play from the start. */
  restart(): this {
    this.timeline.stop()
    return this.play()
  }

  /** Flip direction and keep playing (from the end, if already finished). */
  reverse(): this {
    const finishedForward =
      this.timeline.playbackState === 'idle' && this.timeline.direction === 'forward'
    this.timeline.reverse()
    if (finishedForward && this.timeline.currentTime === 0) {
      this.timeline.seek(this.timeline.duration)
    }
    return this.play()
  }

  /** Jump to a time in seconds, or to a label, and apply it immediately. */
  seek(position: number | string): this {
    this.autoplayPending = false
    this.compat.seek(position)
    this.stage.render(this.timeline)
    return this
  }

  /** Read or set progress, 0..1. Setting applies immediately. */
  progress(value?: number): number {
    if (value === undefined) return this.compat.progress()
    this.autoplayPending = false
    const result = this.compat.progress(value)
    this.stage.render(this.timeline)
    return result
  }

  timeScale(value?: number): number {
    return this.compat.timeScale(value)
  }

  /** Total duration in seconds. */
  duration(): number {
    return this.compat.duration()
  }

  isActive(): boolean {
    return this.timeline.playbackState === 'playing'
  }

  /** Stop and remove every tween. Elements keep the values last applied. */
  kill(): this {
    this.autoplayPending = false
    this.timeline.stop()
    this.stage.deactivate(this.timeline)
    this.compat.kill()
    return this
  }

  /** The compiled animation, as plain JSON. */
  toDefinition(): TimelineDefinition {
    return this.compat.toDefinition()
  }

  /**
   * A track has one start value, but each element starts from its own shape or
   * text. So a morph or text tween over several elements builds one tween per
   * element, all at the same position, with any stagger turned into delays.
   */
  private perElementStarts(
    names: string[],
    vars: TweenVars,
    position: Position | undefined,
    build: (names: string[], vars: TweenVars, position?: Position) => void
  ): void {
    const startsDifferPerElement =
      vars.morphSVG !== undefined || vars.text !== undefined || vars.scrambleText !== undefined
    if (!startsDifferPerElement || names.length === 1) {
      build(names, this.prepare(vars, names), position)
      return
    }

    const { stagger, ...rest } = vars
    const each = typeof stagger === 'number' ? stagger : (stagger as { each?: number } | undefined)?.each ?? 0
    names.forEach((name, i) => {
      const delay = toMs(rest.delay, 0) / 1000 + i * each
      build([name], this.prepare({ ...rest, delay }, [name]), i === 0 ? position : '<')
    })
  }

  /**
   * Resolve the parts of vars that refer to the page — today, a motion path
   * given as a selector or element, and its `align` — into plain data.
   */
  private prepare(vars: TweenVars, names: string[]): TweenVars {
    const warn = (message: string) => this.options.onWarning?.(message)
    const query = (selector: string) => this.stage.query(selector)
    let prepared = vars

    if (vars.motionPath !== undefined) {
      const motionPath = resolveLiveMotionPath(vars.motionPath, {
        query,
        targets: names.map((name) => this.stage.elementFor(name)).filter((el): el is Element => !!el),
        warn,
      })
      prepared = { ...prepared, motionPath }
    }

    if (vars.morphSVG !== undefined) {
      const shape = resolveMorphShape(vars.morphSVG, query, warn)
      // A shape that could not be found has already been warned about; the rest
      // of the tween still plays.
      const { morphSVG: _unresolved, ...withoutMorph } = prepared
      prepared = shape ? { ...prepared, morphSVG: shape } : withoutMorph
    }

    return prepared
  }

  private resolve(target: TargetInput): string[] | undefined {
    const names = this.stage.resolveTargets(target)
    if (names.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${describe(target)}`)
      return undefined
    }
    return names
  }
}

/** The GSAP-shaped entry points, bound to one stage. */
export interface LiveApi {
  timeline(options?: LiveTimelineOptions): LiveTimeline
  to(target: TargetInput, vars: TweenVars): LiveTimeline
  from(target: TargetInput, vars: TweenVars): LiveTimeline
  fromTo(target: TargetInput, fromVars: TweenVars, toVars: TweenVars): LiveTimeline
  set(target: TargetInput, vars: TweenVars): LiveTimeline
  /**
   * Replace basic SVG shapes with equivalent `<path>` elements so they can be
   * morphed (selectors resolve within the stage's root). Changes the document.
   */
  convertToPath(targets: string | Element | ArrayLike<Element>): Element[]
  /** Drag an element, and throw it with inertia on release (GSAP's Draggable + InertiaPlugin). */
  draggable(target: TargetInput, options?: LiveDraggableOptions): LiveDraggable
  /** The stage these calls play on. */
  readonly stage: Stage
}

/**
 * Create a live API bound to a stage. Most pages use the default {@link live};
 * a separate stage is useful for tests, or for an isolated region of a page.
 */
export function createLive(stage: Stage = new Stage()): LiveApi {
  // A standalone tween is a one-tween timeline. GSAP puts repeat, yoyo and the
  // lifecycle callbacks on the tween's vars, so lift them to the timeline.
  const single = (vars: TweenVars): LiveTimeline => {
    const { config } = splitVars(vars)
    return new LiveTimeline(stage, {
      repeat: config.repeat,
      yoyo: config.yoyo,
      repeatDelay: config.repeatDelay,
      paused: config.paused,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
    })
  }

  const api: LiveApi = {
    stage,
    timeline: (options) => new LiveTimeline(stage, options),
    to: (target, vars) => single(vars).to(target, vars),
    from: (target, vars) => single(vars).from(target, vars),
    fromTo: (target, fromVars, toVars) => single(toVars).fromTo(target, fromVars, toVars),
    set: (target, vars) => single(vars).set(target, vars),
    convertToPath: (targets) => convertToPath(targets, stage.root),
    draggable: (target, options) => createLiveDraggable(api, stage, target, options),
  }
  return api
}

/**
 * The default live API, on a page-wide stage.
 *
 * One shared stage is the point: it is what lets separate `live.to()` calls on
 * the same element compose. The stage does nothing until something plays.
 */
export const live: LiveApi = /* @__PURE__ */ createLive()

function describe(target: TargetInput): string {
  return typeof target === 'string' ? `"${target}"` : String(target)
}
