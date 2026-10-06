import type { EasingType, Keyframe } from '../../engine/types'
import { hashSeed } from '../../engine/authoring/random'

/**
 * The acting pass: key poses in, cartoon timing out.
 *
 * Pose-to-pose tracks move every joint at once, start to stop, which is what
 * makes procedural animation look procedural. Hand-drawn animation breaks that
 * up with a handful of habits (the "principles"), and each one is a rule about
 * timing that can be applied to plain keyframes:
 *
 * - **Anticipation**: before a joint moves, it winds up a little the other way.
 * - **Overshoot and settle**: it passes its target, then eases (or wobbles) back.
 * - **Overlap**: joints further out a limb start and arrive later than the
 *   body, so the hips lead and the wrists drag.
 * - **Eyes lead**: the eyes dart to the new look before the body moves, and
 *   the figure blinks as its head turns.
 * - **Moving holds**: a long hold drifts a little instead of freezing dead.
 * - **Squash and stretch on jumps**: the body squashes before take-off,
 *   stretches in the air and squashes again on landing.
 *
 * Everything here is a pure function of the keys: the output is ordinary
 * keyframes (JSON), so seeking, exporting and the editor all see plain tracks.
 * Nothing is random at play time; the small variations (drift, idle blinks)
 * come from a hash of the field name and key index.
 */

/** How strongly each habit is applied. Pick a preset from {@link ACTING_STYLES} or tune one. */
export interface ActingStyle {
  /** Wind-up before a move, as a fraction of the move's size (0 none) */
  anticipation: number
  /** Share of a move's time spent winding up (0..1) */
  anticipationTime: number
  /** Share of a move's time held at the end of the wind-up, before the action snaps (0..1) */
  hold: number
  /** How far past the target a move goes, as a fraction of the move's size */
  overshoot: number
  /** Time to settle from the overshoot onto the target, ms */
  settle: number
  /** Ease of the settle: `ease-in-out` for a soft landing, `elastic` for a cartoon wobble */
  settleEase: EasingType
  /** Ease of the action itself (from the wind-up, or the start, to the target) */
  actionEase: EasingType
  /** Delay per step out along a chain (hips → shoulders → elbows → wrists), ms */
  overlap: number
  /** How long before the body the eyes move, ms */
  eyeLead: number
  /** How quickly the eyes dart to a new look, ms */
  eyeDart: number
  /** How far a held joint drifts during a long hold, as a fraction of its limit (0 none) */
  drift: number
  /** Blink when the head turns, and now and then during long holds */
  blinks: boolean
  /** Squash before a jump, stretch in the air, squash on landing (0 none, 1 full) */
  jumpSquash: number
}

/**
 * Ready-made styles:
 * - `full`: classic feature animation. Soft wind-ups, overshoot that settles
 *   smoothly, generous overlap.
 * - `snappy`: theatrical cartoon timing. Bigger wind-ups held a beat, then a
 *   fast action that overshoots and wobbles to a stop.
 * - `limited`: TV and Pencilmation-style. Little anticipation, no overshoot,
 *   crisp holds; pairs well with a stepped frame rate.
 * - `none`: keys pass through untouched (the same tracks as `poseTracks`).
 */
export const ACTING_STYLES = {
  full: {
    anticipation: 0.12,
    anticipationTime: 0.3,
    hold: 0,
    overshoot: 0.08,
    settle: 220,
    settleEase: 'ease-in-out',
    actionEase: 'ease-in-out-cubic',
    overlap: 45,
    eyeLead: 120,
    eyeDart: 160,
    drift: 0.12,
    blinks: true,
    jumpSquash: 1,
  },
  snappy: {
    anticipation: 0.2,
    anticipationTime: 0.35,
    hold: 0.12,
    overshoot: 0.12,
    settle: 320,
    settleEase: { type: 'elastic', mode: 'out', amplitude: 1, period: 0.35 },
    actionEase: 'ease-out-cubic',
    overlap: 35,
    eyeLead: 100,
    eyeDart: 100,
    drift: 0.1,
    blinks: true,
    jumpSquash: 1.3,
  },
  limited: {
    anticipation: 0.06,
    anticipationTime: 0.25,
    hold: 0,
    overshoot: 0,
    settle: 0,
    settleEase: 'ease-out',
    actionEase: 'ease-in-out',
    overlap: 30,
    eyeLead: 80,
    eyeDart: 120,
    drift: 0,
    blinks: true,
    jumpSquash: 0.6,
  },
  none: {
    anticipation: 0,
    anticipationTime: 0,
    hold: 0,
    overshoot: 0,
    settle: 0,
    settleEase: 'linear',
    actionEase: 'linear',
    overlap: 0,
    eyeLead: 0,
    eyeDart: 0,
    drift: 0,
    blinks: false,
    jumpSquash: 0,
  },
} satisfies Record<string, ActingStyle>

