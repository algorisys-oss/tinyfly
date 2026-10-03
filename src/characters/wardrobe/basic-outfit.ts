import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints, CharacterLayers } from '../character'
import type { Pen } from '../look/pen'
import { taperedOutline } from '../look/tapered-line'

/**
 * A first outfit for the human character: a T-shirt and trousers, drawn as
 * layers on the body's parts, through the character's pen (so it matches the
 * look). The sleeves grow out of the shirt's shoulders with no seam. The full
 * wardrobe is a later milestone; this is the shape every garment will follow.
 */

export interface BasicOutfitOptions {
  /** Shirt colour (default red) */
  shirt?: string
  /** Trouser colour (default navy) */
  trousers?: string
}

/** The part of a polyline between fractions `from` and `to` of its points. */
const along = (points: Point[], from: number, to: number) =>
  points.slice(Math.floor((points.length - 1) * from), Math.ceil((points.length - 1) * to) + 1)

export function basicOutfit(options: BasicOutfitOptions = {}): CharacterLayers {
  const shirtColor = options.shirt ?? '#e2493b'
  const trouserColor = options.trousers ?? '#24476b'
  const edge = (j: CharacterJoints) => j.lineWidth * 0.45

  const trouser = (j: CharacterJoints, pen: Pen, side: 'left' | 'right') => {
    const leg = j.parts[`leg.${side}`].points
    pen.shape(taperedOutline(leg, j.height * 0.08, j.height * 0.05), trouserColor, edge(j))
  }

  const shirt = (j: CharacterJoints, pen: Pen) => {
    // From a little below the hips to the neck, along the spine, so it leans and bends with it.
    const spine = j.chains.spine
    const hip = spine[0]
    const top = spine[spine.length - 1]
    const below = { x: hip.x - (top.x - hip.x) * 0.25, y: hip.y - (top.y - hip.y) * 0.25 }
    pen.shape(taperedOutline([below, ...j.parts.spine.points], j.height * 0.15, j.height * 0.14), shirtColor, edge(j))
  }

  /**
   * A sleeve starts inside the shirt, part way from the shoulder to the neck,
   * and is outlined only along its sides and cuff: filled in the shirt colour,
   * it covers the shirt's shoulder corner, so the edges run on with no seam.
   */
  const sleeve = (j: CharacterJoints, pen: Pen, side: 'left' | 'right') => {
    const arm = j.parts[`arm.${side}`].points
    const shoulder = arm[0]
    const top = j.chains.spine[j.chains.spine.length - 1]
    const root = { x: shoulder.x + (top.x - shoulder.x) * 0.45, y: shoulder.y + (top.y - shoulder.y) * 0.45 }
    const line = [root, ...along(arm, 0, 0.45)]
    const outline = taperedOutline(line, j.height * 0.085, j.height * 0.06)
    const n = line.length
    const left = outline.slice(0, n)
    const right = outline.slice(n).reverse()
    pen.shape(outline, shirtColor, 0)
    // The outer side runs on from the shoulder; the inner side starts below the armpit, as a seam does.
    const nearBody = (points: Point[]) => Math.hypot(points[1].x - top.x, points[1].y - top.y)
    const [outer, inner] = nearBody(left) > nearBody(right) ? [left, right] : [right, left]
    pen.line(outer.slice(1), edge(j))
    pen.line(inner.slice(Math.ceil(n * 0.45)), edge(j))
    pen.line([left[n - 1], right[n - 1]], edge(j))
  }

  return {
    parts: {
      'leg.left': { over: (_ctx, j, pen) => trouser(j, pen, 'left') },
      'leg.right': { over: (_ctx, j, pen) => trouser(j, pen, 'right') },
      spine: { over: (_ctx, j, pen) => shirt(j, pen) },
      'arm.left': { over: (_ctx, j, pen) => sleeve(j, pen, 'left') },
      'arm.right': { over: (_ctx, j, pen) => sleeve(j, pen, 'right') },
    },
  }
}
