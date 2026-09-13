import {
  Timeline,
  createTrack,
  bakeEasing,
  staggerSpan,
  type Track,
  type Keyframe,
  type EasingType,
  type AnimatableValue,
  type TimelineDefinition,
} from '../../engine'
import { mapEase } from './ease-map'
import { resolvePosition, type Position, type PositionContext } from './position'
import { splitVars, toMs, toStaggerConfig, type TweenVars } from './vars'
import { defaultFor } from './defaults'

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
  startValue?: (target: string, property: string) => number | undefined
  /**
   * Bake eases that no cubic-bezier can express (elastic, bounce, steps) into
   * intermediate keyframes. Off by default because it multiplies keyframe
   * count; without it those eases fall back to their nearest smooth curve.
   */
  bakeEases?: boolean
  /** Interval between baked keyframes, in milliseconds (default: one 60fps frame) */
  bakeIntervalMs?: number
  /** Called when a start value falls through to a static default */
  onWarning?: (message: string) => void
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
  private previousStart = 0
  private previousEnd = 0
  private labels = new Map<string, number>()
  private trackCounter = 0

  /** Last authored value per "target|property", for the resolution chain. */
  private lastValues = new Map<string, number>()

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
    return this.build(target, undefined, vars, position)
  }

  /** Animate from the given values to where the property already is. */
  from(target: string | string[], vars: TweenVars, position?: Position): TweenHandle {
    const { config, properties } = splitVars(vars)

    // `from` is `to` with the endpoints swapped: the given values are the start,
    // and the end is whatever the resolution chain says the property holds.
    const toVars: TweenVars = { ...config }
    for (const property of Object.keys(properties)) {
      toVars[property] = this.resolveStart(this.targetsOf(target)[0], property)
    }

    return this.build(target, properties, toVars, position)
  }

  /** Animate between two explicit sets of values. */
  fromTo(
    target: string | string[],
    fromVars: TweenVars,
    toVars: TweenVars,
    position?: Position
  ): TweenHandle {
    const { properties: fromProperties } = splitVars(fromVars)
    return this.build(target, fromProperties, toVars, position)
  }

  /** Set values instantly — a single held keyframe. */
  set(target: string | string[], vars: TweenVars, position?: Position): TweenHandle {
    return this.build(target, undefined, { ...vars, duration: 0 }, position)
  }

  // --- sequencing ---------------------------------------------------------

  /** Name a point in time, for use as a position parameter. */
  addLabel(name: string, position?: Position): this {
    this.labels.set(name, resolvePosition(position, this.context()))
    return this
  }

  /** Time of a label, in milliseconds. */
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
    const { config, properties } = splitVars(vars)
    const targets = this.targetsOf(target)

    const start = resolvePosition(position, this.context())
    const delay = toMs(config.delay, 0)
    const duration = toMs(config.duration, 500)
    const stagger = toStaggerConfig(config.stagger)

    const easing = this.easingFor(config.ease)
    const trackIds: string[] = []

    for (const [property, rawTo] of Object.entries(properties)) {
      const toValue = rawTo as AnimatableValue
      const fromValue =
        fromProperties?.[property] !== undefined
          ? (fromProperties[property] as AnimatableValue)
          : this.resolveStart(targets[0], property)

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
      if (typeof toValue === 'number') {
        for (const t of targets) this.lastValues.set(`${t}|${property}`, toValue)
      }
    }

    // Reuse the engine's stagger maths rather than re-deriving it — it also
    // accounts for `from` (a centre fan spans half as far as a start fan).
    const span =
      duration + (stagger && targets.length > 1 ? staggerSpan(targets.length, stagger) : 0)
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

    if (mapped?.requiresBaking && this.options.bakeEases && mapped.fn) {
      return [
        first,
        ...bakeEasing(first, { time: duration, value: to }, mapped.fn, {
          intervalMs: this.options.bakeIntervalMs,
        }),
      ]
    }

    if (mapped?.requiresBaking && !this.options.bakeEases) {
      this.warn(
        `ease "${rawEase}" cannot be represented as a cubic-bezier; ` +
          `falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
      )
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

/** Create a GSAP-flavoured timeline. */
export function timeline(options?: CompatTimelineOptions): CompatTimeline {
  return new CompatTimeline(options)
}
