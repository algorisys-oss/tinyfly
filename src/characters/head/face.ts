import type { Point } from '../../adapters/canvas/sketch'
import type { Pose } from '../rig/body-plan'
import { headPoint, type SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'

/**
 * A face on the head's surface: eyes, brows and a mouth placed by head
 * coordinates (x to the character's left, y up, -1..1 of a radius) and drawn
 * where the head's turn puts them. Features narrow as they turn toward the
 * edge and hide on the far side, so the face slides round in a 3/4 view,
 * shows one eye in profile, and is gone from behind.
 *
 * The face fields are the v1 stick figure's: `mouth`, `smile`, `mouthWidth`,
 * `blink`, `eye.left`, `eye.right`, `brow.left`, `brow.right`, `browTilt`,
 * `lookX` (toward the character's left +), `lookY` (down +). Marks fade in
 * from 0 to 1: `blush` (rosy cheeks with a few hatch lines), `tears` (a drop
 * under each eye, running down at full strength) and `sweat` (a bead at the
 * temple).
 */

const EYE_X = 0.34
const EYE_Y = 0.12
const MOUTH_Y = -0.4

const field = (pose: Pose, key: string, fallback: number) => pose[key] ?? fallback

/** How open an eye is drawn: its openness, closed further by a blink. */
const eyeOpenness = (eye: number, blink: number) => Math.max(0, eye) * (1 - Math.min(1, Math.max(0, blink)))

/** How far the face slides toward the side the head faces, in profile (head radii) */
const PROFILE_SHIFT = 0.45
/** Narrowest the spacing of features gets as the head turns (fraction of front-on) */
const MIN_SQUEEZE = 0.35
/** Narrowest a feature's own shape gets (an eye stays an eye in profile) */
const MIN_SHAPE_SQUEEZE = 0.7

/**
 * Face coordinates to the screen. Cartoon faces slide less than a sphere
 * would: the whole face shifts toward the side the head faces, the spacing of
 * features narrows (to a minimum) and each feature's own shape narrows less, so
 * a profile still shows an eye and a mouth inside the head. Points are given
 * around a feature's `centre`; `facing` comes from the real surface at that
 * centre, so features on the far side are hidden.
 */
export function faceToScreen(head: SolvedHead, points: Point[], centre: Point): { points: Point[]; facing: number } {
  const z = (p: Point) => Math.sqrt(Math.max(0, 1 - p.x * p.x - p.y * p.y))
  const facing = headPoint(head, [centre.x, centre.y, z(centre)]).facing
  const forward = head.axes[2]
  // The head's turn from the viewer (0 front, ±90° profile) and its nod.
  const yaw = Math.atan2(forward[0], forward[2])
  const cosYaw = Math.cos(yaw)
  const sign = cosYaw >= 0 ? 1 : -1
  const spacing = sign * Math.max(MIN_SQUEEZE, Math.abs(cosYaw))
  const shape = sign * Math.max(MIN_SHAPE_SQUEEZE, Math.abs(cosYaw))
  const cos = Math.cos(head.angle)
  const sin = Math.sin(head.angle)
  return {
    facing,
    points: points.map((p) => {
      const across = PROFILE_SHIFT * Math.sin(yaw) + centre.x * spacing + (p.x - centre.x) * shape
      const up = p.y + forward[1] * z(p)
      const ax = across * head.rx
      const ay = up * head.ry
      return { x: head.center.x + ax * cos + ay * sin, y: head.center.y + ax * sin - ay * cos }
    }),
  }
}

/** Where a feature's middle faces the viewer at least this much, it is drawn. */
const quadratic = (from: Point, control: Point, to: Point, samples = 12): Point[] =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples
    const u = 1 - t
    return { x: u * u * from.x + 2 * u * t * control.x + t * t * to.x, y: u * u * from.y + 2 * u * t * control.y + t * t * to.y }
  })

const ellipse = (cx: number, cy: number, rx: number, ry: number, samples = 16): Point[] =>
  Array.from({ length: samples }, (_, i) => {
    const a = (Math.PI * 2 * i) / samples
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }
  })

const SHOWN = 0.05