export type ActingStyleName = keyof typeof ACTING_STYLES

/**
 * What the acting pass needs to know about a body: which fields are which.
 * Fields it does not mention are eased between keys with the action ease and
 * the overlap of depth 1, but never wound up or overshot.
 */
export interface ActingRig {
  /**
   * Steps from the body's centre along its chains: 0 for the hips and the
   * lean (they lead), 1 for shoulders and knees, 2 for elbows and ankles, 3
   * for wrists. Each step trails by the style's `overlap`.
   */
  depth: Record<string, number>
  /**
   * Fields that wind up and overshoot, with the largest wind-up or overshoot
   * allowed in the field's units (degrees for joints). 0 lets a field
   * overlap but never go past its keys (a lift that would sink into the floor).
   */
  limits: Record<string, number>
  /** The eye fields: they lead the move and dart rather than glide */
  eyes: string[]
  /** The blink field (0 open, 1 closed), when the face has one */
  blink?: string
  /** A change bigger than this in any of these fields turns the head, and the figure blinks */
  headTurns: Record<string, number>
  /** Fields that drift during a long hold */
  drift: string[]
  /** The lift-off field (0 on the ground) and the squash-and-stretch field (1 normal), for jumps */
  lift?: string
  stretch?: string
}

/** A key pose, every field resolved. */
export interface ActingKey {
  /** When the pose is reached, ms */
  time: number
  pose: Record<string, number>
  /** Ease into this key; replaces the style's action ease for this move */
  easing?: EasingType
  /** `false` takes this move as it is (a gag whose timing is already acted) */
  act?: boolean
}

export interface ActingOptions {
  /** A preset name, or a preset's values changed (default `full`) */
  style?: ActingStyleName | (Partial<ActingStyle> & { base?: ActingStyleName })
  /** Varies the drift and idle blinks between figures playing the same keys (default 1) */
  seed?: number
}

/** The style an options object asks for. */
export function resolveActingStyle(style: ActingOptions['style']): ActingStyle {
  if (style === undefined) return ACTING_STYLES.full
  if (typeof style === 'string') return ACTING_STYLES[style]
  const { base, ...changes } = style
  return { ...ACTING_STYLES[base ?? 'full'], ...changes }
}

/** Moves shorter than this are not wound up: there is no time for it to read. */
const MIN_ANTICIPATED_MOVE = 160
/** Moves shorter than this land without an overshoot. */
const MIN_OVERSHOT_MOVE = 120
/** Holds longer than this drift. */
const MIN_DRIFTING_HOLD = 700
/** A blink: closing, then opening, ms. */
const BLINK_CLOSE = 60
const BLINK_OPEN = 90
/** Idle blinks during a hold come about this often, ms (± a third). */
const IDLE_BLINK_EVERY = 3200
/** Keys closer than this (ms) are merged; the later one wins. */
const KEY_EPSILON = 1
/** Changes smaller than this are no change. */
const VALUE_EPSILON = 1e-6

/**
 * Keyframes per field for a sequence of key poses, with the style's acting
 * applied. A field gets keyframes when it changes somewhere in the keys (or
 * when the pass animates it: blinks, jump squash). Keys must be in time order.
 */
export function actKeyframes(keys: ActingKey[], rig: ActingRig, options: ActingOptions = {}): Record<string, Keyframe<number>[]> {
  const style = resolveActingStyle(options.style)
  const seed = options.seed ?? 1
  const out: Record<string, Keyframe<number>[]> = {}
  if (keys.length === 0) return out
  const fields = Object.keys(keys[0].pose).filter((field) => keys.some((key) => Math.abs(key.pose[field] - keys[0].pose[field]) > VALUE_EPSILON))
  const shortestGap = Math.min(Infinity, ...keys.slice(1).map((key, index) => key.time - keys[index].time))
  for (const field of fields) out[field] = actField(field, keys, rig, style, seed, shortestGap)

  const blink = rig.blink
  const authoredBlink = blink !== undefined && fields.includes(blink)
  if (style.blinks && blink !== undefined && !authoredBlink && blink in keys[0].pose) {
    const blinks = blinkKeyframes(keys, rig, style, seed, keys[0].pose[blink])
    if (blinks.length > 0) out[blink] = blinks
  }

  const { lift, stretch } = rig
  if (style.jumpSquash > 0 && lift && stretch && fields.includes(lift) && !fields.includes(stretch) && stretch in keys[0].pose) {
    const squash = jumpKeyframes(keys, lift, keys[0].pose[stretch], style.jumpSquash)
    if (squash.length > 0) out[stretch] = squash
  }
  return out
}

