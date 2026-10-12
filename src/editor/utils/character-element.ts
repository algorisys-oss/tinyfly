import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState } from '../../engine/types'
import { hashSeed } from '../../engine/authoring/random'
import { basicOutfit, character, characterPoseOf, drawCharacter, HAND_REST, HUMAN_REST, CHARACTER_CAST, type FaceOptions, type HairSpec, type CastName, type Character, type CharacterPose, type FacialHairStyleName, type GlassesStyle, type HairStyleName, type HatStyle, type HoldingSpec, type FootShape } from '../../characters'
import type { CharacterBuild, CharacterElement } from '../stores/scene-store'
import { HUMAN_BUILDS } from '../../characters/species/human'

/**
 * Character elements: the editor's bridge to the v2 character system. The
 * element is plain data (figure, look, colours, outfit, pose); these turn it
 * into a character, a pose at a moment, a canvas target, or a painted canvas.
 */

/** The character an element describes. Its height is the element's box height. */
export function characterOf(element: CharacterElement): Character {
  return character({
    figure: element.figure,
    body: element.body,
    leafOutfit: element.figure === 'organic' && element.outfit === 'leaves' ? element.leafOutfit ?? {} : null,
    look: element.look,
    height: Math.max(1, element.height),
    ink: element.ink,
    skin: element.skin,
    lineWidth: element.lineWidth,
    // Each character boils on its own: the seed comes from its id.
    seed: hashSeed(element.id) % 1000,
    layers:
      element.outfit === 'basic'
        ? basicOutfit({ top: element.top, trouserStyle: element.trouserStyle, shirt: element.shirt, trousers: element.trousers, sleeves: element.sleeves, bottom: element.bottom, collar: element.collar, tie: element.tie, over: element.over, shoes: element.shoes })
        : undefined,
    hands: element.hands === undefined ? undefined : element.hands === 'dot' ? 'dot' : 'cartoon',
    handStyle: element.hands === undefined ? undefined : element.hands === 'natural' ? 'natural' : 'glove',
    handSize: element.handSize,
    ...element.build,
    hair: element.hair ? { ...element.hairDetails, style: element.hair as HairStyleName, ...(element.hairColor ? { color: element.hairColor } : {}) } : null,
    facialHair: element.facialHair ? { style: element.facialHair as FacialHairStyleName, ...(element.hairColor ? { color: element.hairColor } : {}) } : null,
    glasses: (element.glasses as GlassesStyle | undefined) ?? null,
    hat: (element.hat as HatStyle | undefined) ?? null,
    ears: element.ears ?? false,
    face: {
      teeth: element.teeth ?? false, tongue: element.tongue ?? false,
      ...(element.faceStyle !== undefined ? { style: element.faceStyle } : {}),
      ...(element.faceShape !== undefined ? { shape: element.faceShape } : {}),
      ...(element.faceProjection !== undefined ? { projection: element.faceProjection } : {}),
      ...(element.jawWidth !== undefined ? { jawWidth: element.jawWidth } : {}),
      ...(element.chinWidth !== undefined ? { chinWidth: element.chinWidth } : {}),
      ...(element.jawRoundness !== undefined ? { jawRoundness: element.jawRoundness } : {}),
      ...(element.eyeScale !== undefined ? { eyeScale: element.eyeScale } : {}),
      ...(element.eyeAspect !== undefined ? { eyeAspect: element.eyeAspect } : {}),
      ...(element.faceNose !== undefined ? { nose: element.faceNose } : {}),
      ...(element.irisColor !== undefined ? { iris: element.irisColor } : {}),
      ...(element.eyeLashes !== undefined ? { lashes: element.eyeLashes } : {}),
      ...(element.ageLines !== undefined ? { ageLines: element.ageLines } : {}),
    },
    feet: (element.feet as FootShape | undefined) ?? 'round',
    holding: element.holding ? (element.holding as HoldingSpec) : null,
  })
}

/** Values shown by appearance controls, including the selected figure's resolved defaults. */
export function characterControlValues(element: CharacterElement) {
  const who = characterOf(element)
  return {
    headSize: who.plan.head.size,
    shoulderWidth: Math.abs(who.plan.chains.find(chain => chain.id === 'arm.left')?.offset?.[0] ?? 0),
    hipWidth: Math.abs(who.plan.chains.find(chain => chain.id === 'leg.left')?.offset?.[0] ?? 0),
    legLength: element.build?.legLength ?? 1,
    armLength: element.build?.armLength ?? 1,
    hands: who.hands === 'dot' ? 'dot' : who.handStyle === 'natural' ? 'natural' : 'cartoon',
    lineWidth: who.lineWidth,
    skin: who.skin,
    ink: who.ink,
    faceStyle: who.face.style ?? 'simple',
    faceShape: who.face.shape ?? 'round',
    jawWidth: who.face.jawWidth ?? .74,
    chinWidth: who.face.chinWidth ?? .14,
    eyeScale: who.face.eyeScale ?? 1,
    eyeAspect: who.face.eyeAspect ?? 1,
    irisColor: who.face.iris ?? '#4b7fce',
    eyeLashes: who.face.lashes ?? true,
    ageLines: who.face.ageLines ?? 0,
  }
}

