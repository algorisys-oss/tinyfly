import type { CustomTarget } from '../adapters/canvas'
import type { EasingType, Track } from '../engine/types'
import type { Point } from '../adapters/canvas/sketch'
import type { FrameInfo } from '../headless/video-scene'
import type { BodyPlan, ChainSpec, Pose, Vec3 } from './rig/body-plan'
import { headPoint, solveSkeleton, type Skeleton, type SolvedHead } from './rig/skeleton'
import { reachPose as reachPlanPose } from './rig/reach'
import { createPen, type Look, type Pen, type PencilOptions } from './look/pen'
import { rubberLimb } from './look/curves'
import { drawFace, faceToScreen } from './head/face'
import { HUMAN_POSES, HUMAN_REST, humanPlan, type HumanPoseName } from './species/human'

/**
 * Characters (v2): any body plan, posed by numbers, turned in 3D, drawn flat
 * in a look (clean, pencil, silhouette) and a figure style (fluid, stick).
 *
 * The v1 stick figure (`stickFigureTarget`, `drawStickFigure`) is separate
 * and unchanged. See docs/character-system-m1.md.
 */

/** `stick`: the traditional (Pencilmation) stick figure. `fluid`: tapered limbs, hands, feet, shoulders. */
export type FigureStyle = 'fluid' | 'stick'

/**
 * Draws part of a character: clothes, hair, a prop. The context is in the
 * character's drawing space (feet at 0, 0), saved and restored around the
 * call. Draw with `pen` so it matches the look.
 */
export type CharacterLayer = (ctx: CanvasRenderingContext2D, joints: CharacterJoints, pen: Pen, time: number) => void

export interface CharacterLayers {
  /** Before anything (a shadow, a cape) */
  behind?: CharacterLayer
  /** Around a part ('leg.left', 'spine', 'neck', 'arm.right', 'head'…): drawn at that part's depth */
  parts?: Record<string, { under?: CharacterLayer; over?: CharacterLayer }>
  /** After everything (a prop in front) */
  front?: CharacterLayer
}

export interface CharacterOptions {
  /** Body plan (default: human, built from the options below) */
  plan?: BodyPlan
  figure?: FigureStyle
  look?: Look
  /** Feet to top of head, px (default 300) */
  height?: number
  /** `bold` (default): head 30% of the height, line 4.5%. `thin`: head 24%, line 2.2%, as the reference sheets */
  proportions?: 'bold' | 'thin'
  /** Head diameter, fraction of the height (overrides the proportions) */
  headSize?: number
  /** Line width, px (overrides the proportions) */
  lineWidth?: number
  /** Half the shoulder width, fraction of the height (fluid only; default 0.06) */
  shoulderWidth?: number
  /** Half the hip width, fraction of the height (fluid only; default 0.022) */
  hipWidth?: number
  /** Line colour (default slate, or graphite in pencil) */
  ink?: string
  /** Head fill; `none` leaves it see-through (default white, or none in pencil) */
  skin?: string
  /** Seed for the pencil's wobble, so two characters do not boil in step (default 1) */
  seed?: number
  pencil?: PencilOptions
  layers?: CharacterLayers
  /** 'ground' (default) rests the lowest contact point on the ground; 'none' leaves the figure where its pose puts it */
  contact?: 'ground' | 'none'
}

/** A character, with every option resolved. Plain data plus its plan. */
export interface Character {
  plan: BodyPlan
  figure: FigureStyle
  look: Look
  height: number
  lineWidth: number
  ink: string
  skin: string
  seed: number
  pencil: PencilOptions
  layers: CharacterLayers
  contact: 'ground' | 'none'
}

