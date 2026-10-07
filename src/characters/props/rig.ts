import { mat4, quat, type Mat4, type Vec3 } from '../../engine/math'
import type { Point } from '../../adapters/canvas/sketch'
import type { PropertyInfo } from '../../adapters/canvas/target-properties'
import { rotX, rotY, type ViewProjection } from '../rig/skeleton'
import { shapeMesh, type Mesh, type PropShape } from './shapes'
import { clipPolygon, clipPolyline } from './clip'
import { matrixKey, placedMesh, propColumns, type Cell } from './slice'
import { hiddenFaces, solidsOf } from './hidden'

/**
 * A prop's rig: parts on pivots, controls that move them, and anchors where
 * other things attach (a seat, a door handle). Like a character's body plan,
 * it is plain data; `solveProp` poses it with control values and projects it
 * through a view, the same `ViewProjection` contract the v2 human is drawn
 * with, so a car turns toward the camera the way a character does.
 *
 * Prop space: +y up (the ground is y = 0), +z the way the prop faces, +x its
 * left. Units are metres.
 */

export interface PropPart {
  id: string
  /** The part it hangs from (its `at` is in that part's space); default the prop itself */
  parent?: string
  shape: PropShape
  /** Where its origin sits in its parent's space (default 0, 0, 0) */
  at?: Vec3
  /** Turned about its origin as built, degrees about x, then y, then z (a head tipped down from its neck) */
  rotate?: Vec3
  /** Fill colour (none when omitted) */
  fill?: string
  /** Outline colour (default the prop's ink) */
  ink?: string
  /** Outline weight, × the prop's line width (default 1; 0 draws no outline) */
  outline?: number
  /** Drawn after a rider (a figure in a seat or a doorway), so it covers the rider: a car's doors, a house's door */
  overRider?: boolean
  /** A rider shows through it: glass, an open doorway. A rider is clipped to these, so the rest of the prop hides it */
  seeThrough?: boolean
  /** Left out of the stick look (line art): rounding that only the solid look needs, such as knee joints */
  solidOnly?: boolean
  /**
   * Where parts sit into each other, which one is drawn over in a 3D scene
   * (default 0): a cabin sitting down into a car's body is drawn over it (1).
   * Seen in perspective from anywhere, overlapping parts can't always be
   * ordered by depth; this says how they overlap.
   */
  layer?: number
  /** The fill blends toward this colour as the control goes 0 → 1: lights, lit windows */
  glow?: { control: string; color: string }
  /** Its opacity follows a control: `from` at 0, `to` at 1 (a rotor disc that appears as the blades blur) */
  fade?: { control: string; from: number; to: number }
}

/** How a control moves parts: per unit of the control's value. */
export interface ControlBinding {
  parts: string[]
  /** Turn about an axis through `pivot` (in the part's space), `degrees` per unit */
  rotate?: { axis: 'x' | 'y' | 'z'; degrees: number; pivot?: Vec3 }
  /** Move by this much per unit, metres */
  translate?: Vec3
  /** Scale toward this at 1 (1 + (s − 1) × value), about the part's origin */
  scale?: Vec3
}

export interface ControlSpec extends PropertyInfo {
  /** Its value before anything moves it (default 0) */
  default?: number
  bind?: ControlBinding[]
}

export interface PropAnchor {
  /** The part it moves with (default the prop itself) */
  part?: string
  at: Vec3
}

export interface PropRig {
  parts: PropPart[]
  /** The prop's own controls; every prop also has the common ones (`PROP_COMMON_CONTROLS`) */
  controls: Record<string, ControlSpec>
  anchors?: Record<string, PropAnchor>
  /** Front to back and its height, metres: the size of its box */
  length: number
  height: number
  /** Its footprint on the ground, across and front to back, metres, for its contact shadow (default 45% of its length across, its length) */
  footprint?: [number, number]
  /**
   * Controls worked out from the others before the rig is posed, returned to
   * replace them: an animal's leg angles, its own pose (a rear's tucked front
   * legs) plus its stride from its gait and phase. Pure: the same values
   * always give the same result.
   */
  derive?: (values: Record<string, number>) => Record<string, number>
}

