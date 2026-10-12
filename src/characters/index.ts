/**
 * `@algorisys/tinyfly/characters`: drawable, poseable characters for canvas
 * scenes (browser or headless video). The pencil pen and path helpers live
 * with the canvas adapter (its shapes can be sketched too) and are re-exported
 * here.
 */
export * from './stick-figure'
export * from './dance'
export * from './human-dance'
export * from './dance-circle'
export * from './dance-contact'
export * from './gaits'
export * from './acrobatics'
export { stickToHuman } from './stick-to-human'
export { skeletonInView, solvePlanSpace, stagePlanSpace, type ViewProjection, type PlanSpace, type StagedSpace } from './rig/skeleton'
// Characters in 3D scenes (@algorisys/tinyfly/scene-3d): loadScene3D(scene, { kinds: [characterObjects] }).
export { characterObjects } from './scene-objects'
export { characterScript3D, checkCharacterBeats3D, lookFields, speechLength, CHARACTER_GAIT_SPEEDS, CHARACTER_BEAT_3D_FIELDS, type CharacterBeat3D, type CharacterScript3DOptions, type CharacterScript3DResult } from './character-script-3d'
export { characterLookAtTracks, objectPositionAt, stageSpots, type LookAtTracksOptions, type StageSpotsOptions } from './staging-3d'
export { type GroundPoint } from './ground-path'
export * from '../adapters/canvas/sketch'
// The 2D camera, for scenes that film characters (applyCamera, cameraPoint, cameraFromValues).
export * from '../adapters/canvas/camera'
export * from './erase'
export * from './code-panel'
export * from './whiteboard'
export * from './chart'
export * from './surface'
export * from '../adapters/canvas/polyline'
export * from './hand'
// Characters v2: body plans, turned in 3D, drawn in a look (see docs/character-system-m1.md).
export * from './character'
export { leafOutfit, leafOutfitContours, type LeafOutfitOptions, type LeafOutfitContours } from './wardrobe/leaf-outfit'
export { softCartoonCharacter, SOFT_CARTOON_CAST, type SoftCartoonName } from './soft-cartoon-cast'
export { resolveOrganicBody, bodyProfileWidth, type OrganicBody, type OrganicBodyOptions, type BodyProfilePoint, type SkinShading } from './body/organic-body'
export { organicBodyContours, organicCenterLine, type OrganicBodyContours, type OrganicContour, type OrganicSample } from './body/organic-geometry'
export { humanPlan, humanPose, mirrorHumanPose, humanFieldLabel, HUMAN_REST, HUMAN_POSES, HUMAN_EXPRESSIONS, HUMAN_BUILDS, FOOT_SHAPES, type FootShape, type HumanBuild, type HumanBuildName, type HumanPoseName, type HumanExpressionName } from './species/human'
// A recurring cast of ready-made characters (family, ages, looks).
export { CHARACTER_CAST, ANIME_CAST, MANGA_CAST, castMember, type CastMember, type CastName, type AnimeCastName, type MangaCastName } from './cast'
export type { FaceOptions, PupilCircle } from './head/face'
// Two characters whose hands meet: handshakes, high fives, fist bumps, a parcel handed over.
export { meetHands, meetingSpacing, HAND_MEETINGS, embrace, embraceSpacing, EMBRACE, helpUp, helpUpSpacing, HELP_UP, type HandMeeting, type HandsMeet, type MeetingPartner, type MeetHandsOptions, type Embrace, type EmbraceOptions, type HelpUp, type HelpUpOptions } from './interactions'
// Native motion for the human plan: gaits from the shared GAITS data, and gags in the character's own frame.
export * from './species/human-motion'
export type { BodyPlan, ChainSpec, BoneSpec, BoneAngles, ContactSpec, HeadSpec, Pose as CharacterPose, Vec3 } from './rig/body-plan'
export { createPen, ellipsePoints, type Pen, type Look, type PencilOptions, type PenOptions } from './look/pen'
export { basicOutfit, type BasicOutfitOptions } from './wardrobe/basic-outfit'
export { outfitPreset, OUTFIT_PRESETS, type OutfitCategory } from './wardrobe/outfit-preset'
// Heads: hair, ears, facial hair, glasses and hats, as plain data that turns with the head (see docs/character-appearance.md).
export * from './head'
// Hair in motion: hanging hair lags behind the head, keyed ahead of time from its motion.
export { hairFollow, hairFollowTracks, hairMotionAt, type HairFollowSample, type HairFollowOptions, type HairFollowKey, type HairFollowTrackOptions } from './hair-follow'
// Cartoon hands: posed in 3D, drawn in a look.
export * from './hands'
// Acting: anticipation, overshoot, overlap, eyes leading, gags and speed lines (see docs/acting.md).
export * from './acting'
export * from './capabilities'
export { describeTarget, checkTracks, animatableProperties, CANVAS_PROPERTIES, type PropertyInfo, type TargetAbout, type TargetDescription, type TrackProblem } from '../adapters/canvas/target-properties'
export * from './props'
// Scenery: a sky or a room behind the figures, and ready-made scenes.
export { scenery, scenePreset, buildScene, skyColors, SCENERY_COLORS, type Scenery, type SceneryOptions, type SceneryColors, type SceneryHorizon, type ScenePreset, type ScenePresetName, type ScenePresetOptions, type PlacedProp } from './scenery'
