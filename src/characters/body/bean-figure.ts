import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints } from '../character'

/**
 * The bean figure (`figure: 'bean'`): the common white outlined stick-figure
 * style. A white figure with a thick black outline, smooth noodle limbs, a
 * shaped body (rounded shoulders, a slight waist, fuller hips), a round head with big oval eyes (`face.style: 'oval'`),
 * white mittens and big cartoon shoes.
 *
 * The rig solves the pose as for every figure (poses, gaits, dances, reaches
 * and turns all work); this module draws the body. Each limb is ONE smooth
 * curve through its joints, stroked in the ink and then stroked again,
 * narrower, in the fill, with round caps and joins, so elbows and knees never
 * show a seam. The front arm joins the body without a seam either: its
 * outline is left out where it lies inside the body near the shoulder, so its
 * fill flows into the body's.
 *
 * `limbs: 'line'` is the bare variant: arms, legs and the neck are single
 * round-capped ink lines (with an optional pale `halo` edge so they read on a
 * dark set); the body, eyes, mittens and shoes stay.
 *
 * Detective gear: a trench `coat` (lapels, a belt and buckle, buttons, a hem
 * at the knee, sleeves to the wrist) and a `fedora` (a brim, a pinched crown
 * and a band). Big dark aviator `shades` are `face.shades` (see face.ts).
 *
 * Painter order: the back arm, the legs and the neck, the body (and the
 * coat), then the near arm and the head (and the fedora). Plain tube legs and
 * neck join the body without a seam, so they come after it.
 */

export interface BeanOptions {
  /** `tube` (default): outlined noodles in the fill; `line`: bare ink lines */
  limbs?: 'tube' | 'line'
  /** Body fullness: the half-width at the hips is 0.068 of the height times this (default 1; 1.3 chubby, 0.85 thin) */
  torso?: number
  /** A tube limb's width (inside the outline), fraction of the height (default 0.024) */
  limbWidth?: number
  /** A `line` limb's width, fraction of the height (default 0.017) */
  lineWidth?: number
  /** Outline width, fraction of the height (default 0.0105) */
  outlineWidth?: number
  /** Body, limbs, mittens and shoes (default white) */
  fill?: string
  /** A tee in this colour over the body (default none: the plain figure) */
  shirt?: string | null
  /** The tee's sleeves (default short) */
  sleeves?: 'short' | 'long' | 'none'
  /** Trousers in this colour (default none) */
  trousers?: string | null
  /** Shoe colour (default the fill); a dark shoe gets a shine and a dark sole */
  shoes?: string
  /** A pale edge round `line` limbs, so they read on a dark set (default none) */
  halo?: string | null
  /** A trench coat in this colour, over the body to the knees, sleeves to the wrist (default none) */
  coat?: string | null
  /** A fedora in this colour on the head (default none) */
  fedora?: string | null
  /** Big dark aviator shades in place of the eyes, the brows still showing: sets `face.shades` (default false) */
  shades?: boolean
}

export interface Bean {
  limbs: 'tube' | 'line'
  torso: number
  limbWidth: number
  lineWidth: number
  outlineWidth: number
  fill: string
  shirt: string | null
  sleeves: 'short' | 'long' | 'none'
  trousers: string | null
  shoes: string
  halo: string | null
  coat: string | null
  fedora: string | null
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const finite = (v: number | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** Every bean option spelled out (plain data). */
export function resolveBean(options: BeanOptions = {}): Bean {
  const limbs = options.limbs ?? 'tube'
  if (limbs !== 'tube' && limbs !== 'line') throw new Error(`bean: unknown limbs '${String(limbs)}' (tube | line)`)
  const sleeves = options.sleeves ?? 'short'
  if (!['short', 'long', 'none'].includes(sleeves)) throw new Error(`bean: unknown sleeves '${String(sleeves)}' (short | long | none)`)
  const fill = options.fill ?? '#ffffff'
  return {
    limbs,
    torso: clamp(finite(options.torso, 1), 0.4, 2.5),
    limbWidth: clamp(finite(options.limbWidth, 0.024), 0.004, 0.12),
    lineWidth: clamp(finite(options.lineWidth, 0.017), 0.003, 0.08),
    outlineWidth: clamp(finite(options.outlineWidth, 0.0105), 0.001, 0.05),
    fill,
    shirt: options.shirt ?? null,
    sleeves,
    trousers: options.trousers ?? null,
    shoes: options.shoes ?? fill,
    halo: options.halo ?? null,
    coat: options.coat ?? null,
    fedora: options.fedora ?? null,
  }
}

/**
 * The body: rounded shoulders, a slight waist, fuller hips and a rounded
 * seat, along the hip-to-shoulder line. `length` is that line's length,
 * `width` the half-width at the hips (0.068 of the height × `torso`).
 */
export interface BeanTorso {
  cx: number
  cy: number
  length: number
  width: number
  /** The direction from the hips to the shoulders, radians */
  angle: number
}

const mid = (a: Point, b: Point, k = 0.5): Point => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })

