/**
 * Onion skinning: sample times around the playhead so the Canvas preview can
 * draw faint "ghost" frames before and after the current time. Pure so it can be
 * unit-tested; the preview turns each ghost into a reduced-alpha render pass.
 */

export interface OnionGhost {
  /** Timeline time (ms) to sample the animation at. */
  time: number
  /** Draw opacity for this ghost (0..1), brightest nearest the playhead. */
  alpha: number
}

export interface OnionOptions {
  /** Ghost frames on each side of the playhead. */
  frames?: number
  /** Spacing between ghosts, in ms. */
  step?: number
  /** Opacity of the nearest ghost; further ghosts fade toward 0. */
  maxAlpha?: number
}

const DEFAULTS: Required<OnionOptions> = { frames: 3, step: 120, maxAlpha: 0.35 }

/**
 * Ghost sample times around `now`, clamped to `[0, duration]`. Nearer ghosts are
 * more opaque. Times out of range (before 0 or past the end) are dropped, so the
 * ends of a timeline simply show fewer ghosts.
 */
export function onionGhostTimes(now: number, duration: number, opts?: OnionOptions): OnionGhost[] {
  const { frames, step, maxAlpha } = { ...DEFAULTS, ...opts }
  if (frames <= 0 || step <= 0) return []
  const ghosts: OnionGhost[] = []
  for (let i = 1; i <= frames; i++) {
    // Nearest ghost (i=1) is brightest; the falloff reaches ~0 past the last one.
    const alpha = Math.max(0, maxAlpha * (1 - (i - 1) / frames))
    if (alpha <= 0) continue
    for (const dir of [-1, 1] as const) {
      const time = now + dir * i * step
      if (time < 0 || time > duration) continue
      ghosts.push({ time, alpha })
    }
  }
  return ghosts
}