/** Controls every prop has: how it is seen, and how its whole body squashes, tips and leans. */
export const PROP_COMMON_CONTROLS: Record<string, ControlSpec> = {
  turn: { description: 'Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D', unit: 'quarter turns' },
  tilt: { description: 'How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down', unit: 'degrees', default: 12, min: -90, max: 90 },
  pitch: { description: 'Nose up (+) or down (−), about its middle on the ground', unit: 'degrees' },
  roll: { description: 'Tipped onto its right (+) or left (−) side', unit: 'degrees' },
  squash: { description: 'Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched', unit: 'factor', default: 1, min: 0.3, max: 3 },
  lift: { description: 'Off the ground', unit: 'metres' },
  lean: { description: 'The top sheared forward (+) or back (−): speed and drag', unit: 'shear' },
  size: { description: 'Its size, about the ground: 1 as built, 0 gone (pop it in or out)', unit: 'factor', default: 1, min: 0 },
}

const DEG = Math.PI / 180

/** A view of a prop: turned by `turn`, looked down on by `tilt`, drawn at `scale` px per metre (feet at 0, 0; up is −y). */
export function propView(turn: number, tilt: number, scale: number): ViewProjection {
  return {
    toView: (v) => rotX(rotY(v, turn * 90 * DEG), -tilt * DEG),
    toScreen: (v) => ({ x: v[0] * scale, y: -v[1] * scale }),
  }
}

export interface SolveOptions {
  /**
   * The view is a perspective camera's (a 3D scene's), with the eye at the
   * view's origin looking down −z: faces are seen when they turn toward the
   * eye, not just toward +z.
   */
  perspective?: boolean
  /**
   * With `perspective`: the camera's near plane, metres in front of the eye.
   * What is nearer than that (or behind the eye) is cut away before it is
   * projected, so a camera close to a prop, or inside it, sees it rightly.
   */
  near?: number
  /**
   * Cut the prop into columns about this many metres across (`cells`),
   * each with its own depth: for drawing it among other things, a column at
   * a time (a 3D scene). Off by default.
   */
  slice?: number
  /**
   * Light each seen face as a scene would: given its middle and outward
   * normal in the prop's space, the light reaching it (RGB, 1 is full light)
   * and how much fog covers it. Without it, faces are shaded by a light that
   * follows the camera (`tone`).
   */
  light?: (middle: Vec3, normal: Vec3) => { light: [number, number, number]; fog: number }
}

/** A seen face, ready to draw. */
export interface SolvedFace {
  points: Point[]
  /** Nearer is larger */
  depth: number
  /** Lit (1.05) to shaded (0.72), from how it faces the light */
  tone: number
  /** With `slice`: the outlines that belong to this face (it is the nearest seen face beside them) */
  edges?: Point[][]
  /** With `slice`: the marks drawn on this face (a wheel's spokes) */
  marks?: Point[][]
  /** With `light`: the light reaching it (RGB, 1 is full light) and how much fog covers it, 0..1 */
  light?: [number, number, number]
  fog?: number
  /** With `slice`: its middle and its normal, in view space (to find the face a panel lies on) */
  center?: Vec3
  normal?: Vec3
}

export interface SolvedPart {
  part: PropPart
  /** Nearer is larger */
  depth: number
  /** Seen faces, far to near */
  faces: SolvedFace[]
  /** Outlines (silhouette and creases), chained into strokes */
  edges: Point[][]
  /** Marks that move with it (spokes) */
  marks: Point[][]
  /** How lit its glow is, 0..1 */
  glow: number
  /** How opaque it is, 0..1 */
  opacity: number
  /** A tube's centre line on screen, for drawing it as a single stroke (the stick look) */
  spine?: Point[]
  /** A piece cut from its part at column walls (with `slice`): its faces meet the next piece's along the cuts */
  cut?: boolean
}

