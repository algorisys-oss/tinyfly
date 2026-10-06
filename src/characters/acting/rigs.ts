import type { ActingRig } from './acting'
import { HUMAN_REST } from '../species/human'

/**
 * Acting rigs: which pose fields lead, which drag, which wind up and how far.
 * Limits are in each field's own units (degrees for joints).
 */

/** The v1 stick figure (`StickPose`). */
export const STICK_ACTING_RIG: ActingRig = {
  depth: {
    lean: 0, bend: 0, rise: 0, sit: 0, spin: 0, stretch: 0, turn: 0, leftHip: 0, rightHip: 0,
    headTilt: 1, leftShoulder: 1, rightShoulder: 1, leftKnee: 1, rightKnee: 1,
    leftBrow: 1, rightBrow: 1, browTilt: 1, leftEye: 1, rightEye: 1,
    leftElbow: 2, rightElbow: 2, leftAnkle: 2, rightAnkle: 2, leftFootOut: 2, rightFootOut: 2,
    mouth: 2, smile: 2, mouthWidth: 2,
    leftWrist: 3, rightWrist: 3,
  },
  limits: {
    lean: 10, bend: 10, headTilt: 12, spin: 25, turn: 0.06, sit: 0.06, stretch: 0.08, rise: 0,
    leftShoulder: 20, rightShoulder: 20, leftElbow: 18, rightElbow: 18, leftWrist: 15, rightWrist: 15,
    leftHip: 12, rightHip: 12, leftKnee: 15, rightKnee: 15, leftAnkle: 10, rightAnkle: 10,
    leftBrow: 0.25, rightBrow: 0.25, leftEye: 0.15, rightEye: 0.15,
  },
  eyes: ['lookX', 'lookY'],
  blink: 'blink',
  headTurns: { turn: 0.15, headTilt: 8, lookX: 0.5, spin: 45 },
  drift: ['lean', 'bend', 'headTilt', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'],
  lift: 'rise',
  stretch: 'stretch',
}

/** Depth and limit of a v2 human field, by its name. */
function humanField(field: string): { depth: number; limit?: number } {
  if (/^(turn|lean|bend|side|lift|roll|stretch)$/.test(field)) {
    const limits: Record<string, number> = { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }
    return { depth: 0, limit: limits[field] }
  }
  if (/^leg\.\w+\.(swing|spread|rotate)$/.test(field)) return { depth: 0, limit: 12 }
  if (/^head\./.test(field)) return { depth: 1, limit: 12 }
  if (/^arm\.\w+\.(swing|spread)$/.test(field)) return { depth: 1, limit: 20 }
  if (/^leg\.\w+\.knee$/.test(field)) return { depth: 1, limit: 15 }
  if (/^(brow\.|browTilt$)/.test(field)) return { depth: 1, limit: field === 'browTilt' ? undefined : 0.25 }
  if (/^eye\./.test(field)) return { depth: 1, limit: 0.15 }
  if (/^arm\.\w+\.(elbow|bend)$/.test(field)) return { depth: 2, limit: 18 }
  if (/^leg\.\w+\.(ankle|toeOut)$/.test(field)) return { depth: 2, limit: 10 }
  if (/^(mouth|smile|mouthWidth)$/.test(field)) return { depth: 2 }
  if (/^hand\./.test(field)) return { depth: 3 }
  return { depth: 1 }
}

function humanActingRig(): ActingRig {
  const depth: Record<string, number> = {}
  const limits: Record<string, number> = {}
  for (const field of Object.keys(HUMAN_REST)) {
    const spec = humanField(field)
    depth[field] = spec.depth
    if (spec.limit !== undefined) limits[field] = spec.limit
  }
  return {
    depth,
    limits,
    eyes: ['lookX', 'lookY'],
    blink: 'blink',
    headTurns: { turn: 0.15, 'head.turn': 15, 'head.nod': 12, lookX: 0.5, roll: 45 },
    drift: ['lean', 'bend', 'head.tilt', 'head.nod', 'arm.left.spread', 'arm.right.spread', 'arm.left.elbow', 'arm.right.elbow'],
    lift: 'lift',
    stretch: 'stretch',
  }
}

/** The v2 human body plan (`HUMAN_REST` fields). */
export const HUMAN_ACTING_RIG: ActingRig = humanActingRig()
