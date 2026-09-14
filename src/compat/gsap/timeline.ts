import {
  Timeline,
  createTrack,
  bakeEasing,
  getEasingFunction,
  isParametricEasing,
  staggerSpan,
  type Track,
  type Keyframe,
  type EasingType,
  type AnimatableValue,
  type TimelineDefinition,
  type MotionPathTrack,
  type TextTrack,
  type InertiaTrack,
  type SpringTrack,
  inertiaDuration,
  inertiaRest,
  springDuration,
} from '../../engine'
import { mapEase } from './ease-map'
import { seededRandom } from './utils'
import { resolvePosition, type Position, type PositionContext } from './position'
import { splitVars, toMs, toStaggerConfig, type TweenVars } from './vars'
import { defaultFor } from './defaults'
import { compileMotionPath, reverseMotionPath } from './motion-path-vars'
import { desugarMorph } from './morph-vars'
import { rejectUnresolvedDrawSvg } from './draw-svg-vars'
import { compileTextVars } from './text-vars'
import { compileInertiaProperty, type InertiaVars } from './inertia-vars'
import { springParameters, springVelocity, type SpringVars } from './spring-vars'

/**
 * A GSAP-flavoured facade over the tinyfly engine.
 *
 * This is a *desugarer*, not a compatibility layer. Every call compiles down to
 * ordinary `Track` data and is handed to a normal `Timeline`, so anything
 * authored here opens in the editor and round-trips as JSON. Nothing new enters
 * the engine.
 *
 * What it deliberately does not do: plugins, `gsap.utils`, runtime function
 * values, live DOM reads for implicit start values, or tween-level overwrite.
 * See docs/gsap-compat.md.
 */

export interface CompatTimelineOptions {
  /** Id for the underlying engine timeline */
  id?: string
  name?: string
  /** Repeat count; -1 for infinite (GSAP's `repeat`) */
  repeat?: number
  /** Alternate direction each repeat (GSAP's `yoyo`) */
  yoyo?: boolean
  /** Seconds to wait between repeats */
  repeatDelay?: number
  /** Playback rate */
  timeScale?: number
  /**
   * Starting values for properties that have no earlier keyframe — step 3 of
   * the resolution chain in `defaults.ts`.
   */
  defaults?: Record<string, number>
  /**
   * Look up a start value for a target+property this timeline has not authored
   * yet — consulted between step 2 and step 3 of the resolution chain. The live
   * runtime uses it to start a new tween from the value an earlier tween left
   * on the element. It is called once, at build time; the resolved number is
   * what lands in the JSON.
   */
  startValue?: (target: string, property: string) => AnimatableValue | undefined
  /**
   * The velocity (units per second) a property is already moving at, for a
   * `spring` tween that does not give one — so interrupting a motion carries its
   * momentum. Called once, at build time.
   */
  startVelocity?: (target: string, property: string) => number | undefined
  /**
   * Sample elastic, bounce, back and steps eases into intermediate keyframes
   * instead of keeping them as parametric eases — for players that predate
   * parametric eases. Off by default: the parametric form is exact and small.
   */
  bakeEases?: boolean
  /** Interval between baked keyframes, in milliseconds (default: one 60fps frame) */
  bakeIntervalMs?: number
  /** Called when a start value falls through to a static default */
  onWarning?: (message: string) => void
  /** For `stagger: { grid: 'auto' }`: how many of these targets share the first row */
  layoutColumns?: (targets: string[]) => number
  /** Random draws for `stagger: { from: 'random' }` (default: seeded from 1) */
  random?: () => number
}

/** Handle for one compiled tween — the nearest thing we have to a GSAP Tween. */
export interface TweenHandle {
  /** Ids of the tracks this tween produced */
  trackIds: string[]
  /** Start time in milliseconds */
  start: number
  /** End time in milliseconds */
  end: number
  /** Remove this tween's tracks from the timeline */
  kill(): void
}

export class CompatTimeline {
  /** The engine timeline. Use it for anything the facade does not cover. */
  readonly timeline: Timeline

  private options: CompatTimelineOptions
  private cursor = 0
  private readonly fallbackRandom = seededRandom(1)
  private previousStart = 0
  private previousEnd = 0
  private labels = new Map<string, number>()
  private trackCounter = 0

  /** Last authored value per "target|property", for the resolution chain. */
  private lastValues = new Map<string, AnimatableValue>()

