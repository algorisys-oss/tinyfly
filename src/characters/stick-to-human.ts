import type { Pose } from './rig/body-plan'
import { HUMAN_REST } from './species/human'
import { HAND_REST, type HandPose } from './hands/hand-rig'
import type { DanceFrame, StickPose } from './stick-figure'

/**
 * The stick figure's poses on a v2 human character, so dances and flips
 * written for the stick figure play on characters too (and in the editor).
 *
 * The stick figure is drawn in one plane: seen front-on (`turn` 0) a limb's
 * angle spreads it sideways; in profile (`turn` 1) the same angle swings it
 * forward or back. A v2 character's limbs are 3D, so each stick angle is split
 * by the turn into a sideways `spread` and a forward `swing`, and the
 * character is turned the same way. Sides swap: the stick figure's right is
 * on screen-right, which is a v2 character's left when it faces the viewer.
 *
 * Elbows split the same way. Legs use the hip rotation instead: front-on, a
 * stick leg lies in the picture plane, which is a v2 leg turned out 90° at the
 * hip (`leg.*.rotate`), so its swing and knee bend sideways, and a plié's
 * knees point out over the toes as they do on the stick figure. Side-on the
 * leg is not turned and swings forward and back. Foot turn-out becomes
 * `toeOut`. `sit` has no v2 field and is left out.
 *
 * With `hands` (a dance frame's hand shapes), the result also carries the
 * `hand.<side>.*` fields that a character with `hands: 'cartoon'` draws: the
 * shapes, turned to match how the stick figure shows them, rolled by the
 * stick figure's wrist bends. Without, wrists are left out (dot hands look
 * the same at any angle).
 */
export function stickToHuman(stick: StickPose, hands?: DanceFrame['hands']): Pose {
  const t = Math.min(1, Math.max(0, stick.turn ?? 0))
  const front = 1 - t
  const out: Pose = { ...HUMAN_REST, turn: t }

  // Stick side (+1 screen-right) → the v2 side drawn there.
  const limbs: Array<{ stick: 'left' | 'right'; human: 'left' | 'right'; s: number }> = [
    { stick: 'right', human: 'left', s: 1 },
    { stick: 'left', human: 'right', s: -1 },
  ]
  for (const { stick: side, human, s } of limbs) {
    const shoulder = stick[`${side}Shoulder`]
    const elbow = stick[`${side}Elbow`]
    out[`arm.${human}.spread`] = shoulder * front
    out[`arm.${human}.swing`] = s * shoulder * t
    out[`arm.${human}.bend`] = elbow * front
    out[`arm.${human}.elbow`] = s * elbow * t

    const hip = stick[`${side}Hip`]
    const knee = stick[`${side}Knee`]
    // Front-on, outward is the same sign on both sides; side-on, forward is s × angle.
    const along = front + s * t
    out[`leg.${human}.rotate`] = 90 * front
    out[`leg.${human}.spread`] = 0
    out[`leg.${human}.swing`] = hip * along
    out[`leg.${human}.knee`] = knee * along
    // The stick ankle points the toe down; a v2 ankle raises it.
    out[`leg.${human}.ankle`] = -(stick[`${side}Ankle`] ?? 0)

    // Stick turn-out runs to 1 (fully sideways, about 70° past the natural splay).
    out[`leg.${human}.toeOut`] = (stick[`${side}FootOut`] ?? 0) * TURN_OUT_DEGREES

    out[`eye.${human}`] = stick[`${side}Eye`]
    out[`brow.${human}`] = stick[`${side}Brow`]

    if (hands) Object.assign(out, handFields(human, hands[side] ?? HAND_REST, stick[`${side}Wrist`] ?? 0, t))
  }

  // The upper body: screen-right is the character's left front-on, forward in profile.
  // The v2 spine is two straight bones, so a curved line of action (`bend`)
  // becomes about half its angle of lean, the rest carried by the head.
  const bend = stick.bend ?? 0
  out.lean = (stick.lean + bend * 0.5) * t
  out.side = (stick.lean + bend * 0.5) * front
  out['head.tilt'] = (stick.headTilt + bend * 0.5) * front
  out['head.nod'] = (stick.headTilt + bend * 0.5) * t

  for (const field of ['mouth', 'smile', 'mouthWidth', 'blink', 'browTilt', 'lookX', 'lookY', 'stretch'] as const) out[field] = stick[field]
  out.lift = stick.rise ?? 0
  out.roll = stick.spin ?? 0
  return out
}

/** Degrees of v2 `toeOut` for a stick `footOut` of 1. */
const TURN_OUT_DEGREES = 70

/**
 * A stick figure's hand as a v2 character's `hand.<side>.*` fields. A v2 hand's
 * `turn` counts from how a hand hangs at the side seen from the character's
 * view (`characterHandPose`), so the stick shape's own turn is taken relative
 * to that. The wrist bend turns the hand in the picture, as `roll`.
 */
function handFields(side: 'left' | 'right', hand: HandPose, wrist: number, view: number): Pose {
  const hanging = side === 'right' ? 1 - view : 1 + view
  const out: Pose = {}
  for (const field of Object.keys(HAND_REST)) out[`hand.${side}.${field}`] = hand[field] ?? HAND_REST[field]
  out[`hand.${side}.turn`] = (hand.turn ?? 0) - hanging
  out[`hand.${side}.roll`] = (hand.roll ?? 0) + wrist
  return out
}
