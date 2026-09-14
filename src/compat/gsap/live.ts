import type { Timeline, TimelineDefinition } from '../../engine'
import { CompatTimeline, type CompatTimelineOptions } from './timeline'
import type { Position } from './position'
import { RESERVED_KEYS, splitVars, type TweenVars } from './vars'
import { Stage, type ObjectTarget, type TargetInput, type Ticker } from './stage'
import type { AnimatableValue } from '../../engine'
import { resolveLiveMotionPath } from './live-motion-path'
import { convertToPath, pathDataOf, resolveMorphShape } from './live-morph'
import { toMs, toStaggerConfig, type StaggerContext } from './vars'
import { createLiveDraggable, type LiveDraggable, type LiveDraggableOptions } from './live-draggable'
import { flipFrom, getFlipState, type FlipState, type FlipVars } from './live-flip'
import { splitText, type SplitTextOptions, type SplitTextResult } from './split-text'
import { createScrollTrigger, type ScrollTriggerVars } from './live-scroll'
import { resolveDrawSvg } from './draw-svg-vars'
import { ScrollDriver, SmoothScroll, type SmoothScrollOptions } from '../../drivers'
import { LiveContext, LiveMatchMedia, type Revertible } from './live-context'
import { ImageSequence, type ImageSequenceOptions } from './image-sequence'
import { pageTransition, type PageTransitionOptions } from './live-transition'
import { CustomBounce, CustomEase, CustomWiggle } from './custom-eases'
import { playheadCrossings, type Direction, type Playhead } from './playhead-crossings'
import { isRandomString, type LiveUtils } from './utils'
import { defaultFor } from './defaults'
import { expandKeyframes, hasKeyframes } from './keyframes-vars'
import { scrollBatch, scrollTo, type ScrollBatchVars, type ScrollDestination, type ScrollToVars } from './live-scroll-to'
import type { CubicBezierPoints, CustomBounceOptions, CustomWiggleOptions } from '../../engine'
import { staggerOffsets } from '../../engine'

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

/** Options for `live.smoothScroll`: a selector may name the scroller. */
export interface LiveSmoothScrollOptions extends Omit<SmoothScrollOptions, 'scroller'> {
  scroller?: string | HTMLElement | null
}

export interface LiveTimelineOptions extends Omit<CompatTimelineOptions, 'startValue'> {
  /** Do not start automatically (GSAP's `paused`) */
  paused?: boolean
  onStart?: () => void
  /** Called after each frame this timeline is applied */
  onUpdate?: () => void
  onComplete?: () => void
  /** Each time a repeat begins */
  onRepeat?: () => void
  /** On arriving back at the start after `reverse()` */
  onReverseComplete?: () => void
  /**
   * Rebuild the timeline at every repeat (GSAP's `repeatRefresh`): function values
   * and `"random(…)"` strings are drawn again, so each loop differs. The random
   * sequence is seeded, so a replay of the page is still identical.
   */
  repeatRefresh?: boolean
  /**
   * Drive this timeline from scrolling: scrub it, pin, or play/reverse it as a
   * range is crossed. It does not autoplay.
   */
  scrollTrigger?: ScrollTriggerVars
}

/** Options for `live.quickTo`: how each re-targeted move animates. */
export interface QuickToVars {
  /** Seconds (default 0.4) */
  duration?: number
  /** Default `'power3.out'` */
  ease?: string
  /** Move on a spring instead; each re-target keeps the current velocity */
  spring?: TweenVars['spring']
}

/** Options for `tl.tweenTo()` / `tl.tweenFromTo()`. */
export interface TweenToVars {
  /** Seconds; default the distance at the timeline's own speed */
  duration?: number
  /** Default `'none'` */
  ease?: string
  onStart?: () => void
  onUpdate?: () => void
  onComplete?: () => void
}

/** A point on a timeline that runs something when the playhead crosses it. */
interface TimelineEvent {
  time: number
  run: () => void
  /** Only when crossed this way (tween onStart / onComplete are forward only) */
  direction?: Direction
  /** Stop the playhead exactly here before running */
  pause?: boolean
}

/** A tween's onUpdate: runs on frames whose movement overlaps the tween. */
interface RangeCallback {
  start: number
  end: number
  run: () => void
}