  constructor(options: CompatTimelineOptions = {}) {
    this.options = options
    this.timeline = new Timeline({
      // A timestamped default would make the same script compile to different
      // JSON on every run, which breaks the determinism contract. Callers that
      // need distinct ids pass one.
      id: options.id ?? 'gsap-compat',
      name: options.name,
      config: {
        ...(options.repeat !== undefined && { loop: options.repeat }),
        ...(options.yoyo !== undefined && { alternate: options.yoyo }),
        ...(options.repeatDelay !== undefined && { repeatDelay: options.repeatDelay * 1000 }),
        ...(options.timeScale !== undefined && { speed: options.timeScale }),
      },
    })
  }

  // --- tween creation -----------------------------------------------------

  /** Animate to the given values. */
  to(target: string | string[], vars: TweenVars, position?: Position): TweenHandle {
    return this.build(target, undefined, desugar(vars), position)
  }

  /** Animate from the given values to where the property already is. */
  from(target: string | string[], vars: TweenVars, position?: Position): TweenHandle {
    const { config, properties } = splitVars(desugar(vars))
    const { motionPath, text, scrambleText, ...animated } = properties
    const first = this.targetsOf(target)[0]

    // `from` is `to` with the endpoints swapped: the given values are the start,
    // and the end is whatever the resolution chain says the property holds.
    const toVars: TweenVars = { ...config }
    for (const property of Object.keys(animated)) {
      toVars[property] = this.resolveStart(first, property)
    }
    // A motion path has no "current value" — from() travels it backwards.
    if (motionPath !== undefined) toVars.motionPath = reverseMotionPath(motionPath)

    // Text goes from the given text to the current text, keeping its options.
    const fromText: Record<string, unknown> = {}
    const current = String(this.resolveStart(first, 'text'))
    if (text !== undefined) {
      fromText.text = textValueOf(text)
      toVars.text = typeof text === 'object' ? { ...text, value: current } : current
    }
    if (scrambleText !== undefined) {
      fromText.text = textValueOf(scrambleText)
      toVars.scrambleText = typeof scrambleText === 'object' ? { ...scrambleText, text: current } : current
    }

    return this.build(target, { ...animated, ...fromText }, toVars, position)
  }

  /** Animate between two explicit sets of values. */
  fromTo(
    target: string | string[],
    fromVars: TweenVars,
    toVars: TweenVars,
    position?: Position
  ): TweenHandle {
    const { properties: fromProperties } = splitVars(desugar(fromVars))
    return this.build(target, fromProperties, desugar(toVars), position)
  }

  /** Set values instantly — a single held keyframe. */
  set(target: string | string[], vars: TweenVars, position?: Position): TweenHandle {
    return this.build(target, undefined, { ...desugar(vars), duration: 0 }, position)
  }

  // --- sequencing ---------------------------------------------------------

  /** Start of the tween (after its delay) or call added last, in milliseconds. */
  get lastStart(): number {
    return this.previousStart
  }

  /** End of the tween or call added last, in milliseconds. */
  get lastEnd(): number {
    return this.previousEnd
  }

  /**
   * Place a zero-length event (a callback or a pause) at a position, as a tween of
   * no duration would be: `'<'` and `'>'` after it refer to it. Returns its time in ms.
   */
  addEvent(position?: Position): number {
    const time = Math.max(0, resolvePosition(position, this.context()))
    this.previousStart = time
    this.previousEnd = time
    this.cursor = Math.max(this.cursor, time)
    return time
  }

  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(position: Position): number {
    return resolvePosition(position, this.context())
  }

  /** Name a point in time, for use as a position parameter. */
  addLabel(name: string, position?: Position): this {
    this.labels.set(name, resolvePosition(position, this.context()))
    return this
  }

  /** Time of a label, in milliseconds. */
  /** Every label's time in milliseconds, in time order. */
  labelTimes(): number[] {
    return [...this.labels.values()].sort((a, b) => a - b)
  }

  labelTime(name: string): number | undefined {
    return this.labels.get(name)
  }

  /**
   * Merge another compat timeline in at a position.
   *
   * Nested timelines are flattened at compile time — every keyframe is offset
   * and copied in — so there is no nested-timeline runtime and the output is
   * one flat, serializable track list.
   */
  add(child: CompatTimeline, position?: Position): this {
    const offset = resolvePosition(position, this.context())

    for (const track of child.timeline.tracks) {
      if (!('keyframes' in track)) continue

      const shifted = createTrack({
        ...(track as Track),
        id: this.nextTrackId(`nested-${track.id}`),
        keyframes: (track as Track).keyframes.map((kf) => ({ ...kf, time: kf.time + offset })),
      })
      this.timeline.addTrack(shifted)
    }

    const end = offset + child.timeline.duration
    this.previousStart = offset
    this.previousEnd = end
    this.cursor = Math.max(this.cursor, end)
    return this
  }

