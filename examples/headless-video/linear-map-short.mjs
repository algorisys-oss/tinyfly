/**
 * "What does a matrix do?" as a vertical short (1080×1920, 9:16): î and ĵ
 * move, the grid follows, and the unit square shows the determinant.
 *
 *   npx tinyfly video examples/headless-video/linear-map-short.mjs
 *   npx tinyfly video examples/headless-video/linear-map-short.mjs --stills stills/ --times 0,3000,7000,12000
 *
 * The figure is JSON (linearMapFigure plus a narration line and a title);
 * the timeline is lesson steps from mathSteps(), so the same two pieces play
 * in a lesson page embed or the gallery.
 */
import { linearMapFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1080
const H = 1920

const figure = linearMapFigure({ width: W, height: H, x: [-4, 4] })
// Narration and a title: TeX \text lines; each step fades to the next.
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{What does a matrix do?}', at: [W / 2, 190], screen: true, size: 34 },
  {
    id: 'caption', kind: 'equation', at: [W / 2, H - 260], screen: true, size: 26,
    steps: [
      '\\text{Every point is a mix of } \\hat{i} \\text{ and } \\hat{j}',
      '\\text{A matrix says where } \\hat{i} \\text{ and } \\hat{j} \\text{ land}',
      '\\text{A shear: } \\hat{j} \\text{ slides over, the grid follows}',
      '\\text{A rotation: everything turns together}',
      '\\text{Squash: the area goes to } 0',
    ],
  },
)
// Square and matrix lower and larger in the tall frame.
figure.items.find((item) => item.id === 'matrix').at = [W * 0.08, 380]
figure.items.find((item) => item.id === 'square').label = '\\det = \\val{M.det}'

const l = lesson({ id: 'linear-map-short' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['grid', 'square', 'basis'] })
l.marker('intro', { label: 'What does a matrix do?' })
steps.drawOn('grid', { duration: 1200 })
steps.drawOn('basis', { duration: 700 })
steps.drawOn('square', { duration: 600 })
l.wait(800)
steps.showStep('caption', 1)
l.wait(900)
steps.showStep('caption', 2)
l.marker('shear', { label: 'Shear' })
steps.applyMatrix([1, 1, 0, 1])
l.wait(1200)
steps.applyMatrix([1, 0, 0, 1], { duration: 900 })
steps.showStep('caption', 3)
l.marker('rotate', { label: 'Rotation' })
steps.applyMatrix([0, -1, 1, 0])
l.wait(1200)
steps.applyMatrix([1, 0, 0, 1], { duration: 900 })
steps.showStep('caption', 4)
l.marker('squash', { label: 'Squash' })
steps.applyMatrix([1, 2, 0.5, 1], { duration: 1800 })
l.wait(1600)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