/** Call it with a value to animate toward it. */
export interface QuickTo {
  (value: number): void
  /** The reused timeline */
  readonly tween: LiveTimeline
  kill(): void
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
  /** The building calls, in order, so `invalidate()` can replay them. */
  private readonly recipe: Array<() => void> = []
  /** The first element any tween targeted: a scroll trigger's default trigger. */
  private firstElement?: Element
  private scrollDriver?: ScrollDriver
  /** Callbacks and pauses placed on the timeline (`call`, `addPause`, tween onStart / onComplete) */
  private events: TimelineEvent[] = []
  private ranges: RangeCallback[] = []
  /** Where the playhead was when callbacks were last worked out */
  private playhead: Playhead = { time: 0, iteration: 0, direction: 'forward', fresh: true }
  /** A plain repeat is waiting out its delay; the next loop starts fresh from 0 */
  private waitingToWrap = false
  /** The engine finished during this frame; completion callbacks run after the frame's events */
  private finishedThisFrame = false
  /** Set by `reverse()`: arriving at the start is a reverse completion */
  private backwards = false

  constructor(stage: Stage, options: LiveTimelineOptions = {}) {
    this.stage = stage
    this.options = options
    this.compat = new CompatTimeline({
      ...options,
      startValue: (target, property) => {
        // An object's own property is the truth: code outside tinyfly may have
        // changed it since the last frame.
        const object = stage.objectFor(target)
        if (object) return animatableValue((object as Record<string, unknown>)[property])

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
      layoutColumns: (targets) => columnsInFirstRow(targets.map((name) => stage.elementFor(name))),
      random: () => stage.utils.random(0, 1),
    })

    this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = true
    }
    stage.collector?.track(this)
    stage.liveTimelines.add(this)

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
    if (hasKeyframes(vars)) return this.record(() => this.keyframed(target, vars, position))
    return this.record(() => this.tween(target, [vars], position, ([v], names, at) => this.compat.to(names, v, at)))
  }

  from(target: TargetInput, vars: TweenVars, position?: Position): this {
    return this.record(() => this.tween(target, [vars], position, ([v], names, at) => this.compat.from(names, v, at)))
  }

  fromTo(target: TargetInput, fromVars: TweenVars, toVars: TweenVars, position?: Position): this {
    return this.record(() =>
      this.tween(target, [fromVars, toVars], position, ([f, t], names, at) => this.compat.fromTo(names, f, t, at))
    )
  }

  set(target: TargetInput, vars: TweenVars, position?: Position): this {
    return this.record(() => this.tween(target, [vars], position, ([v], names, at) => this.compat.set(names, v, at)))
  }

  addLabel(name: string, position?: Position): this {
    return this.record(() => this.compat.addLabel(name, position))
  }

  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(child: LiveTimeline, position?: Position): this {
    return this.record(() => {
      // The child's tracks now play as part of this timeline, not on their own.
      child.autoplayPending = false
      child.timeline.stop()
      child.stage.deactivate(child.timeline)
      this.compat.add(child.compat, position)
    })
  }

  /**
   * Build the timeline again from the same calls: rewind to the start (so start
   * values are read from what elements show before it ran), rebuild every tween —
   * re-running function values — and return to the same progress. Use after a
   * layout change; `scrollTrigger: { invalidateOnRefresh: true }` does it on refresh.
   */
  invalidate(): this {
    const progress = this.compat.progress()
    this.compat.progress(0)
    this.stage.render(this.timeline)
    this.compat.reset()
    this.events = []
    this.ranges = []
    for (const step of this.recipe) step()
    this.syncDuration()
    this.compat.progress(progress)
    this.stage.render(this.timeline)
    return this
  }

  /**
   * Run `callback` when the playhead crosses `position` (default: the end so far),
   * in either direction (GSAP's `call`). It takes no time, but a call after the
   * last tween makes the timeline that long.
   */
  call(callback: (...args: never[]) => void, params: unknown[] = [], position?: Position): this {
    return this.record(() => {
      const time = this.compat.addEvent(position)
      this.events.push({ time, run: () => (callback as (...args: unknown[]) => void)(...params) })
    })
  }

  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(position?: Position, callback?: (...args: never[]) => void, params: unknown[] = []): this {
    return this.record(() => {
      const time = this.compat.addEvent(position)
      this.events.push({ time, pause: true, run: () => (callback as ((...args: unknown[]) => void) | undefined)?.(...params) })
    })
  }