export function beanTorso(bean: Bean, joints: CharacterJoints): BeanTorso {
  const { points } = joints
  const top = mid(points['shoulder.left'], points['shoulder.right'])
  const hip = points.hip
  const length = Math.hypot(top.x - hip.x, top.y - hip.y)
  return {
    cx: (top.x + hip.x) / 2,
    cy: (top.y + hip.y) / 2,
    length: Math.max(length, joints.height * 0.04),
    width: joints.height * 0.068 * bean.torso,
    angle: length > 1e-6 ? Math.atan2(top.y - hip.y, top.x - hip.x) : -Math.PI / 2,
  }
}

type Segment = [control: Point, end: Point]

/** The body's outline in its own frame (x from the hips toward the shoulders): a start and quadratic segments. */
function torsoSegments(t: BeanTorso): { start: Point; segments: Segment[] } {
  const len = t.length
  const sx = len * 0.58
  const bx = -len * 0.62
  const ws = t.width * 0.82
  const ww = t.width * 0.74
  const wh = t.width
  const side = (k: 1 | -1): Segment[] => [
    [{ x: sx, y: k * ws }, { x: sx - len * 0.16, y: k * ws }], // the shoulder
    [{ x: len * 0.05, y: k * ww * 0.98 }, { x: -len * 0.05, y: k * ww }], // down to the waist
    [{ x: -len * 0.3, y: k * wh * 1.04 }, { x: bx + len * 0.14, y: k * wh }], // out to the hip
    [{ x: bx, y: k * wh * 0.95 }, { x: bx, y: 0 }], // round the seat
  ]
  const other = side(1)
  // The other side, back up to the shoulders: the same segments reversed.
  const ends: Point[] = [{ x: sx, y: 0 }, ...other.map(([, end]) => end)]
  const up: Segment[] = other.map(([control], i) => [control, ends[i]] as Segment).reverse()
  return { start: { x: sx, y: 0 }, segments: [...side(-1), ...up] }
}

function toScene(t: BeanTorso, p: Point): Point {
  const c = Math.cos(t.angle)
  const s = Math.sin(t.angle)
  return { x: t.cx + p.x * c - p.y * s, y: t.cy + p.x * s + p.y * c }
}

/** The body's outline as points in the drawing space (for hit tests and checks). */
export function beanTorsoOutline(t: BeanTorso, samples = 8): Point[] {
  const { start, segments } = torsoSegments(t)
  const out: Point[] = [toScene(t, start)]
  let from = start
  for (const [control, end] of segments) {
    for (let i = 1; i <= samples; i++) {
      const k = i / samples
      const u = 1 - k
      out.push(toScene(t, { x: u * u * from.x + 2 * u * k * control.x + k * k * end.x, y: u * u * from.y + 2 * u * k * control.y + k * k * end.y }))
    }
    from = end
  }
  return out
}

/**
 * The bean's drawing order: the back arm, the legs far to near, the neck,
 * the body ('spine'), then any leg reaching well forward (seated thighs),
 * the near arm and any arm reaching forward, and the head. The arm nearer the viewer is the front one; level, the
 * character's left. `reach` is how far each limb's furthest joint comes
 * toward the viewer from its root, px (from the solved skeleton); without
 * it no limb counts as reaching.
 */