export function character(options: CharacterOptions = {}): Character {
  const bold = (options.proportions ?? 'bold') === 'bold'
  const figure = options.figure ?? 'fluid'
  const look = options.look ?? 'clean'
  const height = options.height ?? 300
  const stick = figure === 'stick'
  return {
    plan:
      options.plan ??
      humanPlan({
        headSize: options.headSize ?? (bold ? 0.3 : 0.24),
        shoulderWidth: stick ? 0 : (options.shoulderWidth ?? 0.06),
        hipWidth: stick ? 0 : (options.hipWidth ?? 0.022),
      }),
    figure,
    look,
    height,
    lineWidth: options.lineWidth ?? height * (bold ? 0.045 : 0.022),
    ink: options.ink ?? (look === 'pencil' ? '#2f2f33' : '#1e293b'),
    skin: options.skin ?? (look === 'pencil' ? 'none' : '#ffffff'),
    seed: options.seed ?? 1,
    pencil: options.pencil ?? {},
    layers: options.layers ?? {},
    contact: options.contact ?? 'ground',
  }
}

/** Where every part of a character is, as drawn, in its drawing space (feet at 0, 0; up is -y). */
export interface CharacterJoints {
  height: number
  lineWidth: number
  turn: number
  /** Named points: `hip`, `neck`, `shoulder.left`, `hand.right`, `knee.left`, `toe.right`… */
  points: Record<string, Point>
  /** Every chain's joints */
  chains: Record<string, Point[]>
  /** Every part's centre line as drawn, and its depth toward the viewer (px) */
  parts: Record<string, { points: Point[]; depth: number }>
  /** The head: centre, radii, screen angle and its own axes (use `pointOnHead`) */
  head: SolvedHead
  /** Screen y of the lowest contact point: the ground, 0 when standing */
  groundY: number
  /** Which named points rest on the ground (within 1% of the height) */
  grounded: Record<string, boolean>
}

/** A point on the head from head coordinates: x toward its left, y up, z forward (-1..1 of a radius). */
export function pointOnHead(head: SolvedHead, x: number, y: number, z: number): { point: Point; facing: number } {
  const { point, facing } = headPoint(head, [x, y, z])
  return { point, facing }
}

const isLimb = (chain: ChainSpec) => chain.rest[1] < -0.5
/** Elbows and knees are a little rounded in the fluid figure. */
const SOFT_JOINTS = 0.3

/** The centre line a part is drawn along. */
function partLine(character: Character, chain: ChainSpec, points: Point[]): Point[] {
  if (character.figure === 'stick') return isLimb(chain) ? points.slice(0, 3) : points
  if (isLimb(chain) && points.length >= 3) return rubberLimb(points[0], points[1], points[2], SOFT_JOINTS)
  if (points.length === 3) return rubberLimb(points[0], points[1], points[2], 1)
  return points
}

interface Solved {
  skeleton: Skeleton
  joints: CharacterJoints
  /** Parts far to near */
  order: string[]
}

function solve(character: Character, pose: Pose): Solved {
  const full = character.plan.id === 'human' ? { ...HUMAN_REST, ...pose } : pose
  const skeleton = solveSkeleton(character.plan, full, { height: character.height, contact: character.contact })
  const chains: Record<string, Point[]> = {}
  const parts: CharacterJoints['parts'] = {}
  const keys: Record<string, number> = {}
  const tie = 0.01 * character.height
  character.plan.chains.forEach((chain) => {
    const solved = skeleton.chains[chain.id]
    chains[chain.id] = solved.points
    const depth = solved.depths.reduce((sum, d) => sum + d, 0) / solved.depths.length
    // A part's depth for ordering is measured from where it hangs, so leaning
    // or bending the body never reorders it; small differences are ties.
    const parent = chain.parent ? skeleton.chains[chain.parent] : undefined
    const anchor = parent ? parent.depths[chain.at ?? parent.depths.length - 1] : 0
    const key = depth - anchor
    keys[chain.id] = Math.abs(key) < tie ? 0 : key
    parts[chain.id] = { points: partLine(character, chain, solved.points), depth }
  })
  parts.head = { points: [skeleton.head.center], depth: skeleton.head.depth }
  keys.head = 0
  const planOrder = [...character.plan.chains.map((c) => c.id), 'head']
  const order = [...planOrder].sort((a, b) => keys[a] - keys[b] || planOrder.indexOf(a) - planOrder.indexOf(b))

  const points: Record<string, Point> = { hip: skeleton.hip }
  for (const [name, [chainId, joint]] of Object.entries(character.plan.landmarks ?? {})) {
    const chainPoints = skeleton.chains[chainId]?.points
    if (chainPoints) points[name] = chainPoints[Math.min(joint, chainPoints.length - 1)]
  }
  const grounded: Record<string, boolean> = {}
  for (const [name, point] of Object.entries(points)) grounded[name] = point.y >= skeleton.groundY - 0.01 * character.height
  const joints: CharacterJoints = {
    height: character.height,
    lineWidth: character.lineWidth,
    turn: full.turn ?? 0,
    points,
    chains,
    parts,
    head: skeleton.head,
    groundY: skeleton.groundY,
    grounded,
  }
  return { skeleton, joints, order }
}