  // --- playback -----------------------------------------------------------

  play(): this { this.timeline.play(); return this }
  pause(): this { this.timeline.pause(); return this }
  restart(): this { this.timeline.stop(); this.timeline.play(); return this }
  reverse(): this { this.timeline.reverse(); return this }
  kill(): this { this.timeline.removeTracks(); return this }

  /**
   * Remove every tween and forget the cursor, labels and chained start values,
   * so the same calls can build it again from scratch (`invalidate` in `live`).
   */
  reset(): this {
    this.timeline.removeTracks()
    this.cursor = 0
    this.previousStart = 0
    this.previousEnd = 0
    this.labels.clear()
    this.lastValues.clear()
    this.trackCounter = 0
    return this
  }

  /** Seek to a time in seconds, or to a label. */
  seek(position: number | string): this {
    if (typeof position === 'string') {
      const time = this.labels.get(position)
      if (time !== undefined) this.timeline.seek(time)
      return this
    }
    this.timeline.seek(position * 1000)
    return this
  }

  /** Progress through the timeline, 0..1. */
  progress(value?: number): number {
    const duration = this.timeline.duration
    if (value !== undefined && duration > 0) {
      this.timeline.seek(value * duration)
    }
    return duration > 0 ? this.timeline.currentTime / duration : 0
  }

  /** Playback rate. */
  timeScale(value?: number): number {
    if (value !== undefined) this.timeline.speed = value
    return this.timeline.speed
  }

  /** Total duration in seconds (GSAP's unit). */
  duration(): number {
    return this.timeline.duration / 1000
  }

  /** Advance by `deltaMs` — the host still owns the animation loop. */
  tick(deltaMs: number): this {
    this.timeline.tick(deltaMs)
    return this
  }

  /** The compiled animation, as plain JSON. */
  toDefinition(): TimelineDefinition {
    return this.timeline.toDefinition()
  }

  // --- compilation --------------------------------------------------------