export function beanOrder(bean: Bean, joints: CharacterJoints, reach: Record<string, number> = {}): string[] {
  const depth = (id: string) => joints.parts[id]?.depth ?? 0
  const forward = (id: string) => (reach[id] ?? 0) > joints.height * (id.startsWith('leg.') ? BEAN_LEG_REACH : BEAN_ARM_REACH)
  const arms = depth('arm.left') >= depth('arm.right') ? ['arm.right', 'arm.left'] : ['arm.left', 'arm.right']
  const legs = depth('leg.left') >= depth('leg.right') ? ['leg.right', 'leg.left'] : ['leg.left', 'leg.right']
  // The nearer arm always goes over the body.
  const armOver = (id: string) => forward(id) || id === arms[1]
  // Plain tube limbs join the body without a seam, so they go over it; under a tee, trousers or a coat its hem shows.
  const legOver = (id: string) => forward(id) || (bean.limbs === 'tube' && !bean.trousers && !bean.coat)
  const neckOver = bean.limbs === 'tube' && !bean.shirt && !bean.coat
  return [
    ...arms.filter((id) => !armOver(id)),
    ...legs.filter((id) => !legOver(id)),
    ...(neckOver ? [] : ['neck']),
    'spine',
    ...(neckOver ? ['neck'] : []),
    ...legs.filter(legOver),
    ...arms.filter(armOver),
    'head',
  ]
}

/** How far toward the viewer (fraction of the height) a hand must reach from its shoulder for the arm to go over the body */
export const BEAN_ARM_REACH = 0.08
/** How far toward the viewer a knee or foot must come from its hip for the leg to go over the body (seated, a high kick) */
export const BEAN_LEG_REACH = 0.12

/** Whether a part is drawn over the bean's body, by the drawing order in the joints. */
export function beanOverBody(joints: CharacterJoints, id: string): boolean {
  return (joints.parts[id]?.order ?? 0) > (joints.parts.spine?.order ?? 0)
}

// ------------------------------------------------------------------ smooth strokes

/** One smooth curve through points: quadratics through the midpoints, ending on the last point. */
function traceCurve(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y)
    return
  }
  for (let i = 1; i < points.length - 1; i++) {
    const end = i === points.length - 2 ? points[i + 1] : mid(points[i], points[i + 1])
    ctx.quadraticCurveTo(points[i].x, points[i].y, end.x, end.y)
  }
}

/**
 * A limb's centre line: through root, joint and end, rounded at the joint (a
 * quadratic that passes through the joint), sampled finely so the strokes
 * stay smooth at any size.
 */
export function beanLimbLine(root: Point, joint: Point, end: Point, samples = 12): Point[] {
  // Rounded only partly, so a sharply bent elbow keeps its bend without overshooting.
  const rubber = 0.55
  const control = { x: 2 * joint.x - (root.x + end.x) / 2, y: 2 * joint.y - (root.y + end.y) / 2 }
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples
    const u = 1 - t
    const hose = { x: u * u * root.x + 2 * u * t * control.x + t * t * end.x, y: u * u * root.y + 2 * u * t * control.y + t * t * end.y }
    const jointed = t < 0.5 ? mid(root, joint, 2 * t) : mid(joint, end, 2 * t - 1)
    return mid(jointed, hose, rubber)
  })
}

/** A bare line limb: one ink stroke, over a wider pale `halo` stroke when there is one. */
function inkLine(ctx: CanvasRenderingContext2D, points: Point[], width: number, ink: string, halo: string | null): void {
  if (halo) stroke(ctx, points, width * 1.9, halo)
  stroke(ctx, points, width, ink)
}

