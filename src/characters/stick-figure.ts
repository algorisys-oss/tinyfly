import type { CustomTarget } from '../adapters/canvas'
import type { EasingType, Track } from '../engine/types'

/**
 * A stick-figure rig: a pose is a handful of numbers, so poses blend, walk
 * cycles are functions of a phase, and every joint can be a timeline track.
 *
 * The figure is drawn facing the viewer with its feet at (0, 0) and its head
 * up (negative y). Limb angles are degrees from hanging straight down;
 * positive raises a limb outward, away from the body. Drawing needs only a
 * Canvas 2D context, so it works in a browser, a Worker or Node.
 */

/** Every value is a number, so any two poses blend. */
export interface StickPose {
  /** Upper-body tilt about the hips, degrees (+ leans to the figure's right, +x) */
  lean: number
  /** Head tilt, degrees */
  headTilt: number
  /** Upper arms: 0 hangs down, 90 is straight out, 180 straight up */
  leftShoulder: number
  rightShoulder: number
  /** Elbow bend, added to the upper arm's angle (negative bends inward) */
  leftElbow: number
  rightElbow: number
  /** Thighs: 0 is straight down, positive spreads outward */
  leftHip: number
  rightHip: number
  /** Knee bend: positive swings the shin back toward the centre */
  leftKnee: number
  rightKnee: number
  /** 0 closed, 1 wide open */
  mouth: number
  /** -1 frown, 0 flat, 1 smile; with an open mouth, sets a grin (+) or a wail (-) */
  smile: number
  /** Mouth width: 1 normal, 0.5 pursed, 1.5 wide */
  mouthWidth: number
  /** 0 open eyes, 1 closed; applied on top of the eye openness, for blinking */
  blink: number
  /** Eye openness: 0 shut, 1 normal, 1.6 wide (above about 1.2 the whites show) */
  leftEye: number
  rightEye: number
  /** Eyebrow height: -1 lowered, 0 rest, 1 raised */
  leftBrow: number
  rightBrow: number
  /** Eyebrow slant: -1 angry (inner ends down), 1 worried (inner ends up) */
  browTilt: number
  /** Where the eyes look: -1..1 across (+ is the way the figure faces) and down (+) */
  lookX: number
  lookY: number
}

export const REST_POSE: StickPose = {
  lean: 0,
  headTilt: 0,
  leftShoulder: 18,
  rightShoulder: 18,
  leftElbow: -6,
  rightElbow: -6,
  leftHip: 8,
  rightHip: 8,
  leftKnee: 0,
  rightKnee: 0,
  mouth: 0,
  smile: 0.6,
  mouthWidth: 1,
  blink: 0,
  leftEye: 1,
  rightEye: 1,
  leftBrow: 0,
  rightBrow: 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0,
}

/** A full pose from the fields that differ from rest. */
export function pose(changes: Partial<StickPose>): StickPose {
  return { ...REST_POSE, ...changes }
}

/** The face fields of a pose: what an expression sets. */
export type Expression = Pick<
  StickPose,
  'mouth' | 'smile' | 'mouthWidth' | 'leftEye' | 'rightEye' | 'leftBrow' | 'rightBrow' | 'browTilt' | 'lookX' | 'lookY'
>

const NEUTRAL_FACE: Expression = {
  mouth: 0,
  smile: 0,
  mouthWidth: 1,
  leftEye: 1,
  rightEye: 1,
  leftBrow: 0,
  rightBrow: 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0,
}

const face = (changes: Partial<Expression>): Expression => ({ ...NEUTRAL_FACE, ...changes })

/**
 * Ready-made faces. Each sets every face field, so applying one replaces the
 * whole face, and any two blend. Combine with a body pose via {@link withExpression}.
 */