  /**
   * Pause, and animate the playhead from where it is to `position` (seconds or a
   * label), firing callbacks on the way. Returns the tween that moves it.
   */
  tweenTo(position: number | string, vars: TweenToVars = {}): LiveTimeline {
    return this.tweenFromTo(this.timeline.currentTime / 1000, position, vars)
  }

  /** Jump to `from`, then animate the playhead to `to` (seconds or labels). */
  tweenFromTo(from: number | string, to: number | string, vars: TweenToVars = {}): LiveTimeline {
    this.pause()
    this.seek(from)
    const start = this.timeline.currentTime
    const end = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(to)))
    const playhead = { time: start }
    const seconds = vars.duration ?? Math.abs(end - start) / 1000 / (this.timeScale() || 1)
    const driver = new LiveTimeline(this.stage, { onStart: vars.onStart, onComplete: vars.onComplete })
    driver.to(playhead, {
      time: end,
      duration: seconds,
      ease: vars.ease ?? 'none',
      onUpdate: () => {
        this.moveTo(playhead.time)
        vars.onUpdate?.()
      },
    })
    return driver
  }

  // --- playback -----------------------------------------------------------

  play(): this {
    this.autoplayPending = false
    if (!this.started) {
      this.started = true
      this.options.onStart?.()
    }
    const wasPlaying = this.timeline.playbackState === 'playing'
    const wasPaused = this.timeline.playbackState === 'paused'
    this.timeline.play()
    if (!wasPlaying) {
      // Starting over (or for the first time) at the start: callbacks placed there fire.
      const engine = this.timeline
      const atStart = engine.direction === 'forward' ? engine.currentTime === 0 : engine.currentTime === engine.duration
      this.playhead = { ...this.readPlayhead(), fresh: atStart && !wasPaused }
      this.waitingToWrap = false
    }
    this.stage.liveTimelines.add(this)
    this.stage.render(this.timeline)
    this.stage.activate(this.timeline, { onUpdate: () => this.afterFrame() })
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
    this.backwards = false
    return this.play()
  }

  /** Flip direction and keep playing (from the end, if already finished). */
  reverse(): this {
    this.backwards = !this.backwards
    const finishedForward =
      this.timeline.playbackState === 'idle' && this.timeline.direction === 'forward'
    this.timeline.reverse()
    if (finishedForward && this.timeline.currentTime === 0) {
      this.timeline.seek(this.timeline.duration)
    }
    return this.play()
  }

  /** Label times as progress (0..1), in order. */
  labelProgresses(): number[] {
    const duration = this.timeline.duration
    return duration > 0 ? this.compat.labelTimes().map((time) => time / duration) : []
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
    // A jump: callbacks between here and there do not fire (GSAP's default).
    this.playhead = this.readPlayhead()
    this.waitingToWrap = false
    this.options.onUpdate?.()
    return this
  }

  /**
   * Read or set progress, 0..1. Setting applies immediately and fires the
   * callbacks crossed on the way, so a scroll scrub runs them.
   */
  progress(value?: number): number {
    if (value === undefined) return this.compat.progress()
    this.autoplayPending = false
    this.moveTo(Math.max(0, Math.min(1, value)) * this.timeline.duration)
    return this.compat.progress()
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
    this.stage.liveTimelines.delete(this)
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
   * Remove the tweens on these targets (and only these properties, if given)
   * from this timeline — `live.killTweensOf` asks every live timeline. A tween on
   * several elements shares one track, so it stops for all of them.
   */
  killTweensOf(names: string[], properties?: string[]): void {
    for (const name of names) {
      for (const property of properties ?? [undefined]) {
        this.timeline.removeTracks({ target: name, ...(property !== undefined && { property }) })
      }
    }
    if (this.timeline.tracks.length === 0 && this.events.length === 0) this.kill()
  }

  /** Run a building step now, and keep it so `invalidate()` can run it again. */
  private record(step: () => void): this {
    this.recipe.push(step)
    step()
    this.syncDuration()
    return this
  }

  /** A call or pause after the last tween extends the timeline to reach it. */
  private syncDuration(): void {
    if (this.events.length === 0) return
    this.timeline.setDuration(undefined)
    const last = Math.max(...this.events.map((event) => event.time))
    if (last > this.timeline.duration) this.timeline.setDuration(last)
  }

  private readPlayhead(): Playhead {
    const engine = this.timeline
    return { time: engine.currentTime, iteration: engine.loopIteration, direction: engine.direction }
  }

  /** Set the playhead to a time (ms) within the current loop, firing what it crosses. */
  private moveTo(time: number): void {
    const from = this.playhead
    this.timeline.seek(time)
    this.stage.render(this.timeline)
    const to: Playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: time >= from.time ? 'forward' : 'reverse' }
    const moved = { ...from, iteration: to.iteration, direction: to.direction }
    this.playhead = { ...this.readPlayhead() }
    this.waitingToWrap = false
    this.runCrossings(moved, to, false)
    this.options.onUpdate?.()
  }

  /**
   * Rebuild for a new loop, keeping the playhead where the engine put it. Unlike
   * `invalidate()`, start values are not re-read from a rewound render: the
   * rebuilt tweens start where the recorded calls say, with fresh function values.
   */
  private refreshForRepeat(): void {
    const time = this.timeline.currentTime
    this.compat.reset()
    this.events = []
    this.ranges = []
    for (const step of this.recipe) step()
    this.syncDuration()
    this.timeline.seek(Math.min(time, this.timeline.duration))
  }

  /** After each frame this timeline played: callbacks crossed, repeats, completion. */
  private afterFrame(): void {
    const engine = this.timeline
    const holding = engine.repeatDelayRemaining > 0
    if (this.waitingToWrap && holding) {
      this.options.onUpdate?.()
      return
    }
    this.waitingToWrap = false
    const from = this.playhead
    const to = this.readPlayhead()
    this.playhead = to
    const alternate = this.options.yoyo === true
    if (holding && !alternate && to.iteration > from.iteration) {
      this.playhead = { time: 0, iteration: to.iteration, direction: 'forward', fresh: true }
      this.waitingToWrap = true
    }
    const stopped = this.runCrossings(from, to, holding)
    this.options.onUpdate?.()

    if (this.finishedThisFrame && !stopped) {
      this.finishedThisFrame = false
      const atStart = engine.currentTime === 0 && engine.direction === 'reverse'
      if (!this.scrollDriver && !alternate) this.stage.liveTimelines.delete(this)
      if (atStart && this.backwards) this.options.onReverseComplete?.()
      else this.options.onComplete?.()
    }
    this.finishedThisFrame = false
  }

  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  private runCrossings(from: Playhead, to: Playhead, holding: boolean): boolean {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return false
    const events = this.events
    const { crossings, passes } = playheadCrossings(
      events.map((event) => event.time),
      from,
      to,
      { duration: this.timeline.duration, alternate: this.options.yoyo === true, holding }
    )
    for (const crossing of crossings) {
      if (this.killed) return true
      if (crossing.kind === 'repeat') {
        // Draw function and random values again for the loop that starts now.
        if (this.options.repeatRefresh) this.refreshForRepeat()
        this.options.onRepeat?.()
        continue
      }
      const event = events[crossing.index]
      if (event.direction && event.direction !== crossing.direction) continue
      if (event.pause) {
        this.timeline.seek(event.time)
        this.stage.render(this.timeline)
        this.pause()
        this.playhead = this.readPlayhead()
        this.waitingToWrap = false
        event.run()
        return true
      }
      event.run()
    }
    for (const range of this.ranges) {
      const overlaps = passes.some(([a, b]) => a !== b && Math.max(a, b) >= range.start && Math.min(a, b) <= range.end)
      if (overlaps) range.run()
    }
    return false
  }

  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  private tween(
    target: TargetInput,
    varsList: TweenVars[],
    position: Position | undefined,
    build: (varsList: TweenVars[], names: string[], position?: Position) => void
  ): void {
    const names = this.resolve(target)
    if (!names) return

    // A tween's own callbacks become events at its start and end.
    const { onStart, onUpdate, onComplete } = varsList[varsList.length - 1]
    if (onStart || onUpdate || onComplete) {
      let start = Infinity
      let end = -Infinity
      const measured: typeof build = (list, buildNames, at) => {
        build(list, buildNames, at)
        start = Math.min(start, this.compat.lastStart)
        end = Math.max(end, this.compat.lastEnd)
      }
      this.buildTween(names, varsList, position, measured)
      if (start === Infinity) return
      if (onStart) this.events.push({ time: start, direction: 'forward', run: onStart })
      if (onUpdate) this.ranges.push({ start, end, run: onUpdate })
      if (onComplete) this.events.push({ time: end, direction: 'forward', run: onComplete })
      return
    }
    this.buildTween(names, varsList, position, build)
  }

  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  private keyframed(target: TargetInput, vars: TweenVars, position: Position | undefined): void {
    const names = this.resolve(target)
    if (!names) return
    const segments = expandKeyframes(vars)
    if (segments.length === 0) return

    const config = names.length > 1 ? toStaggerConfig(vars.stagger, this.staggerContext(names)) : undefined
    // Targets as elements / objects: names are not selectors.
    const targets = names.map((name) => this.targetFor(name)).filter((item): item is Element | ObjectTarget => item !== undefined)
    const groups: Array<Array<Element | ObjectTarget>> = config ? targets.map((item) => [item]) : [targets]
    const offsets = config ? staggerOffsets(names.length, config).map((ms) => ms / 1000) : [0]
    const base = this.compat.timeOf(position) / 1000 + toMs(vars.delay, 0) / 1000

    let start = Infinity
    let end = -Infinity
    groups.forEach((group, i) => {
      segments.forEach((segment, j) => {
        const at: Position = j === 0 ? base + offsets[i] : '>'
        this.tween(group as TargetInput, [segment], at, ([v], buildNames, buildAt) => this.compat.to(buildNames, v, buildAt))
        start = Math.min(start, this.compat.lastStart)
        end = Math.max(end, this.compat.lastEnd)
      })
    })
    if (start === Infinity) return
    const { onStart, onUpdate, onComplete } = vars
    if (onStart) this.events.push({ time: start, direction: 'forward', run: onStart })
    if (onUpdate) this.ranges.push({ start, end, run: onUpdate })
    if (onComplete) this.events.push({ time: end, direction: 'forward', run: onComplete })
  }

  private staggerContext(names: string[]): StaggerContext {
    return {
      count: names.length,
      columnsFromLayout: () => columnsInFirstRow(names.map((name) => this.stage.elementFor(name))),
      random: () => this.stage.utils.random(0, 1),
    }
  }

  private buildTween(
    names: string[],
    varsList: TweenVars[],
    position: Position | undefined,
    build: (varsList: TweenVars[], names: string[], position?: Position) => void
  ): void {
    const targets = names.map((name) => this.targetFor(name))
    const perElement =
      names.length > 1 &&
      (varsList.some(differsPerElement) || names.some((name) => this.stage.objectFor(name) !== undefined))
    if (!perElement) {
      const first = this.targetFor(names[0])
      build(varsList.map((vars) => this.prepare(resolveFunctionValues(vars, 0, first, this.stage.utils, targets), names)), names, position)
      return
    }

    // Stagger and delay belong to the last vars (the `to` side). Offsets follow the
    // stagger's each / amount / from, in seconds, as they would for one shared track.
    const last = varsList.length - 1
    const { stagger, ...rest } = varsList[last]
    const config = toStaggerConfig(stagger, this.staggerContext(names))
    const offsets = config ? staggerOffsets(names.length, config).map((ms) => ms / 1000) : names.map(() => 0)
    // The first element goes at the position, after its delay and offset. Each later
    // one goes relative to the previous element's start ('<'), which already includes
    // those, so it moves by the difference between their offsets — possibly backwards.
    names.forEach((name, i) => {
      const delay = i === 0 ? toMs(rest.delay, 0) / 1000 + offsets[0] : 0
      const step = i === 0 ? 0 : offsets[i] - offsets[i - 1]
      const at = i === 0 ? position : `<${step < 0 ? '-' : '+'}${Math.abs(step).toFixed(6)}`
      const perTarget = varsList.map((vars, k) => (k === last ? { ...rest, delay } : vars))
      const resolved = perTarget.map((vars) => this.prepare(resolveFunctionValues(vars, i, this.targetFor(name), this.stage.utils, targets), [name]))
      build(resolved, [name], at)
    })
  }

  /** The element or plain object behind a target name. */
  private targetFor(name: string): Element | ObjectTarget | undefined {
    return this.stage.elementFor(name) ?? this.stage.objectFor(name)
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
  /**
   * GSAP's utilities: `clamp`, `mapRange`, `normalize`, `interpolate`, `wrap`,
   * `wrapYoyo`, `snap`, `random`, `shuffle`, `distribute`, `pipe`, `splitColor`,
   * `getUnit`. Random draws are seeded (`utils.seed(n)`), so pages replay identically.
   */
  readonly utils: LiveUtils
  /**
   * The value tinyfly last applied to a property (or a plain object's own value),
   * falling back to the property's static default. tinyfly never reads computed styles.
   */
  getProperty(target: TargetInput, property: string): AnimatableValue | undefined
  /** Run `callback` after `delay` seconds, on the stage's clock (GSAP's `delayedCall`). `kill()` cancels it. */
  delayedCall(delay: number, callback: (...args: never[]) => void, params?: unknown[]): LiveTimeline
  /**
   * Stop every tween on these targets — only the given properties (an array or
   * `'x,y'`), if any — in every live timeline (GSAP's `killTweensOf`).
   */
  killTweensOf(target: TargetInput, properties?: string | string[]): void
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
  /**
   * One scroll trigger per element, with elements that cross an edge close
   * together delivered in one callback (GSAP's `ScrollTrigger.batch`).
   */
  scrollBatch(targets: string | Element | ArrayLike<Element>, vars: ScrollBatchVars): ScrollDriver[]
  /**
   * Animate scrolling to an offset, element, selector or `'max'` (GSAP's
   * ScrollToPlugin). Stops if the reader scrolls. Also: `live.to(window, { scrollTo })`.
   */
  scrollTo(destination: ScrollDestination, vars?: ScrollToVars): LiveTimeline
  /** Re-measure every scroll trigger and smoother, after layout changes a resize would not catch. */
  refreshScroll(): void
  /**
   * Smooth wheel scrolling, with `data-speed` / `data-lag` parallax when `effects`
   * is set (GSAP's ScrollSmoother). The browser's scroll position still moves, so
   * scroll triggers and pins work unchanged. Off under reduced motion. `kill()` it when done.
   */
  smoothScroll(options?: LiveSmoothScrollOptions): SmoothScroll
  /**
   * Collect everything the live API creates while `fn` runs (and later, inside
   * `ctx.add()`), so `ctx.revert()` undoes it all. Selectors resolve within `scope`.
   */
  context(fn?: (context: LiveContext) => unknown, scope?: ParentNode): LiveContext
  /** Setups that apply while media queries match (GSAP's `gsap.matchMedia`). */
  matchMedia(scope?: ParentNode): LiveMatchMedia
  /**
   * A setter that animates one property toward each value it is given, re-using
   * one tween (GSAP's `gsap.quickTo`) — for values that change on every pointer
   * move or scroll event.
   */
  quickTo(target: TargetInput, property: string, vars?: QuickToVars): QuickTo
  /**
   * A canvas showing one frame of an image sequence; tween or scrub its `frame`.
   * Selectors resolve within the stage's root.
   */
  imageSequence(canvas: string | HTMLCanvasElement, options: ImageSequenceOptions): ImageSequence
  /**
   * Animate a client-side page change: the old view out, `update()`, shared elements
   * carried across by `data-flip-id`, the new view in. Resolves when it has finished.
   */
  pageTransition(options: PageTransitionOptions): Promise<void>
  /** Register a custom ease from SVG path data or bezier points (GSAP's CustomEase.create). Returns the name. */
  customEase(name: string, definition: string | CubicBezierPoints): string
  /** Register a bouncing ease (GSAP's CustomBounce.create). Returns the name. */
  customBounce(name: string, options?: CustomBounceOptions): string
  /** Register a wiggle ease that returns to the start (GSAP's CustomWiggle.create). Returns the name. */
  customWiggle(name: string, options?: CustomWiggleOptions): string
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
      onRepeat: config.onRepeat as (() => void) | undefined,
      onReverseComplete: config.onReverseComplete as (() => void) | undefined,
      repeatRefresh: config.repeatRefresh as boolean | undefined,
      scrollTrigger: config.scrollTrigger,
    })
  }

  const withoutCallbacks = (vars: TweenVars): TweenVars => {
    const { onStart: _start, onUpdate: _update, onComplete: _complete, onRepeat: _repeat, onReverseComplete: _reverse, repeatRefresh: _refresh, ...rest } = vars
    return rest
  }

  /** Register something with the context collecting right now, if any. */
  const track = <T extends Revertible | undefined>(item: T): T => {
    if (item) stage.collector?.track(item)
    return item
  }

  const api: LiveApi = {
    stage,
    ticker: stage.ticker,
    utils: stage.utils,
    getProperty: (target, property) => {
      const [name] = stage.resolveTargets(target)
      if (name === undefined) return undefined
      const object = stage.objectFor(name)
      if (object) return (object as Record<string, unknown>)[property] as AnimatableValue | undefined
      return stage.appliedValue(name, property) ?? defaultFor(property)
    },
    scrollTrigger: (vars) => track(createScrollTrigger(stage, vars)),
    scrollBatch: (targets, vars) => scrollBatch(stage, targets, vars).map((driver) => track(driver)),
    scrollTo: (destination, vars) => scrollTo(api, stage, destination, vars),
    refreshScroll: () => {
      ScrollDriver.refreshAll()
      SmoothScroll.refreshAll()
    },
    smoothScroll: (options = {}) => {
      const scroller =
        typeof options.scroller === 'string' ? (stage.collector?.scope ?? stage.root).querySelector<HTMLElement>(options.scroller) : options.scroller
      // Effects are measured again whenever scroll triggers measure (and pin), so order doesn't matter.
      return track(new SmoothScroll({ ...options, scroller }).start())
    },
    context: (fn, scope) => {
      const context = new LiveContext(stage, scope)
      if (fn) context.add(() => fn(context))
      return context
    },
    matchMedia: (scope) => new LiveMatchMedia(stage, scope),
    customEase: CustomEase.create,
    customBounce: CustomBounce.create,
    customWiggle: CustomWiggle.create,
    pageTransition: (options) => pageTransition(api, stage, (timelineOptions) => new LiveTimeline(stage, timelineOptions), options),
    imageSequence: (canvas, options) => {
      const element = typeof canvas === 'string' ? (stage.collector?.scope ?? stage.root).querySelector(canvas) : canvas
      if (!(element instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(canvas)}`)
      return track(new ImageSequence(element, options))
    },
    quickTo: (target, property, vars = {}) => {
      const tween = new LiveTimeline(stage, { paused: true })
      const [name] = stage.resolveTargets(target)
      const setter = (value: number) => {
        if (!name) return
        // Measured before the old track goes, so a spring carries the motion on.
        const velocity = vars.spring !== undefined ? stage.velocityOf(name, property) ?? 0 : 0
        tween.compat.reset()
        tween.compat.to(name, {
          [property]: value,
          duration: vars.duration ?? 0.4,
          ease: vars.ease ?? 'power3.out',
          ...(vars.spring !== undefined && { spring: withVelocity(vars.spring, property, velocity) }),
        })
        // Restart without rendering now: the value it starts from is already on
        // screen, and the next frame applies the move. Many calls in one frame
        // cost one write.
        tween.timeline.stop()
        tween.timeline.play()
        stage.activate(tween.timeline)
      }
      return Object.assign(setter, { tween, kill: () => tween.kill() }) as QuickTo
    },
    timeline: (options) => new LiveTimeline(stage, options),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (target, vars) => {
      // GSAP's ScrollToPlugin form: live.to(window, { scrollTo: '#id', duration: 1 }).
      if (vars.scrollTo !== undefined) {
        const { scrollTo: destination, ...rest } = vars as TweenVars & { scrollTo: ScrollDestination | { offsetX?: number; offsetY?: number } }
        const offsets = typeof destination === 'object' && destination !== null && !('nodeType' in destination) ? (destination as { offsetX?: number; offsetY?: number }) : {}
        const isScroller = typeof target !== 'string' && target !== window && (target as Element).nodeType === 1
        return scrollTo(api, stage, destination as ScrollDestination, {
          ...(rest as ScrollToVars),
          offsetX: offsets.offsetX,
          offsetY: offsets.offsetY,
          scroller: isScroller ? (target as HTMLElement) : undefined,
        })
      }
      return single(vars).to(target, withoutCallbacks(vars))
    },
    from: (target, vars) => single(vars).from(target, withoutCallbacks(vars)),
    fromTo: (target, fromVars, toVars) => single(toVars).fromTo(target, fromVars, withoutCallbacks(toVars)),
    set: (target, vars) => single(vars).set(target, withoutCallbacks(vars)),
    delayedCall: (delay, callback, params) => new LiveTimeline(stage).call(callback, params, delay),
    killTweensOf: (target, properties) => {
      const names = stage.resolveTargets(target)
      const only = typeof properties === 'string' ? properties.split(',').map((property) => property.trim()).filter(Boolean) : properties
      for (const timeline of [...stage.liveTimelines]) timeline.killTweensOf(names, only)
    },
    convertToPath: (targets) => convertToPath(targets, stage.root),
    splitText: (targets, options) => {
      const root = stage.collector?.scope ?? stage.root
      const elements =
        typeof targets === 'string' ? Array.from(root.querySelectorAll(targets)) : 'nodeType' in targets ? [targets as Element] : Array.from(targets)
      return track(splitText(elements, options))
    },
    draggable: (target, options) => track(createLiveDraggable(api, stage, target, options)),
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

/** A spring option with its velocity for `property` filled in. */
function withVelocity(spring: NonNullable<TweenVars['spring']>, property: string, velocity: number): TweenVars['spring'] {
  if (spring === true) return { velocity: { [property]: velocity } }
  if (typeof spring === 'string') return { preset: spring, velocity: { [property]: velocity } }
  return { ...spring, velocity: { [property]: velocity } }
}

/** Whether a tween's values can differ from one target to the next. */
function differsPerElement(vars: TweenVars): boolean {
  return (
    vars.morphSVG !== undefined ||
    vars.drawSVG !== undefined ||
    vars.text !== undefined ||
    vars.scrambleText !== undefined ||
    hasFunctionValues(vars)
  )
}

function hasFunctionValues(vars: TweenVars): boolean {
  return Object.entries(vars).some(([key, value]) => (typeof value === 'function' || isRandomString(value)) && !RESERVED_KEYS.has(key))
}

/**
 * Call function values (`x: (index, target, targets) => …`) and draw
 * `"random(…)"` strings for one target. Callbacks and a function `ease` are
 * configuration, not values, and are left alone.
 */
function resolveFunctionValues(
  vars: TweenVars,
  index: number,
  target: Element | ObjectTarget | undefined,
  utils: LiveUtils,
  targets: unknown[]
): TweenVars {
  if (!hasFunctionValues(vars)) return vars
  const resolved: TweenVars = {}
  for (const [key, value] of Object.entries(vars)) {
    if (RESERVED_KEYS.has(key)) resolved[key] = value
    else if (typeof value === 'function') resolved[key] = (value as (i: number, t: unknown, all: unknown[]) => unknown)(index, target, targets)
    else if (isRandomString(value)) resolved[key] = utils.resolveRandomString(value)
    else resolved[key] = value
  }
  return resolved
}

/** For `grid: 'auto'`: how many elements sit on the first row (same top, within a pixel). */
function columnsInFirstRow(elements: Array<Element | undefined>): number {
  const tops = elements.map((element) => element?.getBoundingClientRect().top)
  if (tops[0] === undefined) return elements.length
  let columns = 0
  for (const top of tops) {
    if (top === undefined || Math.abs(top - tops[0]) > 1) break
    columns++
  }
  return Math.max(1, columns)
}

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