export interface SolvedProp {
  /** Parts far to near, those drawn under a rider first */
  under: SolvedPart[]
  over: SolvedPart[]
  anchors: Record<string, { point: Point; depth: number }>
  /** Where a rider shows through: the seen faces of its see-through parts (glass, doorways), in drawing space */
  openings: Point[][]
  /** Its contact shadow: an ellipse on the ground under it, smaller and fainter as it lifts */
  shadow: { points: Point[]; opacity: number }
  /**
   * With `slice`: the prop cut into columns, each with its depth (nearer is
   * larger) and its pieces in drawing order, for drawing column by column
   * among other things
   */
  cells?: Array<{ depth: number; parts: SolvedPart[] }>
  /** Screen px per metre at the prop */
  pxPerUnit: number
  /** How tall the prop is on screen, px (its outlines are weighted by it) */
  sizePx: number
}

const meshCache = new WeakMap<PropShape, Mesh>()
/** A shape's mesh, built once (shared, so caches keyed by it hold). */
export const propShapeMesh = (shape: PropShape) => meshOf(shape)

const meshOf = (shape: PropShape) => {
  let mesh = meshCache.get(shape)
  if (!mesh) meshCache.set(shape, (mesh = shapeMesh(shape)))
  return mesh
}

/** A control's value: the given one, else its default. */
export function controlValue(rig: PropRig, values: Record<string, number>, name: string): number {
  return values[name] ?? rig.controls[name]?.default ?? PROP_COMMON_CONTROLS[name]?.default ?? 0
}

/** The whole body's transform in prop space: squash about the ground, lean, roll, pitch, lift. */
function bodyMatrix(rig: PropRig, values: Record<string, number>): Mat4 {
  const squash = Math.max(0.05, controlValue(rig, values, 'squash'))
  const across = 1 / Math.sqrt(squash)
  const lean = controlValue(rig, values, 'lean')
  const shear: Mat4 = [1, 0, 0, 0, 0, 1, lean, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  return [
    mat4.translation([0, controlValue(rig, values, 'lift'), 0]),
    mat4.fromQuat(quat.fromAxisAngle([1, 0, 0], -controlValue(rig, values, 'pitch'))),
    mat4.fromQuat(quat.fromAxisAngle([0, 0, 1], controlValue(rig, values, 'roll'))),
    shear,
    mat4.scaling([across, squash, across]),
    mat4.scaling(Array(3).fill(Math.max(0, controlValue(rig, values, 'size'))) as Vec3),
  ].reduce((m, next) => mat4.multiply(m, next))
}

/** Each part's transform into prop space, parents first. */
function partMatrices(rig: PropRig, values: Record<string, number>): Map<string, Mat4> {
  const body = bodyMatrix(rig, values)
  const out = new Map<string, Mat4>()
  const bindings = Object.entries(rig.controls).flatMap(([name, spec]) => (spec.bind ?? []).map((bind) => ({ value: controlValue(rig, values, name), bind })))
  const solve = (part: PropPart): Mat4 => {
    const known = out.get(part.id)
    if (known) return known
    const parentPart = part.parent ? rig.parts.find((p) => p.id === part.parent) : undefined
    if (part.parent && !parentPart) throw new Error(`prop rig: part "${part.id}" hangs from "${part.parent}", which is not a part`)
    let m = mat4.multiply(parentPart ? solve(parentPart) : body, mat4.translation(part.at ?? [0, 0, 0]))
    if (part.rotate) {
      const [rx, ry, rz] = part.rotate
      if (rx) m = mat4.multiply(m, mat4.fromQuat(quat.fromAxisAngle([1, 0, 0], rx)))
      if (ry) m = mat4.multiply(m, mat4.fromQuat(quat.fromAxisAngle([0, 1, 0], ry)))
      if (rz) m = mat4.multiply(m, mat4.fromQuat(quat.fromAxisAngle([0, 0, 1], rz)))
    }
    for (const { value, bind } of bindings) {
      if (!bind.parts.includes(part.id) || value === 0) continue
      if (bind.translate) m = mat4.multiply(m, mat4.translation([bind.translate[0] * value, bind.translate[1] * value, bind.translate[2] * value]))
      if (bind.rotate) {
        const pivot = bind.rotate.pivot ?? [0, 0, 0]
        const axis: Vec3 = bind.rotate.axis === 'x' ? [1, 0, 0] : bind.rotate.axis === 'y' ? [0, 1, 0] : [0, 0, 1]
        m = [m, mat4.translation(pivot), mat4.fromQuat(quat.fromAxisAngle(axis, bind.rotate.degrees * value)), mat4.translation([-pivot[0], -pivot[1], -pivot[2]])].reduce((a, b) => mat4.multiply(a, b))
      }
      if (bind.scale) m = mat4.multiply(m, mat4.scaling([1 + (bind.scale[0] - 1) * value, 1 + (bind.scale[1] - 1) * value, 1 + (bind.scale[2] - 1) * value]))
    }
    out.set(part.id, m)
    return m
  }
  for (const part of rig.parts) solve(part)
  return out
}

/** The light, in view space: from the upper left, in front. */
const LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.45, 0.75, 0.5]
  const length = Math.hypot(...v)
  return [v[0] / length, v[1] / length, v[2] / length]
})()