export function drawFace(pen: Pen, head: SolvedHead, pose: Pose, lineWidth: number): void {
  // Face lines are lighter than the body's, and capped by the head's size.
  const thin = Math.max(1, Math.min(lineWidth * 0.6, 0.14 * head.rx))
  const toScreen = (points: Point[], centre: Point) => faceToScreen(head, points, centre).points
  const facingAt = (x: number, y: number) => faceToScreen(head, [], { x, y }).facing
  const smile = field(pose, 'smile', 0)
  const blink = field(pose, 'blink', 0)
  const lookX = field(pose, 'lookX', 0)
  const lookY = field(pose, 'lookY', 0)
  const browTilt = field(pose, 'browTilt', 0)

  for (const side of [1, -1]) {
    const name = side === 1 ? 'left' : 'right'
    const ex = EYE_X * side
    if (facingAt(ex, EYE_Y) < SHOWN) continue
    const eye = { x: ex, y: EYE_Y }
    const open = eyeOpenness(field(pose, `eye.${name}`, 1), blink)
    if (open < 0.2) {
      // Shut: a lid line, arched up when smiling (a laugh), curved down otherwise.
      const arch = smile > 0.5 ? 0.12 : -0.06
      pen.line(toScreen(quadratic({ x: ex - 0.12, y: EYE_Y }, { x: ex, y: EYE_Y + arch }, { x: ex + 0.12, y: EYE_Y }), eye), thin)
    } else {
      if (open > 1.2) {
        // Wide open: the whites show around the pupil.
        const white = 0.13 * open
        pen.shape(toScreen(ellipse(ex, EYE_Y, white * 0.85, white), eye), '#ffffff', thin)
      }
      const pupil = open > 1.2 ? 0.075 : 0.1
      const px = ex + lookX * 0.08
      const py = EYE_Y - lookY * 0.07
      pen.shape(toScreen(ellipse(px, py, pupil, pupil * 1.1 * Math.min(open, 1)), eye), pen.ink, 0)
    }
    // Brow: raised or lowered, and slanted (its inner end is toward the middle).
    const brow = EYE_Y + 0.3 + field(pose, `brow.${name}`, 0) * 0.14 + Math.max(0, open - 1) * 0.12
    const outer = { x: ex + side * 0.13, y: brow }
    const inner = { x: ex - side * 0.13, y: brow + browTilt * 0.1 }
    pen.line(toScreen([outer, { x: (outer.x + inner.x) / 2, y: (outer.y + inner.y) / 2 }, inner], { x: ex, y: brow }), thin)
  }

  drawMarks(pen, head, pose, thin)

  // Mouth: closed is a curve; open is an O, a grin (flat top) or a wail (flat bottom).
  const mouthCentre = { x: 0, y: MOUTH_Y }
  if (facingAt(0, MOUTH_Y) < -SHOWN) return
  const w = 0.25 * Math.max(0.3, field(pose, 'mouthWidth', 1))
  const open = Math.min(1, Math.max(0, field(pose, 'mouth', 0)))
  if (open <= 0.05) {
    pen.line(toScreen(quadratic({ x: -w, y: MOUTH_Y }, { x: 0, y: MOUTH_Y - smile * 0.25 }, { x: w, y: MOUTH_Y }), mouthCentre), thin)
    return
  }
  const depth = 0.3 * open
  let outline: Point[]
  if (smile > 0.3) {
    const top = MOUTH_Y + 0.05
    outline = [...quadratic({ x: w, y: top }, { x: 0, y: MOUTH_Y - depth * 2 }, { x: -w, y: top })]
  } else if (smile < -0.3) {
    const bottom = MOUTH_Y - depth * 0.6
    outline = [...quadratic({ x: w, y: bottom }, { x: 0, y: MOUTH_Y + depth * 1.4 }, { x: -w, y: bottom })]
  } else {
    outline = ellipse(0, MOUTH_Y, w * 0.8, depth)
  }
  pen.shape(toScreen(outline, mouthCentre), pen.ink, 0)
}

const WATER = '#8fd0f5'

/** A drop: round at the bottom, pointed at the top, in face coordinates. */
const drop = (cx: number, cy: number, r: number): Point[] =>
  Array.from({ length: 18 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 18
    // From the point at the top round the bulb below.
    const bulb = Math.sin(a / 2)
    return { x: cx + Math.sin(a) * r * bulb, y: cy - r * 0.9 + Math.cos(a) * r * 1.6 * (0.55 + 0.45 * bulb) - r * 0.4 }
  })

/** Blush, tears and sweat: marks that fade in with their fields. */
function drawMarks(pen: Pen, head: SolvedHead, pose: Pose, thin: number) {
  const blush = Math.min(1, Math.max(0, field(pose, 'blush', 0)))
  const tears = Math.min(1, Math.max(0, field(pose, 'tears', 0)))
  const sweat = Math.min(1, Math.max(0, field(pose, 'sweat', 0)))
  if (blush + tears + sweat <= 0.01) return
  for (const side of [1, -1]) {
    const cheek = { x: 0.5 * side, y: -0.16 }
    const shown = faceToScreen(head, [], cheek).facing >= SHOWN
    if (blush > 0.01 && shown) {
      const { points } = faceToScreen(head, ellipse(cheek.x, cheek.y, 0.17, 0.1), cheek)
      pen.shape(points, `rgba(240, 120, 140, ${(0.75 * blush).toFixed(3)})`, 0)
      if (blush > 0.5) {
        // Hatch lines over the cheek.
        for (const dx of [-0.07, 0, 0.07]) {
          const hatch = [{ x: cheek.x + dx - 0.018, y: cheek.y - 0.03 }, { x: cheek.x + dx + 0.018, y: cheek.y + 0.03 }]
          pen.line(faceToScreen(head, hatch, cheek).points, thin * 0.3)
        }
      }
    }
    const eye = { x: EYE_X * side, y: EYE_Y }
    if (tears > 0.01 && faceToScreen(head, [], eye).facing >= SHOWN) {
      const r = 0.05 + 0.04 * tears
      const below = { x: eye.x + 0.06 * side, y: EYE_Y - 0.2 - 0.12 * tears }
      pen.shape(faceToScreen(head, drop(below.x, below.y, r), below).points, WATER, thin * 0.35)
      if (tears > 0.6) {
        const streak = [{ x: eye.x + 0.05 * side, y: EYE_Y - 0.1 }, { x: below.x, y: below.y + r * 0.8 }]
        pen.line(faceToScreen(head, streak, below).points, thin * 0.3)
      }
    }
  }
  if (sweat > 0.01) {
    // One bead at the temple on the character's left (screen right from the front).
    const temple = { x: 0.64, y: 0.42 }
    if (faceToScreen(head, [], temple).facing >= SHOWN) {
      pen.shape(faceToScreen(head, drop(temple.x, temple.y, 0.05 + 0.05 * sweat), temple).points, WATER, thin * 0.35)
    }
  }
}