export function characterColorFields(element: CharacterElement, field: 'skin' | 'ink', value: string): Partial<CharacterElement> {
  const body = element.body
  if (field === 'skin' && body?.fill !== undefined) return { skin: value, body: { ...body, fill: value } }
  if (field === 'ink' && body?.outline?.color !== undefined) return { ink: value, body: { ...body, outline: { ...body.outline, color: value } } }
  return { [field]: value }
}

/**
 * The element fields that dress a character as a cast member: its build,
 * hair, facial hair, glasses, ears and clothes. Heights are left alone (the
 * box sets the height).
 */
export function castElementFields(name: CastName): Partial<CharacterElement> {
  const { options } = CHARACTER_CAST[name] as (typeof CHARACTER_CAST)[CastName] & { options: Record<string, unknown> }
  const styleOf = (value: unknown) => (typeof value === 'string' ? value : (value as { style?: string } | undefined)?.style)
  const colorOf = (value: unknown) => (typeof value === 'object' && value ? (value as { color?: string }).color : undefined)
  const outfit = options.outfit as Pick<CharacterElement, 'top' | 'trouserStyle' | 'sleeves' | 'bottom' | 'collar' | 'tie' | 'over'> & { shirt?: string; trousers?: string } | undefined
  const build = options.build as keyof typeof CHARACTER_BUILDS | undefined
  const shape: CharacterBuild = build && build in CHARACTER_BUILDS ? { ...CHARACTER_BUILDS[build].build } : {}
  for (const field of ['headSize', 'shoulderWidth', 'hipWidth', 'legLength', 'armLength'] as const) {
    if (typeof options[field] === 'number') shape[field] = options[field] as number
  }
  if (options.proportions) shape.proportions = options.proportions as CharacterBuild['proportions']
  const face = options.face as FaceOptions | undefined
  const hairDetails = typeof options.hair === 'object' && options.hair ? { ...options.hair } as HairSpec : undefined
  if (hairDetails) { delete hairDetails.style; delete hairDetails.color }
  return {
    build: shape,
    lineWidth: options.lineWidth as number | undefined,
    ...(options.figure ? { figure: options.figure as CharacterElement['figure'] } : {}),
    ...(options.look ? { look: options.look as CharacterElement['look'] } : {}),
    ...(options.skin ? { skin: options.skin as string } : {}),
    ...(options.ink ? { ink: options.ink as string } : {}),
    ...(options.hands ? { hands: options.hands === 'cartoon' && options.handStyle === 'natural' ? 'natural' as const : options.hands as CharacterElement['hands'] } : {}),
    faceStyle: face?.style,
    faceShape: face?.shape,
    faceProjection: face?.projection,
    jawWidth: face?.jawWidth,
    chinWidth: face?.chinWidth,
    jawRoundness: face?.jawRoundness,
    eyeScale: face?.eyeScale,
    eyeAspect: face?.eyeAspect,
    faceNose: face?.nose,
    hairDetails,
    irisColor: face?.iris,
    eyeLashes: face?.lashes,
    ageLines: face?.ageLines,
    ...(face?.teeth !== undefined ? { teeth: face.teeth } : {}),
    ...(face?.tongue !== undefined ? { tongue: face.tongue } : {}),
    hair: styleOf(options.hair),
    hairColor: colorOf(options.hair) ?? colorOf(options.facialHair),
    facialHair: styleOf(options.facialHair),
    glasses: styleOf(options.glasses),
    hat: styleOf(options.hat),
    ears: Boolean(options.ears),
    ...(outfit
      ? {
          outfit: 'basic' as const,
          shirt: outfit.shirt ?? '#e2493b',
          trousers: outfit.trousers ?? '#24476b',
          top: outfit.top,
          trouserStyle: outfit.trouserStyle,
          sleeves: outfit.sleeves,
          bottom: outfit.bottom,
          collar: outfit.collar,
          tie: outfit.tie,
          over: outfit.over,
          shoes: (outfit as { shoes?: CharacterElement['shoes'] }).shoes,
        }
      : {}),
  }
}

/** Named builds for the property panel; each sets every build field it changes from standard. */
export const CHARACTER_BUILDS = {
  standard: { label: 'Standard', build: {} },
  slim: { label: 'Slim', build: { proportions: 'thin' } },
  kid: { label: 'Kid (big head)', build: { headSize: 0.42 } },
  child: { label: 'Child', build: { ...HUMAN_BUILDS.child } },
  toddler: { label: 'Toddler', build: { ...HUMAN_BUILDS.toddler } },
  tall: { label: 'Tall', build: { ...HUMAN_BUILDS.tall } },
  short: { label: 'Short', build: { ...HUMAN_BUILDS.short } },
  broad: { label: 'Broad', build: { shoulderWidth: 0.11, hipWidth: 0.04 } },
  curvy: { label: 'Curvy', build: { shoulderWidth: 0.055, hipWidth: 0.065 } },
  stocky: { label: 'Stocky', build: { ...HUMAN_BUILDS.stocky } },
} satisfies Record<string, { label: string; build: CharacterBuild }>

