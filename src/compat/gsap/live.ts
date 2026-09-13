import type { Timeline, TimelineDefinition } from '../../engine'
import { CompatTimeline, type CompatTimelineOptions } from './timeline'
import type { Position } from './position'
import { splitVars, type TweenVars } from './vars'
import { Stage, type TargetInput, type Ticker } from './stage'
import type { AnimatableValue } from '../../engine'
import { resolveLiveMotionPath } from './live-motion-path'
import { convertToPath, pathDataOf, resolveMorphShape } from './live-morph'
import { toMs } from './vars'
import { createLiveDraggable, type LiveDraggable, type LiveDraggableOptions } from './live-draggable'
import { flipFrom, getFlipState, type FlipState, type FlipVars } from './live-flip'
import { splitText, type SplitTextOptions, type SplitTextResult } from './split-text'
import { createScrollTrigger, type ScrollTriggerVars } from './live-scroll'
import { resolveDrawSvg } from './draw-svg-vars'
import { ScrollDriver } from '../../drivers'

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
  /**
   * Drive this timeline from scrolling: scrub it, pin, or play/reverse it as a
   * range is crossed. It does not autoplay.
   */
  scrollTrigger?: ScrollTriggerVars
}

export class LiveTimeline {
  /** The compiled compat timeline. */
  readonly compat: CompatTimeline

  private readonly stage: Stage
  private readonly options: LiveTimelineOptions
  /** Cleared once playback has been started or explicitly controlled. */
  private autoplayPending: boolean
  private started = false
  private killed = false
  /** The first element any tween targeted: a scroll trigger's default trigger. */
  private firstElement?: Element
  private scrollDriver?: ScrollDriver