/** Where every part of a character is for a pose, as `drawCharacter` would draw it. */
export function characterJoints(character: Character, pose: Pose): CharacterJoints {
  return solve(character, pose).joints
}

/** Faint construction guides under a pencil figure: the head's circle and centre lines, the spine, the joints. */
function drawConstruction(pen: Pen, character: Character, joints: CharacterJoints) {
  const { head } = joints
  pen.guideEllipse(head.center.x, head.center.y, head.rx * 1.03, head.ry * 1.03, head.angle)
  // The face's centre line and eye line, where the face is: they turn with the head.
  const vertical = Array.from({ length: 13 }, (_, i) => ({ x: 0, y: -0.95 + (1.9 * i) / 12 }))
  const across = Array.from({ length: 13 }, (_, i) => ({ x: -0.95 + (1.9 * i) / 12, y: 0.12 }))
  const centreLine = faceToScreen(head, vertical, { x: 0, y: 0 })
  if (centreLine.facing > 0) pen.guide(centreLine.points)
  pen.guide(faceToScreen(head, across, { x: 0, y: 0.12 }).points)
  pen.guide(joints.chains.spine ?? [])
  const r = character.lineWidth * 0.9
  for (const name of ['shoulder.left', 'shoulder.right', 'elbow.left', 'elbow.right', 'hip.left', 'hip.right', 'knee.left', 'knee.right']) {
    const p = joints.points[name]
    if (p) pen.guideEllipse(p.x, p.y, r, r, 0)
  }
}

function drawPart(pen: Pen, character: Character, joints: CharacterJoints, id: string, pose: Pose) {
  const lw = character.lineWidth
  if (id === 'head') {
    const { head } = joints
    const fill = character.skin === 'none' ? null : character.skin
    pen.ellipse(head.center.x, head.center.y, head.rx, head.ry, head.angle, fill, lw)
    if (pen.look !== 'silhouette') drawFace(pen, head, pose, lw)
    return
  }
  const chain = character.plan.chains.find((c) => c.id === id)!
  const points = joints.chains[id]
  const line = joints.parts[id].points
  if (character.figure === 'stick') {
    // The traditional figure: even lines; the neck continues the spine.
    if (id === 'neck') return
    const drawn = id === 'spine' ? [...points, ...(joints.chains.neck?.slice(1) ?? [])] : line
    pen.line(drawn, lw)
    return
  }
  const widths = (from: number, to: number) => [chain.bones[from].width[0] * lw, chain.bones[to].width[1] * lw] as const
  if (isLimb(chain)) {
    const [from, to] = widths(0, 1)
    pen.limb(line, from, to)
    if (chain.bones.length >= 3) {
      // A foot: from the ankle to the toes.
      pen.limb([points[2], points[3]], chain.bones[2].width[0] * lw, chain.bones[2].width[1] * lw)
    } else {
      const hand = points[points.length - 1]
      pen.dot(hand.x, hand.y, lw * 0.62)
    }
    return
  }
  if (id === 'spine') {
    // Hips, the spine, and rounded shoulders over the top of it.
    const hipLeft = joints.points['hip.left']
    const hipRight = joints.points['hip.right']
    if (hipLeft && hipRight && Math.hypot(hipLeft.x - hipRight.x, hipLeft.y - hipRight.y) > 0.5) pen.limb([hipLeft, hipRight], lw * 1.3, lw * 1.3)
    const [from, to] = widths(0, chain.bones.length - 1)
    pen.limb(line, from, to)
    const left = joints.points['shoulder.left']
    const right = joints.points['shoulder.right']
    if (left && right && Math.hypot(left.x - right.x, left.y - right.y) > 0.5) {
      pen.limb(rubberLimb(left, points[points.length - 1], right, 1, 10), lw * 1.15, lw * 1.15)
    }
    return
  }
  const [from, to] = widths(0, chain.bones.length - 1)
  pen.limb(line, from, to)
}

