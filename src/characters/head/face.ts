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
 * `lookX` (toward the character's left +), `lookY` (down +), and for
 * close-ups `pupil` (size, 1 the usual), `lid` (the upper lids lowered, 0..1)
 * and `bulge` (the eyes bulging out of the head, 0..1). Marks fade in
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

/** The height of a symmetric quadratic (its control above or below the middle) at an x between its ends. */
const quadraticY = (from: Point, control: Point, to: Point, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - from.x) / (to.x - from.x)))
  const u = 1 - t
  return u * u * from.y + 2 * u * t * control.y + t * t * to.y
}

const ellipse = (cx: number, cy: number, rx: number, ry: number, samples = 16): Point[] =>
  Array.from({ length: samples }, (_, i) => {
    const a = (Math.PI * 2 * i) / samples
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }
  })

const SHOWN = 0.05

/** The pupil's circle on the screen, for drawing inside it. */
export interface PupilCircle {
  x: number
  y: number
  r: number
  side: 'left' | 'right'
}

/** What an open mouth shows: a row of upper teeth, and a tongue (default neither, as the plain face); a nose; what is in the pupils. */
export interface FaceOptions {
  /** `simple` (default) or colour anime eyes with irises, highlights and expressive lids. Uses the same pose fields. */
  style?: 'simple' | 'anime'
  /** Anime iris colour (default blue); plain data, including in scene JSON. */
  iris?: string
  /** Head outline: round (default) or angular cheeks, jaw and chin. */
  shape?: 'round' | 'angular'
  /** Angular jaw half-width in head radii, 0.55..0.95 (default 0.74). */
  jawWidth?: number
  /** Angular chin half-width in head radii, 0.03..0.35 (default 0.14). */
  chinWidth?: number
  /** Round angular jaw corners, 0..1 (default 0: keep the sharp outline). */
  jawRoundness?: number
  /** Anime eye size, 0.5..1.2 (default 1). */
  eyeScale?: number
  /** Anime eye height relative to width, 0.45..1.2 (default 1). */
  eyeAspect?: number
  /** Anime outer lashes (default true). */
  lashes?: boolean
  /** Subtle eye and smile creases, 0..1 (default 0); independent of expression and posture. */
  ageLines?: number
  teeth?: boolean
  tongue?: boolean
  /** A small nose between the eyes and the mouth (default none) */
  nose?: boolean
  /** The head's fill, for lids that cover the eye (default white) */
  skin?: string
  /**
   * Draw inside each pupil: the context is clipped to the pupil's circle and
   * the hook draws there in screen space (another scene, the same head again
   * for a Droste face). Needs the context passed to `drawFace`.
   */
  inPupil?: (ctx: CanvasRenderingContext2D, pupil: PupilCircle) => void
}

/** An open mouth shows its teeth and tongue past this much open. */
const SHOWS_INSIDE = 0.3
const TONGUE = '#e06b7d'

