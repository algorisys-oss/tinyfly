/**
 * @algorisys/tinyfly/math: maths teaching animations.
 *
 * A figure is JSON (a coordinate plane and items: grids, axes, vectors,
 * functions, polygons, equations); its values (numbers, vectors, matrices)
 * and its items' draw / opacity / step are animated by ordinary timeline
 * tracks. One pure layout step turns figure + values into shapes, drawn on a
 * canvas (videos, Workers, live demos) or as SVG (lesson embeds, static
 * export), so every output shows the same picture.
 */
// Grouped by kind, like the engine's vec3 / mat4: `vec2.add`, `mat2.eigen`.
export * as vec2 from './linear/vec2'
export * as mat2 from './linear/mat2'
export type { Vec2 } from './linear/vec2'
export type { Mat2, Eigenpair } from './linear/mat2'
export { parseExpression, expressionNames, ExpressionError, FUNCTIONS, CONSTANTS, type Expression as MathExpression } from './expr/parse-expression'
export { evaluate, compile, compileDerivative, type Scope } from './expr/evaluate'
export { differentiate, nthDerivative, expressionToString } from './expr/differentiate'
export { integrate } from './figure/derived'
export { density, meanOf, sdOf, supportOf, sample, samples, isDiscrete, distributionProblem, DISTRIBUTION_KINDS, type Distribution, type DistributionKind } from './prob/distributions'
export { binSamples, defaultBins, summary, type Bin } from './prob/histogram'
export { scatterPoints, leastSquares, type PointsSpec } from './prob/scatter'
export { ballPath, ballAt, binOf } from './prob/galton'
export { bayesAreas, type BayesAreas } from './prob/bayes'
export { searchEvents, treeLayout, adjacency, SEARCH_KINDS, type SearchKind, type SearchEvent, type GraphEdge } from './discrete/graph-search'
export { parseSetExpression, inRegion, regionCells, setNames, type SetExpression } from './discrete/set-expression'
export { parseTex, TexError, TEX_COMMANDS, SYMBOLS, type TexNode, type TexClass } from './tex/tex-parser'
export { layoutTex, type TexLayout, type TexPiece, type TexGlyph, type TexRule, type TexStroke, type TexLayoutOptions } from './tex/tex-layout'
export { morphEquation, type MorphPiece, type PlacedLayout } from './tex/equation-morph'
export { MATH_FONT, MATH_SYMBOL_FONT } from './tex/glyph-metrics'
export * from './figure/figure-spec'
export { validateMathFigure } from './figure/validate-spec'
export { layoutFigure, type MathProps } from './figure/layout-figure'
export { planeOf, type Plane } from './figure/plane'
export { texToShapes, trimPolylines, type DisplayList, type Shape, type TexPlacement } from './figure/display-list'
export { drawDisplayList } from './render/draw-display-list'
export { displayListToSvg, displayListToSvgContent } from './render/display-list-to-svg'
export { mathTarget, mathFigureProps, type MathCanvasTarget } from './targets/math-target'
export { mathSteps, type MathSteps } from './steps/math-steps'
export { mountMath, mountAllMath, type MountedMathFigure } from './embed/mount-math'
export { mathExplorable, type MathExplorable, type ExplorableOptions, type SliderControl, type DragHandle } from './embed/explorable'
export {
  linearMapFigure,
  determinantFigure,
  eigenFigure,
  vectorSumFigure,
  spanFigure,
  MATRIX_TEX,
  type PresetOptions,
} from './presets/linear-algebra'
export { tangentFigure, secantFigure, riemannFigure, areaFigure, taylorFigure, limitFigure, type CalculusOptions } from './presets/calculus'
export { normalFigure, binomialFigure, cltFigure, galtonFigure, monteCarloPiFigure, regressionFigure, bayesFigure, type ProbabilityOptions } from './presets/probability'
export { graphSearchFigure, shortestPathFigure, recursionTreeFigure, vennFigure, clockFigure, SAMPLE_GRAPH, type DiscreteOptions } from './presets/discrete'

import type { MathFigureSpec } from './figure/figure-spec'
import { validateMathFigure } from './figure/validate-spec'
import { layoutFigure, type MathProps } from './figure/layout-figure'
import { displayListToSvg } from './render/display-list-to-svg'

/** A figure checked up front: returns it unchanged, or throws a message that says how to fix it. */
export function mathFigure(spec: MathFigureSpec): MathFigureSpec {
  return validateMathFigure(spec)
}

/** A figure at some values as a standalone SVG document (for static pages, RSS, email, print). */
export function mathFigureToSvg(spec: MathFigureSpec, props: MathProps = {}, options: { title?: string } = {}): string {
  return displayListToSvg(layoutFigure(validateMathFigure(spec), props), options)
}
