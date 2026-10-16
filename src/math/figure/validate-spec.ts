import { unknownName } from '../../engine/authoring/did-you-mean'
import { parseExpression, expressionNames, CONSTANTS } from '../expr/parse-expression'
import { isMat2 } from '../linear/mat2'
import { isVec2 } from '../linear/vec2'
import { layoutTex } from '../tex/tex-layout'
import { differentiate } from '../expr/differentiate'
import { ITEM_KINDS, MATH_THEMES, type DistributionRef, type MathFigureSpec, type MathItem, type NumRef, type VecRef } from './figure-spec'
import { distributionOf, scopeOf } from './item-context'
import { distributionProblem, DISTRIBUTION_KINDS } from '../prob/distributions'
import { SEARCH_KINDS } from '../discrete/graph-search'
import { parseSetExpression, setNames } from '../discrete/set-expression'
import { graphEdges, graphPositions } from './items/discrete'
import { ACTIVATIONS } from '../ml/network'
import { COLORMAPS } from '../ml/colormap'
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
  const distribution = (item: MathItem, field: string, ref: DistributionRef) => {
    if (!ref || typeof ref !== 'object' || !DISTRIBUTION_KINDS.includes(ref.kind)) {
      fail(`${item.id}.${field}: ${unknownName('distribution', (ref as { kind?: string })?.kind, DISTRIBUTION_KINDS)}`)
    }
    for (const [key, value] of Object.entries(ref)) {
      if (key === 'kind') continue
      if (key === 'of') distribution(item, `${field}.of`, value as DistributionRef)
      else number(item, `${field}.${key}`, value as NumRef)
    }
    const problem = distributionProblem(distributionOf(values, ref))
    if (problem) fail(`${item.id}.${field}: ${problem}`)
  }
  const twoVariables = (item: MathItem, field: string, source: string) => {
    let names: string[] = []
    try {
      names = expressionNames(parseExpression(source))
    } catch (error) {
      fail(`${item.id}.${field}: ${(error as Error).message}`)
    }
    for (const name of names) {
      if (name !== 'x' && name !== 'y' && !numberNames.includes(name)) fail(`${item.id}.${field}: "${name}" is neither x, y nor a number value`)
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
      case 'histogram':
        distribution(item, 'distribution', item.distribution)
        number(item, 'count', item.count)
        if (item.bins !== undefined && !(Array.isArray(item.bins) && item.bins.length === 3 && item.bins[1] > item.bins[0] && Number.isInteger(item.bins[2]) && item.bins[2] >= 1 && item.bins[2] <= 500)) {
          fail(`${item.id}.bins must be [from, to, count] with from < to and a whole count 1..500`)
        }
        break
      case 'distribution':
        distribution(item, 'distribution', item.distribution)
        if (item.shade) item.shade.forEach((ref, k) => number(item, `shade[${k}]`, ref))
        break
      case 'galton':
        if (item.rows !== undefined && !(Number.isInteger(item.rows) && item.rows >= 1 && item.rows <= 30)) fail(`${item.id}.rows must be a whole number 1..30`)
        number(item, 'balls', item.balls)
        break
      case 'scatter':
        if (!item.points || !['uniform', 'linear'].includes(item.points.kind)) fail(`${item.id}.points: ${unknownName('points kind', item.points?.kind, ['uniform', 'linear'])}`)
        if (item.points.kind === 'linear') {
          number(item, 'points.slope', item.points.slope)
          number(item, 'points.intercept', item.points.intercept)
          number(item, 'points.noise', item.points.noise)
        }
        number(item, 'count', item.count)
        if (item.inside) twoVariables(item, 'inside', item.inside)
        break
      case 'bayes':
        number(item, 'prior', item.prior)
        number(item, 'truePositive', item.truePositive)
        number(item, 'falsePositive', item.falsePositive)
        break
      case 'graph': {
        if (!Array.isArray(item.nodes) || item.nodes.length === 0) fail(`${item.id}.nodes needs at least one node`)
        const nodeIds = item.nodes.map((node) => node.id)
        if (new Set(nodeIds).size !== nodeIds.length) fail(`${item.id}: two nodes share an id`)
        const known = (field: string, id: string) => {
          if (!nodeIds.includes(id)) fail(`${item.id}.${field}: ${unknownName('node', id, nodeIds)}`)
        }
        if (!Array.isArray(item.edges)) fail(`${item.id}.edges must be an array`)
        graphEdges(item).forEach((edge, k) => {
          known(`edges[${k}]`, edge.from)
          known(`edges[${k}]`, edge.to)
          if (edge.weight !== undefined && !(edge.weight >= 0)) fail(`${item.id}.edges[${k}]: weights must be ≥ 0 (shortest paths need them)`)
        })
        if (item.tree) known('tree.root', item.tree.root)
        const placed = graphPositions(item)
        const unplaced = nodeIds.filter((id) => !placed.has(id))
        if (unplaced.length) fail(`${item.id}: nodes ${unplaced.join(', ')} have no "at" and are not reached from the tree root`)
        if (item.search) {
          if (!SEARCH_KINDS.includes(item.search.kind)) fail(`${item.id}.search: ${unknownName('search', item.search.kind, SEARCH_KINDS)}`)
          known('search.start', item.search.start)
        }
        number(item, 'step', item.step)
        item.nodes.forEach((node) => node.label !== undefined && tex(item, `nodes.${node.id}.label`, node.label))
        break
      }
      case 'venn': {
        if (!Array.isArray(item.sets) || item.sets.length < 2 || item.sets.length > 3) fail(`${item.id}.sets: give two or three sets`)
        const ids = item.sets.map((set) => set.id)
        if (!ids.every((id) => /^[A-Za-z]\w*$/.test(id))) fail(`${item.id}.sets: ids must be names like A, B, Evens`)
        if (item.highlight) {
          try {
            for (const name of setNames(parseSetExpression(item.highlight))) {
              if (!ids.includes(name)) fail(`${item.id}.highlight: ${unknownName('set', name, ids)}`)
            }
          } catch (error) {
            fail(`${item.id}.highlight: ${(error as Error).message}`)
          }
        }
        item.sets.forEach((set) => set.label !== undefined && tex(item, `sets.${set.id}.label`, set.label))
        break
      }
      case 'network':
        if (!Array.isArray(item.layers) || item.layers.length < 2 || item.layers.length > 8 || !item.layers.every((n) => Number.isInteger(n) && n >= 1 && n <= 12)) {
          fail(`${item.id}.layers: give 2 to 8 layers of 1 to 12 nodes, like [3, 4, 2]`)
        }
        if (item.activation !== undefined && !ACTIVATIONS.includes(item.activation)) fail(`${item.id}.activation: ${unknownName('activation', item.activation, ACTIVATIONS)}`)
        if (item.inputs && item.inputs.length > item.layers[0]) fail(`${item.id}.inputs: more inputs than the ${item.layers[0]} input nodes`)
        item.inputs?.forEach((ref, k) => number(item, `inputs[${k}]`, ref))
        number(item, 'flow', item.flow)
        item.labels?.inputs?.forEach((t, k) => tex(item, `labels.inputs[${k}]`, t))
        item.labels?.outputs?.forEach((t, k) => tex(item, `labels.outputs[${k}]`, t))
        break
      case 'heatmap':
        if ((item.cells === undefined) === (item.expr === undefined)) fail(`${item.id} needs exactly one of cells or expr`)
        if (item.cells && !(Array.isArray(item.cells) && item.cells.length >= 1 && item.cells.length <= 64 && item.cells.every((row) => Array.isArray(row) && row.length === item.cells![0].length && row.length <= 64 && row.every(Number.isFinite)))) {
          fail(`${item.id}.cells must be up to 64 equal rows of up to 64 numbers`)
        }
        if (item.expr) twoVariables(item, 'expr', item.expr)
        if (item.resolution !== undefined && !(Number.isInteger(item.resolution) && item.resolution >= 4 && item.resolution <= 120)) fail(`${item.id}.resolution must be 4..120`)
        if (item.colormap !== undefined && !COLORMAPS.includes(item.colormap)) fail(`${item.id}.colormap: ${unknownName('colormap', item.colormap, COLORMAPS)}`)
        item.rowLabels?.forEach((t, k) => tex(item, `rowLabels[${k}]`, t))
        item.colLabels?.forEach((t, k) => tex(item, `colLabels[${k}]`, t))
        break
      case 'contours':
        twoVariables(item, 'expr', item.expr)
        if (item.colormap !== undefined && !COLORMAPS.includes(item.colormap)) fail(`${item.id}.colormap: ${unknownName('colormap', item.colormap, COLORMAPS)}`)
        if (item.resolution !== undefined && !(Number.isInteger(item.resolution) && item.resolution >= 8 && item.resolution <= 200)) fail(`${item.id}.resolution must be 8..200`)
        break
      case 'descent':
        twoVariables(item, 'expr', item.expr)
        for (const variable of ['x', 'y']) {
          try {
            differentiate(parseExpression(item.expr), variable)
          } catch (error) {
            fail(`${item.id}.expr: ${(error as Error).message} (descent needs a gradient)`)
          }
        }
        vector(item, 'start', item.start)
        number(item, 'rate', item.rate)
        number(item, 'steps', item.steps)
        number(item, 'momentum', item.momentum)
        break
      case 'classifier':
        number(item, 'epochs', item.epochs)
        if (item.count !== undefined && !(Number.isInteger(item.count) && item.count >= 1 && item.count <= 500)) fail(`${item.id}.count must be 1..500 points per cluster`)
        if (item.centres !== undefined && !(item.centres.length === 2 && item.centres.every(isVec2))) fail(`${item.id}.centres must be two [x, y] points`)
        break
      case 'kmeans':
        if (!Array.isArray(item.centres) || item.centres.length < 1 || item.centres.length > 6 || !item.centres.every(isVec2)) fail(`${item.id}.centres: give 1 to 6 [x, y] cluster centres`)
        if (item.k !== undefined && !(Number.isInteger(item.k) && item.k >= 1 && item.k <= 6)) fail(`${item.id}.k must be 1..6`)
        number(item, 'iteration', item.iteration)
        break
      case 'clock':
        if (!Number.isInteger(item.modulus) || item.modulus < 2 || item.modulus > 60) fail(`${item.id}.modulus must be a whole number 2..60`)
        number(item, 'value', item.value)
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
