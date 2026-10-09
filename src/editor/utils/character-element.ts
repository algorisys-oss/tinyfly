import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState } from '../../engine/types'
import { hashSeed } from '../../engine/authoring/random'
import { basicOutfit, character, drawCharacter, HAND_REST, HUMAN_REST, CHARACTER_CAST, type CastName, type Character, type CharacterPose, type FacialHairStyleName, type GlassesStyle, type HairStyleName, type HatStyle, type HoldingSpec } from '../../characters'
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
    look: element.look,
    height: Math.max(1, element.height),
    ink: element.ink,
    skin: element.skin,
    // Each character boils on its own: the seed comes from its id.
    seed: hashSeed(element.id) % 1000,
    layers:
      element.outfit === 'basic'
        ? basicOutfit({ shirt: element.shirt, trousers: element.trousers, sleeves: element.sleeves, bottom: element.bottom, collar: element.collar, tie: element.tie, over: element.over })
        : undefined,
    hands: (element.hands ?? 'dot') === 'dot' ? 'dot' : 'cartoon',
    handStyle: element.hands === 'natural' ? 'natural' : 'glove',
    ...element.build,
    hair: element.hair ? { style: element.hair as HairStyleName, ...(element.hairColor ? { color: element.hairColor } : {}) } : null,
    facialHair: element.facialHair ? { style: element.facialHair as FacialHairStyleName, ...(element.hairColor ? { color: element.hairColor } : {}) } : null,
    glasses: (element.glasses as GlassesStyle | undefined) ?? null,
    hat: (element.hat as HatStyle | undefined) ?? null,
    ears: element.ears ?? false,
    holding: element.holding ? (element.holding as HoldingSpec) : null,
  })
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
  const outfit = options.outfit as Pick<CharacterElement, 'sleeves' | 'bottom' | 'collar' | 'tie' | 'over'> & { shirt?: string; trousers?: string } | undefined
  const build = options.build as keyof typeof CHARACTER_BUILDS | undefined
  return {
    build: build && build in CHARACTER_BUILDS ? { ...CHARACTER_BUILDS[build].build } : {},
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
          sleeves: outfit.sleeves,
          bottom: outfit.bottom,
          collar: outfit.collar,
          tie: outfit.tie,
          over: outfit.over,
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

/**
 * The full pose at a moment: rest, then the element's own pose, then any
 * animated values in `state` (tracks address an element by name, or by id).
 */
export function characterElementPose(element: CharacterElement, state?: AnimationState | null): CharacterPose {
  const pose: CharacterPose = { ...HUMAN_REST, ...element.pose }
  for (const key of [element.id, element.name]) {
    const values = state?.values.get(key)
    if (!values) continue
    for (const [property, value] of values) {
      if (typeof value === 'number' && isCharacterField(property)) pose[property] = value
    }
  }
  return pose
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
      drawCharacter(ctx, who, target.props as CharacterPose, time)
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
