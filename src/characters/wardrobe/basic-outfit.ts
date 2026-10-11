import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints, CharacterLayers } from '../character'
import type { Pen } from '../look/pen'
import { taperedOutline } from '../look/tapered-line'

/**
 * Clothes for the human character, as plain data, drawn as layers on the
 * body's parts through the character's pen (so they match the look). The
 * base is a top and trousers whose sleeves grow out of the shirt's shoulders
 * with no seam; the options change its cut (long or no sleeves, shorts, a
 * skirt) and add pieces worn over it (a collar, a tie, an apron, a lab coat,
 * a hoodie, a cardigan, overalls, a sari) and boots on the feet. The defaults
 * are the original T-shirt and trousers, unchanged.
 */

export interface BasicOutfitOptions {
  /** Shirt colour (default red) */
  shirt?: string
  /** Trouser (or shorts, or skirt) colour (default navy) */
  trousers?: string
  /** Sleeves: `short` (default), `long` (to the wrist) or `none` */
  sleeves?: 'short' | 'long' | 'none'
  /** Below the waist: `trousers` (default), `shorts` (to the knee) or `skirt` */
  bottom?: 'trousers' | 'shorts' | 'skirt'
  /** A shirt collar at the neck */
  collar?: boolean
  /** A tie down the front, in this colour */
  tie?: string | null
  /**
   * Worn over the clothes (default none): an apron, a lab coat, a hoodie (a
   * loose top with a hood at the back, a front pocket and long sleeves), a
   * cardigan (open down the front, buttoned, long sleeves), overalls (a bib
   * on the chest with straps over the shoulders, in the trousers' colour) or
   * a sari (a drape to the ankles with the pallu over the near shoulder)
   */
  over?: 'apron' | 'labCoat' | 'hoodie' | 'cardigan' | 'overalls' | 'sari' | null
  /** The colour of what is worn over (default: white coat, tan apron, grey hoodie, olive cardigan, green sari) */
  overColor?: string
  /** On the feet: nothing (default), or boots to above the ankle */
  shoes?: 'none' | 'boots'
  /** The boots' colour (default dark brown) */
  shoeColor?: string
}

/** What each thing worn over is coloured when nothing is said. */
const OVER_COLORS = { apron: '#d8b48a', labCoat: '#f4f6f8', hoodie: '#6b7280', cardigan: '#6b8e4e', overalls: '', sari: '#16a34a' } as const

/** The part of a polyline between fractions `from` and `to` of its points. */
const along = (points: Point[], from: number, to: number) =>
  points.slice(Math.floor((points.length - 1) * from), Math.ceil((points.length - 1) * to) + 1)

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/**
 * Which leg is drawn last: the nearer one (the body orders parts by how far
 * each stands toward the viewer from where it hangs, small differences being
 * ties, which fall to the right leg). Garments that cover both legs (a skirt,
 * an apron, a coat's skirts) draw with it, so neither leg crosses over them.
 */
function lastLeg(j: CharacterJoints): 'left' | 'right' {
  return orderKey(j, j.parts['leg.left'].depth) > orderKey(j, j.parts['leg.right'].depth) ? 'left' : 'right'
}

/** A part's place in the drawing order, as the body works it out (ties count as 0). */
const orderKey = (j: CharacterJoints, depth: number) => (Math.abs(depth) < 0.01 * j.height ? 0 : depth)

/** Whether the legs are drawn after the body (seen from the front) or before it (from behind). */
const legsAfterBody = (j: CharacterJoints) => orderKey(j, Math.max(j.parts['leg.left'].depth, j.parts['leg.right'].depth)) > 0

/** How much the character's front faces the viewer: 1 front-on, 0 side-on, negative from behind. */
const frontFacing = (j: CharacterJoints) => Math.cos((j.turn * Math.PI) / 2)

