import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState } from '../../engine/types'
import { hashSeed } from '../../engine/authoring/random'
import { basicOutfit, character, drawCharacter, HAND_REST, HUMAN_REST, type Character, type CharacterPose } from '../../characters'
import type { CharacterElement } from '../stores/scene-store'

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
    layers: element.outfit === 'basic' ? basicOutfit({ shirt: element.shirt, trousers: element.trousers }) : undefined,
    hands: (element.hands ?? 'dot') === 'dot' ? 'dot' : 'cartoon',
    handStyle: element.hands === 'natural' ? 'natural' : 'glove',
  })
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