function stroke(ctx: CanvasRenderingContext2D, points: Point[], width: number, color: string): void {
  if (points.length < 2) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  traceCurve(ctx, points)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function traceTorso(ctx: CanvasRenderingContext2D, torso: BeanTorso): void {
  const { start, segments } = torsoSegments(torso)
  const p0 = toScene(torso, start)
  ctx.moveTo(p0.x, p0.y)
  for (const [control, end] of segments) {
    const c = toScene(torso, control)
    const e = toScene(torso, end)
    ctx.quadraticCurveTo(c.x, c.y, e.x, e.y)
  }
  ctx.closePath()
}

/**
 * Leave a front limb's outline out where it lies inside the body near its
 * root: its fill then flows into the body's with no seam, while its outline
 * still shows outside the body and where it crosses the body further along.
 */
function outsideJoin(ctx: CanvasRenderingContext2D, torso: BeanTorso, root: Point, radius: number, draw: () => void): void {
  const W = 1e6
  // Everywhere but the body, then everywhere but the disc round the root: together, all but their overlap.
  for (const hole of [() => traceTorso(ctx, torso), () => ctx.arc(root.x, root.y, radius, 0, Math.PI * 2)]) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(-W, -W, 2 * W, 2 * W)
    hole()
    ctx.clip('evenodd')
    draw()
    ctx.restore()
  }
}

/** A point moved along the body's line toward the hips. */
function towardHip(p: Point, torso: BeanTorso, by: number): Point {
  return { x: p.x - Math.cos(torso.angle) * by, y: p.y - Math.sin(torso.angle) * by }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, angle: number, fill: string, ink: string, outline: number): void {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = outline
  ctx.strokeStyle = ink
  ctx.stroke()
}

/** A white mitten at the end of a forearm: an oval along it, past the wrist. */
export function mittenAt(elbow: Point, wrist: Point, height: number): { x: number; y: number; rx: number; ry: number; angle: number } {
  const angle = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x)
  const reach = height * 0.012
  return { x: wrist.x + Math.cos(angle) * reach, y: wrist.y + Math.sin(angle) * reach, rx: height * 0.031, ry: height * 0.025, angle }
}

/**
 * Where a shoe goes: the ankle's x, the ground under it (the toe's level),
 * which way it points (+1 screen-right), its length, and how far it tips
 * when the foot does (a kick, pointed toes), radians.
 */
export function beanShoeAt(ankle: Point, toe: Point, height: number, facing: number): { x: number; ankle: number; ground: number; dir: number; length: number; tip: number } {
  const dx = toe.x - ankle.x
  const dy = toe.y - ankle.y
  const dir = Math.abs(dx) > height * 0.004 ? Math.sign(dx) : facing
  const run = Math.max(Math.abs(dx), height * 0.03)
  // A foot pointing down (or up) more than it does standing tips the shoe with it.
  const lifted = Math.max(0, Math.abs(dy) - height * 0.02)
  const tip = Math.atan2(Math.sign(dy) * lifted, run)
  return { x: ankle.x, ankle: ankle.y, ground: toe.y, dir, length: run + height * 0.035, tip }
}

/** The shoe's sole colour, and a dark shoe's */
export const BEAN_SOLE = '#d6d3d1'
export const BEAN_DARK_SOLE = '#3f3f46'

/** Whether a `#rgb` / `#rrggbb` colour is dark (other colour forms count as light). */
function isDark(color: string): boolean {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1]
  if (!hex) return false
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b < 110
}

/**
 * A trench coat over the body, in the body's frame (x from the hips toward
 * the shoulders): wide shoulders, a belted waist, flaring to a hem at the
 * knee; lapels, the front overlap, a belt and buckle, double-breasted buttons.
 */
