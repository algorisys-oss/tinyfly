import type { PropertyInfo } from '../adapters/canvas/target-properties'
import type { StickFigureProps, StickPose } from './stick-figure'

/**
 * The stick figure's animatable props, said as data: what each joint and
 * face field does, its unit and its usual range. `stickFigureTarget` puts
 * them in its `about`, so `describeTarget` and `checkTracks` know them, and
 * the capability catalog lists them.
 */

const degrees = (description: string): PropertyInfo => ({ description, unit: 'degrees' })
const unit = (description: string, min = 0, max = 1): PropertyInfo => ({ description, unit: `${min}..${max}`, min, max })

/** Every pose field (`StickPose`). */
export const STICK_POSE_FIELDS = {
  lean: degrees('Upper body tipped about the hips (+ toward the way it faces)'),
  bend: degrees('Line of action: the spine curved (+ curls forward, − arches back)'),
  headTilt: degrees('Head tilt'),
  leftShoulder: degrees('Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm'),
  rightShoulder: degrees('Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up'),
  leftElbow: degrees('Left elbow bend, added to the upper arm'),
  rightElbow: degrees('Right elbow bend, added to the upper arm'),
  leftHip: degrees('Left thigh: 0 straight down; in profile negative is forward'),
  rightHip: degrees('Right thigh: 0 straight down; in profile positive is forward'),
  leftKnee: degrees('Left knee bend (negative folds the shin back)'),
  rightKnee: degrees('Right knee bend (positive folds the shin back)'),
  leftWrist: degrees('Left wrist bend, added to the forearm'),
  rightWrist: degrees('Right wrist bend, added to the forearm'),
  leftAnkle: degrees('Left ankle: + points the toe down (tiptoe), − onto the heel'),
  rightAnkle: degrees('Right ankle: + points the toe down (tiptoe), − onto the heel'),
  leftFootOut: unit('Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in', -1, 1),
  rightFootOut: unit('Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in', -1, 1),
  mouth: unit('Mouth open: 0 closed, 1 wide open'),
  smile: unit('−1 frown, 0 flat, 1 smile', -1, 1),
  mouthWidth: { description: 'Mouth width: 1 normal, 0.5 pursed, 1.5 wide', unit: 'factor', min: 0.3, max: 2 },
  blink: unit('Eyes closed by a blink: 0 open, 1 shut'),
  leftEye: { description: 'Left eye openness: 0 shut, 1 normal, 1.6 wide', unit: 'factor', min: 0, max: 2 },
  rightEye: { description: 'Right eye openness: 0 shut, 1 normal, 1.6 wide', unit: 'factor', min: 0, max: 2 },
  leftBrow: unit('Left eyebrow: −1 lowered, 0 rest, 1 raised', -1, 1),
  rightBrow: unit('Right eyebrow: −1 lowered, 0 rest, 1 raised', -1, 1),
  browTilt: unit('Eyebrow slant: −1 angry, 1 worried', -1, 1),
  lookX: unit('Eyes look across: + the way it faces', -1, 1),
  lookY: unit('Eyes look down (+) or up (−)', -1, 1),
  stretch: { description: 'Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)', unit: 'factor', min: 0.3, max: 3 },
  turn: unit('0 front-on, 1 in profile, turned the way it faces'),
  sit: unit('0 standing, 1 seated'),
  spin: degrees('Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn'),
  rise: { description: 'Lift off the ground, as a fraction of its height (the arc of a jump)', unit: '× height' },
} satisfies Record<keyof StickPose, PropertyInfo>

/** The figure target's props besides the pose. */
export const STICK_FIGURE_EXTRAS = {
  walk: { description: 'Walk-cycle phase, in strides: animate 0 → n for n strides', unit: 'strides' },
  walking: unit('How much of the walk cycle is applied (0 standing)'),
  gait: { description: 'How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it', kind: 'string' },
  talk: unit('How much the mouth chatters'),
  rubber: unit('Limbs from jointed (0) to rubber hose (1)'),
  facing: { description: 'Which way it faces: 1 right, −1 left (key the flip while turn is near 0)', unit: '±1', min: -1, max: 1 },
  beat: { description: 'Beats into its dance (with a dance)', unit: 'beats' },
  dancing: unit('How much of the dance is applied'),
} satisfies Record<Exclude<keyof StickFigureProps, keyof StickPose>, PropertyInfo>

/** A cartoon hand's pose fields (`hand.left.<field>` / `hand.right.<field>` props when the style has hands). */
export const HAND_FIELDS: Record<string, PropertyInfo> = {
  'thumb.curl': unit('Thumb curled in'),
  'thumb.across': unit('Thumb across the palm'),
  'index.curl': unit('Index finger curled'),
  'middle.curl': unit('Middle finger curled'),
  'ring.curl': unit('Ring finger curled'),
  'pinky.curl': unit('Little finger curled'),
  spread: unit('Fingers spread apart'),
  turn: degrees('Hand turned about the forearm'),
  bend: degrees('Hand bent at the wrist, palm-ward'),
  tilt: degrees('Hand tilted sideways'),
  roll: degrees('Hand rolled to show the back or the palm'),
}