  constructor(stage: Stage, options: LiveTimelineOptions = {}) {
    this.stage = stage
    this.options = options
    this.compat = new CompatTimeline({
      ...options,
      startValue: (target, property) => {
        // An object's own property is the truth: code outside tinyfly may have
        // changed it since the last frame.
        const object = stage.objectFor(target)
        if (object) return animatableValue(object[property])

        const applied = stage.appliedValue(target, property)
        if (applied !== undefined) return applied
        // A shape's starting point is whatever the element draws right now,
        // and a text tween starts from the text it shows.
        if (property === 'd') return pathDataOf(stage.elementFor(target)) ?? undefined
        if (property === 'text') return stage.elementFor(target)?.textContent ?? undefined
        // An undrawn stroke is fully drawn: one dash as long as the path.
        if (property === 'strokeDasharray' || property === 'strokeDashoffset') {
          const length = strokeLength(stage.elementFor(target))
          if (length !== undefined) return property === 'strokeDasharray' ? [length, length] : 0
        }
        return undefined
      },
      startVelocity: (target, property) => stage.velocityOf(target, property),
    })

    this.compat.timeline.onComplete = () => options.onComplete?.()

    this.autoplayPending = !options.paused && !options.scrollTrigger
    if (options.scrollTrigger) {
      // Wait for the tweens chained on synchronously, so the default trigger and
      // the starting state are known.
      const vars = options.scrollTrigger
      queueMicrotask(() => {
        if (this.killed) return
        this.scrollDriver = createScrollTrigger(stage, vars, this, this.firstElement, (m) => options.onWarning?.(m))
      })
    }
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

  /** The scroll driver behind `scrollTrigger`, once attached (after a microtask). */
  get scrollTrigger(): ScrollDriver | undefined {
    return this.scrollDriver
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
    if (!names) return this
    if ((fromVars.drawSVG === undefined && toVars.drawSVG === undefined) || names.length === 1) {
      this.compat.fromTo(names, this.prepare(fromVars, names), this.prepare(toVars, names), position)
      return this
    }
    // Each stroke has its own length, so each element gets its own tween.
    this.eachElement(names, toVars, position, (name, vars, at) =>
      this.compat.fromTo([name], this.prepare(fromVars, [name]), this.prepare(vars, [name]), at)
    )
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

  /** Whether the timeline is set to play backwards. */
  reversed(): boolean {
    return this.timeline.direction === 'reverse'
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

  /** Stop and remove every tween, and any scroll trigger (and its pin). Elements keep the values last applied. */
  kill(): this {
    this.killed = true
    this.scrollDriver?.destroy()
    this.scrollDriver = undefined
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
   * text, and each plain object from its own current values. So a morph or text tween over several elements builds one tween per
   * element, all at the same position, with any stagger turned into delays.
   */
  private perElementStarts(
    names: string[],
    vars: TweenVars,
    position: Position | undefined,
    build: (names: string[], vars: TweenVars, position?: Position) => void
  ): void {
    const startsDifferPerElement =
      vars.morphSVG !== undefined ||
      vars.drawSVG !== undefined ||
      vars.text !== undefined ||
      vars.scrambleText !== undefined ||
      names.some((name) => this.stage.objectFor(name) !== undefined)
    if (!startsDifferPerElement || names.length === 1) {
      build(names, this.prepare(vars, names), position)
      return
    }

    this.eachElement(names, vars, position, (name, perElement, at) => build([name], this.prepare(perElement, [name]), at))
  }

  /** One tween per element at the same position, with any stagger turned into delays. */
  private eachElement(
    names: string[],
    vars: TweenVars,
    position: Position | undefined,
    build: (name: string, vars: TweenVars, position: Position | undefined) => void
  ): void {
    const { stagger, ...rest } = vars
    const each = typeof stagger === 'number' ? stagger : (stagger as { each?: number } | undefined)?.each ?? 0
    names.forEach((name, i) => {
      const delay = toMs(rest.delay, 0) / 1000 + i * each
      build(name, { ...rest, delay }, i === 0 ? position : '<')
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

    if (vars.drawSVG !== undefined) {
      const length = strokeLength(this.stage.elementFor(names[0]))
      if (length === undefined) {
        warn('gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)')
        const { drawSVG: _unmeasurable, ...withoutDraw } = prepared
        prepared = withoutDraw
      } else {
        prepared = resolveDrawSvg(prepared, length)
      }
    }

    return prepared
  }

  private resolve(target: TargetInput): string[] | undefined {
    const names = this.stage.resolveTargets(target)
    if (names.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${describe(target)}`)
      return undefined
    }
    this.firstElement ??= names.map((name) => this.stage.elementFor(name)).find((el) => el !== undefined)
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
  /**
   * Wrap text in char, word and line spans so each can be animated (GSAP's
   * SplitText). Selectors resolve within the stage's root. Changes the document;
   * `revert()` restores it.
   */
  splitText(targets: string | Element | ArrayLike<Element>, options?: SplitTextOptions): SplitTextResult
  /**
   * A scroll trigger with no animation — for callbacks such as velocity effects
   * (GSAP's `ScrollTrigger.create`). `destroy()` it when done.
   */
  scrollTrigger(vars: ScrollTriggerVars & { trigger: string | Element }): ScrollDriver | undefined
  /** Re-measure every scroll trigger, after layout changes a resize would not catch. */
  refreshScroll(): void
  /** Run a callback every frame, after animations are applied (GSAP's `gsap.ticker`). */
  readonly ticker: Ticker
  /** Record where elements appear, before a layout change (GSAP's `Flip.getState`). */
  getFlipState(targets: TargetInput): FlipState
  /** Animate recorded elements from where they were to their new layout (GSAP's `Flip.from`). */
  flipFrom(state: FlipState, vars?: FlipVars): LiveTimeline
  /** Record, run `change`, and animate the difference — in one call. */
  flip(targets: TargetInput, change: () => void, vars?: FlipVars): LiveTimeline
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
      scrollTrigger: config.scrollTrigger,
    })
  }

  const api: LiveApi = {
    stage,
    ticker: stage.ticker,
    scrollTrigger: (vars) => createScrollTrigger(stage, vars),
    refreshScroll: () => ScrollDriver.refreshAll(),
    timeline: (options) => new LiveTimeline(stage, options),
    to: (target, vars) => single(vars).to(target, vars),
    from: (target, vars) => single(vars).from(target, vars),
    fromTo: (target, fromVars, toVars) => single(toVars).fromTo(target, fromVars, toVars),
    set: (target, vars) => single(vars).set(target, vars),
    convertToPath: (targets) => convertToPath(targets, stage.root),
    splitText: (targets, options) =>
      splitText(
        typeof targets === 'string' ? Array.from(stage.root.querySelectorAll(targets)) : 'nodeType' in targets ? [targets as Element] : Array.from(targets),
        options
      ),
    draggable: (target, options) => createLiveDraggable(api, stage, target, options),
    getFlipState: (targets) => getFlipState(stage, targets),
    flipFrom: (state, vars) => flipFrom(stage, (options) => new LiveTimeline(stage, options), state, vars),
    flip: (targets, change, vars) => {
      const state = getFlipState(stage, targets)
      change()
      return flipFrom(stage, (options) => new LiveTimeline(stage, options), state, { targets, ...vars })
    },
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

/** The length of an SVG shape's stroke, measured once; undefined for anything else. */
function strokeLength(element: Element | undefined): number | undefined {
  const shape = element as (Element & { getTotalLength?: () => number }) | undefined
  if (typeof shape?.getTotalLength !== 'function') return undefined
  return shape.getTotalLength()
}

/** A property read off a plain object, if it is something the engine can animate. */
function animatableValue(value: unknown): AnimatableValue | undefined {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (Array.isArray(value) && value.every((item) => typeof item === 'number')) return value as number[]
  return undefined
}

function describe(target: TargetInput): string {
  return typeof target === 'string' ? `"${target}"` : String(target)
}