export function basicOutfit(options: BasicOutfitOptions = {}): CharacterLayers {
  const shirtColor = options.shirt ?? '#e2493b'
  const trouserColor = options.trousers ?? '#24476b'
  const sleeves = options.sleeves ?? 'short'
  const bottom = options.bottom ?? 'trousers'
  const coat = options.over === 'labCoat'
  const hoodie = options.over === 'hoodie'
  const cardigan = options.over === 'cardigan'
  const overalls = options.over === 'overalls'
  const sari = options.over === 'sari'
  const overColor = options.overColor ?? (options.over && options.over !== 'overalls' ? OVER_COLORS[options.over] : trouserColor)
  const boots = options.shoes === 'boots'
  const shoeColor = options.shoeColor ?? '#3b2a1e'
  const edge = (j: CharacterJoints) => j.lineWidth * 0.45

  const trouser = (j: CharacterJoints, pen: Pen, side: 'left' | 'right') => {
    const leg = j.parts[`leg.${side}`].points
    if (bottom === 'skirt' && !overalls) return
    if (bottom === 'shorts' && !overalls) {
      const short = along(leg, 0, 0.5)
      pen.shape(taperedOutline(short, j.height * 0.085, j.height * 0.07), trouserColor, edge(j))
      return
    }
    pen.shape(taperedOutline(leg, j.height * 0.08, j.height * 0.05), trouserColor, edge(j))
  }

  /** Boots: the foot and the shin above the ankle, in the boot's colour, with a line at the top. */
  const boot = (j: CharacterJoints, pen: Pen, side: 'left' | 'right') => {
    const leg = j.parts[`leg.${side}`].points
    const shod = along(leg, 0.7, 1)
    if (shod.length < 2) return
    pen.shape(taperedOutline(shod, j.height * 0.075, j.height * 0.07), shoeColor, edge(j))
    const top = shod[0]
    const next = shod[1]
    const dx = next.x - top.x
    const dy = next.y - top.y
    const l = Math.hypot(dx, dy) || 1
    const w = j.height * 0.04
    pen.line([{ x: top.x - (dy / l) * w, y: top.y + (dx / l) * w }, { x: top.x + (dy / l) * w, y: top.y - (dx / l) * w }], edge(j) * 0.9)
  }

  /** The spine from a little below the hips to the neck, so the shirt leans and bends with it. */
  const torso = (j: CharacterJoints) => {
    const spine = j.chains.spine
    const hip = spine[0]
    const top = spine[spine.length - 1]
    const below = { x: hip.x - (top.x - hip.x) * 0.25, y: hip.y - (top.y - hip.y) * 0.25 }
    return { hip, top, below, line: [below, ...j.parts.spine.points] }
  }

  const shirt = (j: CharacterJoints, pen: Pen) => {
    // A hoodie is loose: wider, in its own colour; a cardigan and a sari leave the shirt (a blouse) under them.
    const color = hoodie ? overColor : shirtColor
    const wide = hoodie ? 1.14 : 1
    pen.shape(taperedOutline(torso(j).line, j.height * 0.15 * wide, j.height * 0.14 * wide), color, edge(j))
  }

  /** The hood: from the front, a bump behind the neck above the shoulders; from behind, hanging down the back. */
  const hood = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    const { top, hip } = torso(j)
    const w = j.height * 0.07
    const up = { x: (top.x - hip.x) * 0.16, y: (top.y - hip.y) * 0.16 }
    if (facing >= 0) {
      // Behind the neck: the head covers its middle.
      pen.shape(
        [
          { x: top.x - w, y: top.y + up.y * 0.25 },
          { x: top.x - w * 0.8 + up.x, y: top.y + up.y },
          { x: top.x + up.x * 1.2, y: top.y + up.y * 1.35 },
          { x: top.x + w * 0.8 + up.x, y: top.y + up.y },
          { x: top.x + w, y: top.y + up.y * 0.25 },
        ],
        overColor,
        edge(j)
      )
      return
    }
    // Down the back, to the shoulder blades.
    const down = lerp(top, hip, 0.42)
    pen.shape(
      [
        { x: top.x - w * 0.9, y: top.y },
        { x: top.x + w * 0.9, y: top.y },
        { x: down.x + w * 0.7, y: down.y },
        { x: down.x, y: down.y + j.height * 0.02 },
        { x: down.x - w * 0.7, y: down.y },
      ],
      overColor,
      edge(j)
    )
  }

  /** A hoodie's front: the kangaroo pocket and the drawstrings. */
  const hoodieFront = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    if (facing < 0.2) return
    const { top, hip } = torso(j)
    const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.03
    const w = j.height * 0.06 * facing
    const pocketTop = lerp(top, hip, 0.62)
    const pocketBottom = lerp(top, hip, 0.9)
    pen.line([{ x: pocketTop.x + shift - w, y: pocketTop.y }, { x: pocketBottom.x + shift - w * 1.1, y: pocketBottom.y }], edge(j) * 0.7)
    pen.line([{ x: pocketTop.x + shift + w, y: pocketTop.y }, { x: pocketBottom.x + shift + w * 1.1, y: pocketBottom.y }], edge(j) * 0.7)
    const neck = lerp(top, hip, 0.1)
    for (const side of [-1, 1]) pen.line([{ x: neck.x + shift + side * w * 0.2, y: neck.y }, { x: neck.x + shift + side * w * 0.35, y: neck.y + j.height * 0.07 }], edge(j) * 0.6)
  }

  /** A cardigan: over the torso to the hips, open down the front over the shirt, with buttons. */
  const cardiganBody = (j: CharacterJoints, pen: Pen) => {
    const { top, hip } = torso(j)
    const facing = frontFacing(j)
    pen.shape(taperedOutline([top, lerp(top, hip, 0.5), lerp(top, hip, 1.08)], j.height * 0.155, j.height * 0.15), overColor, edge(j))
    if (facing < 0.2) return
    // The opening: a strip of the shirt, the edges lined, and buttons down one side.
    const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.03
    const w = j.height * 0.02 * facing
    const from = lerp(top, hip, 0.12)
    const to = lerp(top, hip, 1.05)
    pen.shape([{ x: from.x + shift - w, y: from.y }, { x: from.x + shift + w, y: from.y }, { x: to.x + shift + w * 1.3, y: to.y }, { x: to.x + shift - w * 1.3, y: to.y }], shirtColor, edge(j) * 0.7)
    for (const t of [0.35, 0.55, 0.75]) {
      const at = lerp(top, hip, t)
      pen.dot(at.x + shift + w * 1.6, at.y, edge(j) * 1.2)
    }
  }

  /** Overalls: a bib on the chest in the trousers' colour, straps over the shoulders, a pocket. */
  const bib = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    const { top, hip } = torso(j)
    const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.04
    const waist = lerp(hip, top, 0.12)
    const chest = lerp(hip, top, 0.74)
    if (facing < 0.15) {
      // From behind: the straps crossing the back.
      if (facing < -0.3) {
        const shoulderL = j.points['shoulder.left']
        const shoulderR = j.points['shoulder.right']
        pen.line([shoulderL, { x: waist.x + j.height * 0.03, y: waist.y }], edge(j) * 0.8)
        pen.line([shoulderR, { x: waist.x - j.height * 0.03, y: waist.y }], edge(j) * 0.8)
      }
      return
    }
    const w = j.height * 0.07 * facing
    pen.shape(
      [
        { x: chest.x + shift - w * 0.75, y: chest.y },
        { x: chest.x + shift + w * 0.75, y: chest.y },
        { x: waist.x + shift + w * 1.1, y: waist.y },
        { x: waist.x + shift - w * 1.1, y: waist.y },
      ],
      trouserColor,
      edge(j)
    )
    // The straps up over the shoulders, and a pocket on the bib.
    for (const side of ['left', 'right'] as const) {
      const shoulder = j.points[`shoulder.${side}`]
      const corner = { x: chest.x + shift + (shoulder.x > chest.x + shift ? 1 : -1) * w * 0.55, y: chest.y }
      pen.line([corner, { x: shoulder.x + (corner.x - shoulder.x) * 0.15, y: shoulder.y + (corner.y - shoulder.y) * 0.15 }], edge(j) * 1.6)
    }
    const pocket = lerp(chest, waist, 0.3)
    const pw = w * 0.4
    pen.line([{ x: pocket.x + shift - pw, y: pocket.y }, { x: pocket.x + shift - pw, y: pocket.y + pw * 1.4 }, { x: pocket.x + shift + pw, y: pocket.y + pw * 1.4 }, { x: pocket.x + shift + pw, y: pocket.y }], edge(j) * 0.6)
  }

  /** A sari: a drape from the waist to the ankles over both legs, flaring, with a fold line. */
  const drape = (j: CharacterJoints, pen: Pen) => {
    const { hip, top } = torso(j)
    const waist = lerp(hip, top, 0.2)
    const ankles = [j.points['ankle.left'], j.points['ankle.right']]
    const hem = lerp(hip, { x: (ankles[0].x + ankles[1].x) / 2, y: (ankles[0].y + ankles[1].y) / 2 }, 0.98)
    const halfWaist = j.height * 0.075
    const halfHem = Math.max(j.height * 0.12, Math.abs(ankles[0].x - ankles[1].x) / 2 + j.height * 0.07)
    const dx = hem.x - waist.x
    const dy = hem.y - waist.y
    const l = Math.hypot(dx, dy) || 1
    const n = { x: -dy / l, y: dx / l }
    pen.shape(
      [
        { x: waist.x + n.x * halfWaist, y: waist.y + n.y * halfWaist },
        { x: hem.x + n.x * halfHem, y: hem.y + n.y * halfHem },
        { x: hem.x - n.x * halfHem, y: hem.y - n.y * halfHem },
        { x: waist.x - n.x * halfWaist, y: waist.y - n.y * halfWaist },
      ],
      overColor,
      edge(j)
    )
    // Pleats: a few folds down the front.
    const facing = frontFacing(j)
    if (facing > 0.2) {
      const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.03
      for (const k of [-0.35, 0, 0.35]) {
        const w0 = halfWaist * 0.5 * k
        const w1 = halfHem * 0.45 * k
        pen.line([{ x: waist.x + shift + n.x * w0, y: waist.y + n.y * w0 + j.height * 0.02 }, { x: hem.x + shift + n.x * w1, y: hem.y + n.y * w1 }], edge(j) * 0.5)
      }
    }
  }

  /** The pallu: a band from the far hip across the chest and over the near shoulder; from behind, down the back. */
  const pallu = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    const { top, hip } = torso(j)
    const toward = Math.sin((j.turn * Math.PI) / 2)
    const near = toward >= 0 ? 'left' : 'right'
    const far = near === 'left' ? 'right' : 'left'
    const shoulder = j.points[`shoulder.${near}`]
    const w = j.height * 0.035
    if (facing < 0.15) {
      // Down the back from the shoulder.
      const down = lerp(top, hip, 0.9)
      pen.shape(taperedOutline([shoulder, { x: down.x + (shoulder.x - top.x) * 0.5, y: down.y }], w * 2.2, w * 2.6), overColor, edge(j))
      return
    }
    const farHip = { x: hip.x + (j.points[`hip.${far}`].x - hip.x) * 1.2, y: lerp(hip, top, 0.08).y }
    pen.shape(taperedOutline([farHip, lerp(farHip, shoulder, 0.5), shoulder], w * 2.4, w * 2), overColor, edge(j))
    // Over the shoulder and hanging behind it.
    const behind = { x: shoulder.x - (hip.x - shoulder.x) * 0.05 - toward * j.height * 0.03, y: shoulder.y + j.height * 0.16 }
    pen.shape(taperedOutline([shoulder, behind], w * 2, w * 1.6), overColor, edge(j))
  }

  /** A skirt from the waist to the knees, flaring out, over both legs. */
  const skirt = (j: CharacterJoints, pen: Pen) => {
    const { hip, top } = torso(j)
    const waist = lerp(hip, top, 0.18)
    const knees = [j.points['knee.left'], j.points['knee.right']]
    const hem = lerp(hip, { x: (knees[0].x + knees[1].x) / 2, y: (knees[0].y + knees[1].y) / 2 }, 1.05)
    const halfWaist = j.height * 0.075
    const halfHem = Math.max(j.height * 0.13, Math.abs(knees[0].x - knees[1].x) / 2 + j.height * 0.08)
    const dx = hem.x - waist.x
    const dy = hem.y - waist.y
    const l = Math.hypot(dx, dy) || 1
    const n = { x: -dy / l, y: dx / l }
    pen.shape(
      [
        { x: waist.x + n.x * halfWaist, y: waist.y + n.y * halfWaist },
        { x: hem.x + n.x * halfHem, y: hem.y + n.y * halfHem },
        { x: hem.x - n.x * halfHem, y: hem.y - n.y * halfHem },
        { x: waist.x - n.x * halfWaist, y: waist.y - n.y * halfWaist },
      ],
      trouserColor,
      edge(j)
    )
  }

  /** A collar: two points either side of the neck, toward the viewer. */
  const collar = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    if (facing < 0.2) return
    const { top, hip } = torso(j)
    const down = { x: (hip.x - top.x) * 0.12, y: (hip.y - top.y) * 0.12 }
    const w = j.height * 0.045 * facing
    for (const side of [-1, 1]) {
      pen.shape(
        [
          { x: top.x + side * w * 0.2, y: top.y + down.y * 0.1 },
          { x: top.x + side * w * 1.3, y: top.y - down.y * 0.1 },
          { x: top.x + side * w * 0.6 + down.x, y: top.y + down.y },
        ],
        shirtColor,
        edge(j) * 0.8
      )
    }
  }

  /** A tie down the middle of the shirt's front. */
  const tie = (j: CharacterJoints, pen: Pen, color: string) => {
    const facing = frontFacing(j)
    if (facing < 0.25) return
    const { top, hip } = torso(j)
    const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.03
    const at = (t: number) => ({ x: lerp(top, hip, t).x + shift, y: lerp(top, hip, t).y })
    const w = j.height * 0.022 * facing
    const knot = at(0.08)
    const end = at(0.62)
    pen.shape([{ x: knot.x - w, y: knot.y - w }, { x: knot.x + w, y: knot.y - w }, { x: knot.x + w * 0.6, y: knot.y + w }, { x: knot.x - w * 0.6, y: knot.y + w }], color, edge(j) * 0.7)
    pen.shape([{ x: knot.x - w * 0.6, y: knot.y + w }, { x: knot.x + w * 0.6, y: knot.y + w }, { x: end.x + w * 1.4, y: end.y - w * 2 }, end, { x: end.x - w * 1.4, y: end.y - w * 2 }], color, edge(j) * 0.7)
  }

  /** An apron: a bib and a skirt on the front; from behind, only its ties. */
  const apron = (j: CharacterJoints, pen: Pen) => {
    const facing = frontFacing(j)
    const { top, hip } = torso(j)
    const chest = lerp(hip, top, 0.72)
    const knees = [j.points['knee.left'], j.points['knee.right']]
    const hem = lerp(hip, { x: (knees[0].x + knees[1].x) / 2, y: (knees[0].y + knees[1].y) / 2 }, 0.9)
    const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.04
    if (facing < 0.15) {
      // From behind: the bow at the waist.
      const waist = lerp(hip, top, 0.2)
      if (facing < -0.3) pen.line([{ x: waist.x - j.height * 0.05, y: waist.y }, { x: waist.x + j.height * 0.05, y: waist.y }], edge(j))
      return
    }
    const w = j.height * 0.075 * facing
    const waist = lerp(hip, top, 0.2)
    pen.shape(
      [
        { x: chest.x + shift - w * 0.7, y: chest.y },
        { x: chest.x + shift + w * 0.7, y: chest.y },
        { x: waist.x + shift + w, y: waist.y },
        { x: hem.x + shift + w * 1.15, y: hem.y },
        { x: hem.x + shift - w * 1.15, y: hem.y },
        { x: waist.x + shift - w, y: waist.y },
      ],
      overColor,
      edge(j)
    )
    // The neck strap.
    pen.line([{ x: chest.x + shift - w * 0.6, y: chest.y }, { x: top.x - w * 0.2, y: top.y }, { x: chest.x + shift + w * 0.6, y: chest.y }], edge(j) * 0.8)
  }

  /** A lab coat: a long open coat over the clothes, to the knees; `skirts` draws the part below the waist. */
  const labCoat = (j: CharacterJoints, pen: Pen, skirts: boolean) => {
    const { top, hip } = torso(j)
    const knees = [j.points['knee.left'], j.points['knee.right']]
    const hem = lerp(hip, { x: (knees[0].x + knees[1].x) / 2, y: (knees[0].y + knees[1].y) / 2 }, 0.95)
    if (skirts) {
      // From just above the waist down: drawn over the legs.
      pen.shape(taperedOutline([lerp(top, hip, 0.8), hip, hem], j.height * 0.145, j.height * 0.17), overColor, edge(j))
    } else {
      pen.shape(taperedOutline([top, lerp(top, hip, 0.5), hip], j.height * 0.14, j.height * 0.15), overColor, edge(j))
    }
    const facing = frontFacing(j)
    if (facing > 0.2) {
      // The opening down the front, and a pocket on the chest.
      const shift = Math.sin((j.turn * Math.PI) / 2) * j.height * 0.03
      const [from, to] = skirts ? [hip, hem] : [top, hip]
      pen.line([{ x: from.x + shift, y: from.y }, { x: to.x + shift, y: to.y }], edge(j) * 0.8)
      if (!skirts) {
        const pocket = lerp(top, hip, 0.35)
        const w = j.height * 0.025 * facing
        pen.shape([{ x: pocket.x + shift - w * 2.4, y: pocket.y }, { x: pocket.x + shift - w * 0.6, y: pocket.y }, { x: pocket.x + shift - w * 0.6, y: pocket.y + w * 1.6 }, { x: pocket.x + shift - w * 2.4, y: pocket.y + w * 1.6 }], overColor, edge(j) * 0.6)
      }
    }
  }

  /**
   * A sleeve starts inside the shirt, part way from the shoulder to the neck,
   * and is outlined only along its sides and cuff: filled in the shirt colour,
   * it covers the shirt's shoulder corner, so the edges run on with no seam.
   */
  const sleeve = (j: CharacterJoints, pen: Pen, side: 'left' | 'right', color: string, length: number) => {
    const arm = j.parts[`arm.${side}`].points
    const shoulder = arm[0]
    const top = j.chains.spine[j.chains.spine.length - 1]
    const root = { x: shoulder.x + (top.x - shoulder.x) * 0.45, y: shoulder.y + (top.y - shoulder.y) * 0.45 }
    const line = [root, ...along(arm, 0, length)]
    const outline = taperedOutline(line, j.height * 0.085, j.height * (length > 0.6 ? 0.045 : 0.06))
    const n = line.length
    const left = outline.slice(0, n)
    const right = outline.slice(n).reverse()
    pen.shape(outline, color, 0)
    // The outer side runs on from the shoulder; the inner side starts below the armpit, as a seam does.
    const nearBody = (points: Point[]) => Math.hypot(points[1].x - top.x, points[1].y - top.y)
    const [outer, inner] = nearBody(left) > nearBody(right) ? [left, right] : [right, left]
    pen.line(outer.slice(1), edge(j))
    pen.line(inner.slice(Math.ceil(n * 0.45)), edge(j))
    pen.line([left[n - 1], right[n - 1]], edge(j))
  }

  // A lab coat's, a hoodie's and a cardigan's sleeves are their own, and long.
  const longOver = coat || hoodie || cardigan
  const sleeveColor = longOver ? overColor : shirtColor
  const sleeveLength = longOver || sleeves === 'long' ? 0.95 : 0.45
  const hasSleeves = longOver || sleeves !== 'none'

  /** What covers both legs: drawn after both legs and the shirt, whichever comes last. */
  const overLegs = (j: CharacterJoints, pen: Pen) => {
    if (bottom === 'skirt' && !overalls && !sari) skirt(j, pen)
    if (sari) drape(j, pen)
    if (coat) labCoat(j, pen, true)
    if (options.over === 'apron') apron(j, pen)
  }

  /** A leg's trousers and boots, and, when the legs come after the body, what covers both. */
  const leg = (side: 'left' | 'right') => (_ctx: CanvasRenderingContext2D, j: CharacterJoints, pen: Pen) => {
    trouser(j, pen, side)
    if (boots) boot(j, pen, side)
    if (lastLeg(j) === side && legsAfterBody(j)) overLegs(j, pen)
  }

  return {
    parts: {
      'leg.left': { over: leg('left') },
      'leg.right': { over: leg('right') },
      spine: {
        over: (_ctx, j, pen) => {
          if (hoodie && frontFacing(j) >= 0) hood(j, pen)
          shirt(j, pen)
          if (options.collar && !hoodie) collar(j, pen)
          if (options.tie && !hoodie) tie(j, pen, options.tie)
          if (coat) labCoat(j, pen, false)
          if (cardigan) cardiganBody(j, pen)
          if (hoodie) {
            if (frontFacing(j) < 0) hood(j, pen)
            hoodieFront(j, pen)
          }
          if (overalls) bib(j, pen)
          if (sari) pallu(j, pen)
          if (!legsAfterBody(j)) overLegs(j, pen)
        },
      },
      'arm.left': { over: hasSleeves ? (_ctx, j, pen) => sleeve(j, pen, 'left', sleeveColor, sleeveLength) : undefined },
      'arm.right': { over: hasSleeves ? (_ctx, j, pen) => sleeve(j, pen, 'right', sleeveColor, sleeveLength) : undefined },
    },
  }
}