/** Edges between seen faces at more than this angle are creases. */
const CREASE_COS = Math.cos(35 * DEG)

/**
 * The prop posed with control values and seen through a view: its parts'
 * seen faces, outlines and marks, sorted far to near, and its anchors.
 */
export function solveProp(rig: PropRig, given: Record<string, number>, view: ViewProjection, scale: number, options: SolveOptions = {}): SolvedProp {
  // Derived controls (an animal's legs from its gait) are worked out first, from everything given.
  const values = rig.derive ? { ...given, ...rig.derive(given) } : given
  const matrices = partMatrices(rig, values)
  // A direction is seen as the view of its tip less the view of the origin: a scene camera's view also moves points.
  const viewOrigin = view.toView([0, 0, 0])
  const rotationOf = (m: Mat4) => (v: Vec3): Vec3 => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]]
  // One part (or a piece of one cut at a column wall, already in the prop's space) as seen.
  // With `slice`, the prop is cut into columns (see `slice.ts`) in its rest space (before its pitch, lift and
  // squash, so most parts hold still there and their cuts are cached), and faces inside another solid part, or
  // against one, are left out (see `hidden.ts`).
  const body = bodyMatrix(rig, values)
  const rest = options.slice === undefined ? null : mat4.invert(body)
  const placedParts = rest ? rig.parts.map((part) => ({ part, mesh: meshOf(part.shape), local: mat4.multiply(rest, matrices.get(part.id)!), whole: part.shape.type === 'tube' })) : undefined
  const columns = placedParts ? propColumns(placedParts, options.slice!) : undefined
  const solids = placedParts ? solidsOf(placedParts.map((p) => ({ part: p.part.id, mesh: p.mesh, ...placedMesh(p.mesh, p.local) }))) : undefined
  // One part (or a piece of one cut at a column wall), as seen; `local` places it in rest space, for hiding faces.
  const solvePiece = (part: PropPart, mesh: Mesh, m: Mat4, local?: Mat4): SolvedPart => {
    const viewOf = (p: Vec3) => view.toView(mat4.transformPoint(m, p))
    const seen = mesh.vertices.map(viewOf)
    const screen = seen.map((v) => view.toScreen(v))
    // In front of the near plane only (when there is one): polygons and lines are cut there, then projected.
    const near = options.perspective ? options.near : undefined
    const project = (points: Vec3[]) => points.map((v) => view.toScreen(v))
    const polygon = (points: Vec3[]) => (near === undefined ? points : clipPolygon(points, near))
    const lines = (points: Vec3[]) => (near === undefined ? [points] : clipPolyline(points, near))
    const turnNormal = rotationOf(m)
    const normals = mesh.faces.map((face) => {
      const turned = view.toView(turnNormal(face.normal))
      const n: Vec3 = [turned[0] - viewOrigin[0], turned[1] - viewOrigin[1], turned[2] - viewOrigin[2]]
      const length = Math.hypot(...n) || 1
      return [n[0] / length, n[1] / length, n[2] / length] as Vec3
    })
    // Seen faces turn toward the viewer: along +z in a flat view; toward the eye (the view's origin) in perspective.
    const hidden = solids && local ? hiddenFaces(part.id, mesh, local, matrixKey(local), solids) : undefined
    const hiddenFace = (i: number) => hidden?.[i] ?? false
    const visible = normals.map((n, i) => {
      if (hiddenFace(i)) return false
      if (!options.perspective) return n[2] > 1e-6
      const corners = mesh.faces[i].corners
      const middle = corners.reduce<Vec3>((sum, c) => [sum[0] + seen[c][0], sum[1] + seen[c][1], sum[2] + seen[c][2]], [0, 0, 0])
      return -(n[0] * middle[0] + n[1] * middle[1] + n[2] * middle[2]) > 1e-9
    })
    const faceDepth = (i: number) => mesh.faces[i].corners.reduce((sum, c) => sum + seen[c][2], 0) / mesh.faces[i].corners.length
    const seenFaces = mesh.faces
      .map((face, i) => ({ face, i }))
      .filter(({ i }) => visible[i])
      .map(({ face, i }) => ({
        i,
        solved: {
          points: near === undefined ? face.corners.map((c) => screen[c]) : project(polygon(face.corners.map((c) => seen[c]))),
          depth: faceDepth(i),
          tone: 0.72 + 0.33 * Math.max(0, normals[i][0] * LIGHT[0] + normals[i][1] * LIGHT[1] + normals[i][2] * LIGHT[2]),
        } as SolvedFace,
      }))
      .filter((face) => face.solved.points.length >= 3)
      .sort((a, b) => a.solved.depth - b.solved.depth)
    if (options.light) {
      // Lit as the scene's own meshes are: at the face's middle, along its normal, in the prop's space.
      const turn = rotationOf(m)
      for (const { i, solved: face } of seenFaces) {
        const corners = mesh.faces[i].corners
        const middle = corners.reduce<Vec3>((sum, c) => {
          const p = mat4.transformPoint(m, mesh.vertices[c])
          return [sum[0] + p[0] / corners.length, sum[1] + p[1] / corners.length, sum[2] + p[2] / corners.length]
        }, [0, 0, 0])
        const n = turn(mesh.faces[i].normal)
        const length = Math.hypot(...n) || 1
        const lit = options.light(middle, [n[0] / length, n[1] / length, n[2] / length])
        face.light = lit.light
        face.fog = lit.fog
      }
    }
    const faces = seenFaces.map((face) => face.solved)
    // Outlines: an edge between a seen and an unseen face, a seen face's open edge, or a crease between seen faces.
    const edgeFaces = edgesOf(mesh)
    const drawn: Array<[number, number]> = []
    // Which seen face each outline belongs to (the nearest beside it), for drawing face by face.
    const owners: number[] = []
    for (const [key, around] of edgeFaces) {
      const seenCount = around.filter((i) => visible[i]).length
      if (seenCount === 0) continue
      const crease =
        around.length === 2 && seenCount === 2 && mesh.creases !== false &&
        normals[around[0]][0] * normals[around[1]][0] + normals[around[0]][1] * normals[around[1]][1] + normals[around[0]][2] * normals[around[1]][2] < CREASE_COS
      // A joined shape's open edges are where it meets the next segment, and a piece's open edges on a column
      // wall are where it was cut: not outlines.
      if (around.length === 1 && (mesh.joined || onWall(mesh, key))) continue
      if (around.length === 1 || seenCount === 1 || crease) {
        drawn.push(key.split('-').map(Number) as [number, number])
        owners.push(around.filter((i) => visible[i]).reduce((best, i) => (faceDepth(i) > faceDepth(best) ? i : best)))
      }
    }
    // A mark shows on the end it sits on only when that end is seen.
    const markFace = (a: number) => mesh.faces.findIndex((face) => face.corners.length > 4 && Math.sign(dot3(mesh.vertices[a], face.normal)) > 0)
    const seenMarks = (mesh.marks ?? []).filter(([a]) => markFace(a) < 0 || visible[markFace(a)])
    const markLines = ([a, b]: [number, number]) => (near === undefined ? [[screen[a], screen[b]]] : lines([seen[a], seen[b]]).map(project))
    const marks = seenMarks.flatMap(markLines)
    const outlineOf = (indices: number[]) => (near === undefined ? [indices.map((i) => screen[i])] : lines(indices.map((i) => seen[i])).map(project))
    if (options.slice !== undefined) {
      // Face by face (a scene's columns): each seen face carries its own outlines and marks, drawn right after it.
      const ownEdges = new Map<number, Array<[number, number]>>()
      drawn.forEach((edge, k) => ownEdges.set(owners[k], [...(ownEdges.get(owners[k]) ?? []), edge]))
      for (const { i, solved: face } of seenFaces) {
        face.edges = chain(ownEdges.get(i) ?? []).flatMap(outlineOf)
        const corners = mesh.faces[i].corners
        face.center = corners.reduce<Vec3>((sum, c) => [sum[0] + seen[c][0] / corners.length, sum[1] + seen[c][1] / corners.length, sum[2] + seen[c][2] / corners.length], [0, 0, 0])
        face.normal = normals[i]
        // A mark on no end face (or one whose end is not found) goes with the nearest seen face.
        const nearestSeen = seenFaces[seenFaces.length - 1].i
        face.marks = seenMarks.filter(([a]) => (markFace(a) >= 0 ? markFace(a) : nearestSeen) === i).flatMap(markLines)
      }
    }
    const glowValue = part.glow ? Math.max(0, Math.min(1, controlValue(rig, values, part.glow.control))) : 0
    const fadeValue = part.fade ? Math.max(0, Math.min(1, controlValue(rig, values, part.fade.control))) : 0
    const opacity = part.fade ? Math.max(0, Math.min(1, part.fade.from + (part.fade.to - part.fade.from) * fadeValue)) : 1
    return {
      part,
      depth: seen.reduce((sum, v) => sum + v[2], 0) / Math.max(1, seen.length),
      faces,
      edges: chain(drawn).flatMap(outlineOf),
      marks,
      glow: glowValue,
      opacity,
      ...(part.shape.type === 'tube' ? { spine: spineOf(lines(part.shape.points.map(viewOf)).map(project)) } : {}),
      ...(mesh.walls ? { cut: true } : {}),
    }
  }
  const locals = new Map(placedParts?.map((p) => [p.part.id, p.local]))
  const pieces = columns
    ? columns.pieces.map((piece) => ({
        part: piece.part,
        mesh: piece.mesh,
        // A cut piece is already in rest space: the body's matrix places it.
        m: piece.cut ? body : matrices.get(piece.part.id)!,
        local: piece.cut ? mat4.identity() : locals.get(piece.part.id),
        cell: piece.cell as Cell | undefined,
      }))
    : rig.parts.map((part) => ({ part, mesh: meshOf(part.shape), m: matrices.get(part.id)!, local: undefined, cell: undefined }))
  const solvedPieces = pieces.map((piece) => ({ cell: piece.cell, solved: solvePiece(piece.part, piece.mesh, piece.m, piece.local) }))
  const solved = solvedPieces.map((piece) => piece.solved)
  const order = (parts: SolvedPart[]) => parts.filter((p) => p.faces.length > 0 && p.opacity > 0.01).sort((a, b) => a.depth - b.depth)
  // Columns (with `slice`): each sorts at the depth of its own middle (they are equal blocks on a grid, so this
  // orders them rightly whatever is in them), and inside it the pieces keep the order their whole parts have
  // (so a cabin still draws over its body).
  let cells: SolvedProp['cells']
  if (columns) {
    const wholeDepth = new Map(rig.parts.map((part) => {
      const m = matrices.get(part.id)!
      const vertices = meshOf(part.shape).vertices
      return [part.id, vertices.reduce((sum, v) => sum + view.toView(mat4.transformPoint(m, v))[2], 0) / Math.max(1, vertices.length)]
    }))
    const byCell = new Map<string, { cell: Cell; parts: SolvedPart[] }>()
    for (const piece of solvedPieces) {
      const key = piece.cell!.join(',')
      if (!byCell.has(key)) byCell.set(key, { cell: piece.cell!, parts: [] })
      byCell.get(key)!.parts.push(piece.solved)
      piece.solved.depth = wholeDepth.get(piece.solved.part.id)!
    }
    cells = [...byCell.values()]
      .map(({ cell, parts }) => ({ depth: view.toView(mat4.transformPoint(body, columns.middle(cell)))[2], parts: order(parts) }))
      .filter((cell) => cell.parts.length > 0)
  }
  const anchors: SolvedProp['anchors'] = {}
  for (const [name, anchor] of Object.entries(rig.anchors ?? {})) {
    const m = anchor.part ? matrices.get(anchor.part) : bodyMatrix(rig, values)
    if (!m) throw new Error(`prop rig: anchor "${name}" is on "${anchor.part}", which is not a part`)
    const v = view.toView(mat4.transformPoint(m, anchor.at))
    anchors[name] = { point: view.toScreen(v), depth: v[2] }
  }
  // The shadow stays on the ground (it is not lifted), shrinking and fading as the prop rises.
  const [across, along] = rig.footprint ?? [rig.length * 0.45, rig.length]
  const lift = Math.max(0, controlValue(rig, values, 'lift'))
  const shrink = Math.max(0, controlValue(rig, values, 'size')) / (1 + lift * 0.8)
  const ground = Array.from({ length: 24 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 24
    return view.toView([Math.cos(a) * across * 0.55 * shrink, 0, Math.sin(a) * along * 0.55 * shrink])
  })
  const near = options.perspective ? options.near : undefined
  const shadow = {
    points: (near === undefined ? ground : clipPolygon(ground, near)).map((v) => view.toScreen(v)),
    opacity: 0.16 * shrink,
  }
  const openings = solved.filter((p) => p.part.seeThrough && p.opacity > 0.01).flatMap((p) => p.faces.map((f) => f.points))
  return { under: order(solved.filter((p) => !p.part.overRider)), over: order(solved.filter((p) => p.part.overRider)), ...(cells ? { cells } : {}), anchors, openings, shadow, pxPerUnit: scale, sizePx: rig.height * scale }
}