  /**
   * Compile one tween into tracks.
   *
   * `fromProperties` holds explicit start values (fromTo / from); when absent,
   * each property's start comes from the resolution chain.
   */
  private build(
    target: string | string[],
    fromProperties: Record<string, unknown> | undefined,
    vars: TweenVars,
    position?: Position
  ): TweenHandle {
    const { config, properties: allProperties } = splitVars(vars)
    // motionPath, text and scrambleText are not properties with a value; each
    // compiles to its own track kind.
    const { motionPath, text, scrambleText, inertia, ...properties } = allProperties
    const targets = this.targetsOf(target)

    const start = resolvePosition(position, this.context())
    const delay = toMs(config.delay, 0)
    const duration = toMs(config.duration, 500)
    const stagger = toStaggerConfig(config.stagger, {
      count: targets.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns!(targets) : undefined,
      random: this.options.random ?? this.fallbackRandom,
    })

    const easing = this.easingFor(config.ease)
    const trackIds: string[] = []
    const spring = config.spring as SpringVars | undefined
    // Springs and throws decide their own length, so they extend the tween rather than using `duration`.
    let physicsMs = 0
    let eased = false

    for (const [property, rawTo] of Object.entries(properties)) {
      const toValue = rawTo as AnimatableValue
      let fromValue =
        fromProperties?.[property] !== undefined
          ? (fromProperties[property] as AnimatableValue)
          : this.resolveStart(targets[0], property)

      // A fallback start of the wrong kind (0 for a colour, say) would render as
      // garbage for the whole tween. Start from the end value instead: it snaps
      // rather than animates, which is visibly wrong but not broken.
      if (typeof fromValue !== typeof toValue) {
        this.warn(
          `no usable start value for "${property}" on "${targets[0]}" — it will snap to ${String(toValue)}. ` +
            'Use fromTo() to animate it.'
        )
        fromValue = toValue
      }

      if (spring !== undefined && (typeof fromValue !== 'number' || typeof toValue !== 'number')) {
        this.warn(`spring works on numbers, so "${property}" on "${targets[0]}" eases instead`)
      }

      if (spring !== undefined && typeof fromValue === 'number' && typeof toValue === 'number') {
        const springConfig = {
          ...springParameters(spring),
          from: fromValue,
          to: toValue,
          velocity: springVelocity(spring, property) ?? this.options.startVelocity?.(targets[0], property) ?? 0,
        }
        const id = this.nextTrackId(`${targets[0]}-${property}-spring`)
        const track: SpringTrack = {
          id,
          target: targets[0],
          ...(targets.length > 1 && { targets }),
          ...(stagger && targets.length > 1 && { stagger }),
          property,
          kind: 'spring',
          spring: springConfig,
          delay: start + delay,
        }
        this.timeline.addTrack(track)
        trackIds.push(id)
        physicsMs = Math.max(physicsMs, springDuration(springConfig))
        for (const t of targets) this.lastValues.set(`${t}|${property}`, toValue)
        continue
      }

      eased = true
      const keyframes = this.keyframesFor(fromValue, toValue, duration, easing, config.ease)

      const id = this.nextTrackId(`${targets[0]}-${property}`)
      this.timeline.addTrack(
        createTrack({
          id,
          target: targets[0],
          ...(targets.length > 1 && { targets }),
          ...(stagger && targets.length > 1 && { stagger }),
          property,
          delay: start + delay,
          keyframes,
        })
      )

      trackIds.push(id)
      // Any value, not just numbers: a colour or a shape chains just as well.
      for (const t of targets) this.lastValues.set(`${t}|${property}`, toValue)
    }

    const textConfig = compileTextVars({ text, scrambleText }, targets[0], duration)
    if (textConfig) {
      const given = fromProperties?.text ?? fromProperties?.scrambleText
      const from = given !== undefined ? textValueOf(given) : this.resolveStart(targets[0], 'text')
      const id = this.nextTrackId(`${targets[0]}-text`)
      const track: TextTrack = {
        id,
        target: targets[0],
        ...(targets.length > 1 && { targets }),
        ...(stagger && targets.length > 1 && { stagger }),
        property: 'text',
        textConfig: { from: typeof from === 'string' ? from : String(from ?? ''), ...textConfig },
        delay: start + delay,
        keyframes: this.keyframesFor(0, 1, duration, easing, config.ease) as TextTrack['keyframes'],
      }
      this.timeline.addTrack(track)
      trackIds.push(id)
      for (const t of targets) this.lastValues.set(`${t}|text`, textConfig.to)
    }

    if (motionPath !== undefined) {
      const { config: pathConfig, start: from, end: to } = compileMotionPath(motionPath)
      const id = this.nextTrackId(`${targets[0]}-motionPath`)
      const track: MotionPathTrack = {
        id,
        target: targets[0],
        ...(targets.length > 1 && { targets }),
        ...(stagger && targets.length > 1 && { stagger }),
        property: 'motionPath',
        motionPathConfig: pathConfig,
        delay: start + delay,
        keyframes: this.keyframesFor(from, to, duration, easing, config.ease) as MotionPathTrack['keyframes'],
      }
      this.timeline.addTrack(track)
      trackIds.push(id)
    }

    if (inertia !== undefined) {
      for (const [property, value] of Object.entries(inertia as InertiaVars)) {
        const from = this.resolveStart(targets[0], property)
        if (typeof from !== 'number') {
          this.warn(`inertia on "${property}" needs a numeric start value; skipped`)
          continue
        }
        const inertiaConfig = compileInertiaProperty(from, value)
        const id = this.nextTrackId(`${targets[0]}-${property}-inertia`)
        const track: InertiaTrack = {
          id,
          target: targets[0],
          ...(targets.length > 1 && { targets }),
          ...(stagger && targets.length > 1 && { stagger }),
          property,
          kind: 'inertia',
          inertia: inertiaConfig,
          delay: start + delay,
        }
        this.timeline.addTrack(track)
        trackIds.push(id)
        physicsMs = Math.max(physicsMs, inertiaDuration(inertiaConfig))
        // The next tween on this property starts where the throw came to rest.
        for (const t of targets) this.lastValues.set(`${t}|${property}`, inertiaRest(inertiaConfig))
      }
    }

    // Reuse the engine's stagger maths rather than re-deriving it — it also
    // accounts for `from` (a centre fan spans half as far as a start fan).
    const onlyPhysics = (inertia !== undefined || spring !== undefined) && !eased && !textConfig && motionPath === undefined
    const length = onlyPhysics ? physicsMs : Math.max(duration, physicsMs)
    const span =
      length + (stagger && targets.length > 1 ? staggerSpan(targets.length, stagger) : 0)
    const end = start + delay + span

    this.previousStart = start + delay
    this.previousEnd = end
    this.cursor = Math.max(this.cursor, end)

    return {
      trackIds,
      start: start + delay,
      end,
      kill: () => {
        for (const id of trackIds) this.timeline.removeTrack(id)
      },
    }
  }

  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  private keyframesFor(
    from: AnimatableValue,
    to: AnimatableValue,
    duration: number,
    easing: EasingType | undefined,
    rawEase: TweenVars['ease']
  ): Keyframe[] {
    const first: Keyframe = { time: 0, value: from }

    // A zero-duration tween is a `set`: one keyframe holding the value.
    if (duration <= 0) {
      return [{ time: 0, value: to }]
    }

    const mapped = typeof rawEase === 'string' ? mapEase(rawEase) : undefined

    // Registered curves have no closed form and are always sampled. Parametric
    // eases (elastic, bounce, back, steps) stay one keyframe unless `bakeEases`
    // asks for keyframes a player without them can read.
    const sample = mapped?.requiresBaking === 'custom' || (this.options.bakeEases && isParametricEasing(easing))
    if (sample) {
      const fn = mapped?.fn ?? getEasingFunction(easing)
      return [first, ...bakeEasing(first, { time: duration, value: to }, fn, { intervalMs: this.options.bakeIntervalMs })]
    }

    return [first, { time: duration, value: to, ...(easing && { easing }) }]
  }

