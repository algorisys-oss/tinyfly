import type { Pose } from '../rig/body-plan'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { drawHairBehind, drawHairFront, resolveHair, type Hair, type HairSpec, type HairStyleName } from './hair'
import { drawEarsBehind, drawEarsFront } from './ears'
import { drawBeardBehind, drawBeardFront, drawMoustache, resolveFacialHair, type FacialHair, type FacialHairSpec, type FacialHairStyleName } from './facial-hair'
import { drawGlasses, resolveGlasses, type Glasses, type GlassesSpec, type GlassesStyle } from './glasses'
import { drawHat, resolveHat, type Hat, type HatSpec, type HatStyle } from './hats'

/**
 * Everything on a character's head besides the face: hair, ears, facial
 * hair, glasses and a hat. It is plain data, resolved once when the
 * character is made (so a saved character keeps its look even if a preset
 * changes), and drawn in passes around the body:
 *
 * - behind: before the body, the parts facing away (long hair down the back,
 *   ears seen from the front, a ponytail behind the head);
 * - front: with the head, after its outline: ears, hair, beard, then the
 *   face, then the moustache, glasses and hat over it;
 * - over: after the whole body, the hair and hat when the head is turned
 *   away, since they are then the nearest things to the viewer.
 *
 * Which part wins where two overlap is fixed by that order: the face's eyes
 * and brows draw over a fringe, the mouth over a beard (which leaves an
 * opening for it), a moustache over the mouth's top, and a hat over the hair.
 */

export interface HeadLookOptions {
  /** Hair: a style name, a style with changes (`{ style: 'bob', color: '#9a4426' }`), or null for none (the default) */
  hair?: HairSpec | HairStyleName | null
  /** Facial hair: a style name (`'fullBeard'`), or `{ moustache, beard, color }` (default none) */
  facialHair?: FacialHairSpec | FacialHairStyleName | null
  /** Glasses: `'round'`, `'square'` or `'sunglasses'` (default none) */
  glasses?: GlassesSpec | GlassesStyle | null
  /** A hat: `'cap'`, `'beanie'`, `'hardHat'`, `'sunHat'`, `'bowler'`, or `{ style, color }` (default none) */
  hat?: HatSpec | HatStyle | null
  /** Draw ears (default false: the plain figure has none) */
  ears?: boolean
}

export interface HeadLook {
  hair: Hair | null
  facialHair: FacialHair | null
  glasses: Glasses | null
  hat: Hat | null
  ears: boolean
}

export function resolveHeadLook(options: HeadLookOptions): HeadLook {
  const hair = options.hair ? resolveHair(options.hair) : null
  return {
    hair,
    facialHair: options.facialHair ? resolveFacialHair(options.facialHair, hair?.color) : null,
    glasses: options.glasses ? resolveGlasses(options.glasses) : null,
    hat: options.hat ? resolveHat(options.hat) : null,
    ears: options.ears ?? false,
  }
}

export interface HeadDrawOptions {
  lineWidth: number
  skin: string
}

/** Whether a head look draws anything at all (so plain figures skip the work). */
const isBare = (look: HeadLook) => !look.hair && !look.facialHair && !look.glasses && !look.hat && !look.ears

/**
 * Turned away, the hair down the back is the nearest thing to the viewer, so
 * it is drawn after the whole body (over an arm at the side), not with the head.
 */
const facesAway = (head: SolvedHead) => head.axes[2][2] < -0.3

const showsEars = (look: HeadLook) => look.ears && !look.hair?.coversEars

export function drawHeadBehind(ctx: CanvasRenderingContext2D, pen: Pen, look: HeadLook, head: SolvedHead, _pose: Pose, options: HeadDrawOptions): void {
  if (isBare(look)) return
  if (look.hair) drawHairBehind(pen, ctx, head, look.hair, options)
  if (look.facialHair) drawBeardBehind(pen, ctx, head, look.facialHair, options)
  if (showsEars(look)) drawEarsBehind(pen, ctx, head, options)
}

/** The head's front pass; `drawFace` draws the face at its place in the order. */
export function drawHeadFront(
  _ctx: CanvasRenderingContext2D,
  pen: Pen,
  look: HeadLook,
  head: SolvedHead,
  pose: Pose,
  options: HeadDrawOptions,
  drawFace: () => void
): void {
  if (isBare(look)) {
    drawFace()
    return
  }
  const away = facesAway(head)
  if (showsEars(look)) drawEarsFront(pen, head, options)
  if (look.hair && !away) drawHairFront(pen, head, look.hair, options)
  if (look.facialHair) drawBeardFront(pen, head, look.facialHair, options, pose.mouthWidth ?? 1)
  drawFace()
  if (look.facialHair) drawMoustache(pen, head, look.facialHair, options)
  if (look.glasses) drawGlasses(pen, head, look.glasses, options)
  if (look.hat && !away) drawHat(pen, head, look.hat, { lineWidth: options.lineWidth, hairVolume: look.hair?.volume ?? 0 })
}

/** After the whole figure: the hair and hat, when the head is turned away. */
export function drawHeadOver(_ctx: CanvasRenderingContext2D, pen: Pen, look: HeadLook, head: SolvedHead, _pose: Pose, options: HeadDrawOptions): void {
  if (!facesAway(head)) return
  if (look.hair) drawHairFront(pen, head, look.hair, options)
  if (look.hat) drawHat(pen, head, look.hat, { lineWidth: options.lineWidth, hairVolume: look.hair?.volume ?? 0 })
}