/** One field's keyframes. */
function actField(field: string, keys: ActingKey[], rig: ActingRig, style: ActingStyle, seed: number, shortestGap: number): Keyframe<number>[] {
  const isEye = rig.eyes.includes(field)
  const limit = rig.limits[field]
  const physical = limit !== undefined
  // A quarter of the shortest gap at most, so shifted keys never pass each other.
  const maxShift = Number.isFinite(shortestGap) ? shortestGap / 4 : 0
  const wanted = isEye ? -style.eyeLead : (rig.depth[field] ?? 1) * style.overlap
  const shift = Math.max(-maxShift, Math.min(maxShift, wanted))

  const frames: Keyframe<number>[] = [{ time: keys[0].time, value: keys[0].pose[field] }]
  const push = (time: number, value: number, easing?: EasingType) => {
    const last = frames[frames.length - 1]
    if (time <= last.time + KEY_EPSILON) {
      // Same moment: the later key wins (it keeps the earlier one's place in time).
      frames[frames.length - 1] = { ...last, value, ...(easing ? { easing } : {}) }
      return
    }
    frames.push({ time, value, ...(easing ? { easing } : {}) })
  }
  /** The value the field rests on now (a drift moves it off the key) */
  let current = keys[0].pose[field]

  for (let i = 1; i < keys.length; i++) {
    const key = keys[i]
    const from = keys[i - 1].pose[field]
    const to = key.pose[field]
    const change = to - from
    const lastTime = frames[frames.length - 1].time
    const acted = key.act !== false

    if (Math.abs(change) <= VALUE_EPSILON) {
      // A hold: drift a little if it is long, then wait for the next move.
      // The last key is where the figure comes to rest, so it ends on its pose.
      const holdEnd = key.time + (acted ? shift : 0)
      if (i === keys.length - 1) {
        if (Math.abs(current - to) > VALUE_EPSILON) push(Math.max(holdEnd, lastTime + MIN_ANTICIPATED_MOVE), to, 'ease-in-out')
        current = to
      } else if (acted && physical && style.drift > 0 && rig.drift.includes(field) && holdEnd - lastTime >= MIN_DRIFTING_HOLD) {
        const direction = hashSeed(`${seed}:${field}:${i}`) % 2 === 0 ? 1 : -1
        current = to + direction * style.drift * limit
        push(holdEnd, current, 'ease-in-out')
      }
      continue
    }

    if (!acted) {
      // Already acted: hold, then move exactly as written.
      push(keys[i - 1].time, current)
      push(key.time, to, key.easing)
      current = to
      continue
    }

    const begin = Math.max(keys[i - 1].time + shift, lastTime)
    let end = key.time + shift
    if (isEye && style.eyeDart > 0) end = Math.min(end, begin + style.eyeDart)
    const duration = end - begin
    if (duration <= KEY_EPSILON) {
      push(key.time, to, key.easing)
      current = to
      continue
    }
    push(begin, current)

    const direction = Math.sign(change)
    if (physical && style.anticipation > 0 && limit > 0 && duration >= MIN_ANTICIPATED_MOVE) {
      // Wind up the other way, hold it a beat if the style does, then the action.
      const windUp = current - direction * Math.min(Math.abs(change) * style.anticipation, limit)
      const windUpAt = begin + duration * style.anticipationTime
      push(windUpAt, windUp, 'ease-in-out')
      if (style.hold > 0) push(windUpAt + duration * style.hold, windUp)
    }

    const nextGap = i + 1 < keys.length ? keys[i + 1].time - key.time : Infinity
    const settle = Math.min(style.settle, nextGap / 2)
    if (physical && style.overshoot > 0 && limit > 0 && duration >= MIN_OVERSHOT_MOVE && settle > KEY_EPSILON) {
      const past = Math.min(Math.abs(change) * style.overshoot, limit)
      push(end, to + direction * past, key.easing ?? style.actionEase)
      push(end + settle, to, style.settleEase)
    } else {
      push(end, to, key.easing ?? style.actionEase)
    }
    current = to
  }
  return frames
}

