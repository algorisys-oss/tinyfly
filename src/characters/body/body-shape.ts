import type { BodyProfilePoint } from './organic-body'

/**
 * A body described by tape-measure girths, as a tailor or a size chart gives
 * them. Any unit works (cm, inches) as long as `height` uses the same one:
 * only the ratios matter. The organic figure turns these into the torso's
 * front width and its front and back depth, so the shape reads correctly from
 * the front, the side and everywhere between.
 */
export interface BodyMeasurements {
  /** Standing height, in the same unit as the girths */
  height: number
  /** Bust (or chest) girth at its fullest */
  bust: number
  /** Ribcage girth just under the bust (default 0.86 × bust); the difference is how far the bust projects */
  underbust?: number
  /** Natural waist girth, at its narrowest */
  waist: number
  /** Hip girth at the fullest part of the seat */
  hip: number
}

/**
 * The common body-shape families from size charts, as measurements of a
 * 165 cm figure. Every shape suits any character; they are starting points,
 * changed field by field like any other option.
 */
export const BODY_SHAPES = {
  hourglass: { height: 165, bust: 94, underbust: 76, waist: 70, hip: 98 },
  pear: { height: 165, bust: 86, underbust: 74, waist: 72, hip: 102 },
  rectangle: { height: 165, bust: 86, underbust: 76, waist: 76, hip: 89 },
  invertedTriangle: { height: 165, bust: 98, underbust: 86, waist: 78, hip: 90 },
  round: { height: 165, bust: 104, underbust: 92, waist: 98, hip: 104 },
} satisfies Record<string, BodyMeasurements>

export type BodyShapeName = keyof typeof BODY_SHAPES

/** Torso profiles along the spine (hip 0 to neck 1), each a fraction of the height. */
export interface BodyShapeProfiles {
  /** Half-width seen from the front */
  torso: BodyProfilePoint[]
  /** Depth from the spine line toward the chest and belly, seen from the side */
  torsoFront: BodyProfilePoint[]
  /** Depth from the spine line toward the back and seat, seen from the side */
  torsoBack: BodyProfilePoint[]
  /** Half-width of the hips at their fullest, for placing the legs */
  hipHalfWidth: number
}

/** Depth ÷ width of a torso cross-section, from anthropometric averages. */
const RIB_DEPTH_RATIO = 0.72
const WAIST_DEPTH_RATIO = 0.72
const HIP_DEPTH_RATIO = 0.68
/** How far the bust projects past the ribcage, per unit of (bust − underbust) girth. */
const BUST_PROJECTION = 0.33
/** The seat sits behind the hip joint: the back carries this much more of the hip depth. */
const SEAT_BIAS = 0.2
/** The ribcage widens a little from under the bust up to the armpits. */
const RIB_FLARE = 1.04
const NECK = 0.024
/** Along the torso: where the bust starts below, is fullest, and blends into the upper chest. */
const BUST_LOW = 0.54
const BUST_APEX = 0.66
const BUST_TOP = 0.86
/** Along the torso: the seat is fullest here, and at the cut it is this share of the hip depth. */
const SEAT_APEX = 0.18
const SEAT_LOW = 0.6
const STEP = 0.02

/** Profile points every STEP from `from` to `to`, so a curve keeps its shape between them. */
function sampled(from: number, to: number, width: (at: number) => number): BodyProfilePoint[] {
  const count = Math.round((to - from) / STEP)
  return Array.from({ length: count + 1 }, (_, i) => {
    const at = from + (to - from) * i / count
    return { at, width: width(at) }
  })
}

/** 0..1 of the bust's projection: a rounded underside, then a long gentle slope up to the chest. */
function bustCurve(at: number): number {
  if (at <= BUST_APEX) {
    const u = (BUST_APEX - at) / (BUST_APEX - BUST_LOW)
    return Math.sqrt(Math.max(0, 1 - u * u))
  }
  return (1 - (at - BUST_APEX) / (BUST_TOP - BUST_APEX)) ** 1.6
}

/** Back depth over the seat: rounding under into the thigh, then easing into the small of the back. */
function seatCurve(at: number, low: number, full: number, waist: number): number {
  // A quarter sine, not a circle: its slope stays finite at the cut, so the
  // seat meets the thigh in a curve rather than a flat ledge.
  if (at <= SEAT_APEX) return low + (full - low) * Math.sin(at / SEAT_APEX * Math.PI / 2)
  const u = (at - SEAT_APEX) / (0.4 - SEAT_APEX)
  return full + (waist - full) * (1 - Math.cos(u * Math.PI)) / 2
}

