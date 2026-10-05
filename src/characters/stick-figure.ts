import type { CustomTarget } from '../adapters/canvas'
import type { FrameInfo } from '../headless/video-scene'
import type { EasingType, Track } from '../engine/types'
import { sketchPen, type Point, type SketchPen, type SketchStyle } from '../adapters/canvas/sketch'
import { taperedLine } from './look/tapered-line'
import { rubberLimb } from './look/curves'
import { drawCartoonHand } from './hands/draw-cartoon-hand'
import { HAND_REST, mixHandPoses, type HandPose } from './hands/hand-rig'

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
  /**
   * Wrist bend, degrees, added to the forearm's angle like the elbow is to the
   * upper arm's. It turns `handAngle` (props, cartoon hands) and the hands
   * drawn by `style.hands`; a dot hand looks the same at any angle.
   */
  leftWrist: number
  rightWrist: number
  /**
   * Ankle, degrees: positive points the toe down (onto tiptoe, which lifts the
   * body), negative flexes it up onto the heel. Not drawn in the classic look.
   */
  leftAnkle: number
  rightAnkle: number
  /**
   * Foot turn-out seen from the front: 0 the natural splay, positive turns the
   * toes further out (1 fully sideways), negative turns them in. Swivelling
   * feet (the twist, a Charleston) animate this.
   */
  leftFootOut: number
  rightFootOut: number
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
  /**
   * Squash and stretch: 1 normal, above 1 taller (a jump), below 1 squashed (a landing).
   * The body and legs scale by it, the arms by its square root, and the head
   * becomes an ellipse of the same area.
   */
  stretch: number
  /**
   * How far the figure turns toward the way it faces: 0 front-on, 1 in
   * profile. The face slides toward the facing side and narrows, and
   * shoulders (with a `shoulderWidth`) close up. Turn walkers toward where they go.
   */
  turn: number
  /**
   * 0 standing, 1 seated: the thighs swing forward to level, the shins hang
   * straight down, and the hips drop to {@link seatHeight} above the feet. From
   * 0.25 on, the lower foot rests on the ground.
   */
  sit: number
  /**
   * The whole body turned about the hips, degrees: positive rolls forward (the
   * way the figure faces, a front flip), negative backward. Seen front-on
   * (`turn` 0) it is a cartwheel. 360 is a full turn.
   */
  spin: number
  /** Lift off the ground, as a fraction of the height: the arc of a jump or a flip */
  rise: number
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
  leftWrist: 0,
  rightWrist: 0,
  leftAnkle: 0,
  rightAnkle: 0,
  leftFootOut: 0,
  rightFootOut: 0,
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
  stretch: 1,
  turn: 0,
  sit: 0,
  spin: 0,
  rise: 0,
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
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: pose({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: pose({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: pose({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...EXPRESSIONS.joyful }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: pose({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...EXPRESSIONS.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: pose({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...EXPRESSIONS.happy }),
} satisfies Record<string, StickPose>

export type PoseName = keyof typeof POSES

const POSE_KEYS = Object.keys(REST_POSE) as (keyof StickPose)[]

/** Linear blend: `t` 0 is `from`, 1 is `to`. */
export function blendPose(from: StickPose, to: StickPose, t: number): StickPose {
  const out = { ...from }
  for (const key of POSE_KEYS) out[key] = from[key] + (to[key] - from[key]) * t
  return out
}

/** Thigh swing either side of vertical while walking, degrees. */
const WALK_HIP_SWING = 24

/** Forward lean while walking, degrees per unit stride. */
const WALK_LEAN = 4

/** How far a forearm bends forward at the front of its swing, degrees. */
const WALK_ELBOW = 28

/** Arms raised further than this (degrees) keep their pose while walking. */
const SWINGING_ARM_LIMIT = 40

/**
 * A walking stride at `phase` (in strides: 0 → 1 is one full cycle), built on
 * `base`: the legs walk, hanging arms swing, and raised arms (a wave, a point)
 * and the face keep `base`'s pose. `stride` scales the swing.
 *
 * Limb angles are measured outward from each side, so the same angle moves the
 * left limb one way on screen and the right limb the other. Giving both hips the
 * same angle therefore puts one foot forward (+x, the way the figure faces) and
 * the other back, evenly about the vertical, which is what a stride looks like.
 */
export function walkPose(phase: number, base: StickPose = REST_POSE, stride = 1): StickPose {
  const swing = Math.sin(phase * Math.PI * 2) * stride
  const lift = Math.cos(phase * Math.PI * 2) * stride
  const swings = (shoulder: number) => shoulder <= SWINGING_ARM_LIMIT
  const armSwing = (shoulder: number) => (swings(shoulder) ? 22 * swing : shoulder)
  // A swinging arm's forearm follows through as it comes forward. Forward (+x) is a
  // negative angle for the left arm and a positive one for the right.
  const leftElbow = swings(base.leftShoulder) ? base.leftElbow - WALK_ELBOW * Math.max(0, -swing) : base.leftElbow
  const rightElbow = swings(base.rightShoulder) ? base.rightElbow + WALK_ELBOW * Math.max(0, swing) : base.rightElbow
  return {
    ...base,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: base.lean + WALK_LEAN * stride,
    headTilt: base.headTilt - WALK_LEAN * 0.5 * stride,
    leftElbow,
    rightElbow,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -WALK_HIP_SWING * swing,
    rightHip: -WALK_HIP_SWING * swing,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, lift),
    rightKnee: 30 * Math.max(0, -lift),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: armSwing(base.leftShoulder),
    rightShoulder: armSwing(base.rightShoulder),
  }
}

/**
 * Ground covered by one full walk cycle (two steps) for a figure `height` px
 * tall: each step the foot sweeps from one side of the hip to the other.
 * Set the walk phase to distance / strideLength so the feet stay planted.
 */
export function strideLength(height: number, stride = 1): number {
  const leg = (THIGH + SHIN) * height
  return 4 * leg * Math.sin((WALK_HIP_SWING * stride * Math.PI) / 180)
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
  /**
   * Head diameter as a fraction of the height (default 0.24). A bigger head
   * takes its room from the torso: the feet and hips stay where they are.
   */
  headSize?: number
  /** Head fill; `none` leaves it see-through (default white) */
  headFill?: string
  /** 1 faces right, -1 faces left: mirrors the figure and turns the eyes */
  facing?: number
  /** Name tag drawn over the head */
  label?: string
  /** Name tag font (default bold, 11% of the height, sans-serif) */
  labelFont?: string
  /** Draw in hand-drawn pencil strokes that boil (see `sketchPen`); omit for clean lines */
  sketch?: SketchStyle
  /** Limbs: 0 straight segments jointed at elbows and knees (default), 1 smooth rubber-hose curves */
  rubber?: number
  /**
   * Half the shoulder width, as a fraction of the height (default 0: both arms
   * come from one point on the spine). The shoulders sit either side of the
   * spine and square to it, so they tilt with `lean`; a line joins them.
   */
  shoulderWidth?: number
  /**
   * The 0.75 look: even straight-stroked lines, sharp elbows and knees, no
   * hands or feet, and the hips held at a fixed height (feet can float off the
   * ground mid-stride). Off by default: limbs taper, elbows and knees are
   * always a little rounded (as `rubber` 0.3), hands and feet are drawn, the
   * lower foot always rests on the ground (so a walk bobs), and the body leans
   * into sitting down and standing up.
   */
  classic?: boolean
  /** Drawing hooks that put costumes, hair and props inside the figure's z-order */
  layers?: FigureLayers
  /**
   * Cartoon hands in place of the round dot hands (not in the classic look):
   * posed hands with fingers, pointing along the forearm turned by the wrist.
   */
  hands?: StickHands
}

/** Cartoon hands for a stick figure: a {@link HandPose} per hand, and how they look. */
export interface StickHands {
  /** Hand poses (default relaxed): see `HAND_SHAPES` */
  left?: HandPose
  right?: HandPose
  /** Skin fill (default the head fill, or a warm tan when the head is see-through) */
  skin?: string
  /** Wrist to fingertip, as a fraction of the figure's height (default 0.075) */
  size?: number
  /** `5` (default) or `4`: a thumb and three, the classic cartoon glove */
  fingers?: 4 | 5
  /** 1 a natural hand (default); 1.5 a fat cartoon glove */
  plump?: number
}

export type StickSide = 'left' | 'right'

/**
 * Draws part of a figure: a costume, hair, a held prop. The context is in the
 * figure's own space (feet at 0, 0, not mirrored), saved and restored around
 * the call, with the figure's line colour and width set. `joints` are already
 * mirrored for facing, so the hook draws at them directly. `pen` is given when
 * the figure is sketched, so a costume boils with the line work; it is not the
 * figure's own pen, so adding a costume does not change how the figure wobbles.
 */
export type FigureLayer = (ctx: CanvasRenderingContext2D, joints: StickJoints, time: number, pen?: SketchPen) => void

/** A {@link FigureLayer} for one arm's sleeve. */
export type SleeveLayer = (
  ctx: CanvasRenderingContext2D,
  joints: StickJoints,
  side: StickSide,
  time: number,
  pen?: SketchPen
) => void

/**
 * Hooks called while a figure draws, so what they draw sits at the right depth.
 * The order is:
 *
 * behind → legs → torso → body → back arm → sleeve(back) → front arm →
 * sleeve(front) → behindHead → head and face → overHead → front → label
 *
 * The left arm is always the back arm, drawn first. The figure faces the
 * viewer and is mirrored as a whole for `facing`, so its left side is always
 * the one away from the way it looks. Turned more than a quarter of the way
 * (`turn` above 0.25), the back arm and its sleeve move behind the body:
 *
 * behind → legs → back arm → sleeve(back) → torso → body → front arm → …
 */
export interface FigureLayers {
  /** Before anything: long hair at the back, a cape, a shadow */
  behind?: FigureLayer
  /** After the legs and torso, before the arms: a shirt, kurta, sari or trousers */
  body?: FigureLayer
  /** Right after each arm, so each arm comes out of its own sleeve */
  sleeve?: SleeveLayer
  /** After the arms, before the head: a bun, the root of a ponytail */
  behindHead?: FigureLayer
  /** After the head and face: a hair cap, turban, crown, glasses, moustache */
  overHead?: FigureLayer
  /** Last, before the label: a held prop in front of everything */
  front?: FigureLayer
}

/** The head as drawn: an ellipse, turned with the lean and head tilt. */
export interface StickHead {
  center: Point
  /** Radii across and along the head (they differ when the figure stretches) */
  rx: number
  ry: number
  /** Rotation of the head, radians, as seen on screen (lean + head tilt, mirrored for facing) */
  angle: number
  /**
   * Face features in head units, for {@link headPoint}: 0 is the centre, -1
   * the top, 1 the bottom. Hair fringes sit above `browTopY`, a moustache
   * between `eyeY` and `mouthY`.
   */
  eyeY: number
  /** The highest point of either brow for this pose (brows rise with surprise) */
  browTopY: number
  mouthY: number
  /** Across the head, where the face is centred: it sits toward the facing side */
  faceX: number
}

/**
 * Where every part of a figure is, as {@link drawStickFigure} draws it. Points
 * are in the figure's space (feet at 0, 0, up is -y) and already mirrored for
 * facing, so no `ctx.scale(-1, 1)` is needed to draw at them (that would mirror
 * text too). Use {@link jointsToScene} to move them to where the feet stand.
 */
export interface StickJoints {
  facing: 1 | -1
  /** The style's height */
  height: number
  /** Squash and stretch as drawn (clamped to 0.3..3) */
  stretch: number
  lineWidth: number
  /** The pelvis: legs hang from it and the body leans about it */
  hip: Point
  /** Top of the spine, after the lean */
  neck: Point
  /** Where the arms start: one point when `shoulderWidth` is 0 */
  shoulders: Record<StickSide, Point>
  elbows: Record<StickSide, Point>
  /** The wrists: where the forearms end and the hands begin */
  hands: Record<StickSide, Point>
  /** Where each hand reaches to past its wrist, turned by the wrist bend */
  fingertips: Record<StickSide, Point>
  knees: Record<StickSide, Point>
  feet: Record<StickSide, Point>
  /** Tips of the feet, pointing the way the figure faces (the ankles, in the classic look) */
  toes: Record<StickSide, Point>
  /** The lower foot's y: where the ground is under a figure standing, walking or sitting */
  feetY: number
  /** Which feet are on the ground: within 1% of the height of the lower foot */
  grounded: Record<StickSide, boolean>
  /**
   * Direction the hand points, radians: the forearm (along its curve for rubber
   * hose) turned by the wrist bend. For holding props.
   */
  handAngle: Record<StickSide, number>
  /** Each limb as the polyline that is stroked (rubber-hose curves included), for sleeves and trousers */
  limbs: { leftArm: Point[]; rightArm: Point[]; leftLeg: Point[]; rightLeg: Point[]; spine: Point[] }
  head: StickHead
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

/** Face layout in head units (radius 1), shared by the face drawing and {@link StickHead}. */
const FACE_X = 0.12
/** Heaviest face line, as a fraction of the head radius (the default brush stays under it) */
const FACE_LINE_MAX = 0.14
/** How far the face slides toward the facing side in profile (`turn` 1) */
const PROFILE_SHIFT = 0.33
/** How much `turn` closes up the back eye, the front eye and the mouth */
const BACK_EYE_SQUEEZE = 0.7
const FRONT_EYE_SQUEEZE = 0.3
const MOUTH_SQUEEZE = 0.35

/** Organic look: line widths (× the line width) at each end, and the feet and hands. */
const TORSO_WIDTH = [1.7, 1.05]
const ARM_WIDTH = [1.3, 0.75]
const LEG_WIDTH = [1.45, 0.85]
const FOOT_WIDTH = [1.15, 0.75]
const FOOT = 0.06
/** Seen from the front, how far each foot turns out to its own side (it points partly at the viewer, so it looks shorter) */
const FOOT_SPLAY = 0.7
const HAND_RADIUS = 0.65
/** Wrist to fingertip, as a fraction of the height (also the size of `style.hands`) */
const HAND_LENGTH = 0.075
/** Organic look: elbows and knees are always rounded at least this much (as `rubber`) */
const SOFT_JOINTS = 0.3
/** How far the back bows (fraction of the height) when turned in profile, and when seated */
const SPINE_BOW_TURNED = 0.02
const SPINE_BOW_SEATED = 0.012
/** Forward lean (degrees) half way through sitting down or standing up */
const SIT_LEAN = 12

/** Turned further than this (`turn`), the back arm is drawn behind the body and its clothes */
const BACK_ARM_BEHIND_TURN = 0.25

/** Seated leg angles (degrees): thighs level and forward, shins straight down. */
const SIT_THIGH = 90
/** From this `sit` on, the hips are low enough that the lower foot touches the ground. */
const SIT_PLANTED = 0.25
/** Risen this far (fraction of the height), the feet are no longer planted. */
const AIRBORNE_RISE = 0.04
/** A foot this close (fraction of the height) to the lower foot counts as grounded. */
const GROUND_TOLERANCE = 0.01

/** Clamp to 0..1; a pose written before the field existed leaves it undefined (0). */
const unit = (value: number | undefined) => Math.min(1, Math.max(0, value ?? 0))

/**
 * Height of the hips above the feet when a figure `height` px tall is fully
 * seated (`sit` 1): put the top of a bench, log or charpai here.
 */
export function seatHeight(height: number, stretch = 1): number {
  return SHIN * height * stretch
}
const EYE_Y = -0.12
const MOUTH_Y = 0.4

const rad = (degrees: number) => (degrees * Math.PI) / 180

/** Unit vector for a limb at `angle` degrees from down, spreading to `side` (-1 left, 1 right). */
const limb = (angle: number, side: number) => ({ x: side * Math.sin(rad(angle)), y: Math.cos(rad(angle)) })

/** How open an eye is drawn: its openness, closed further by a blink. */
const eyeOpenness = (eye: number, blink: number) => Math.max(0, eye) * (1 - Math.min(1, Math.max(0, blink)))

/** Height of a brow's outer end over an eye at `eyeY`: raised by `brow`, and by eyes opened wide. */
const browHeight = (eyeY: number, r: number, brow: number, open: number) =>
  eyeY - 0.3 * r - brow * 0.14 * r - Math.max(0, open - 1) * 0.12 * r

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
  // Face lines are lighter than the body's, and capped by the head's size so a
  // thick brush does not blot out the eyes and brows.
  const thin = Math.max(1, Math.min(lineWidth * 0.6, FACE_LINE_MAX * r))
  // Eyes sit a little toward the facing side, and the pupils follow lookX/lookY.
  const turn = unit(figure.turn)
  const look = (FACE_X + PROFILE_SHIFT * turn) * r
  const eyeY = cy + EYE_Y * r
  const pupilX = look + figure.lookX * 0.08 * r
  const pupilY = figure.lookY * 0.07 * r
  const eyes = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * r * (1 - BACK_EYE_SQUEEZE * turn), squeeze: 1 - BACK_EYE_SQUEEZE * turn, open: figure.leftEye, brow: figure.leftBrow, side: -1 },
    { x: 0.34 * r * (1 - FRONT_EYE_SQUEEZE * turn), squeeze: 1 - FRONT_EYE_SQUEEZE * turn, open: figure.rightEye, brow: figure.rightBrow, side: 1 },
  ]

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = thin
  for (const eye of eyes) {
    const open = eyeOpenness(eye.open, figure.blink)
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
    const browY = browHeight(eyeY, r, eye.brow, open)
    const inner = eye.x + look - eye.side * 0.13 * r * eye.squeeze
    const outer = eye.x + look + eye.side * 0.13 * r * eye.squeeze
    ctx.beginPath()
    ctx.moveTo(outer, browY)
    ctx.lineTo(inner, browY - figure.browTilt * 0.1 * r)
    ctx.stroke()
  }

  // Mouth: closed is a curve; open is an O, a grin (flat top) or a wail (flat bottom).
  const mouthY = cy + MOUTH_Y * r
  const w = 0.25 * r * Math.max(0.3, figure.mouthWidth) * (1 - MOUTH_SQUEEZE * turn)
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

export { rubberLimb } from './look/curves'


/** A two-part limb: from its root through the elbow or knee to the hand or foot. */
interface Bones {
  root: Point
  joint: Point
  end: Point
}

/**
 * A figure's geometry in the frames it is drawn in: the legs in the mirrored
 * frame, the torso and arms in the frame leaned about the hips, the head about
 * the neck. Drawing and {@link stickFigureJoints} both start from this, so the
 * joints are always where the lines are.
 */
interface Rig {
  height: number
  facing: 1 | -1
  stretch: number
  lineWidth: number
  rubber: number
  /** Head radius at rest, and the radii it squashes and stretches to */
  r: number
  headRx: number
  headRy: number
  hipY: number
  neckY: number
  /** How far sitting (or, outside the classic look, planting the feet) lowers the body, px */
  drop: number
  /** Upper-body lean as drawn, degrees: the pose's, plus the lean into sitting */
  lean: number
  classic: boolean
  legs: Record<StickSide, Bones>
  arms: Record<StickSide, Bones>
  /** Foot tips; the ankles in the classic look */
  toes: Record<StickSide, Point>
  /** Where each hand points to from its wrist: along the forearm, turned by the wrist */
  handTips: Record<StickSide, Point>
  /** Hip to neck, as drawn: straight, or bowed when turned or seated */
  spine: Point[]
}

function rigFigure(figure: StickPose, style: StickStyle): Rig {
  const h = style.height ?? 300
  // Poses written before `stretch` existed leave it undefined.
  const stretch = Math.min(3, Math.max(0.3, figure.stretch ?? 1))
  const armStretch = Math.sqrt(stretch)
  // A bigger head takes its height from the body: the neck sits lower, the hips stay put.
  const head = (style.headSize ?? 2 * HEAD) / 2
  const neck = style.headSize === undefined ? NECK : 1 - 2 * head
  const r = head * h
  const sit = unit(figure.sit)
  // Sitting swings the legs toward the seated angles (forward is +x in the mirrored frame).
  const leftHip = figure.leftHip + (-SIT_THIGH - figure.leftHip) * sit
  const leftKnee = figure.leftKnee + (-SIT_THIGH - figure.leftKnee) * sit
  const rightHip = figure.rightHip + (SIT_THIGH - figure.rightHip) * sit
  const rightKnee = figure.rightKnee + (SIT_THIGH - figure.rightKnee) * sit
  const classic = style.classic === true
  // Seen from the front the feet turn out, each to its own side (and look
  // shorter, pointing partly at the viewer); turning toward profile swings both
  // round to the way the figure faces. They tip with the shin (by half its
  // angle), so a trailing foot rolls onto its toe and a swinging one clears the
  // ground; the ankle points the toe further down (tiptoe) or flexes it up.
  const turn = unit(figure.turn)
  const footOffset = (side: number, hipAngle: number, knee: number, ankle: number, out: number) => {
    const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(rad(hipAngle - knee) / 2) + rad(ankle)))
    const splay = Math.max(-1, Math.min(1, FOOT_SPLAY + out))
    const across = turn + (1 - turn) * side * splay
    return classic ? { x: 0, y: 0 } : { x: Math.cos(pitch) * FOOT * across, y: Math.sin(pitch) * FOOT }
  }
  // Poses written before the wrists, ankles and turn-out existed leave them undefined.
  const ankles = { left: figure.leftAnkle ?? 0, right: figure.rightAnkle ?? 0 }
  const outs = { left: figure.leftFootOut ?? 0, right: figure.rightFootOut ?? 0 }
  // …and lowers the hips until the lower foot rests on the ground: while
  // sitting, or always outside the classic look (so a walk bobs).
  let drop = 0
  if (sit > 0 || !classic) {
    // A toe pointed down reaches lower than the ankle; a flexed one does not.
    const reach = (side: number, hipAngle: number, knee: number, ankle: number, out: number) =>
      THIGH * Math.cos(rad(hipAngle)) +
      SHIN * Math.cos(rad(hipAngle - knee)) +
      Math.max(0, footOffset(side, hipAngle, knee, ankle, out).y)
    const legHeight = Math.max(
      reach(-1, leftHip, leftKnee, ankles.left, outs.left),
      reach(1, rightHip, rightKnee, ankles.right, outs.right)
    )
    // Off the ground (`rise`), the feet stop being planted, so the hips keep
    // their height while the legs tuck: the plant lets go over the first few
    // percent of the rise, so leaving the ground is smooth.
    const grounded = 1 - unit((figure.rise ?? 0) / AIRBORNE_RISE)
    const plant = (classic ? Math.min(1, sit / SIT_PLANTED) : 1) * grounded
    drop = (HIP - legHeight) * plant * h * stretch
  }
  const hipY = -HIP * h * stretch + drop
  const neckY = -neck * h * stretch + drop
  const bow = classic ? 0 : (SPINE_BOW_TURNED * unit(figure.turn) + SPINE_BOW_SEATED * sit) * h * stretch
  const spine =
    bow === 0
      ? [{ x: 0, y: hipY }, { x: 0, y: neckY }]
      : rubberLimb({ x: 0, y: hipY }, { x: -bow, y: (hipY + neckY) / 2 }, { x: 0, y: neckY }, 1, 8)
  const shoulderY = neckY + SHOULDER_DROP * h * stretch
  // Turning toward profile brings the shoulders together.
  const shoulderX = (style.shoulderWidth ?? 0) * h * Math.cos((turn * Math.PI) / 2)

  const segment = (x: number, y: number, angle: number, side: number, length: number) => {
    const d = limb(angle, side)
    return { x: x + d.x * length * h, y: y + d.y * length * h }
  }
  // Legs hang from the hips and do not lean.
  const leg = (side: number, hipAngle: number, knee: number): Bones => {
    const joint = segment(0, hipY, hipAngle, side, THIGH * stretch)
    return { root: { x: 0, y: hipY }, joint, end: segment(joint.x, joint.y, hipAngle - knee, side, SHIN * stretch) }
  }
  const arm = (side: number, shoulder: number, elbow: number): Bones => {
    const root = { x: side * shoulderX, y: shoulderY }
    const joint = segment(root.x, root.y, shoulder, side, UPPER_ARM * armStretch)
    return { root, joint, end: segment(joint.x, joint.y, shoulder + elbow, side, FOREARM * armStretch) }
  }

  const legs = { left: leg(-1, leftHip, leftKnee), right: leg(1, rightHip, rightKnee) }
  const toe = (side: number, bones: Bones, hipAngle: number, knee: number, ankle: number, out: number): Point => {
    const offset = footOffset(side, hipAngle, knee, ankle, out)
    return { x: bones.end.x + offset.x * h * stretch, y: bones.end.y + offset.y * h * stretch }
  }
  // The hand carries on from the wrist, turned by the wrist bend.
  const handTip = (side: number, bones: Bones, shoulder: number, elbow: number, wrist: number): Point =>
    segment(bones.end.x, bones.end.y, shoulder + elbow + wrist, side, HAND_LENGTH * armStretch)
  const arms = {
    left: arm(-1, figure.leftShoulder, figure.leftElbow),
    right: arm(1, figure.rightShoulder, figure.rightElbow),
  }

  return {
    height: h,
    facing: (style.facing ?? 1) < 0 ? -1 : 1,
    stretch,
    lineWidth: style.lineWidth ?? h * 0.025,
    rubber: Math.min(1, Math.max(classic ? 0 : SOFT_JOINTS, style.rubber ?? 0)),
    r,
    // The head keeps its area: taller and narrower when stretched.
    headRx: r / Math.sqrt(stretch),
    headRy: r * Math.sqrt(stretch),
    hipY,
    neckY,
    drop,
    lean: classic ? figure.lean : figure.lean + SIT_LEAN * Math.sin(Math.PI * sit),
    classic,
    legs,
    toes: {
      left: toe(-1, legs.left, leftHip, leftKnee, ankles.left, outs.left),
      right: toe(1, legs.right, rightHip, rightKnee, ankles.right, outs.right),
    },
    spine,
    arms,
    handTips: {
      left: handTip(-1, arms.left, figure.leftShoulder, figure.leftElbow, figure.leftWrist ?? 0),
      right: handTip(1, arms.right, figure.rightShoulder, figure.rightElbow, figure.rightWrist ?? 0),
    },
  }
}

/** The points a limb is stroked through: its two bones, or a rubber-hose curve. */
const limbPoints = (bones: Bones, rubber: number): Point[] =>
  rubber === 0 ? [bones.root, bones.joint, bones.end] : rubberLimb(bones.root, bones.joint, bones.end, rubber)

/** `p` turned by `angle` radians about `centre`, the way `ctx.rotate` turns it. */
function rotateAbout(p: Point, centre: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = p.x - centre.x
  const dy = p.y - centre.y
  return { x: centre.x + dx * cos - dy * sin, y: centre.y + dx * sin + dy * cos }
}

/**
 * The joints as drawn. With `airborne` (the default), `spin` and `rise` move
 * them as they move the drawing; without, they are in the body's own frame,
 * which is where layer hooks draw (the context is already spun and lifted).
 */
function jointsFromRig(rig: Rig, figure: StickPose, airborne = true): StickJoints {
  const joints = bodyJoints(rig, figure)
  const spin = figure.spin ?? 0
  const rise = figure.rise ?? 0
  return airborne && (spin !== 0 || rise !== 0) ? spunAndLifted(joints, rig, spin, rise) : joints
}

/** How `spin` and `rise` move the drawing: turned about the hips, then lifted. */
function airTransform(rig: Rig, spin: number, rise: number) {
  return { pivot: { x: 0, y: rig.hipY }, angle: rig.facing * rad(spin), lift: rise * rig.height }
}

function spunAndLifted(joints: StickJoints, rig: Rig, spin: number, rise: number): StickJoints {
  const { pivot, angle, lift } = airTransform(rig, spin, rise)
  const move = (p: Point): Point => {
    const turned = rotateAbout(p, pivot, angle)
    return { x: turned.x, y: turned.y - lift }
  }
  const pair = (r: Record<StickSide, Point>) => ({ left: move(r.left), right: move(r.right) })
  const lowest = { left: Math.max(move(joints.feet.left).y, move(joints.toes.left).y), right: Math.max(move(joints.feet.right).y, move(joints.toes.right).y) }
  const feetY = Math.max(lowest.left, lowest.right)
  const tolerance = GROUND_TOLERANCE * rig.height
  return {
    ...joints,
    hip: move(joints.hip),
    neck: move(joints.neck),
    shoulders: pair(joints.shoulders),
    elbows: pair(joints.elbows),
    hands: pair(joints.hands),
    fingertips: pair(joints.fingertips),
    knees: pair(joints.knees),
    feet: pair(joints.feet),
    toes: pair(joints.toes),
    feetY,
    grounded: { left: lowest.left >= feetY - tolerance, right: lowest.right >= feetY - tolerance },
    handAngle: { left: joints.handAngle.left + angle, right: joints.handAngle.right + angle },
    limbs: {
      leftArm: joints.limbs.leftArm.map(move),
      rightArm: joints.limbs.rightArm.map(move),
      leftLeg: joints.limbs.leftLeg.map(move),
      rightLeg: joints.limbs.rightLeg.map(move),
      spine: joints.limbs.spine.map(move),
    },
    head: { ...joints.head, center: move(joints.head.center), angle: joints.head.angle + angle },
  }
}

function bodyJoints(rig: Rig, figure: StickPose): StickJoints {
  const lean = rad(rig.lean)
  const tilt = rad(figure.headTilt)
  const hip = { x: 0, y: rig.hipY }
  // The same transforms drawStickFigure applies to the context, done to points.
  const mirrored = (p: Point): Point => ({ x: rig.facing * p.x, y: p.y })
  const leaned = (p: Point): Point => mirrored(rotateAbout(p, hip, lean))
  const inHead = (p: Point): Point => leaned(rotateAbout({ x: p.x, y: p.y + rig.neckY }, { x: 0, y: rig.neckY }, tilt))

  const leftArm = limbPoints(rig.arms.left, rig.rubber).map(leaned)
  const rightArm = limbPoints(rig.arms.right, rig.rubber).map(leaned)
  const angleOf = (from: Point, to: Point) => Math.atan2(to.y - from.y, to.x - from.x)
  const fingertips = { left: leaned(rig.handTips.left), right: leaned(rig.handTips.right) }
  // The forearm's direction where it meets the hand, turned as far as the wrist bends.
  const direction = (points: Point[], side: StickSide) => {
    const [from, to] = points.slice(-2)
    const wrist = rig.arms[side]
    const bend = angleOf(leaned(wrist.end), fingertips[side]) - angleOf(leaned(wrist.joint), leaned(wrist.end))
    return angleOf(from, to) + bend
  }

  // The highest brow, in head units: each brow's outer end, or its inner end when slanted up.
  let browTopY = Infinity
  for (const [brow, eye] of [
    [figure.leftBrow, figure.leftEye],
    [figure.rightBrow, figure.rightEye],
  ]) {
    const outer = browHeight(EYE_Y, 1, brow, eyeOpenness(eye, figure.blink))
    browTopY = Math.min(browTopY, outer, outer - figure.browTilt * 0.1)
  }

  const feet = { left: mirrored(rig.legs.left.end), right: mirrored(rig.legs.right.end) }
  const toes = { left: mirrored(rig.toes.left), right: mirrored(rig.toes.right) }
  // Each foot's lowest point: its ankle or its toe.
  const lowest = { left: Math.max(feet.left.y, toes.left.y), right: Math.max(feet.right.y, toes.right.y) }
  const feetY = Math.max(lowest.left, lowest.right)
  const tolerance = GROUND_TOLERANCE * rig.height

  return {
    facing: rig.facing,
    height: rig.height,
    stretch: rig.stretch,
    lineWidth: rig.lineWidth,
    hip,
    neck: leaned({ x: 0, y: rig.neckY }),
    shoulders: { left: leaned(rig.arms.left.root), right: leaned(rig.arms.right.root) },
    elbows: { left: leaned(rig.arms.left.joint), right: leaned(rig.arms.right.joint) },
    hands: { left: leaned(rig.arms.left.end), right: leaned(rig.arms.right.end) },
    knees: { left: mirrored(rig.legs.left.joint), right: mirrored(rig.legs.right.joint) },
    feet,
    toes,
    feetY,
    grounded: { left: lowest.left >= feetY - tolerance, right: lowest.right >= feetY - tolerance },
    fingertips,
    handAngle: { left: direction(leftArm, 'left'), right: direction(rightArm, 'right') },
    limbs: {
      leftArm,
      rightArm,
      leftLeg: limbPoints(rig.legs.left, rig.rubber).map(mirrored),
      rightLeg: limbPoints(rig.legs.right, rig.rubber).map(mirrored),
      spine: rig.spine.map(leaned),
    },
    head: {
      center: inHead({ x: 0, y: -rig.headRy }),
      rx: rig.headRx,
      ry: rig.headRy,
      // Mirroring a turn reverses it.
      angle: rig.facing * (lean + tilt),
      eyeY: EYE_Y,
      browTopY,
      mouthY: MOUTH_Y,
      faceX: rig.facing * (FACE_X + PROFILE_SHIFT * unit(figure.turn)),
    },
  }
}

/**
 * Where every joint of a figure is, without drawing it: the same numbers
 * {@link drawStickFigure} draws with. `figure` is the pose as drawn (use
 * {@link resolveStickPose} to fold a target's walk and talk in first).
 */
export function stickFigureJoints(figure: StickPose, style: StickStyle = {}): StickJoints {
  return jointsFromRig(rigFigure(figure, style), figure)
}

/**
 * A point on the head from head units: (0, 0) is the centre and ±1 the edges,
 * x to the right on screen and y down, both turned with the head. For
 * example, `headPoint(head, head.faceX, head.browTopY - 0.1)` is just above
 * the brows.
 */
export function headPoint(head: StickHead, x: number, y: number): Point {
  return rotateAbout({ x: head.center.x + x * head.rx, y: head.center.y + y * head.ry }, head.center, head.angle)
}

/** Joints moved from the figure's space to a scene where its feet stand at (x, y). */
export function jointsToScene(joints: StickJoints, x: number, y: number): StickJoints {
  const move = (p: Point): Point => ({ x: p.x + x, y: p.y + y })
  const pair = (points: Record<StickSide, Point>) => ({ left: move(points.left), right: move(points.right) })
  return {
    ...joints,
    hip: move(joints.hip),
    neck: move(joints.neck),
    shoulders: pair(joints.shoulders),
    elbows: pair(joints.elbows),
    hands: pair(joints.hands),
    knees: pair(joints.knees),
    feet: pair(joints.feet),
    toes: pair(joints.toes),
    feetY: joints.feetY + y,
    grounded: { ...joints.grounded },
    handAngle: { ...joints.handAngle },
    limbs: {
      leftArm: joints.limbs.leftArm.map(move),
      rightArm: joints.limbs.rightArm.map(move),
      leftLeg: joints.limbs.leftLeg.map(move),
      rightLeg: joints.limbs.rightLeg.map(move),
      spine: joints.limbs.spine.map(move),
    },
    head: { ...joints.head, center: move(joints.head.center) },
  }
}

export { taperedLine, taperedOutline } from './look/tapered-line'

/**
 * Draw a figure with its feet at (0, 0). `time` (ms) matters for a sketched
 * style (it picks which boil frame of the wobble shows) and is passed to any
 * `layers` hooks.
 */
export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  figure: StickPose,
  style: StickStyle = {},
  time = 0
): void {
  const rig = rigFigure(figure, style)
  const color = style.color ?? '#1e293b'
  const layers = style.layers ?? {}
  // Hooks draw in the body's frame: the context is spun and lifted with them.
  const joints = style.layers ? jointsFromRig(rig, figure, false) : undefined
  const pen: SketchPen | undefined = style.sketch ? sketchPen(ctx, style.sketch, time) : undefined
  // Hooks get a pen of their own, so a costume does not change how the figure's lines wobble.
  const layerPen = style.sketch && style.layers ? sketchPen(ctx, style.sketch, time) : undefined

  /** Run `draw` without letting its transforms or styles leak out. */
  const isolated = (draw: () => void) => {
    ctx.save()
    draw()
    ctx.restore()
  }
  const layer = (hook?: FigureLayer) => {
    if (hook && joints) isolated(() => hook(ctx, joints, time, layerPen))
  }
  /** Mirror for facing; the legs are drawn in this frame. */
  const mirror = () => ctx.scale(rig.facing, 1)
  /** Mirror, then tilt the upper body about the hips. */
  const lean = () => {
    mirror()
    ctx.translate(0, rig.hipY)
    ctx.rotate(rad(rig.lean))
    ctx.translate(0, -rig.hipY)
  }
  /**
   * A line through `points`: a pencil stroke when sketched, an even stroke in
   * the classic look, otherwise a filled shape tapering between `widths`
   * (multiples of the line width).
   */
  const line = (points: Point[], curved: boolean, widths: number[]) => {
    if (pen) return curved ? pen.curve(points) : pen.line(points)
    if (rig.classic) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
      ctx.stroke()
      return
    }
    taperedLine(ctx, points, widths[0] * rig.lineWidth, widths[1] * rig.lineWidth)
  }
  /** A limb from root through its joint to its end: jointed, rubber hose, or a blend. */
  const drawLimb = (bones: Bones, widths: number[]) => line(limbPoints(bones, rig.rubber), rig.rubber > 0, widths)
  const drawFoot = (side: StickSide) => {
    if (!rig.classic) line([rig.legs[side].end, rig.toes[side]], false, FOOT_WIDTH)
  }
  const drawHand = (side: StickSide) => {
    if (style.hands && !rig.classic) return drawPosedHand(side)
    if (rig.classic || pen) return
    const hand = rig.arms[side].end
    ctx.beginPath()
    ctx.arc(hand.x, hand.y, HAND_RADIUS * rig.lineWidth, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = rig.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // In the air: lift, then turn the whole body about the hips.
  const air = airTransform(rig, figure.spin ?? 0, figure.rise ?? 0)
  if (air.angle !== 0 || air.lift !== 0) {
    ctx.translate(0, -air.lift)
    ctx.translate(air.pivot.x, air.pivot.y)
    ctx.rotate(air.angle)
    ctx.translate(-air.pivot.x, -air.pivot.y)
  }

  /** A cartoon hand at the wrist, in the leaned frame the arm is drawn in. */
  function drawPosedHand(side: StickSide) {
    const hands = style.hands ?? {}
    const wrist = rig.arms[side].end
    const tip = rig.handTips[side]
    const headFill = style.headFill ?? '#ffffff'
    drawCartoonHand(ctx, wrist, hands[side] ?? HAND_REST, {
      side,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: (Math.atan2(tip.x - wrist.x, wrist.y - tip.y) * 180) / Math.PI,
      size: (hands.size ?? HAND_LENGTH) * rig.height * Math.sqrt(rig.stretch),
      skin: hands.skin ?? (headFill === 'none' ? undefined : headFill),
      ink: color,
      lineWidth: rig.lineWidth * 0.45,
      fingers: hands.fingers,
      plump: hands.plump,
      look: style.sketch ? 'pencil' : 'clean',
      seed: style.sketch?.seed,
    }, time)
  }

  /** An arm, its hand, then its sleeve hook. */
  const drawArm = (side: StickSide) => {
    isolated(() => {
      lean()
      drawLimb(rig.arms[side], ARM_WIDTH)
      drawHand(side)
    })
    const sleeve = layers.sleeve
    if (sleeve && joints) isolated(() => sleeve(ctx, joints, side, time, layerPen))
  }
  // Turned away from the viewer, the far (left) arm goes behind the body and its clothes.
  const backArmBehind = unit(figure.turn) > BACK_ARM_BEHIND_TURN

  layer(layers.behind)
  isolated(() => {
    mirror()
    drawLimb(rig.legs.left, LEG_WIDTH)
    drawFoot('left')
    drawLimb(rig.legs.right, LEG_WIDTH)
    drawFoot('right')
  })
  if (backArmBehind) drawArm('left')
  isolated(() => {
    lean()
    line(rig.spine, rig.spine.length > 2, TORSO_WIDTH)
    const { left, right } = { left: rig.arms.left.root, right: rig.arms.right.root }
    if (left.x !== right.x) {
      if (rig.classic) line([left, right], false, [1, 1])
      else {
        // Rounded shoulders: an arch over the spine that slopes down into the arms.
        const top = { x: (left.x + right.x) / 2, y: left.y - 0.3 * Math.abs(right.x - left.x) }
        line(rubberLimb(left, top, right, 1, 8), true, [1.1, 1.1])
      }
    }
  })
  layer(layers.body)
  if (!backArmBehind) drawArm('left')
  drawArm('right')
  layer(layers.behindHead)

  // Head and face, tilted about the neck.
  isolated(() => {
    lean()
    ctx.translate(0, rig.neckY)
    ctx.rotate(rad(figure.headTilt))
    const cy = -rig.headRy
    ctx.beginPath()
    ctx.ellipse(0, cy, rig.headRx, rig.headRy, 0, 0, Math.PI * 2)
    const headFill = style.headFill ?? '#ffffff'
    if (headFill !== 'none') {
      ctx.fillStyle = headFill
      ctx.fill()
    }
    if (pen) {
      pen.ellipse(0, cy, rig.headRx, rig.headRy)
      // The face keeps its clean curves but shifts with the boil, so it lives with the lines.
      const nudge = pen.nudge()
      ctx.translate(nudge.x, nudge.y)
    } else {
      ctx.stroke()
    }

    // The face squashes and stretches with the head.
    ctx.translate(0, cy)
    ctx.scale(rig.headRx / rig.r, rig.headRy / rig.r)
    drawFace(ctx, figure, rig.r, 0, color, rig.lineWidth)
  })
  layer(layers.overHead)
  layer(layers.front)
  ctx.restore()

  if (style.label) {
    ctx.save()
    ctx.fillStyle = color
    ctx.font = style.labelFont ?? `700 ${Math.round(rig.height * 0.11)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(style.label, 0, -rig.height * rig.stretch - 0.04 * rig.height + rig.drop)
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
  /** Limbs from jointed (0) to rubber hose (1); starts at the style's `rubber` */
  rubber: number
  /** Beats into the target's dance (animate it 0 → n at the tempo); see `danceTracks` */
  beat?: number
  /** How much of the dance is applied, 0..1 (0 standing) */
  dancing?: number
}

/** A dancer's pose at one moment, and its hand shapes when it has them. */
export interface DanceFrame {
  pose: StickPose
  hands?: { left?: HandPose; right?: HandPose }
}

/** Gives the pose at a beat: what `stickFigureTarget({ dance })` plays (see `dancer()`). */
export type Dancer = (beat: number) => DanceFrame

/**
 * What a stick-figure target draws at `time` ms: its props with the walk
 * cycle (by `walking`), a dance (by `dancing`) and the chatter of `talk`
 * folded in, and the dance's hand shapes.
 */
export function resolveStickFrame(props: StickFigureProps, time: number, dance?: Dancer): DanceFrame {
  const standing: StickPose = { ...props }
  let figure = props.walking > 0 ? blendPose(standing, walkPose(props.walk, standing), props.walking) : standing
  // The target's own hands (its `hand.*` props), which a dance blends away from.
  let hands = handsFromProps(props as unknown as Record<string, unknown>)
  const dancing = props.dancing ?? 0
  if (dance && dancing > 0) {
    const frame = dance(props.beat ?? 0)
    figure = blendPose(figure, frame.pose, dancing)
    if (frame.hands) {
      const mix = (own: HandPose | undefined, hand?: HandPose) => (hand ? mixHandPoses(own ?? HAND_REST, hand, dancing) : own)
      hands = { left: mix(hands?.left, frame.hands.left), right: mix(hands?.right, frame.hands.right) }
    }
  }
  if (props.talk > 0) figure = { ...figure, mouth: Math.max(figure.mouth, props.talk * talkingMouth(time)) }
  return { pose: figure, hands }
}

/** The pose of {@link resolveStickFrame}. */
export function resolveStickPose(props: StickFigureProps, time: number, dance?: Dancer): StickPose {
  return resolveStickFrame(props, time, dance).pose
}

/** Prop names for a hand's pose fields on a stick-figure target: `hand.left.index.curl`, … */
export const handProp = (side: StickSide, field: string) => `hand.${side}.${field}`

/** A target's hands from its `hand.left.*` / `hand.right.*` props, if it has them. */
function handsFromProps(props: Record<string, unknown>): DanceFrame['hands'] {
  const read = (side: StickSide): HandPose | undefined => {
    if (typeof props[handProp(side, 'spread')] !== 'number') return undefined
    return Object.fromEntries(Object.keys(HAND_REST).map((field) => [field, props[handProp(side, field)] as number]))
  }
  const left = read('left')
  const right = read('right')
  return left || right ? { left, right } : undefined
}

/** A style with a dance frame's hands, when the style draws hands at all. */
function withDanceHands(style: StickStyle, hands: DanceFrame['hands']): StickStyle {
  if (!hands || !style.hands) return style
  return { ...style, hands: { ...style.hands, left: hands.left ?? style.hands.left, right: hands.right ?? style.hands.right } }
}

export interface StickFigureTargetOptions {
  /** Where the feet stand */
  x: number
  y: number
  /** Starting pose (default rest) */
  pose?: Partial<StickPose>
  style?: StickStyle
  /**
   * A dance to play: its `beat` prop counts beats and `dancing` blends it in
   * (see `dancer()` and `danceTracks()`). Its hand shapes show when the style has `hands`.
   */
  dance?: Dancer
}

/** A `custom` target made by {@link stickFigureTarget}. */
export interface StickFigureTarget extends CustomTarget {
  /** The style it draws with, so {@link stickFigureAt} can find its joints */
  readonly figureStyle: StickStyle
  /** The dance it plays, if any */
  readonly figureDance?: Dancer
}

/**
 * A `custom` canvas target that draws a stick figure. Its props are the pose
 * plus `walk`, `walking`, `talk` and `rubber`, so the timeline can pose, walk,
 * voice and loosen it. `x`/`y` here are the feet; the target's own box sits
 * above them (a stretched figure reaches above its box).
 */
export function stickFigureTarget(options: StickFigureTargetOptions): StickFigureTarget {
  const style = options.style ?? {}
  const height = style.height ?? 300
  const width = height * 0.8
  const props: StickFigureProps = { ...pose(options.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: style.rubber ?? 0, beat: 0, dancing: 0 }
  // With cartoon hands, every hand pose field is a prop too (`hand.left.index.curl`…), so tracks pose the fingers.
  const handProps: Record<string, number> = {}
  if (style.hands) {
    for (const side of ['left', 'right'] as const) {
      const hand = style.hands[side] ?? HAND_REST
      for (const field of Object.keys(HAND_REST)) handProps[handProp(side, field)] = hand[field] ?? HAND_REST[field]
    }
  }
  return {
    type: 'custom',
    x: options.x - width / 2,
    y: options.y - height,
    width,
    height,
    props: { ...props, ...handProps },
    figureStyle: style,
    figureDance: options.dance,
    draw(ctx, target, time) {
      const values = target.props as unknown as StickFigureProps
      const frame = resolveStickFrame(values, time, options.dance)
      ctx.translate(width / 2, height)
      drawStickFigure(ctx, frame.pose, withDanceHands({ ...style, rubber: values.rubber }, frame.hands), time)
    },
  }
}

/**
 * The pose and scene-space joints of a {@link stickFigureTarget} in a frame, for
 * immediate-mode drawing that follows it (a speech-bubble tail at the head, a
 * pot carried on it). `id` is the target's key in the scene's `targets`, which
 * is how the timeline's tracks address it.
 *
 * The figure's `x`/`y` tracks are followed; a `rotate` or `scale` on the
 * target itself is not.
 */
export function stickFigureAt(
  target: CustomTarget,
  frame: Pick<FrameInfo, 'time' | 'state'>,
  id: string
): { pose: StickPose; joints: StickJoints } {
  const style = (target as Partial<StickFigureTarget>).figureStyle
  if (!style) throw new Error('stickFigureAt: the target was not made by stickFigureTarget')
  const props = { ...target.props } as unknown as StickFigureProps
  // Apply the frame's state as the canvas adapter does: x/y move the target, other tracks set props.
  let dx = 0
  let dy = 0
  for (const [property, value] of frame.state?.values.get(id) ?? []) {
    if (typeof value !== 'number') continue
    if (property === 'x' || property === 'motionPathX') dx = value
    else if (property === 'y' || property === 'motionPathY') dy = value
    else if (property in props) props[property as keyof StickFigureProps] = value
  }
  const figure = resolveStickPose(props, frame.time, (target as Partial<StickFigureTarget>).figureDance)
  const joints = stickFigureJoints(figure, { ...style, rubber: props.rubber })
  return { pose: figure, joints: jointsToScene(joints, target.x + dx + target.width / 2, target.y + dy + target.height) }
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
