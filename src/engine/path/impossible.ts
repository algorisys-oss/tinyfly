/**
 * Impossible objects, as plain geometry: the Penrose triangle (three beams
 * that seem to join in a loop) and the Penrose stairs (a flight that climbs
 * for ever), built the way the sculptures are: real boxes in 3D that only
 * line up from one viewpoint. Seen along the (1, 1, 1) diagonal (the
 * isometric view), the ends meet on screen though they are far apart in
 * depth, and drawing the boxes far to near makes the near end cover the far
 * one. Everything here is pure: boxes in, screen polygons out, for any
 * renderer that fills polygons.
 */

export type Vec3 = [number, number, number]

export interface IsoPoint {
  x: number
  y: number
}

/** A box by its two corners, in a right-handed space with z up. */
export interface IsoBox {
  min: Vec3
  max: Vec3
  /** Anything to carry to the faces (a bar's index, a step's number) */
  tag?: number
  /** Faces not to draw (an end cap that another box's drawing should cover) */
  hide?: Array<'top' | 'left' | 'right'>
}

/** One visible face of a box on screen: its polygon, which way it faces, and its depth (further is smaller). */
export interface IsoFace {
  points: IsoPoint[]
  /** `top` faces up (+z), `left` faces +y (toward the lower left on screen), `right` faces +x (lower right) */
  side: 'top' | 'left' | 'right'
  depth: number
  tag?: number
}

export interface IsoOptions {
  /** Where the origin lands on screen (default 0, 0) */
  centre?: IsoPoint
  /** Screen px per unit (default 1) */
  scale?: number
}

/**
 * The isometric projection: the view along (1, 1, 1) with z up. +x runs to
 * the lower right, +y to the lower left, +z straight up.
 */
export function projectIsometric([x, y, z]: Vec3, options: IsoOptions = {}): IsoPoint {
  const s = options.scale ?? 1
  const c = options.centre ?? { x: 0, y: 0 }
  const cos30 = Math.sqrt(3) / 2
  return { x: c.x + (x - y) * cos30 * s, y: c.y + ((x + y) * 0.5 - z) * s }
}

/** How far along the view direction a point is: larger is nearer the viewer. */
export const isoDepth = ([x, y, z]: Vec3): number => x + y + z

/** The three faces of a box that show in the isometric view: top (+z), left (+y) and right (+x). */
export function isometricBoxFaces(box: IsoBox, options: IsoOptions = {}): IsoFace[] {
  const [x0, y0, z0] = box.min
  const [x1, y1, z1] = box.max
  const p = (v: Vec3) => projectIsometric(v, options)
  const centre: Vec3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]
  const depth = isoDepth(centre)
  const faces: IsoFace[] = [
    { side: 'top', depth, tag: box.tag, points: [p([x0, y0, z1]), p([x1, y0, z1]), p([x1, y1, z1]), p([x0, y1, z1])] },
    { side: 'left', depth, tag: box.tag, points: [p([x0, y1, z0]), p([x1, y1, z0]), p([x1, y1, z1]), p([x0, y1, z1])] },
    { side: 'right', depth, tag: box.tag, points: [p([x1, y0, z0]), p([x1, y1, z0]), p([x1, y1, z1]), p([x1, y0, z1])] },
  ]
  return box.hide ? faces.filter((face) => !box.hide!.includes(face.side)) : faces
}