export type CharacterBuildName = keyof typeof CHARACTER_BUILDS

type BuildField = 'headSize' | 'shoulderWidth' | 'hipWidth' | 'legLength' | 'armLength'

/** The build's value for a field, with the standard build's default when it leaves it out. */
export function buildValue(build: CharacterBuild | undefined, field: BuildField): number {
  const value = build?.[field]
  if (value !== undefined) return value
  if (field === 'headSize') return build?.proportions === 'thin' ? 0.24 : 0.3
  if (field === 'legLength' || field === 'armLength') return 1
  return field === 'shoulderWidth' ? 0.06 : 0.022
}

/** Which named build matches, if any (for the picker). */
export function buildName(build: CharacterBuild | undefined): CharacterBuildName | undefined {
  const same = (a: CharacterBuild, b: CharacterBuild) =>
    (a.proportions ?? 'bold') === (b.proportions ?? 'bold') &&
    (['headSize', 'shoulderWidth', 'hipWidth', 'legLength', 'armLength'] as const).every((field) => Math.abs(buildValue(a, field) - buildValue(b, field)) < 1e-6)
  return (Object.keys(CHARACTER_BUILDS) as CharacterBuildName[]).find((name) => same(build ?? {}, CHARACTER_BUILDS[name].build))
}

/**
 * Is `property` one of the character's pose fields (so a track on it animates
 * the pose)? The body and face fields, and each cartoon hand's
 * (`hand.left.index.curl`, `hand.right.turn`…).
 */
export const isCharacterField = (property: string) => {
  if (property in HUMAN_REST) return true
  const hand = /^hand\.(left|right)\.(.+)$/.exec(property)
  return hand !== null && hand[2] in HAND_REST
}

/** Tracks that step a character's gait rather than pose a field (see `characterScript`). */
const WALK_PROPERTIES = new Set(['walk', 'walking', 'gait'])

/**
 * The full pose at a moment: rest, then the element's own pose, then any
 * animated values in `state` (tracks address an element by name, or by id),
 * with its gait stepped in by `walk`, `walking` and `gait` tracks.
 */
export function characterElementPose(element: CharacterElement, state?: AnimationState | null): CharacterPose {
  const props: Record<string, unknown> = { ...HUMAN_REST, ...element.pose }
  for (const key of [element.id, element.name]) {
    const values = state?.values.get(key)
    if (!values) continue
    for (const [property, value] of values) {
      if (typeof value === 'number' && isCharacterField(property)) props[property] = value
      else if (WALK_PROPERTIES.has(property)) props[property] = value
    }
  }
  return characterPoseOf(props)
}

/**
 * A canvas target for the Canvas preview and the GIF / MP4 exporters. Every
 * pose field is a prop, so the timeline's tracks pose it. The feet stand at
 * the bottom centre of the element's box.
 */
export function characterElementTarget(element: CharacterElement): CustomTarget {
  const who = characterOf(element)
  const width = element.width
  const height = element.height
  return {
    type: 'custom',
    x: element.x,
    y: element.y,
    width,
    height,
    opacity: element.opacity,
    rotate: element.rotation || undefined,
    props: { ...HUMAN_REST, ...element.pose },
    draw(ctx, target, time) {
      ctx.translate(width / 2, height)
      drawCharacter(ctx, who, characterPoseOf(target.props ?? {}), time)
    },
  }
}

/**
 * How far a character can reach outside its box (raised arms, lying down), as
 * fractions of its height: the DOM preview's canvas is this much bigger.
 */
export const CHARACTER_OVERFLOW = { side: 0.6, top: 0.3, bottom: 0.05 }

/** Paint a character element into a canvas that covers its box plus the overflow margin. */
export function paintCharacterCanvas(
  canvas: HTMLCanvasElement,
  element: CharacterElement,
  pose: CharacterPose,
  time: number,
  pixelRatio = 1
): void {
  const side = element.height * CHARACTER_OVERFLOW.side
  const top = element.height * CHARACTER_OVERFLOW.top
  const width = element.width + side * 2
  const height = element.height + top + element.height * CHARACTER_OVERFLOW.bottom
  const pixelWidth = Math.max(1, Math.round(width * pixelRatio))
  const pixelHeight = Math.max(1, Math.round(height * pixelRatio))
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.translate(side + element.width / 2, top + element.height)
  drawCharacter(ctx, characterOf(element), pose, time)
}
