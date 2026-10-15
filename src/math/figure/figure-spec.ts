import type { Vec2 } from '../linear/vec2'

/**
 * A maths figure as plain JSON: a coordinate plane and the items drawn on it.
 *
 * Everything that moves is a **value**: a number (`k`), a vector (`v: [1, 2]`)
 * or a matrix (`M: [a, b, c, d]`). Items refer to values by name, and a
 * timeline animates them as flat props on the figure's target, with no code:
 *
 * - a value by its name: `M` keyed from `[1, 0, 0, 1]` to `[2, 1, 0, 1]`
 *   warps the grid; `k` keyed from 1 to 3 reshapes `sin(k x)`
 * - `ITEM.draw` (0..1): draws an item on, like a pen
 * - `ITEM.opacity` (0..1)
 * - `ITEM.step` on an equation: 0, 1, 2 … shows each step; in between, terms
 *   glide from one step to the next
 *
 * The same figure and values always give the same picture.
 */
export interface MathFigureSpec {
  /** Size in px */
  width: number
  height: number
  /** World x range shown (default [-5, 5]) */
  x?: [number, number]
  /** World y range shown (default: centred on 0, with the same scale as x) */
  y?: [number, number]
  /** Colour scheme (default `dark`, the classic look of maths videos) */
  theme?: MathThemeName
  /** Background colour; `none` for transparent (default: the theme's) */
  background?: string
  /** Starting values: numbers, `[x, y]` vectors, `[a, b, c, d]` matrices */
  values?: Record<string, number | number[]>
  items: MathItem[]
}

/** A point or vector given directly, or the name of a value holding one. */
export type VecRef = Vec2 | string

/** A number given directly, or the name of a number value (so a timeline can move it). */
export type NumRef = number | string

interface ItemBase {
  /** Unique within the figure; names the item's props (`grid.draw`) */
  id: string
  /** Colour: a theme colour name (`blue`, `green`, `red`, `yellow`, `ink`, …) or any CSS colour */
  color?: string
  /** Drawn part, 0..1 (default 1); animate `ID.draw` */
  draw?: number
  /** 0..1 (default 1); animate `ID.opacity` */
  opacity?: number
}

/** Lines of the plane, warped by a matrix value: the picture of a linear map. */
export interface GridItem extends ItemBase {
  kind: 'grid'
  /** World units between lines (default 1) */
  step?: number
  /** Name of a matrix value applied to the grid */
  transform?: string
  /** Also draw the untransformed grid, faintly, underneath (default false) */
  ghost?: boolean
}

export interface AxesItem extends ItemBase {
  kind: 'axes'
  /** World units between ticks (default 1); 0 for none */
  ticks?: number
  /** Number the ticks (default true) */
  labels?: boolean
}

export interface VectorItem extends ItemBase {
  kind: 'vector'
  /** The tip */
  to: VecRef
  /** The tail (default the origin) */
  from?: VecRef
  /** Name of a matrix value applied to both ends */
  transform?: string
  /** TeX label by the tip */
  label?: string
  /** Where the label goes: beyond the tip (default) or beside the middle, on the left of travel */
  labelAt?: 'tip' | 'middle'
  /** Line width in px at a 600 px figure (default 4) */
  width?: number
}

/** î and ĵ, optionally carried by a matrix value. */
export interface BasisItem extends ItemBase {
  kind: 'basis'
  transform?: string
  /** Label the vectors î and ĵ (default true) */
  labels?: boolean
}

export interface PointItem extends ItemBase {
  kind: 'point'
  /** Where it is; or give `on` and `x` to put it on a curve */
  at?: VecRef
  /** A function of x the point rides on: the point is (x, f(x)) */
  on?: string
  /** The point's x on `on` (a number or a number value) */
  x?: NumRef
  transform?: string
  label?: string
  /** px at a 600 px figure (default 6) */
  radius?: number
  /** An open circle: a value the function does not take (a hole, a limit) */
  hollow?: boolean
}

/** y = f(x) from an expression (see expr/parse-expression.ts); number values are its parameters. */
export interface FunctionItem extends ItemBase {
  kind: 'function'
  expr: string
  /** Plot this derivative of it instead (1: f′, 2: f″ …), worked out exactly */
  derivative?: number
  /** x range drawn (default the figure's) */
  domain?: [number, number]
  width?: number
  /** Dashed line (default false) */
  dashed?: boolean
}

/** The tangent to y = f(x) at x = at; with `h`, the secant through at and at + h instead. */
export interface TangentItem extends ItemBase {
  kind: 'tangent'
  expr: string
  at: NumRef
  /** Secant step: the line through (at, f(at)) and (at + h, f(at + h)); 0 or absent is the tangent */
  h?: NumRef
  /** World x units the line spans, centred on `at` (default the whole view) */
  length?: number
  /** Mark the point(s) it touches (default true) */
  points?: boolean
  /** TeX by the point; `\val{ID.slope}` shows the slope */
  label?: string
  width?: number
}

/** Rectangles (or trapezoids) under y = f(x): a Riemann sum. */
export interface RiemannItem extends ItemBase {
  kind: 'riemann'
  expr: string
  from: NumRef
  to: NumRef
  /** How many pieces (rounded; animate it to watch them thin out) */
  n: NumRef
  /** Where each rectangle meets the curve (default `left`) */
  rule?: 'left' | 'right' | 'midpoint' | 'trapezoid'
  /** Fill opacity (default 0.35) */
  fillOpacity?: number
}