/** Every visible face of a set of boxes, far to near, so filling them in order draws the picture. */
export function isometricFaces(boxes: IsoBox[], options: IsoOptions = {}): IsoFace[] {
  return boxes
    .map((box) => ({ box, depth: isoDepth([(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2]) }))
    .sort((a, b) => a.depth - b.depth)
    .flatMap(({ box }) => isometricBoxFaces(box, options))
}

export interface PenroseTriangleOptions extends IsoOptions {
  /** The beams' length, units (default 10) */
  size?: number
  /** The beams' thickness, units (default 2) */
  thickness?: number
}

/**
 * The Penrose triangle as three square beams: along x, then y, then up z,
 * each starting where the last ended. The third ends exactly one diagonal
 * (1, 1, 1) step from where the first began, so on screen the loop closes.
 * Returns the beams (tag 0, 1, 2) and their faces in drawing order: far to
 * near, then the first beam again over the third's end (its own end cap
 * left out), which is what makes every corner look the same.
 */
export function penroseTriangle(options: PenroseTriangleOptions = {}): { boxes: IsoBox[]; faces: IsoFace[] } {
  const L = options.size ?? 10
  const t = options.thickness ?? 2
  const h = t / 2
  // The corners are the origin, (L, 0, 0) and (L, L, 0); the loop closes at (L, L, L). The first beam
  // starts half a thickness early, so the third's end cap lands inside its silhouette.
  const boxes: IsoBox[] = [
    { tag: 0, min: [-h, -h, -h], max: [L - h, h, h] },
    { tag: 1, min: [L - h, -h, -h], max: [L + h, L - h, h] },
    { tag: 2, min: [L - h, L - h, -h], max: [L + h, L + h, L] },
  ]
  const centre = options.centre ?? { x: 0, y: 0 }
  const mid = projectIsometric([(2 * L) / 3, L / 3, L / 3], { scale: options.scale })
  const shifted = { centre: { x: centre.x - mid.x, y: centre.y - mid.y }, scale: options.scale }
  return { boxes, faces: [...isometricFaces(boxes, shifted), ...isometricBoxFaces({ ...boxes[0], hide: ['right'] }, shifted)] }
}

export interface PenroseStairsOptions extends IsoOptions {
  /** Steps on each of the two long flights (default 8); the two coming back are shorter by the climb */
  steps?: number
  /** A step's depth along the flight, units (default 1.5) */
  tread?: number
  /** How much each step climbs, units (default 0.25); nudged so the loop closes exactly (see the result's `rise`) */
  rise?: number
  /** The flights' width, units (default 3) */
  width?: number
  /** How high the first step's top is above the floor the blocks stand on, units (default 1.5) */
  base?: number
}

/**
 * The Penrose stairs: four flights round a square, every step a little higher
 * than the last, and the last step one diagonal (1, 1, 1) from the first so
 * the top step meets the bottom one on screen. The flights coming back are
 * shorter by the climb (the ring is really a spiral), and the rise is nudged
 * so that works out in whole steps. Returns the steps (tag: the step's
 * number) and their faces, far to near, and the rise used.
 */
export function penroseStairs(options: PenroseStairsOptions = {}): { boxes: IsoBox[]; faces: IsoFace[]; rise: number } {
  const long = Math.max(2, Math.round(options.steps ?? 8))
  const tread = options.tread ?? 1.5
  const asked = options.rise ?? 0.25
  const w = options.width ?? 3
  const base = options.base ?? 1.5
  // With N steps of rise r, the ring must come back short by N·r on each axis: the two short flights have
  // long − N·r / tread steps. Choose that count whole, then the rise that makes it exact.
  const short = Math.max(1, Math.round((long * (tread - 2 * asked)) / (tread + 2 * asked)))
  const total = 2 * (long + short)
  const rise = (tread * (long - short)) / total
  const legs: Array<{ dir: Vec3; across: Vec3; count: number }> = [
    { dir: [1, 0, 0], across: [0, 1, 0], count: long },
    { dir: [0, 1, 0], across: [-1, 0, 0], count: long },
    { dir: [-1, 0, 0], across: [0, -1, 0], count: short },
    { dir: [0, -1, 0], across: [1, 0, 0], count: short },
  ]
  const boxes: IsoBox[] = []
  let at: Vec3 = [0, 0, 0]
  let step = 0
  for (const leg of legs) {
    for (let k = 0; k < leg.count; k++) {
      const z = step * rise
      const corner: Vec3 = [at[0] + leg.dir[0] * k * tread, at[1] + leg.dir[1] * k * tread, 0]
      const far: Vec3 = [corner[0] + leg.dir[0] * tread + leg.across[0] * w, corner[1] + leg.dir[1] * tread + leg.across[1] * w, 0]
      // Each step is a block from the floor up: the flights stand on a solid base, as in the drawings.
      boxes.push({
        tag: step,
        min: [Math.min(corner[0], far[0]), Math.min(corner[1], far[1]), 0],
        max: [Math.max(corner[0], far[0]), Math.max(corner[1], far[1]), z + base],
      })
      step++
    }
    at = [at[0] + leg.dir[0] * leg.count * tread, at[1] + leg.dir[1] * leg.count * tread, 0]
  }
  const climb = total * rise
  const centre = options.centre ?? { x: 0, y: 0 }
  const mid = projectIsometric([(long * tread) / 2, (long * tread) / 2, climb / 2 + base], { scale: options.scale })
  const shifted = { centre: { x: centre.x - mid.x, y: centre.y - mid.y }, scale: options.scale }
  return { boxes, faces: isometricFaces(boxes, shifted), rise }
}