/** Half-width of an ellipse with this circumference and depth ÷ width ratio. */
function halfWidth(girth: number, depthRatio: number): number {
  // C ≈ π √(2(a² + b²)), within 1% for torso-like ellipses.
  return girth / (Math.PI * Math.sqrt(2 * (1 + depthRatio * depthRatio)))
}

/** The named shape's measurements, or the measurements as given; validated. */
export function resolveMeasurements(measurements: BodyMeasurements | BodyShapeName): Required<BodyMeasurements> {
  if (typeof measurements === 'string') {
    if (!Object.prototype.hasOwnProperty.call(BODY_SHAPES, measurements)) throw new Error(`body shape: unknown shape '${measurements}'`)
    measurements = BODY_SHAPES[measurements]
  }
  const { height, bust, waist, hip } = measurements
  const underbust = measurements.underbust ?? bust * 0.86
  for (const [name, value] of Object.entries({ height, bust, underbust, waist, hip })) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`body shape: ${name} must be a positive number`)
  }
  if (underbust > bust) throw new Error('body shape: underbust cannot be larger than bust')
  for (const [name, value] of Object.entries({ bust, waist, hip })) {
    if (value / height < 0.25 || value / height > 1) throw new Error(`body shape: ${name} must be 0.25..1 of the height`)
  }
  return { height, bust, underbust, waist, hip }
}

/**
 * Turn measurements into torso profiles. A pure function: the same
 * measurements always give the same shape. `shoulder` is the half-width at
 * the shoulders that the rest of the figure already uses.
 */
export function bodyShapeProfiles(measurements: BodyMeasurements | BodyShapeName, shoulder: number): BodyShapeProfiles {
  const m = resolveMeasurements(measurements)
  const share = (girth: number) => girth / m.height

  const hip = halfWidth(share(m.hip), HIP_DEPTH_RATIO)
  const waist = halfWidth(share(m.waist), WAIST_DEPTH_RATIO)
  const rib = halfWidth(share(m.underbust), RIB_DEPTH_RATIO)
  const hipDepth = hip * HIP_DEPTH_RATIO
  const waistDepth = waist * WAIST_DEPTH_RATIO
  const ribDepth = rib * RIB_DEPTH_RATIO
  const projection = share(m.bust - m.underbust) * BUST_PROJECTION
  // A waist close to the hips carries its fullness at the front (a belly).
  const belly = Math.min(0.25, Math.max(0, m.waist / m.hip - 0.8))

  return {
    torso: [
      { at: 0, width: hip }, { at: 0.2, width: hip * 0.97 }, { at: 0.42, width: waist },
      { at: 0.6, width: rib }, { at: 0.72, width: Math.min(shoulder, rib * RIB_FLARE) },
      { at: 0.86, width: Math.max(shoulder, rib * RIB_FLARE) }, { at: 1, width: NECK },
    ],
    torsoFront: [
      { at: 0, width: hipDepth * (1 - SEAT_BIAS) * 0.8 }, { at: 0.14, width: hipDepth * (1 - SEAT_BIAS) },
      { at: 0.42, width: waistDepth * (1.05 + belly) },
      ...sampled(BUST_LOW, BUST_TOP, at => ribDepth + projection * bustCurve(at)),
      { at: 0.92, width: ribDepth * 0.9 }, { at: 1, width: NECK },
    ],
    torsoBack: [
      ...sampled(0, 0.4, at => seatCurve(at, hipDepth * SEAT_LOW, hipDepth * (1 + SEAT_BIAS), waistDepth * 0.95)),
      { at: 0.6, width: ribDepth }, { at: 0.8, width: ribDepth * 1.02 }, { at: 0.9, width: ribDepth * 0.9 }, { at: 1, width: NECK },
    ],
    hipHalfWidth: hip,
  }
}

/** Thighs fill out with the hips: their half-width at the top. */
export function measuredThighWidth(hipHalfWidth: number): number {
  return hipHalfWidth * 0.4
}

/** Half the spacing of the hip joints for these measurements: each thigh's outside meets the hip line. */
export function measuredHipWidth(measurements: BodyMeasurements | BodyShapeName): number {
  const m = resolveMeasurements(measurements)
  const hip = halfWidth(m.hip / m.height, HIP_DEPTH_RATIO)
  return Math.max(0.02, hip - Math.max(0.042, measuredThighWidth(hip)))
}