  /** Resolve a start value through the documented chain. */
  private resolveStart(target: string, property: string): AnimatableValue {
    const remembered = this.lastValues.get(`${target}|${property}`)
    if (remembered !== undefined) return remembered

    const supplied = this.options.startValue?.(target, property)
    if (supplied !== undefined) return supplied

    const fromDefaults = this.options.defaults?.[property]
    if (fromDefaults !== undefined) return fromDefaults

    // Text starts empty unless something says otherwise: typing onto nothing is normal.
    if (property === 'text') return ''

    // A shape has no sensible default: morphing from nothing is always a mistake.
    if (property === 'd') {
      throw new Error(
        `gsap-compat: no starting shape for "${target}". Use fromTo({ d: … }, { morphSVG: … }), ` +
          'or live.to(), which reads the element\'s current shape.'
      )
    }

    const staticDefault = defaultFor(property)
    if (staticDefault !== undefined) {
      this.warn(
        `no start value for "${property}" on "${target}" — using the static default ` +
          `${staticDefault}. GSAP would read the live DOM here; tinyfly cannot, ` +
          `so pass an explicit fromTo() or a defaults map.`
      )
      return staticDefault
    }

    this.warn(`no start value or default for "${property}" on "${target}" — using 0`)
    return 0
  }

  private easingFor(ease: TweenVars['ease']): EasingType | undefined {
    if (ease === undefined) return undefined
    if (typeof ease === 'string') return mapEase(ease).easing
    if (typeof ease === 'function') {
      // A function ease cannot serialize, and silently dropping it would be
      // worse than saying so.
      throw new Error(
        'gsap-compat: function eases cannot be serialized. Use a named ease, ' +
          'or a cubic-bezier via { type: "cubic-bezier", points: [...] }.'
      )
    }
    return ease
  }

  private targetsOf(target: string | string[]): string[] {
    return Array.isArray(target) ? target : [target]
  }

  private context(): PositionContext {
    return {
      cursor: this.cursor,
      previousStart: this.previousStart,
      previousEnd: this.previousEnd,
      labels: this.labels,
      // Position literals are GSAP seconds; everything stored is milliseconds.
      scale: 1000,
    }
  }

  private nextTrackId(base: string): string {
    this.trackCounter += 1
    return `${base}-${this.trackCounter}`
  }

  private warn(message: string): void {
    this.options.onWarning?.(`gsap-compat: ${message}`)
  }
}

/** The string in a `text` / `scrambleText` value: the value itself, or its `value` / `text` field. */
function textValueOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as { value?: unknown; text?: unknown }
    return String(record.value ?? record.text ?? '')
  }
  return String(value ?? '')
}

/** Create a GSAP-flavoured timeline. */
export function timeline(options?: CompatTimelineOptions): CompatTimeline {
  return new CompatTimeline(options)
}

/** Replace options that name other properties (`morphSVG`) and reject ones that need the page. */
function desugar(vars: TweenVars): TweenVars {
  return rejectUnresolvedDrawSvg(desugarMorph(vars))
}
