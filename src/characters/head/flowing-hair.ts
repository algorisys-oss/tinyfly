import type { Hair } from './hair'
import type { HairLock, HairLockPoint } from './hair-lock'

const point = (around: number, up: number, lift = 0): HairLockPoint => ({ around, up, lift })

/** A soft fringe swept from a parting, with a shorter lock at the other temple. */
const fringe = (): HairLock[] => [
  { width: 0.66, follow: 0.22, path: [point(-38, 0.88), point(-12, 0.94, 0.08), point(58, 0.76, 0.09), point(94, 0.16, 0.03)] },
  { width: 0.58, follow: 0.3, path: [point(-42, 0.8), point(-24, 0.7, 0.12), point(18, 0.57, 0.09), point(64, 0.3)] },
  { width: 0.36, follow: 0.18, path: [point(-58, 0.76), point(-76, 0.56, 0.07), point(-90, 0.12, 0.06), point(-102, -0.36)] },
]

/** Overlapping sections all around the sides and nape, with individually shaped tips. */
function fallingLocks(long: boolean): HairLock[] {
  return [-100, -130, -160, -190, -220, -250, -280].map((around, i) => {
    const variation = i % 2 === 0 ? 1 : -1
    const end = long ? -2.45 - (i % 3) * 0.12 : -1.06 - (i % 3) * 0.09
    return {
      width: long ? 0.88 : 0.92,
      follow: long ? 0.8 + (i % 3) * 0.12 : 0.38 + (i % 3) * 0.08,
      path: long ? [
        point(around, 0.7), point(around + variation * 9, 0.2, 0.12), point(around - variation * 13, -0.5, 0.2), point(around - variation * 8, -0.95, 0.16),
        point(around - variation * 3, -1.4, 0.12), point(around + variation * 18, end + 0.35, 0.22), point(around + variation * 12, end, 0.03),
      ] : [
        point(around, 0.7), point(around + variation * 7, 0.15, 0.2), point(around - variation * 8, -0.75, 0.25), point(around + variation * 5, end),
      ],
    }
  })
}

/** Original flowing cartoon styles: a fitted cap with broad curved locks, rather than a straight curtain. */
export const FLOWING_HAIR_STYLES = {
  softSweep: {
    volume: 0.12, shine: 0.16, part: -38, strands: 'part', sweep: -0.08,
    hairline: { front: 0.64, side: 0.12, back: -0.8 },
    locks: fringe(),
  },
  flowingBob: {
    volume: 0.15, shine: 0.16, length: 0.96, fall: { taper: 0.08, wave: 0.08 }, part: -38, strands: 'part', sweep: -0.08,
    hairline: { front: 0.64, side: 0.08, back: -0.8 }, coversEars: true,
    locks: [...fallingLocks(false), ...fringe()],
  },
  cascadingWaves: {
    volume: 0.16, shine: 0.16, length: 2.38, fall: { taper: 0.18, wave: 0.12 }, part: -38, strands: 'part', sweep: -0.08,
    hairline: { front: 0.64, side: 0.08, back: -0.8 }, coversEars: true,
    locks: [...fallingLocks(true), ...fringe()],
  },
} satisfies Record<string, Partial<Omit<Hair, 'color' | 'hairline'>> & { hairline?: Partial<Hair['hairline']> }>
