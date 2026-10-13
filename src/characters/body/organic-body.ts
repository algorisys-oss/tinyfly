import { bodyShapeProfiles, measuredThighWidth, type BodyMeasurements, type BodyShapeName } from './body-shape'

/** A contour's half-width as a share of character height, at 0..1 along it. */
export interface BodyProfilePoint { at: number; width: number }

/** Screen-space light; geometry and shading stay deterministic at any time. */
export interface SkinShading {
  mode: 'none' | 'cel'
  light: [number, number]
  shadow: string
  opacity: number
  highlight: number
}

export interface OrganicBodyOptions {
  /** Hip to neck: hips, waist, chest and shoulders. */
  torso?: BodyProfilePoint[]
  /**
   * Seen from the side, the torso's depth from the spine line toward the
   * chest and belly (front) and toward the back and seat (back). Default:
   * `torso` × `depth` each way.
   */
  torsoFront?: BodyProfilePoint[]
  torsoBack?: BodyProfilePoint[]
  /**
   * The torso from tape-measure girths, or a named shape (`hourglass`, `pear`,
   * `rectangle`, `invertedTriangle`, `round`; see BODY_SHAPES). Sets each of
   * `torso`, `torsoFront`, `torsoBack` and the thighs that is not given too.
   */
  measurements?: BodyMeasurements | BodyShapeName
  /** Shoulder to wrist: upper arm, elbow, forearm and wrist. */
  arm?: BodyProfilePoint[]
  /** Hip to ankle: thigh, knee, calf and ankle. */
  leg?: BodyProfilePoint[]
  neck?: BodyProfilePoint[]
  /** Side thickness relative to front width, 0.2..1 (default 0.55). */
  depth?: number
  /** Shared exposed skin colour, including face and hands. Defaults to `skin`. */
  fill?: string
  /** Independent contour settings. Defaults to the character's ink/lineWidth. */
  outline?: { color?: string; width?: number }
  shading?: Partial<SkinShading>
}

/** Resolved, owned JSON data. Profiles are copied once when making a character. */
export interface OrganicBody {
  torso: BodyProfilePoint[]
  torsoFront: BodyProfilePoint[]
  torsoBack: BodyProfilePoint[]
  arm: BodyProfilePoint[]
  leg: BodyProfilePoint[]
  neck: BodyProfilePoint[]
  depth: number
  fill: string
  outline: { color: string; width: number }
  shading: SkinShading
}

function bounded(value: number, name: string, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`organic body: ${name} must be ${min}..${max}`)
  return value
}

function copyProfile(points: BodyProfilePoint[], name: string): BodyProfilePoint[] {
  if (points.length < 2 || points[0].at !== 0 || points.at(-1)!.at !== 1) throw new Error(`organic body: ${name} must run from 0 to 1`)
  return points.map((point, i) => {
    bounded(point.at, `${name}.at`, 0, 1)
    bounded(point.width, `${name}.width`, 0.001, 0.3)
    if (i > 0 && point.at <= points[i - 1].at) throw new Error(`organic body: ${name} positions must increase`)
    return { at: point.at, width: point.width }
  })
}

/** Resolve body data without a canvas, UI, clock or mutable global state. */
export function resolveOrganicBody(options: OrganicBodyOptions, defaults: {
  skin: string; ink: string; lineWidth: number; shoulderWidth: number; hipWidth: number
}): OrganicBody {
  const shoulder = Math.max(0.095, defaults.shoulderWidth + 0.025)
  const hip = Math.max(0.085, defaults.hipWidth + 0.032)
  const shade = options.shading ?? {}
  const light = shade.light ?? [-0.8, -0.6]
  if (light.length !== 2 || !light.every(Number.isFinite) || Math.hypot(...light) === 0) throw new Error('organic body: light must be a finite nonzero 2D vector')
  if (shade.mode !== undefined && shade.mode !== 'none' && shade.mode !== 'cel') throw new Error('organic body: unknown shading mode')
  const shaped = options.measurements !== undefined ? bodyShapeProfiles(options.measurements, shoulder) : undefined
  const torso = copyProfile(options.torso ?? shaped?.torso ?? [
    { at: 0, width: hip }, { at: 0.2, width: hip }, { at: 0.42, width: hip * 0.72 },
    { at: 0.68, width: shoulder * 0.9 }, { at: 0.86, width: shoulder }, { at: 1, width: 0.024 },
  ], 'torso')
  const depth = bounded(options.depth ?? 0.55, 'depth', 0.2, 1)
  const deep = (points: BodyProfilePoint[]) => points.map(point => ({ at: point.at, width: Math.max(0.001, point.width * depth) }))
  // Fuller hips carry fuller thighs; the standard leg is unchanged.
  const thigh = shaped ? Math.max(1, measuredThighWidth(shaped.hipHalfWidth) / 0.042) : 1
  return {
    torso,
    torsoFront: copyProfile(options.torsoFront ?? shaped?.torsoFront ?? deep(torso), 'torsoFront'),
    torsoBack: copyProfile(options.torsoBack ?? shaped?.torsoBack ?? deep(torso), 'torsoBack'),
    arm: copyProfile(options.arm ?? [
      { at: 0, width: 0.028 }, { at: 0.22, width: 0.027 }, { at: 0.5, width: 0.019 },
      { at: 0.68, width: 0.023 }, { at: 1, width: 0.012 },
    ], 'arm'),
    leg: copyProfile(options.leg ?? [
      { at: 0, width: 0.04 * thigh }, { at: 0.24, width: 0.042 * thigh }, { at: 0.5, width: 0.027 },
      { at: 0.68, width: 0.032 }, { at: 1, width: 0.016 },
    ], 'leg'),
    neck: copyProfile(options.neck ?? [{ at: 0, width: 0.024 }, { at: 1, width: 0.023 }], 'neck'),
    depth,
    fill: options.fill ?? defaults.skin,
    outline: { color: options.outline?.color ?? defaults.ink, width: bounded(options.outline?.width ?? defaults.lineWidth, 'outline.width', 0, 100) },
    shading: {
      mode: shade.mode ?? 'cel', light: [...light], shadow: shade.shadow ?? '#633923',
      opacity: bounded(shade.opacity ?? 0.17, 'shading.opacity', 0, 1),
      highlight: bounded(shade.highlight ?? 0.12, 'shading.highlight', 0, 1),
    },
  }
}

/** Smooth bounded width interpolation; anatomy never depends on outline width. */
export function bodyProfileWidth(profile: BodyProfilePoint[], at: number): number {
  const t = Math.min(1, Math.max(0, at))
  const end = profile.findIndex(point => point.at >= t)
  if (end <= 0) return profile[0].width
  const a = profile[end - 1], b = profile[end]
  const u = (t - a.at) / (b.at - a.at)
  return a.width + (b.width - a.width) * u * u * (3 - 2 * u)
}