const edgeCache = new WeakMap<Mesh, Map<string, number[]>>()

/** A mesh's edges (`a-b` by vertex index, lower first) and the faces round each: its shape never changes, so worked out once. */
function edgesOf(mesh: Mesh): Map<string, number[]> {
  let edges = edgeCache.get(mesh)
  if (!edges) {
    edges = new Map()
    for (let i = 0; i < mesh.faces.length; i++) {
      const corners = mesh.faces[i].corners
      for (let k = 0; k < corners.length; k++) {
        const a = corners[k]
        const b = corners[(k + 1) % corners.length]
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        const around = edges.get(key)
        if (around) around.push(i)
        else edges.set(key, [i])
      }
    }
    edgeCache.set(mesh, edges)
  }
  return edges
}

/**
 * Its parts placed in its own 3D space (metres), with its controls applied
 * (derived ones too), and how much each glows and shows: for drawing them as
 * a scene's meshes.
 */
export function propPartsInSpace(rig: PropRig, given: Record<string, number>): Array<{ part: PropPart; matrix: Mat4; local: Mat4; glow: number; opacity: number }> {
  const values = rig.derive ? { ...given, ...rig.derive(given) } : given
  const matrices = partMatrices(rig, values)
  // Its rest space too (before its pitch, lift and squash), where most parts hold still: for caching.
  const rest = mat4.invert(bodyMatrix(rig, values)) ?? mat4.identity()
  const unit = (v: number) => Math.max(0, Math.min(1, v))
  return rig.parts.map((part) => {
    const fade = part.fade ? unit(controlValue(rig, values, part.fade.control)) : 0
    return {
      part,
      matrix: matrices.get(part.id)!,
      local: mat4.multiply(rest, matrices.get(part.id)!),
      glow: part.glow ? unit(controlValue(rig, values, part.glow.control)) : 0,
      opacity: part.fade ? unit(part.fade.from + (part.fade.to - part.fade.from) * fade) : 1,
    }
  })
}