/**
 * Draw a character in a pose with its feet at (0, 0). `time` (ms) picks the
 * pencil's boil frame and is passed to layer hooks.
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, character: Character, pose: Pose, time = 0): void {
  const full = character.plan.id === 'human' ? { ...HUMAN_REST, ...pose } : pose
  const { joints, order } = solve(character, full)
  const pen = createPen(ctx, {
    look: character.look,
    ink: character.ink,
    lineWidth: character.lineWidth,
    seed: character.seed,
    time,
    pencil: character.pencil,
  })
  const hook = (layer?: CharacterLayer) => {
    if (!layer) return
    ctx.save()
    layer(ctx, joints, pen, time)
    ctx.restore()
  }
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (character.look === 'pencil' && character.pencil.construction !== false) drawConstruction(pen, character, joints)
  hook(character.layers.behind)
  for (const id of order) {
    const layers = character.layers.parts?.[id]
    hook(layers?.under)
    drawPart(pen, character, joints, id, full)
    hook(layers?.over)
  }
  hook(character.layers.front)
  ctx.restore()
}

/** A full blend of two poses: `t` 0 is `from`, 1 is `to`. Fields in only one keep its value. */
export function mixPoses(from: Pose, to: Pose, t: number): Pose {
  const out: Pose = { ...from }
  for (const [key, value] of Object.entries(to)) {
    const start = from[key] ?? value
    out[key] = start + (value - start) * t
  }
  return out
}

/**
 * The pose with a limb reaching for `target`: a point in the character's own
 * 3D space (px; +x its left, +y up from the ground under its hips, +z forward),
 * or a point in its drawing space with a `depth` toward the viewer.
 */
export function reachCharacter(
  character: Character,
  pose: Pose,
  chain: string,
  target: Vec3 | { x: number; y: number; depth?: number }
): Pose {
  const full = character.plan.id === 'human' ? { ...HUMAN_REST, ...pose } : pose
  let point: Vec3
  if (Array.isArray(target)) {
    point = target
  } else {
    // From the drawing space back to the character's: undo the placing, the roll and the turn.
    const { skeleton } = solve(character, full)
    const unplaced = solveSkeleton(character.plan, { ...full, roll: 0 }, { height: character.height, contact: 'none' })
    const roll = ((full.roll ?? 0) * Math.PI) / 180
    const dx = target.x - skeleton.hip.x
    const dy = target.y - skeleton.hip.y
    const x = unplaced.hip.x + dx * Math.cos(-roll) - dy * Math.sin(-roll)
    const y = unplaced.hip.y + dx * Math.sin(-roll) + dy * Math.cos(-roll)
    const view = (Math.PI / 2) * (full.turn ?? 0)
    const depth = target.depth ?? skeleton.chains[chain].depths[skeleton.chains[chain].depths.length - 1]
    // The view turned the character by `view` about the vertical; turn back.
    const c = Math.cos(view)
    const s = Math.sin(view)
    point = [x * c - depth * s, -y, x * s + depth * c]
  }
  return reachPlanPose(character.plan, full, chain, point, { height: character.height })
}

export interface CharacterTargetOptions {
  /** Where the feet stand */
  x: number
  y: number
  character: Character
  /** Starting pose (default rest) */
  pose?: Pose
}

/** A `custom` target made by {@link characterTarget}. */
export interface CharacterTarget extends CustomTarget {
  readonly character: Character
}

/**
 * A `custom` canvas target that draws a character. Every pose field is a
 * prop, so timeline tracks pose, turn and roll it. `x`/`y` are the feet.
 */