/** The region between y = f(x) and y = lower(x) (default the x axis) from `from` to `to`. */
export interface AreaItem extends ItemBase {
  kind: 'area'
  expr: string
  from: NumRef
  to: NumRef
  /** The lower boundary, a function of x (default 0) */
  lower?: string
  /** Colour where the region is below the lower boundary (default `red`) */
  negativeColor?: string
  fillOpacity?: number
}

/** The Taylor polynomial of y = f(x) about x = at; a fractional order blends into the next term. */
export interface TaylorItem extends ItemBase {
  kind: 'taylor'
  expr: string
  at: NumRef
  /** Degree, 0..20 (animate it to add terms one by one) */
  order: NumRef
  domain?: [number, number]
  width?: number
}

/** (x(t), y(t)) from two expressions. */
export interface ParametricItem extends ItemBase {
  kind: 'parametric'
  x: string
  y: string
  /** t range (default [0, 2π]) */
  t?: [number, number]
  transform?: string
  width?: number
}

/** A filled polygon (default the unit square), optionally carried by a matrix: its area shows the determinant. */
export interface PolygonItem extends ItemBase {
  kind: 'polygon'
  points?: Vec2[]
  transform?: string
  /** Fill opacity (default 0.3) */
  fillOpacity?: number
  /** TeX label at its centre; `\val{M.det}` shows the matrix's determinant */
  label?: string
}

/** A line through the origin along a vector: a span, or (with `eigen`) a matrix's eigenvectors. */
export interface LineItem extends ItemBase {
  kind: 'line'
  /** Direction */
  along?: VecRef
  /** Instead of `along`: one line per real eigenvector of this matrix value */
  eigen?: string
  dashed?: boolean
  width?: number
}

/** TeX placed in world or screen coordinates. */
export interface LabelItem extends ItemBase {
  kind: 'label'
  tex: string
  /** Where, in world units (or px with `screen: true`) */
  at: VecRef
  screen?: boolean
  /** Font size, px at a 600 px figure (default 28) */
  size?: number
  align?: 'left' | 'center' | 'right'
  /** A soft panel behind the text, so it reads over a grid (default true for `screen` labels) */
  backdrop?: boolean
}

/** An equation worked in steps; `ID.step` moves between them, terms gliding. */
export interface EquationItem extends ItemBase {
  kind: 'equation'
  /** TeX for each step */
  steps: string[]
  /** Which step (default 0); fractional values are part way to the next */
  step?: number
  at: VecRef
  screen?: boolean
  size?: number
  align?: 'left' | 'center' | 'right'
  /** A soft panel behind the text (default true for `screen` equations) */
  backdrop?: boolean
}

export type MathItem =
  | GridItem | AxesItem | VectorItem | BasisItem | PointItem | FunctionItem
  | ParametricItem | PolygonItem | LineItem | LabelItem | EquationItem
  | TangentItem | RiemannItem | AreaItem | TaylorItem

export type MathItemKind = MathItem['kind']

export const ITEM_KINDS: readonly MathItemKind[] = [
  'grid', 'axes', 'vector', 'basis', 'point', 'function', 'parametric', 'polygon', 'line', 'label', 'equation',
  'tangent', 'riemann', 'area', 'taylor',
]

export type MathThemeName = 'dark' | 'light' | 'chalk'

export interface MathTheme {
  background: string
  ink: string
  grid: string
  ghost: string
  axes: string
  colors: Record<string, string>
}

/**
 * Colour schemes. `dark` follows the long-standing maths-video palette (blue
 * grid, green î, red ĵ, yellow highlights); `light` suits lesson pages;
 * `chalk` is a blackboard.
 */
export const MATH_THEMES: Record<MathThemeName, MathTheme> = {
  dark: {
    background: '#0f1117', ink: '#f2f2f2', grid: '#29abca', ghost: 'rgba(255,255,255,0.18)', axes: '#f2f2f2',
    colors: { blue: '#58c4dd', green: '#83c167', red: '#fc6255', yellow: '#ffd75e', purple: '#b189f0', orange: '#ff9b4d', teal: '#5cd0b3', pink: '#f58ad1', ink: '#f2f2f2', grey: '#8a8f99' },
  },
  light: {
    background: '#fbfaf7', ink: '#1f2430', grid: '#7fb3d5', ghost: 'rgba(31,36,48,0.14)', axes: '#1f2430',
    colors: { blue: '#2f6fd0', green: '#2f9a4a', red: '#d64545', yellow: '#c99a00', purple: '#7b4fc9', orange: '#e0761f', teal: '#178f7c', pink: '#c94f9c', ink: '#1f2430', grey: '#7a808c' },
  },
  chalk: {
    background: '#23332b', ink: '#eef0e6', grid: 'rgba(238,240,230,0.35)', ghost: 'rgba(238,240,230,0.14)', axes: '#eef0e6',
    colors: { blue: '#9fd3f0', green: '#b9e39a', red: '#f59a8f', yellow: '#f6e58d', purple: '#d0b5f2', orange: '#f7c08a', teal: '#a3e4d4', pink: '#f4b6dc', ink: '#eef0e6', grey: '#a9b0a6' },
  },
}
