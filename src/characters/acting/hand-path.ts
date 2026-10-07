import { Timeline } from '../../engine/core/timeline'
import type { Track } from '../../engine/types'
import { stickFigureAt, stickFigureTarget, type StickSide, type StickStyle } from '../stick-figure'

/**
 * Where a stick figure's hand is over a stretch of time, scene px, sampled
 * from its tracks: a path for something it carries to follow (a word it
 * grabbed off a code panel, a prop).
 *
 * ```ts
 * const [grab, , toss] = script.beats
 * const path = handPath('hero', script.tracks, { x: 600, y: 300, style: { height: 100 }, start: grab.contact!, end: toss.release! })
 * code.follow(word, path).fling(word, { at: toss.release! })
 * ```
 */
export interface HandPathOptions {
  /** Where the figure was placed: its feet, scene px (the script's `from` and `ground`) */
  x: number
  y: number
  /** The style it is drawn with (its height and look move the hand) */
  style?: StickStyle
  /** From and to, ms */
  start: number
  end: number
  /** Which hand (default right, the one beats reach with) */
  side?: StickSide
  /** Sample spacing, ms (default 33, about 30 fps) */
  every?: number
}

export function handPath(target: string, tracks: Track[], options: HandPathOptions): Array<{ time: number; x: number; y: number }> {
  const timeline = new Timeline({ id: `${target}-hand`, tracks: tracks.filter((track) => track.target === target) })
  const figure = stickFigureTarget({ x: options.x, y: options.y, style: options.style })
  const side = options.side ?? 'right'
  const every = options.every ?? 33
  const path: Array<{ time: number; x: number; y: number }> = []
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const { joints } = stickFigureAt(figure, { time, state: timeline.getStateAtTime(time) }, target)
    const hand = joints.hands[side]
    const tip = joints.fingertips[side]
    // Held in the palm: between the wrist and the fingertips.
    path.push({ time, x: (hand.x + tip.x) / 2, y: (hand.y + tip.y) / 2 })
    if (time >= options.end) break
  }
  return path
}
