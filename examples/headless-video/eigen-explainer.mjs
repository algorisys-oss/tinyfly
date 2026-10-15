/**
 * Eigenvectors in 16:9 (1920×1080): the lines a matrix leaves on their own
 * span. A vector on an eigenline only stretches; one off it is knocked away.
 *
 *   npx tinyfly video examples/headless-video/eigen-explainer.mjs
 *   npx tinyfly video examples/headless-video/eigen-explainer.mjs --stills stills/ --times 0,4000,7500
 */
import { eigenFigure, mathTarget, mathSteps, mat2 } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1920
const H = 1080
const A = [3, 1, 0, 2]
const [big, small] = mat2.eigen(A)

const figure = eigenFigure({ width: W, height: H, x: [-8, 8], matrix: A })
figure.values.e1 = big.vector.map((v) => v * 1.5)
figure.values.e2 = small.vector.map((v) => v * 1.5)
figure.values.w = [-1, 1.5]
figure.items.push(
  // Two vectors on the eigenlines and one off them, all carried by M.
  { id: 'onFirst', kind: 'vector', to: 'e1', transform: 'M', color: 'yellow', label: '\\lambda = 3' },
  { id: 'onSecond', kind: 'vector', to: 'e2', transform: 'M', color: 'orange', label: '\\lambda = 2' },
  { id: 'off', kind: 'vector', to: 'w', transform: 'M', color: 'pink', label: '\\vec{w}' },
  { id: 'offSpan', kind: 'line', along: 'w', color: 'pink', dashed: true, width: 2 },
  { id: 'title', kind: 'label', tex: '\\text{Eigenvectors: } A\\vec{v} = \\lambda \\vec{v}', at: [W / 2, 80], screen: true, size: 30 },
)
figure.items.find((item) => item.id === 'matrix').tex = 'A = \\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix}'

const l = lesson({ id: 'eigen-explainer' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['eigen', 'onFirst', 'onSecond', 'off', 'offSpan'] })
l.wait(600)
steps.drawOn('eigen', { duration: 1000 })
l.together(() => {
  steps.drawOn('onFirst', { duration: 700 })
  steps.drawOn('onSecond', { duration: 700 })
})
steps.drawOn('off', { duration: 600 })
steps.drawOn('offSpan', { duration: 600 })
l.marker('before', { label: 'Two eigenlines, and a vector off them' })
l.wait(700)
steps.applyMatrix(A, { duration: 2400 })
l.marker('after', { label: 'The eigenvectors only stretch, by 3 and 2; w leaves its line' })
l.wait(2000)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
