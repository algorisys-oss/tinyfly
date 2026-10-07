import type { EasingType, Keyframe, Track } from '../../engine/types'

/**
 * The timed edits a surface records on its own props, written out as plain
 * keyframes by `tracks()`. A surface's methods (highlight a line, grow a
 * bar, fling a piece) only ever add keys here; nothing is applied until the
 * timeline plays the tracks, so the same calls always give the same tracks.
 */

/** One recorded key on a prop. */
export type EditKey = { time: number; value: number; easing?: EasingType }

/** When an edit happens. */
export interface EditOptions {
  /** When the edit starts, ms */
  at: number
  /** ms (default depends on the edit) */
  duration?: number
  easing?: EasingType
}

/** A span of time a prop is changing in, ms. */
export interface TimeWindow {
  start: number
  end: number
}

export interface EditLog {
  /** The keys recorded on a prop so far (undefined when it has none) */
  keys(prop: string): EditKey[] | undefined
  /** Add keys to a prop */
  push(prop: string, ...keys: EditKey[]): void
  /** An edit from one value to another, as a start and an end key */
  tween(prop: string, from: number, to: number, edit: EditOptions, defaultDuration?: number): void
  /** The value of a prop's latest key, or `fallback` when it has none */
  last(prop: string, fallback: number): number
  /** A prop's recorded value at `time` (see `valueAt`) */
  valueAt(prop: string, time: number): number
  /** Drop the keys after `time` on each prop (a later edit takes over from there) */
  cutAfter(props: string[], time: number): void
  /** The recorded edits as tracks on `target` (the surface's key in the scene) */
  tracks(target: string): Track[]
}

export function editLog(): EditLog {
  const edits = new Map<string, EditKey[]>()
  const push = (prop: string, ...keys: EditKey[]) => edits.set(prop, [...(edits.get(prop) ?? []), ...keys])
  return {
    keys: (prop) => edits.get(prop),
    push,
    tween(prop, from, to, edit, defaultDuration = 300) {
      push(prop, { time: edit.at, value: from }, { time: edit.at + (edit.duration ?? defaultDuration), value: to, ...(edit.easing ? { easing: edit.easing } : {}) })
    },
    last(prop, fallback) {
      const list = edits.get(prop)
      return list ? [...list].sort((a, b) => a.time - b.time)[list.length - 1].value : fallback
    },
    valueAt: (prop, time) => valueAt(edits.get(prop), time),
    cutAfter(props, time) {
      for (const prop of props) edits.set(prop, (edits.get(prop) ?? []).filter((key) => key.time <= time))
    },
    tracks(target) {
      return [...edits].filter(([, keys]) => keys.length > 0).map(([property, keys]) => ({
        id: `${target}-${property}`,
        target,
        property,
        keyframes: inTimeOrder(keys),
      }))
    },
  }
}

/** A recorded prop's value at `time`: linear between its keys, held before the first and after the last (0 with none). */
export function valueAt(keys: EditKey[] | undefined, time: number): number {
  if (!keys || keys.length === 0) return 0
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  if (time <= sorted[0].time) return sorted[0].value
  for (let i = 1; i < sorted.length; i++) {
    if (time <= sorted[i].time) {
      const a = sorted[i - 1]
      const b = sorted[i]
      return b.time === a.time ? b.value : a.value + ((b.value - a.value) * (time - a.time)) / (b.time - a.time)
    }
  }
  return sorted[sorted.length - 1].value
}

/** When a prop's recorded value is changing: each pair of neighbouring keys with different values. */
export function changingWindows(keys: EditKey[] | undefined): TimeWindow[] {
  const sorted = [...(keys ?? [])].sort((a, b) => a.time - b.time)
  return sorted.slice(1).flatMap((key, i) => (key.value !== sorted[i].value ? [{ start: sorted[i].time, end: key.time }] : []))
}

/**
 * Keys in time order. Each edit is a (start, end) pair, so the value holds
 * flat between edits and a later edit starts where the earlier one ended.
 */
function inTimeOrder(keys: EditKey[]): Keyframe<number>[] {
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  return sorted.map((key) => ({ time: key.time, value: key.value, ...(key.easing ? { easing: key.easing } : {}) }))
}