/** Blinks: one as the head turns (just before the move), and idle ones in long holds. */
function blinkKeyframes(keys: ActingKey[], rig: ActingRig, style: ActingStyle, seed: number, open: number): Keyframe<number>[] {
  const times: number[] = []
  const blinkLength = BLINK_CLOSE + BLINK_OPEN
  for (let i = 1; i < keys.length; i++) {
    const before = keys[i - 1].pose
    const after = keys[i].pose
    const turns = Object.entries(rig.headTurns).some(([field, threshold]) => Math.abs((after[field] ?? 0) - (before[field] ?? 0)) > threshold)
    // Blink as the eyes leave: the start of the move, less the eye lead.
    if (turns && keys[i].act !== false) times.push(Math.max(keys[0].time, keys[i - 1].time - style.eyeLead))
  }
  // Idle blinks fill long stretches with nothing else.
  const start = keys[0].time
  const end = keys[keys.length - 1].time
  const fixed = [...times]
  let at = start + IDLE_BLINK_EVERY * 0.6
  let n = 0
  while (at < end) {
    const near = fixed.some((time) => Math.abs(time - at) < IDLE_BLINK_EVERY / 2)
    if (!near) times.push(at)
    const jitter = ((hashSeed(`${seed}:blink:${n++}`) % 1000) / 1000 - 0.5) * (IDLE_BLINK_EVERY * 0.66)
    at += IDLE_BLINK_EVERY + jitter
  }
  times.sort((a, b) => a - b)

  const frames: Keyframe<number>[] = [{ time: start, value: open }]
  for (const time of times) {
    const last = frames[frames.length - 1].time
    // A blink at the very start closes from the first key.
    if (time + BLINK_CLOSE <= last + KEY_EPSILON) continue
    if (time > last + KEY_EPSILON) frames.push({ time, value: open })
    frames.push({ time: time + BLINK_CLOSE, value: 1, easing: 'ease-in' })
    frames.push({ time: time + blinkLength, value: open, easing: 'ease-out' })
  }
  return frames.length > 1 ? frames : []
}

/**
 * Squash and stretch for jumps, read off the lift field: a lift-off from the
 * ground squashes, then stretches up; coming down stretches, and touching the
 * ground squashes before it springs back.
 */
function jumpKeyframes(keys: ActingKey[], lift: string, normal: number, amount: number): Keyframe<number>[] {
  const squash = normal * (1 - 0.18 * amount)
  const stretch = normal * (1 + 0.14 * amount)
  const frames: Keyframe<number>[] = [{ time: keys[0].time, value: normal }]
  const push = (time: number, value: number, easing?: EasingType) => {
    const last = frames[frames.length - 1]
    if (time <= last.time + KEY_EPSILON) return
    frames.push({ time, value, ...(easing ? { easing } : {}) })
  }
  for (let i = 1; i < keys.length; i++) {
    const from = keys[i - 1].pose[lift]
    const to = keys[i].pose[lift]
    const begin = keys[i - 1].time
    const end = keys[i].time
    const duration = end - begin
    if (duration < MIN_ANTICIPATED_MOVE || keys[i].act === false) continue
    if (from <= VALUE_EPSILON && to > VALUE_EPSILON) {
      // Take-off: squash down, spring up stretched, round out at the top.
      push(begin, normal)
      push(begin + duration * 0.2, squash, 'ease-out')
      push(begin + duration * 0.45, stretch, 'ease-out')
      push(end, normal, 'ease-in-out')
    } else if (from > VALUE_EPSILON && to <= VALUE_EPSILON) {
      // Landing: stretch falling, squash on contact, settle back.
      const nextGap = i + 1 < keys.length ? keys[i + 1].time - end : 400
      push(begin + duration * 0.5, normal)
      push(end - Math.min(60, duration * 0.15), stretch, 'ease-in')
      push(end, squash, 'ease-out')
      push(end + Math.min(260, nextGap / 2), normal, { type: 'back', mode: 'out', overshoot: 1.4 })
    }
  }
  return frames.length > 1 ? frames : []
}