export const EXPRESSIONS = {
  neutral: NEUTRAL_FACE,
  happy: face({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: face({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: face({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: face({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: face({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: face({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: face({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: face({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: face({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: face({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: face({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: face({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: face({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: face({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: face({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: face({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: face({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 }),
} satisfies Record<string, Expression>

export type ExpressionName = keyof typeof EXPRESSIONS

/** `base` with its face replaced by an expression (a name, or face fields to change). */
export function withExpression(base: StickPose, expression: ExpressionName | Partial<Expression>): StickPose {
  return { ...base, ...(typeof expression === 'string' ? EXPRESSIONS[expression] : expression) }
}

/** Ready-made poses. Blend between them, or override single joints. */
export const POSES = {
  rest: REST_POSE,
  wave: pose({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...EXPRESSIONS.happy }),
  cheer: pose({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...EXPRESSIONS.joyful }),
  shrug: pose({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...EXPRESSIONS.confused, lookX: 0, lookY: 0 }),
  point: pose({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: pose({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...EXPRESSIONS.thinking }),
  handsOnHips: pose({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: pose({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...EXPRESSIONS.sad }),
  surprised: pose({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...EXPRESSIONS.surprised }),
} satisfies Record<string, StickPose>

export type PoseName = keyof typeof POSES

const POSE_KEYS = Object.keys(REST_POSE) as (keyof StickPose)[]

/** Linear blend: `t` 0 is `from`, 1 is `to`. */
export function blendPose(from: StickPose, to: StickPose, t: number): StickPose {
  const out = { ...from }
  for (const key of POSE_KEYS) out[key] = from[key] + (to[key] - from[key]) * t
  return out
}

/**
 * A walking stride at `phase` (in strides: 0 → 1 is one full cycle), built on
 * `base` so the upper body can keep another pose. `stride` scales the swing.
 */
export function walkPose(phase: number, base: StickPose = REST_POSE, stride = 1): StickPose {
  const swing = Math.sin(phase * Math.PI * 2)
  const lift = Math.cos(phase * Math.PI * 2)
  return {
    ...base,
    // Legs scissor: one thigh swings the way the other swings back.
    leftHip: base.leftHip + 22 * swing * stride,
    rightHip: base.rightHip - 22 * swing * stride,
    leftKnee: base.leftKnee + 14 * Math.max(0, lift) * stride,
    rightKnee: base.rightKnee + 14 * Math.max(0, -lift) * stride,
    // Arms swing against the legs.
    leftShoulder: base.leftShoulder - 14 * swing * stride,
    rightShoulder: base.rightShoulder + 14 * swing * stride,
  }
}

/** How open a talking mouth is at `time` ms: a deterministic chatter, 0..1. */
export function talkingMouth(time: number): number {
  const syllable = Math.abs(Math.sin(time / 65))
  const phrase = 0.55 + 0.45 * Math.sin(time / 310)
  return syllable * phrase
}

/** How the figure looks, apart from its pose. */
export interface StickStyle {
  /** Feet to top of head, px (default 300) */
  height?: number
  /** Line colour (default slate) */
  color?: string
  /** Line width (default 2.5% of the height) */
  lineWidth?: number
  /** Head fill; `none` leaves it see-through (default white) */
  headFill?: string
  /** 1 faces right, -1 faces left: mirrors the figure and turns the eyes */
  facing?: number
  /** Name tag drawn over the head */
  label?: string
  /** Name tag font (default bold, 11% of the height, sans-serif) */
  labelFont?: string
}

/** Proportions as fractions of the height. */
const HEAD = 0.12
const HIP = 0.46
const NECK = 1 - 2 * HEAD
const SHOULDER_DROP = 0.1
const UPPER_ARM = 0.21
const FOREARM = 0.19
const THIGH = 0.24
const SHIN = 0.22

const rad = (degrees: number) => (degrees * Math.PI) / 180

/** Unit vector for a limb at `angle` degrees from down, spreading to `side` (-1 left, 1 right). */
const limb = (angle: number, side: number) => ({ x: side * Math.sin(rad(angle)), y: Math.cos(rad(angle)) })

/**
 * Eyes, brows and mouth, in the head's frame: centre (0, cy), radius r. The
 * canvas is already mirrored for facing, so +x is the way the figure looks.
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  figure: StickPose,
  r: number,
  cy: number,
  color: string,
  lineWidth: number
): void {
  const thin = Math.max(1, lineWidth * 0.6)
  // Eyes sit a little toward the facing side, and the pupils follow lookX/lookY.
  const look = 0.12 * r
  const eyeY = cy - 0.12 * r
  const pupilX = look + figure.lookX * 0.08 * r
  const pupilY = figure.lookY * 0.07 * r
  const eyes = [
    { x: -0.34 * r, open: figure.leftEye, brow: figure.leftBrow, side: -1 },
    { x: 0.34 * r, open: figure.rightEye, brow: figure.rightBrow, side: 1 },
  ]

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = thin
  for (const eye of eyes) {
    const open = Math.max(0, eye.open) * (1 - Math.min(1, Math.max(0, figure.blink)))
    if (open < 0.2) {
      // Shut: a lid line, arched up when smiling (a laugh), curved down otherwise.
      const arch = figure.smile > 0.5 ? -0.12 * r : 0.06 * r
      ctx.beginPath()
      ctx.moveTo(eye.x + look - 0.12 * r, eyeY)
      ctx.quadraticCurveTo(eye.x + look, eyeY + arch, eye.x + look + 0.12 * r, eyeY)
      ctx.stroke()
    } else {
      if (open > 1.2) {
        // Wide open: the whites show around the pupil.
        const white = 0.13 * r * open
        ctx.beginPath()
        ctx.ellipse(eye.x + look, eyeY, white * 0.85, white, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = color
      }
      // Pupils shrink a little as the eyes widen, so the whites read.
      const pupil = open > 1.2 ? 0.075 * r : 0.1 * r
      ctx.beginPath()
      ctx.ellipse(eye.x + pupilX, eyeY + pupilY, pupil, pupil * 1.1 * Math.min(open, 1), 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Brow: raised or lowered, and slanted (inner end is toward x = 0).
    const browY = eyeY - 0.3 * r - eye.brow * 0.14 * r - Math.max(0, open - 1) * 0.12 * r
    const inner = eye.x + look - eye.side * 0.13 * r
    const outer = eye.x + look + eye.side * 0.13 * r
    ctx.beginPath()
    ctx.moveTo(outer, browY)
    ctx.lineTo(inner, browY - figure.browTilt * 0.1 * r)
    ctx.stroke()
  }

  // Mouth: closed is a curve; open is an O, a grin (flat top) or a wail (flat bottom).
  const mouthY = cy + 0.4 * r
  const w = 0.25 * r * Math.max(0.3, figure.mouthWidth)
  const open = Math.min(1, Math.max(0, figure.mouth))
  ctx.beginPath()
  if (open <= 0.05) {
    ctx.moveTo(look - w, mouthY)
    ctx.quadraticCurveTo(look, mouthY + figure.smile * 0.25 * r, look + w, mouthY)
    ctx.stroke()
    return
  }
  const depth = 0.3 * r * open
  if (figure.smile > 0.3) {
    ctx.moveTo(look - w, mouthY - 0.05 * r)
    ctx.lineTo(look + w, mouthY - 0.05 * r)
    ctx.quadraticCurveTo(look, mouthY + depth * 2, look - w, mouthY - 0.05 * r)
  } else if (figure.smile < -0.3) {
    ctx.moveTo(look - w, mouthY + depth * 0.6)
    ctx.lineTo(look + w, mouthY + depth * 0.6)
    ctx.quadraticCurveTo(look, mouthY - depth * 1.4, look - w, mouthY + depth * 0.6)
  } else {
    ctx.ellipse(look, mouthY, w * 0.8, depth, 0, 0, Math.PI * 2)
  }
  ctx.fill()
}

/** Draw a figure with its feet at (0, 0). */
export function drawStickFigure(ctx: CanvasRenderingContext2D, figure: StickPose, style: StickStyle = {}): void {
  const h = style.height ?? 300
  const color = style.color ?? '#1e293b'
  const facing = (style.facing ?? 1) < 0 ? -1 : 1
  const r = HEAD * h
  const hipY = -HIP * h
  const neckY = -NECK * h

  ctx.save()
  ctx.scale(facing, 1)
  ctx.strokeStyle = color
  ctx.lineWidth = style.lineWidth ?? h * 0.025
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const segment = (x: number, y: number, angle: number, side: number, length: number) => {
    const d = limb(angle, side)
    return { x: x + d.x * length * h, y: y + d.y * length * h }
  }
  const polyline = (...points: { x: number; y: number }[]) => {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  // Legs hang from the hips and do not lean.
  for (const [side, hipAngle, knee] of [
    [-1, figure.leftHip, figure.leftKnee],
    [1, figure.rightHip, figure.rightKnee],
  ] as const) {
    const kneePoint = segment(0, hipY, hipAngle, side, THIGH)
    polyline({ x: 0, y: hipY }, kneePoint, segment(kneePoint.x, kneePoint.y, hipAngle - knee, side, SHIN))
  }

  // The upper body tilts about the hips.
  ctx.translate(0, hipY)
  ctx.rotate(rad(figure.lean))
  ctx.translate(0, -hipY)
  polyline({ x: 0, y: hipY }, { x: 0, y: neckY })

  const shoulderY = neckY + SHOULDER_DROP * h
  for (const [side, shoulder, elbow] of [
    [-1, figure.leftShoulder, figure.leftElbow],
    [1, figure.rightShoulder, figure.rightElbow],
  ] as const) {
    const elbowPoint = segment(0, shoulderY, shoulder, side, UPPER_ARM)
    polyline({ x: 0, y: shoulderY }, elbowPoint, segment(elbowPoint.x, elbowPoint.y, shoulder + elbow, side, FOREARM))
  }

  // Head and face, tilted about the neck.
  ctx.translate(0, neckY)
  ctx.rotate(rad(figure.headTilt))
  const cy = -r
  ctx.beginPath()
  ctx.arc(0, cy, r, 0, Math.PI * 2)
  const headFill = style.headFill ?? '#ffffff'
  if (headFill !== 'none') {
    ctx.fillStyle = headFill
    ctx.fill()
  }
  ctx.stroke()

  drawFace(ctx, figure, r, cy, color, style.lineWidth ?? h * 0.025)
  ctx.restore()

  if (style.label) {
    ctx.save()
    ctx.fillStyle = color
    ctx.font = style.labelFont ?? `700 ${Math.round(h * 0.11)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(style.label, 0, -h - 0.04 * h)
    ctx.restore()
  }
}

/** Values a stick-figure target's tracks can animate, besides x/y/opacity/…. */
export interface StickFigureProps extends StickPose {
  /** Walk cycle phase, in strides (animate it 0 → n for n strides) */
  walk: number
  /** How much of the walk cycle is applied, 0..1 (0 standing) */
  walking: number
  /** How much the mouth chatters, 0..1 */
  talk: number
}

export interface StickFigureTargetOptions {
  /** Where the feet stand */
  x: number
  y: number
  /** Starting pose (default rest) */
  pose?: Partial<StickPose>
  style?: StickStyle
}

/**
 * A `custom` canvas target that draws a stick figure. Its props are the pose
 * plus `walk`, `walking` and `talk`, so the timeline can pose, walk and voice
 * it. `x`/`y` here are the feet; the target's own box sits above them.
 */
export function stickFigureTarget(options: StickFigureTargetOptions): CustomTarget {
  const style = options.style ?? {}
  const height = style.height ?? 300
  const width = height * 0.8
  const props: StickFigureProps = { ...pose(options.pose ?? {}), walk: 0, walking: 0, talk: 0 }
  return {
    type: 'custom',
    x: options.x - width / 2,
    y: options.y - height,
    width,
    height,
    props: { ...props },
    draw(ctx, target, time) {
      const values = target.props as unknown as StickFigureProps
      const standing: StickPose = { ...values }
      let figure = values.walking > 0 ? blendPose(standing, walkPose(values.walk, standing), values.walking) : standing
      if (values.talk > 0) figure = { ...figure, mouth: Math.max(figure.mouth, values.talk * talkingMouth(time)) }
      ctx.translate(width / 2, height)
      drawStickFigure(ctx, figure, style)
    },
  }
}

export interface PoseKey {
  time: number
  /** The pose here: a name, or joints to change from the previous key (default: no change) */
  pose?: PoseName | Partial<StickPose>
  /** The face here, applied over the pose: a name, or face fields to change */
  expression?: ExpressionName | Partial<Expression>
  /** Easing into this key */
  easing?: EasingType
}

/**
 * Keyframe tracks that move `target` through a sequence of poses. Each key is
 * a named pose or changes from the previous key (the first builds on rest),
 * optionally with an expression over it.
 * Only joints that leave rest in some key get a track, so the JSON stays
 * small; the others keep the target's own pose.
 */
export function poseTracks(target: string, keys: PoseKey[]): Track[] {
  const resolved: StickPose[] = []
  keys.forEach((key, index) => {
    const previous = index === 0 ? REST_POSE : resolved[index - 1]
    const body = typeof key.pose === 'string' ? POSES[key.pose] : { ...previous, ...key.pose }
    resolved.push(key.expression ? withExpression(body, key.expression) : body)
  })
  return POSE_KEYS.filter((field) => resolved.some((p) => p[field] !== REST_POSE[field])).map((field) => ({
    id: `${target}-${field}`,
    target,
    property: field,
    keyframes: keys.map((key, index) => ({
      time: key.time,
      value: resolved[index][field],
      ...(key.easing ? { easing: key.easing } : {}),
    })),
  }))
}
