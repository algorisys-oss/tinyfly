import { IDENTITY, type Mat2 } from '../linear/mat2'
import type { Vec2 } from '../linear/vec2'
import type { MathFigureSpec, MathItem, MathThemeName } from '../figure/figure-spec'

/**
 * Ready-made linear algebra figures. Each returns a plain MathFigureSpec, so
 * it can be changed, saved as JSON or extended with more items. The matrix is
 * the value `M`: start it at the identity and key it to a matrix to watch the
 * plane transform (see steps/math-lesson.ts `applyMatrix`).
 */
export interface PresetOptions {
  width?: number
  height?: number
  theme?: MathThemeName
  /** World x range (default [-5, 5]) */
  x?: [number, number]
  /** Starting matrix (default the identity) */
  matrix?: Mat2
}

const base = (options: PresetOptions, values: MathFigureSpec['values'], items: MathItem[]): MathFigureSpec => ({
  width: options.width ?? 600,
  height: options.height ?? 600,
  ...(options.theme ? { theme: options.theme } : {}),
  ...(options.x ? { x: options.x } : {}),
  values,
  items,
})

/** TeX for the live matrix `M`, as `[a b; c d]` with its current entries. */
export const MATRIX_TEX = '\\begin{bmatrix} \\val{M.a} & \\val{M.b} \\\\ \\val{M.c} & \\val{M.d} \\end{bmatrix}'

/** Where a screen label sits: the figure's top left corner, inset. */
const corner = (options: PresetOptions): Vec2 => [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.1]

/** The grid, î and ĵ carried by `M`, with the unit square and the matrix shown live. */
export function linearMapFigure(options: PresetOptions = {}): MathFigureSpec {
  return base(options, { M: options.matrix ?? IDENTITY }, [
    { id: 'grid', kind: 'grid', transform: 'M', ghost: true },
    { id: 'square', kind: 'polygon', transform: 'M', color: 'yellow', fillOpacity: 0.25 },
    { id: 'basis', kind: 'basis', transform: 'M' },
    { id: 'matrix', kind: 'label', tex: MATRIX_TEX, at: corner(options), screen: true, align: 'left' },
  ])
}

/** The unit square becomes a parallelogram whose area is the determinant. */
export function determinantFigure(options: PresetOptions = {}): MathFigureSpec {
  return base(options, { M: options.matrix ?? IDENTITY }, [
    { id: 'grid', kind: 'grid', transform: 'M', ghost: true },
    { id: 'square', kind: 'polygon', transform: 'M', color: 'yellow', fillOpacity: 0.35, label: '\\det = \\val{M.det}' },
    { id: 'basis', kind: 'basis', transform: 'M' },
    { id: 'matrix', kind: 'label', tex: MATRIX_TEX, at: corner(options), screen: true, align: 'left' },
  ])
}

/**
 * Eigenvectors: the lines that stay put. Set `matrix` to the target, start
 * `M` at the identity and key it there; the eigenlines are those of the
 * target (value `A`), so they are visible before the plane moves.
 */
export function eigenFigure(options: PresetOptions & { matrix: Mat2 }): MathFigureSpec {
  return base(options, { M: IDENTITY, A: options.matrix }, [
    { id: 'grid', kind: 'grid', transform: 'M', ghost: true },
    { id: 'eigen', kind: 'line', eigen: 'A', color: 'yellow', width: 3 },
    { id: 'basis', kind: 'basis', transform: 'M' },
    { id: 'matrix', kind: 'label', tex: MATRIX_TEX, at: corner(options), screen: true, align: 'left' },
  ])
}

/** u + v, tip to tail, with the sum. */
export function vectorSumFigure(options: PresetOptions & { u: Vec2; v: Vec2 }): MathFigureSpec {
  const sum: Vec2 = [options.u[0] + options.v[0], options.u[1] + options.v[1]]
  return base(options, { u: options.u, v: options.v, s: sum }, [
    { id: 'grid', kind: 'grid', ghost: false, color: 'grey', opacity: 0.5 },
    { id: 'axes', kind: 'axes' },
    { id: 'arrowU', kind: 'vector', to: 'u', color: 'green', label: '\\vec{u}', labelAt: 'middle' },
    { id: 'arrowV', kind: 'vector', from: 'u', to: 's', color: 'red', label: '\\vec{v}', labelAt: 'middle' },
    { id: 'sum', kind: 'vector', to: 's', color: 'yellow', label: '\\vec{u} + \\vec{v}' },
  ])
}

/** Every combination a u + b v: two vectors and the line or plane they span. */
export function spanFigure(options: PresetOptions & { u: Vec2; v?: Vec2 }): MathFigureSpec {
  const items: MathItem[] = [
    { id: 'axes', kind: 'axes' },
    { id: 'spanU', kind: 'line', along: 'u', color: 'green', dashed: true },
    { id: 'arrowU', kind: 'vector', to: 'u', color: 'green', label: '\\vec{u}' },
  ]
  const values: Record<string, number[]> = { u: options.u }
  if (options.v) {
    values.v = options.v
    items.splice(2, 0, { id: 'spanV', kind: 'line', along: 'v', color: 'red', dashed: true })
    items.push({ id: 'arrowV', kind: 'vector', to: 'v', color: 'red', label: '\\vec{v}' })
  }
  return base(options, values, items)
}
