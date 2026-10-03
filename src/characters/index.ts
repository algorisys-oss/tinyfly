/**
 * `@algorisys/tinyfly/characters`: drawable, poseable characters for canvas
 * scenes (browser or headless video). The pencil pen and path helpers live
 * with the canvas adapter (its shapes can be sketched too) and are re-exported
 * here.
 */
export * from './stick-figure'
export * from '../adapters/canvas/sketch'
export * from './erase'
export * from '../adapters/canvas/polyline'
export * from './hand'
// Characters v2: body plans, turned in 3D, drawn in a look (see docs/character-system-m1.md).
export * from './character'
export { humanPlan, humanPose, humanFieldLabel, HUMAN_REST, HUMAN_POSES, HUMAN_EXPRESSIONS, type HumanBuild, type HumanPoseName } from './species/human'
export type { BodyPlan, ChainSpec, BoneSpec, BoneAngles, ContactSpec, HeadSpec, Pose as CharacterPose, Vec3 } from './rig/body-plan'
export { createPen, ellipsePoints, type Pen, type Look, type PencilOptions, type PenOptions } from './look/pen'
export { basicOutfit, type BasicOutfitOptions } from './wardrobe/basic-outfit'
