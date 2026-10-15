import { unknownName } from '../../engine/authoring/did-you-mean'
import { parseExpression, expressionNames, CONSTANTS } from '../expr/parse-expression'
import { isMat2 } from '../linear/mat2'
import { isVec2 } from '../linear/vec2'
import { layoutTex } from '../tex/tex-layout'
import { differentiate } from '../expr/differentiate'
import { ITEM_KINDS, MATH_THEMES, type MathFigureSpec, type MathItem, type NumRef, type VecRef } from './figure-spec'
import { scopeOf } from './item-context'
import { derivedValues } from './derived'

/**
 * Checks a figure once, up front, so mistakes surface with a message that
 * says how to fix them instead of as a blank or broken frame: unknown kinds
 * and themes (with "did you mean"), duplicate ids, values of the wrong shape,
 * expressions that do not parse or read a missing parameter, TeX errors.
 * Returns the spec unchanged when it is valid.
 */
/**
 * Names a value cannot take: the figure target's own properties (a track on
 * `x` moves the whole figure) and the variables of functions and curves.
 */
const RESERVED = new Set([
  'x', 'y', 'z', 't', 'opacity', 'rotate', 'rotateX', 'rotateY', 'scale', 'scaleX', 'scaleY', 'skewX', 'skewY',
  'originX', 'originY', 'perspective', 'width', 'height', 'fill', 'stroke', 'fillStyle', 'strokeStyle', 'lineWidth',
  'strokeWidth', 'filter', 'blur', 'visible', 'clipTop', 'clipRight', 'clipBottom', 'clipLeft', 'quaternion',
])