function drawTrench(ctx: CanvasRenderingContext2D, torso: BeanTorso, color: string, thigh: number, ink: string, O: number, H: number): void {
  const len = torso.length
  const tw = torso.width
  const sx = len * 0.58
  const bx = -len * 0.62
  const hem = bx - thigh * 0.62
  const wS = tw
  const wW = tw * 0.9
  const wHem = tw * 1.45
  ctx.save()
  ctx.translate(torso.cx, torso.cy)
  ctx.rotate(torso.angle)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = ink
  ctx.lineWidth = O
  ctx.beginPath()
  ctx.moveTo(sx + len * 0.02, 0)
  ctx.quadraticCurveTo(sx + len * 0.02, -wS, sx - len * 0.14, -wS)
  ctx.quadraticCurveTo(len * 0.05, -wW, -len * 0.08, -wW)
  ctx.quadraticCurveTo(-len * 0.5, -wW * 1.1, hem, -wHem)
  ctx.lineTo(hem, wHem)
  ctx.quadraticCurveTo(-len * 0.5, wW * 1.1, -len * 0.08, wW)
  ctx.quadraticCurveTo(len * 0.05, wW, sx - len * 0.14, wS)
  ctx.quadraticCurveTo(sx + len * 0.02, wS, sx + len * 0.02, 0)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.stroke()
  ctx.clip()
  ctx.lineWidth = O * 0.8
  ctx.beginPath() // the lapels: a V from the collar to the belt, with a notch each side
  ctx.moveTo(sx, -tw * 0.5)
  ctx.lineTo(-len * 0.02, tw * 0.05)
  ctx.moveTo(sx, tw * 0.5)
  ctx.lineTo(-len * 0.02, -tw * 0.05)
  ctx.moveTo(sx - len * 0.2, -tw * 0.62)
  ctx.lineTo(sx - len * 0.12, -tw * 0.38)
  ctx.moveTo(sx - len * 0.2, tw * 0.62)
  ctx.lineTo(sx - len * 0.12, tw * 0.38)
  ctx.stroke()
  ctx.beginPath() // the overlap down the front to the hem
  ctx.moveTo(-len * 0.02, tw * 0.05)
  ctx.lineTo(hem, tw * 0.12)
  ctx.stroke()
  ctx.fillStyle = 'rgba(0,0,0,0.28)' // the belt
  ctx.fillRect(-len * 0.16, -wW * 1.2, len * 0.11, wW * 2.4)
  ctx.beginPath() // its buckle
  ctx.rect(-len * 0.17, -tw * 0.18, len * 0.13, tw * 0.36)
  ctx.fillStyle = '#c9a227'
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = ink // double-breasted buttons
  for (const [x, y] of [[len * 0.22, -tw * 0.3], [len * 0.22, tw * 0.4], [-len * 0.32, -tw * 0.3], [-len * 0.32, tw * 0.45]]) {
    ctx.beginPath()
    ctx.arc(x, y, H * 0.006, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** The fedora's head: what `drawBeanFedora` needs of the solved head. */
export interface BeanHead {
  center: Point
  rx: number
  angle: number
}

/**
 * A fedora on the head: a wide brim, a pinched crown and a dark band,
 * tilting with the head and sliding a little with `head.turn`.
 */
export function drawBeanFedora(ctx: CanvasRenderingContext2D, head: BeanHead, color: string, ink: string, outline: number, headTurn = 0): void {
  const R = head.rx
  const shift = (Math.max(-90, Math.min(90, headTurn)) / 60) * R * 0.25
  ctx.save()
  ctx.translate(head.center.x, head.center.y)
  ctx.rotate(head.angle)
  ctx.lineJoin = 'round'
  ctx.lineWidth = outline
  ctx.strokeStyle = ink
  ctx.beginPath() // the brim
  ctx.ellipse(shift * 0.5, -R * 0.62, R * 1.38, R * 0.22, 0, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.stroke()
  ctx.beginPath() // the crown, pinched at the top
  ctx.moveTo(shift - R * 0.78, -R * 0.64)
  ctx.bezierCurveTo(shift - R * 0.82, -R * 1.05, shift - R * 0.6, -R * 1.32, shift - R * 0.22, -R * 1.24)
  ctx.quadraticCurveTo(shift, -R * 1.12, shift + R * 0.22, -R * 1.24)
  ctx.bezierCurveTo(shift + R * 0.6, -R * 1.32, shift + R * 0.82, -R * 1.05, shift + R * 0.78, -R * 0.64)
  ctx.quadraticCurveTo(shift, -R * 0.54, shift - R * 0.78, -R * 0.64)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.stroke()
  ctx.clip() // the band
  ctx.fillStyle = ink
  ctx.fillRect(shift - R, -R * 0.84, 2 * R, R * 0.17)
  ctx.restore()
}

/**
 * A cartoon shoe: a flat sole on the ground, a rounded toe cap, a low heel
 * and an ankle opening, with a grey sole strip.
 */
function drawShoe(ctx: CanvasRenderingContext2D, at: ReturnType<typeof beanShoeAt>, H: number, fill: string, ink: string, outline: number): void {
  const toe = at.length * 1.3
  const heel = H * 0.034
  const h = H * 0.066
  const sole = H * 0.012
  ctx.save()
  // Turned about the ankle when tipped; standing, the sole rests on the ground.
  ctx.translate(at.x, at.ankle)
  ctx.scale(at.dir, 1)
  if (at.tip) ctx.rotate(at.tip)
  ctx.translate(0, at.ground - at.ankle)
  ctx.lineJoin = 'round'
  ctx.lineWidth = outline
  ctx.strokeStyle = ink
  ctx.beginPath()
  ctx.moveTo(-heel, -sole)
  ctx.lineTo(toe * 0.82, -sole) // the flat sole
  ctx.quadraticCurveTo(toe + H * 0.012, -sole, toe + H * 0.01, -h * 0.42) // round up the toe
  ctx.quadraticCurveTo(toe * 0.98, -h * 0.85, toe * 0.62, -h * 0.82) // the toe cap
  ctx.quadraticCurveTo(toe * 0.3, -h * 0.8, H * 0.012, -h) // the tongue, up to the ankle
  ctx.lineTo(-H * 0.012, -h) // the ankle opening
  ctx.quadraticCurveTo(-heel * 1.15, -h * 0.85, -heel, -sole) // the back of the heel
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.stroke()
  if (isDark(fill)) {
    // A shine across the toe cap of a dark shoe.
    ctx.save()
    ctx.clip()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = H * 0.006
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(toe * 0.45, -h * 0.68)
    ctx.quadraticCurveTo(toe * 0.85, -h * 0.72, toe * 0.95, -h * 0.45)
    ctx.stroke()
    ctx.restore()
  }
  ctx.beginPath() // the sole strip along the ground
  ctx.moveTo(-heel, -sole)
  ctx.lineTo(toe * 0.82, -sole)
  ctx.quadraticCurveTo(toe + H * 0.012, -sole, toe + H * 0.011, -sole * 1.8)
  ctx.lineTo(toe + H * 0.012, 0)
  ctx.lineTo(-heel, 0)
  ctx.closePath()
  ctx.fillStyle = isDark(fill) ? BEAN_DARK_SOLE : BEAN_SOLE
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export interface BeanDrawOptions {
  ink: string
  /** The hands: `mitten` drawn here; others by the caller */
  hands: 'dot' | 'cartoon' | 'mitten'
}

/** Draw one part of a bean figure ('arm.left', 'leg.right', 'neck', 'spine'). */
export function drawBeanPart(ctx: CanvasRenderingContext2D, bean: Bean, joints: CharacterJoints, id: string, options: BeanDrawOptions): void {
  const H = joints.height
  const P = joints.points
  const ink = options.ink
  const O = bean.outlineWidth * H
  const W = bean.limbWidth * H
  const L = bean.lineWidth * H
  const line = bean.limbs === 'line'
  const torso = beanTorso(bean, joints)
  ctx.save()
  if (id === 'spine') {
    ctx.beginPath()
    traceTorso(ctx, torso)
    ctx.fillStyle = bean.shirt ?? bean.fill
    ctx.fill()
    ctx.lineWidth = O
    ctx.strokeStyle = ink
    ctx.stroke()
    if (bean.coat) {
      const thigh = (side: string) => Math.hypot(P[`knee.${side}`].x - P[`hip.${side}`].x, P[`knee.${side}`].y - P[`hip.${side}`].y)
      drawTrench(ctx, torso, bean.coat, (thigh('left') + thigh('right')) / 2, ink, O, H)
    }
  } else if (id === 'neck') {
    const top = mid(P['shoulder.left'], P['shoulder.right'])
    const pts = [top, joints.head.center]
    if (line) inkLine(ctx, pts, L, ink, bean.halo)
    else {
      const outline = () => stroke(ctx, pts, W * 0.9 + 2 * O, ink)
      if (beanOverBody(joints, id)) outsideJoin(ctx, torso, top, torso.length * 0.25, outline)
      else outline()
      stroke(ctx, pts, W * 0.9, bean.fill)
    }
  } else if (id.startsWith('arm.')) {
    const side = id.slice(4)
    const el = P[`elbow.${side}`]
    // The arm's root sits a little inside the body, so its round end never bulges above the shoulder.
    const sh = towardHip(P[`shoulder.${side}`], torso, (line ? L : W) / 2 + O)
    const hd = P[`hand.${side}`]
    const pts = beanLimbLine(sh, el, hd)
    const front = !line && beanOverBody(joints, id)
    // A coat sleeve, from the shoulder to the wrist.
    const coatSleeve = bean.coat ? beanLimbLine(sh, el, mid(el, hd, 0.8)) : null
    const coatW = W * 1.7
    const shirt = bean.shirt
    const longSleeve = !!shirt && bean.sleeves === 'long'
    const sleeve = shirt && bean.sleeves === 'short' ? beanLimbLine(sh, mid(sh, el, 0.25), mid(sh, el, 0.5), 4) : null
    const sleeveW = W * 1.55
    const ring = (coatSleeve ? coatW : sleeve ? sleeveW : W) / 2 + O * 2
    const outlines = () => {
      if (!line) stroke(ctx, pts, W + 2 * O, ink)
      if (sleeve) stroke(ctx, sleeve, sleeveW + 2 * O, ink)
    }
    if (line && !longSleeve) inkLine(ctx, pts, L, ink, bean.halo)
    if (line && longSleeve) stroke(ctx, pts, W + 2 * O, ink)
    // The outline everywhere but inside the body at the shoulder (the front arm's seamless join).
    if (front) outsideJoin(ctx, torso, sh, ring, outlines)
    else outlines()
    if (!line || longSleeve) stroke(ctx, pts, W, longSleeve ? shirt! : bean.fill)
    if (sleeve) stroke(ctx, sleeve, sleeveW, shirt!)
    if (coatSleeve) {
      const coatOutline = () => stroke(ctx, coatSleeve, coatW + 2 * O, ink)
      if (beanOverBody(joints, id)) outsideJoin(ctx, torso, sh, ring, coatOutline)
      else coatOutline()
      stroke(ctx, coatSleeve, coatW, bean.coat!)
    }
    if (options.hands === 'mitten') {
      const m = mittenAt(el, hd, H)
      blob(ctx, m.x, m.y, m.rx, m.ry, m.angle, bean.fill, ink, O)
    } else if (options.hands === 'dot' && line) {
      ctx.beginPath()
      ctx.arc(hd.x, hd.y, L * 0.9, 0, Math.PI * 2)
      ctx.fillStyle = ink
      ctx.fill()
    }
  } else if (id.startsWith('leg.')) {
    const side = id.slice(4)
    const hip = P[`hip.${side}`]
    const ankle = P[`ankle.${side}`]
    const width = bean.trousers ? W * 1.35 : line ? L : W
    // The leg ends inside the shoe, its round end clear of the sole.
    const knee = P[`knee.${side}`]
    const shin = Math.hypot(knee.x - ankle.x, knee.y - ankle.y) || 1
    const up = Math.min(shin * 0.4, width / 2 + O + H * 0.012)
    const end = { x: ankle.x + ((knee.x - ankle.x) / shin) * up, y: ankle.y + ((knee.y - ankle.y) / shin) * up }
    const pts = beanLimbLine(hip, knee, end)
    const over = beanOverBody(joints, id)
    if (line && !bean.trousers) inkLine(ctx, pts, L, ink, bean.halo)
    else {
      const outline = () => stroke(ctx, pts, width + 2 * O, ink)
      if (over) outsideJoin(ctx, torso, hip, width / 2 + O * 2, outline)
      else outline()
      stroke(ctx, pts, width, bean.trousers ?? bean.fill)
    }
    const turn = joints.turn
    // Which way the figure faces on screen: right for turns 0..2, left for 2..4.
    const facing = ((turn % 4) + 4) % 4 > 2 ? -1 : 1
    drawShoe(ctx, beanShoeAt(P[`ankle.${side}`], P[`toe.${side}`], H, facing), H, bean.shoes, ink, O)
  }
  ctx.restore()
}