export function drawFace(pen: Pen, head: SolvedHead, pose: Pose, lineWidth: number, options: FaceOptions = {}, ctx?: CanvasRenderingContext2D): void {
  // Face lines are lighter than the body's, and capped by the head's size.
  const thin = Math.max(1, Math.min(lineWidth * 0.6, 0.14 * head.rx))
  const toScreen = (points: Point[], centre: Point) => faceToScreen(head, points, centre).points
  const facingAt = (x: number, y: number) => faceToScreen(head, [], { x, y }).facing
  const smile = field(pose, 'smile', 0)
  const blink = field(pose, 'blink', 0)
  const lookX = field(pose, 'lookX', 0)
  const lookY = field(pose, 'lookY', 0)
  const browTilt = field(pose, 'browTilt', 0)
  const pupilSize = Math.max(0.2, field(pose, 'pupil', 1))
  const lid = Math.min(1, Math.max(0, field(pose, 'lid', 0)))
  const bulge = Math.min(1, Math.max(0, field(pose, 'bulge', 0)))

  for (const side of [1, -1]) {
    const name = side === 1 ? 'left' : 'right'
    const ex = EYE_X * side
    if (facingAt(ex, EYE_Y) < SHOWN) continue
    const eye = { x: ex, y: EYE_Y }
    const open = eyeOpenness(field(pose, `eye.${name}`, 1), blink)
    if (open < 0.2 || (options.style === 'anime' && lid >= 0.98)) {
      // Shut: a lid line, arched up when smiling (a laugh), curved down otherwise.
      const arch = smile > 0.5 ? 0.12 : -0.06
      pen.line(toScreen(quadratic({ x: ex - 0.12, y: EYE_Y }, { x: ex, y: EYE_Y + arch }, { x: ex + 0.12, y: EYE_Y }), eye), thin)
    } else if (options.style === 'anime') {
      drawAnimeEye(pen, head, eye, side, open, lid, bulge, pupilSize, lookX, lookY, thin, options, ctx)
    } else {
      // Wide open or bulging: the whites show around the pupil.
      const whites = open > 1.2 || bulge > 0.02
      const white = 0.13 * Math.max(open, 1) * (1 + bulge * 0.7)
      if (whites) pen.shape(toScreen(ellipse(ex, EYE_Y, white * 0.85, white), eye), '#ffffff', thin)
      const pupil = (open > 1.2 ? 0.075 : 0.1) * pupilSize * (1 + bulge * 0.3)
      const px = ex + lookX * 0.08
      const py = EYE_Y - lookY * 0.07
      const circle = ellipse(px, py, pupil, pupil * 1.1 * Math.min(open, 1))
      pen.shape(toScreen(circle, eye), pen.ink, 0)
      if (options.inPupil && ctx) {
        // The pupil's circle on screen: its centre, and the nearest edge as the radius, so the drawing stays inside.
        const [centre] = toScreen([{ x: px, y: py }], eye)
        const edge = toScreen(circle, eye)
        const r = Math.min(...edge.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)))
        if (r > 0.5) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2)
          ctx.clip()
          options.inPupil(ctx, { x: centre.x, y: centre.y, r, side: name })
          ctx.restore()
        }
      }
      if (lid > 0.02) {
        // The upper lid lowered: the head's fill covers the top of the eye, with the lid's edge drawn.
        const reach = whites ? white * 1.15 : pupil * 1.4
        const top = EYE_Y + reach
        const edge = top - reach * 2 * lid
        const half = reach * 1.1
        pen.shape(toScreen([{ x: ex - half, y: top + 0.02 }, { x: ex + half, y: top + 0.02 }, { x: ex + half, y: edge }, { x: ex - half, y: edge }], eye), options.skin ?? '#ffffff', 0)
        pen.line(toScreen([{ x: ex - half, y: edge }, { x: ex + half, y: edge }], eye), thin)
      }
    }
    // Brow: raised or lowered, and slanted (its inner end is toward the middle).
    const brow = EYE_Y + (options.style === 'anime' ? 0.38 : 0.3) + field(pose, `brow.${name}`, 0) * 0.14 + Math.max(0, open - 1) * 0.12
    const outer = { x: ex + side * 0.13, y: brow }
    const inner = { x: ex - side * 0.13, y: brow + browTilt * 0.1 }
    pen.line(toScreen([outer, { x: (outer.x + inner.x) / 2, y: (outer.y + inner.y) / 2 }, inner], { x: ex, y: brow }), thin)
  }

  drawMarks(pen, head, pose, thin)
  drawAgeLines(pen, head, options.ageLines ?? 0, thin)

  // Mouth: closed is a curve; open is an O, a grin (flat top) or a wail (flat bottom).
  const mouthCentre = { x: 0, y: MOUTH_Y }
  if (facingAt(0, MOUTH_Y) < -SHOWN) return
  if (options.nose && facingAt(0, EYE_Y - 0.15) >= SHOWN) {
    // A small nose: down from between the eyes, hooking toward the character's right.
    pen.line(toScreen([{ x: 0.01, y: EYE_Y - 0.1 }, { x: 0.03, y: MOUTH_Y + 0.2 }, { x: -0.05, y: MOUTH_Y + 0.17 }], { x: 0, y: MOUTH_Y + 0.22 }), thin)
  }
  const w = 0.25 * Math.max(0.3, field(pose, 'mouthWidth', 1))
  const open = Math.min(1, Math.max(0, field(pose, 'mouth', 0)))
  if (open <= 0.05) {
    pen.line(toScreen(quadratic({ x: -w, y: MOUTH_Y }, { x: 0, y: MOUTH_Y - smile * 0.25 }, { x: w, y: MOUTH_Y }), mouthCentre), thin)
    return
  }
  const depth = 0.3 * open
  // The opening's edges, face space (up is +y), as the height of its top and bottom at an x across it.
  let outline: Point[]
  let yTop: (x: number) => number
  let yBottom: (x: number) => number
  // How much of the mouth's width the teeth fill.
  let inside: number
  if (smile > 0.3) {
    // A grin: a flat top, the bottom curving down.
    const top = MOUTH_Y + 0.05
    const control = { x: 0, y: MOUTH_Y - depth * 2 }
    outline = [...quadratic({ x: w, y: top }, control, { x: -w, y: top })]
    yTop = () => top
    yBottom = (x) => quadraticY({ x: w, y: top }, control, { x: -w, y: top }, x)
    inside = 0.85
  } else if (smile < -0.3) {
    // A wail: a flat bottom, the top curving up.
    const bottom = MOUTH_Y - depth * 0.6
    const control = { x: 0, y: MOUTH_Y + depth * 1.4 }
    outline = [...quadratic({ x: w, y: bottom }, control, { x: -w, y: bottom })]
    yTop = (x) => quadraticY({ x: w, y: bottom }, control, { x: -w, y: bottom }, x)
    yBottom = () => bottom
    inside = 0.5
  } else {
    const rx = w * 0.8
    outline = ellipse(0, MOUTH_Y, rx, depth)
    const rise = (x: number) => depth * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2))
    yTop = (x) => MOUTH_Y + rise(x)
    yBottom = (x) => MOUTH_Y - rise(x)
    inside = 0.5
  }
  pen.shape(toScreen(outline, mouthCentre), pen.ink, 0)
  if (open < SHOWS_INSIDE) return
  const gap = yTop(0) - yBottom(0)
  const half = w * inside
  const across = (from: number, to: number, samples = 8) => Array.from({ length: samples + 1 }, (_, i) => from + ((to - from) * i) / samples)
  if (options.tongue) {
    // A tongue lying along the bottom of the opening, its tip curving up in the middle.
    const tw = half * 0.55
    const floor = across(tw, -tw).map((x) => ({ x, y: yBottom(x) }))
    const tip = quadratic({ x: -tw, y: yBottom(-tw) }, { x: 0, y: yBottom(0) + gap * 0.8 }, { x: tw, y: yBottom(tw) }, 8)
    pen.shape(toScreen([...floor, ...tip.slice(1, -1)], mouthCentre), TONGUE, 0)
  }
  if (options.teeth) {
    // A row of upper teeth hanging from the top of the opening, with the lines between them.
    const t = Math.min(0.06, gap * 0.4)
    const edge = across(-half, half).map((x) => ({ x, y: yTop(x) }))
    const under = edge.map(({ x, y }) => ({ x: x * 0.92, y: y - t })).reverse()
    pen.shape(toScreen([...edge, ...under], mouthCentre), '#ffffff', 0)
    for (const k of [-0.5, 0, 0.5]) {
      const x = half * k
      pen.line(toScreen([{ x, y: yTop(x) }, { x: x * 0.92, y: yTop(x) - t }], mouthCentre), thin * 0.6)
    }
  }
}