export function validateMathFigure(spec: MathFigureSpec): MathFigureSpec {
  const fail = (message: string): never => {
    throw new Error(`math figure: ${message}`)
  }
  if (!spec || typeof spec !== 'object') fail('expected a figure object')
  if (!(spec.width > 0) || !(spec.height > 0)) fail('width and height must be positive numbers (px)')
  for (const range of ['x', 'y'] as const) {
    const r = spec[range]
    if (r !== undefined && !(Array.isArray(r) && r.length === 2 && r.every(Number.isFinite) && r[0] < r[1])) {
      fail(`${range} must be [min, max] with min < max`)
    }
  }
  if (spec.theme !== undefined && !(spec.theme in MATH_THEMES)) fail(unknownName('theme', spec.theme, Object.keys(MATH_THEMES)))
  if (!Array.isArray(spec.items)) fail('items must be an array')
  const values = spec.values ?? {}
  for (const [name, value] of Object.entries(values)) {
    if (!/^[A-Za-z_]\w*$/.test(name)) fail(`value name "${name}" must be letters, digits and _ (starting with a letter)`)
    if (RESERVED.has(name)) fail(`"${name}" cannot name a value: it is ${name === 'x' || name === 't' ? 'the variable of functions and curves' : 'a property of the figure itself (its place, size or look)'}`)
    const ok = (typeof value === 'number' && Number.isFinite(value)) || isVec2(value) || isMat2(value)
    if (!ok) fail(`value "${name}" must be a number, an [x, y] vector or an [a, b, c, d] matrix`)
  }
  const scope = scopeOf(values)
  const numberNames = Object.keys(values).filter((name) => typeof values[name] === 'number')

  const vector = (item: MathItem, field: string, ref: VecRef | undefined) => {
    if (ref === undefined) return
    if (typeof ref === 'string') {
      if (!(ref in values)) fail(`${item.id}.${field}: ${unknownName('value', ref, Object.keys(values))}`)
      if (!isVec2(values[ref])) fail(`${item.id}.${field}: value "${ref}" is not an [x, y] vector`)
    } else if (!isVec2(ref)) {
      fail(`${item.id}.${field} must be [x, y] or the name of a vector value`)
    }
  }
  const matrix = (item: MathItem, field: string, name: string | undefined) => {
    if (name === undefined) return
    if (!(name in values)) fail(`${item.id}.${field}: ${unknownName('value', name, Object.keys(values))}`)
    if (!isMat2(values[name])) fail(`${item.id}.${field}: value "${name}" is not an [a, b, c, d] matrix`)
  }
  const expression = (item: MathItem, field: string, source: string, variable: string) => {
    let names: string[] = []
    try {
      names = expressionNames(parseExpression(source))
    } catch (error) {
      fail(`${item.id}.${field}: ${(error as Error).message}`)
    }
    for (const name of names) {
      if (name !== variable && !(name in CONSTANTS) && !numberNames.includes(name)) {
        fail(`${item.id}.${field}: "${name}" is neither ${variable} nor a number value (${unknownName('value', name, [variable, ...numberNames])})`)
      }
    }
  }
  // TeX can show numbers items work out (a slope, a sum), so it is checked after every item is.
  const texChecks: [MathItem, string, string][] = []
  const tex = (item: MathItem, field: string, source: string) => void texChecks.push([item, field, source])
  const number = (item: MathItem, field: string, ref: NumRef | undefined) => {
    if (ref === undefined) return
    if (typeof ref === 'string') {
      if (!(ref in values)) fail(`${item.id}.${field}: ${unknownName('value', ref, numberNames)}`)
      if (typeof values[ref] !== 'number') fail(`${item.id}.${field}: value "${ref}" is not a number`)
    } else if (!Number.isFinite(ref)) {
      fail(`${item.id}.${field} must be a number or the name of a number value`)
    }
  }
  const derivable = (item: MathItem, field: string, source: string, order: number) => {
    // Every function used has a derivative rule (floor and round do not).
    try {
      let tree = parseExpression(source)
      for (let k = 0; k < order; k++) tree = differentiate(tree)
    } catch (error) {
      fail(`${item.id}.${field}: ${(error as Error).message} (calculus needs functions with derivatives)`)
    }
  }

  const ids = new Set<string>()
  for (const item of spec.items) {
    if (!item || typeof item !== 'object') fail('every item must be an object')
    if (!ITEM_KINDS.includes(item.kind)) fail(unknownName('item kind', item.kind, ITEM_KINDS))
    if (typeof item.id !== 'string' || !/^[A-Za-z_][\w-]*$/.test(item.id)) fail(`a ${item.kind} needs an id (letters, digits, _ and -)`)
    if (ids.has(item.id)) fail(`two items have the id "${item.id}"`)
    if (item.id in values) fail(`"${item.id}" is both an item id and a value name`)
    ids.add(item.id)
    switch (item.kind) {
      case 'grid':
        if (item.step !== undefined && !(item.step > 0)) fail(`${item.id}.step must be positive`)
        matrix(item, 'transform', item.transform)
        break
      case 'vector':
        vector(item, 'to', item.to)
        vector(item, 'from', item.from)
        matrix(item, 'transform', item.transform)
        if (item.label) tex(item, 'label', item.label)
        break
      case 'basis':
        matrix(item, 'transform', item.transform)
        break
      case 'point':
        if ((item.at === undefined) === (item.on === undefined)) fail(`${item.id} needs at, or on with x (a point on a curve)`)
        if (item.on !== undefined) {
          if (item.x === undefined) fail(`${item.id}: a point on a curve needs x`)
          expression(item, 'on', item.on, 'x')
          number(item, 'x', item.x)
        }
        vector(item, 'at', item.at)
        matrix(item, 'transform', item.transform)
        if (item.label) tex(item, 'label', item.label)
        break
      case 'function':
        expression(item, 'expr', item.expr, 'x')
        if (item.derivative !== undefined) {
          if (!Number.isInteger(item.derivative) || item.derivative < 0 || item.derivative > 8) fail(`${item.id}.derivative must be a whole number from 0 to 8`)
          derivable(item, 'expr', item.expr, item.derivative)
        }
        break
      case 'tangent':
        expression(item, 'expr', item.expr, 'x')
        derivable(item, 'expr', item.expr, 1)
        number(item, 'at', item.at)
        number(item, 'h', item.h)
        if (item.label) tex(item, 'label', item.label)
        break
      case 'riemann':
        expression(item, 'expr', item.expr, 'x')
        number(item, 'from', item.from)
        number(item, 'to', item.to)
        number(item, 'n', item.n)
        if (item.rule !== undefined && !['left', 'right', 'midpoint', 'trapezoid'].includes(item.rule)) {
          fail(`${item.id}.rule: ${unknownName('rule', item.rule, ['left', 'right', 'midpoint', 'trapezoid'])}`)
        }
        break
      case 'area':
        expression(item, 'expr', item.expr, 'x')
        if (item.lower !== undefined) expression(item, 'lower', item.lower, 'x')
        number(item, 'from', item.from)
        number(item, 'to', item.to)
        break
      case 'taylor':
        expression(item, 'expr', item.expr, 'x')
        derivable(item, 'expr', item.expr, 3)
        number(item, 'at', item.at)
        number(item, 'order', item.order)
        break
      case 'parametric':
        expression(item, 'x', item.x, 't')
        expression(item, 'y', item.y, 't')
        matrix(item, 'transform', item.transform)
        break
      case 'polygon':
        if (item.points !== undefined && !(Array.isArray(item.points) && item.points.length >= 3 && item.points.every(isVec2))) {
          fail(`${item.id}.points must be three or more [x, y] points`)
        }
        matrix(item, 'transform', item.transform)
        if (item.label) tex(item, 'label', item.label)
        break
      case 'line':
        if ((item.along === undefined) === (item.eigen === undefined)) fail(`${item.id} needs exactly one of along or eigen`)
        vector(item, 'along', item.along)
        matrix(item, 'eigen', item.eigen)
        break
      case 'label':
        vector(item, 'at', item.at)
        tex(item, 'tex', item.tex)
        break
      case 'equation':
        vector(item, 'at', item.at)
        if (!Array.isArray(item.steps) || item.steps.length === 0) fail(`${item.id}.steps needs at least one TeX step`)
        item.steps.forEach((step, k) => tex(item, `steps[${k}]`, step))
        break
    }
  }
  const everything = { ...scope, ...derivedValues(spec.items, values, scope) }
  for (const [item, field, source] of texChecks) {
    try {
      layoutTex(source, { values: everything })
    } catch (error) {
      fail(`${item.id}.${field}: ${(error as Error).message}`)
    }
  }
  return spec
}