export function characterTarget(options: CharacterTargetOptions): CharacterTarget {
  const { character: who } = options
  const width = who.height * 0.8
  const height = who.height
  const rest = who.plan.id === 'human' ? HUMAN_REST : {}
  return {
    type: 'custom',
    x: options.x - width / 2,
    y: options.y - height,
    width,
    height,
    props: { ...rest, ...options.pose },
    character: who,
    draw(ctx, target, time) {
      ctx.translate(width / 2, height)
      drawCharacter(ctx, who, target.props as Pose, time)
    },
  }
}

/** Joints moved from a character's drawing space to a scene where its feet stand at (x, y). */
export function jointsInScene(joints: CharacterJoints, x: number, y: number): CharacterJoints {
  const move = (p: Point): Point => ({ x: p.x + x, y: p.y + y })
  const moveAll = <T extends Record<string, Point[]>>(record: T) =>
    Object.fromEntries(Object.entries(record).map(([key, points]) => [key, points.map(move)])) as T
  return {
    ...joints,
    points: Object.fromEntries(Object.entries(joints.points).map(([key, p]) => [key, move(p)])),
    chains: moveAll(joints.chains),
    parts: Object.fromEntries(Object.entries(joints.parts).map(([key, part]) => [key, { ...part, points: part.points.map(move) }])),
    head: { ...joints.head, center: move(joints.head.center) },
    groundY: joints.groundY + y,
  }
}

/**
 * A character target's pose and scene-space joints in a frame, for
 * immediate-mode drawing that follows it. `id` is its key in the scene's
 * `targets`. Its `x`/`y` tracks are followed; `rotate`/`scale` on the target
 * itself are not.
 */
export function characterAt(target: CustomTarget, frame: Pick<FrameInfo, 'time' | 'state'>, id: string): { pose: Pose; joints: CharacterJoints } {
  const who = (target as Partial<CharacterTarget>).character
  if (!who) throw new Error('characterAt: the target was not made by characterTarget')
  const pose = { ...(target.props as Pose) }
  let dx = 0
  let dy = 0
  for (const [property, value] of frame.state?.values.get(id) ?? []) {
    if (typeof value !== 'number') continue
    if (property === 'x' || property === 'motionPathX') dx = value
    else if (property === 'y' || property === 'motionPathY') dy = value
    else if (property in pose) pose[property] = value
  }
  const joints = characterJoints(who, pose)
  return { pose, joints: jointsInScene(joints, target.x + dx + target.width / 2, target.y + dy + target.height) }
}

export interface CharacterPoseKey {
  time: number
  /** A named pose, or fields that change from the previous key (default: no change) */
  pose?: HumanPoseName | Pose
  /** Easing into this key */
  easing?: EasingType
}

/**
 * Keyframe tracks that move a character target through a sequence of poses.
 * Each key is a named pose or changes from the previous key (the first builds
 * on rest). Only fields that leave rest in some key get a track, so the JSON
 * stays small and the timeline shows only what moves.
 */
export function characterPoseTracks(target: string, keys: CharacterPoseKey[], rest: Pose = HUMAN_REST): Track[] {
  const resolved: Pose[] = []
  keys.forEach((key, index) => {
    const previous = index === 0 ? rest : resolved[index - 1]
    const named = typeof key.pose === 'string' ? HUMAN_POSES[key.pose] : undefined
    // A named pose keeps the view (turn) of the key before it, unless it sets one.
    resolved.push(named ? { ...named, turn: previous.turn ?? 0 } : { ...previous, ...(key.pose as Pose | undefined) })
  })
  const fields = Object.keys(rest).filter((field) => resolved.some((pose) => (pose[field] ?? rest[field]) !== rest[field]))
  return fields.map((field) => ({
    id: `${target}-${field}`,
    target,
    property: field,
    keyframes: keys.map((key, index) => ({
      time: key.time,
      value: resolved[index][field] ?? rest[field],
      ...(key.easing ? { easing: key.easing } : {}),
    })),
  }))
}