/** Almond eyes in head coordinates: every feature follows the same turn/nod projection as the plain face. */
function drawAnimeEye(
  pen: Pen, head: SolvedHead, eye: Point, side: number, open: number, lid: number, bulge: number,
  pupilSize: number, lookX: number, lookY: number, thin: number, options: FaceOptions, ctx?: CanvasRenderingContext2D
): void {
  const { x: ex, y: ey } = eye
  const scale = Math.min(1.2, Math.max(0.5, options.eyeScale ?? 1))
  const aspect = Math.min(1.2, Math.max(0.45, options.eyeAspect ?? 1))
  const width = 0.21 * scale * (1 + bulge * 0.15)
  const height = 0.25 * scale * aspect * Math.min(open, 1.6) * (1 - lid) * (1 + bulge * 0.3)
  const left = { x: ex - width, y: ey }
  const right = { x: ex + width, y: ey }
  const top = { x: ex, y: ey + height * 1.9 }
  const bottom = { x: ex, y: ey - height * 1.35 }
  const upper = quadratic(left, top, right)
  const lower = quadratic(right, bottom, left)
  const screen = (points: Point[]) => faceToScreen(head, points, eye).points
  // Clamp coloured features to the eye opening, also when drawFace is used without a canvas context.
  const inside = (points: Point[]) => points.map((p) => {
    const x = Math.min(right.x, Math.max(left.x, p.x))
    return { x, y: Math.min(quadraticY(left, top, right, x), Math.max(quadraticY(right, bottom, left, x), p.y)) }
  })
  pen.shape(screen([...upper, ...lower.slice(1, -1)]), '#ffffff', thin * 0.5)
  const px = ex + Math.max(-1, Math.min(1, lookX)) * 0.07 * scale
  const py = ey - Math.max(-1, Math.min(1, lookY)) * 0.055 * scale
  const irisX = 0.115 * scale
  const irisY = 0.185 * scale
  pen.shape(screen(inside(ellipse(px, py, irisX, irisY, 24))), options.iris ?? '#4b7fce', thin * 0.4)
  pen.shape(screen(inside(ellipse(px, py - 0.075 * scale, irisX * 0.7, irisY * 0.35))), 'rgba(255,255,255,0.25)', 0)
  const radius = Math.min(0.085, 0.042 * pupilSize) * scale
  const pupil = inside(ellipse(px, py, radius, radius * 1.35))
  pen.shape(screen(pupil), pen.ink, 0)
  if (options.inPupil && ctx) {
    const [centre] = screen([{ x: px, y: py }])
    const r = Math.min(...screen(pupil).map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)))
    if (r > 0.5) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2)
      ctx.clip()
      options.inPupil(ctx, { ...centre, r, side: side === 1 ? 'left' : 'right' })
      ctx.restore()
    }
  }
  pen.shape(screen(inside(ellipse(px - 0.038 * scale, py + 0.075 * scale, 0.035 * scale, 0.045 * scale))), '#ffffff', 0)
  pen.shape(screen(inside(ellipse(px + 0.04 * scale, py - 0.04 * scale, 0.014 * scale, 0.02 * scale))), '#ffffff', 0)
  pen.line(screen(upper), thin * 1.1)
  if (options.lashes !== false) {
    for (const offset of [0, 0.035]) {
      const x = ex + side * (width - offset)
      const y = quadraticY(left, top, right, x)
      pen.line(screen([{ x, y }, { x: x + side * 0.055, y: y + 0.07 }]), thin * 0.75)
    }
  }
}

function drawAgeLines(pen: Pen, head: SolvedHead, amount: number, thin: number): void {
  const strength = Math.min(1, Math.max(0, amount))
  if (strength <= 0) return
  for (const side of [-1, 1]) {
    const centre = { x: side * 0.59, y: EYE_Y }
    if (faceToScreen(head, [], centre).facing < SHOWN) continue
    for (const slope of [-0.06, 0.035]) {
      const points = [{ x: centre.x, y: centre.y }, { x: centre.x + side * 0.1, y: centre.y + slope }]
      pen.line(faceToScreen(head, points, centre).points, thin * 0.45 * strength)
    }
    const cheek = { x: side * 0.3, y: -0.38 }
    const crease = quadratic({ x: cheek.x, y: -0.31 }, { x: cheek.x + side * 0.07, y: -0.4 }, { x: cheek.x + side * 0.035, y: -0.49 })
    pen.line(faceToScreen(head, crease, cheek).points, thin * 0.35 * strength)
  }
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