/**
 * Its anchors in its own 3D space, metres (+y up from the ground, +z its
 * front), with its controls applied (a horse's stride bobbing its saddle,
 * a car's pitch): where a rider sits in a 3D scene.
 */
export function propAnchors3D(rig: PropRig, given: Record<string, number>): Record<string, Vec3> {
  const values = rig.derive ? { ...given, ...rig.derive(given) } : given
  const matrices = partMatrices(rig, values)
  const body = bodyMatrix(rig, values)
  const out: Record<string, Vec3> = {}
  for (const [name, anchor] of Object.entries(rig.anchors ?? {})) {
    const m = anchor.part ? matrices.get(anchor.part) : body
    if (!m) throw new Error(`prop rig: anchor "${name}" is on "${anchor.part}", which is not a part`)
    out[name] = mat4.transformPoint(m, anchor.at)
  }
  return out
}

/** Whether an edge (`a-b` by vertex index) of a piece cut at column walls lies along one of the walls. */
function onWall(mesh: Mesh, key: string): boolean {
  if (!mesh.walls) return false
  const [a, b] = key.split('-').map((i) => mesh.vertices[Number(i)])
  const along = (k: 0 | 2, walls: number[]) => walls.some((w) => Math.abs(a[k] - w) < 1e-6 && Math.abs(b[k] - w) < 1e-6)
  return along(0, mesh.walls.x) || along(2, mesh.walls.z)
}

/** A tube's centre line: the longest run left in front of the near plane (all of it, unclipped). */
function spineOf(runs: Point[][]): Point[] | undefined {
  return runs.reduce<Point[] | undefined>((longest, run) => (!longest || run.length > longest.length ? run : longest), undefined)
}

const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Edges joined end to end into strokes, so a pencil draws one line round a wheel, not twenty. */
function chain(edges: Array<[number, number]>): number[][] {
  const remaining = edges.map((e) => [...e] as [number, number])
  const strokes: number[][] = []
  while (remaining.length > 0) {
    const stroke = [...remaining.shift()!]
    let grew = true
    while (grew) {
      grew = false
      for (let i = 0; i < remaining.length; i++) {
        const [a, b] = remaining[i]
        const end = stroke[stroke.length - 1]
        const start = stroke[0]
        if (a === end) stroke.push(b)
        else if (b === end) stroke.push(a)
        else if (b === start) stroke.unshift(a)
        else if (a === start) stroke.unshift(b)
        else continue
        remaining.splice(i, 1)
        grew = true
        break
      }
    }
    strokes.push(stroke)
  }
  return strokes
}
