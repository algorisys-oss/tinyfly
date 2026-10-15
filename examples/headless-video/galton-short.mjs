/**
 * The Galton board as a vertical short (1080×1920, 9:16): 260 balls bounce
 * through ten rows of pegs into a bell curve, slowly at first, then pouring.
 *
 *   npx tinyfly video examples/headless-video/galton-short.mjs
 *   npx tinyfly video examples/headless-video/galton-short.mjs --stills stills/ --times 3000,9000,17000
 *
 * Every bounce is a seeded coin flip, so the board fills the same way on every render.
 */
import { galtonFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1080
const H = 1920

const figure = galtonFigure({ rows: 10, width: W, height: H, x: [-3.2, 3.2], y: [-16, 3.5] })
figure.items.find((item) => item.id === 'readout').at = [W / 2, 190]
figure.items.find((item) => item.id === 'readout').align = 'center'
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{Why the bell curve?}', at: [W / 2, 105], screen: true, size: 34 },
  {
    id: 'caption', kind: 'equation', at: [W / 2, 270], screen: true, size: 22,
    steps: [
      '\\text{Each ball goes left or right at every peg}',
      '\\text{Most paths mix lefts and rights: they land in the middle}',
      'P(k) = \\binom{10}{k} \\frac{1}{2^{10}}',
    ],
  },
)
// \binom is not in the TeX subset; write the coefficient as a fraction of factorials.
figure.items.at(-1).steps[2] = 'P(k) = \\frac{10!}{k!\\,(10 - k)!} \\cdot \\frac{1}{2^{10}}'

const l = lesson({ id: 'galton-short' })
const steps = mathSteps(l, 'fig', figure)
l.marker('start', { label: 'One ball at a time' })
steps.toValue('balls', 4, { duration: 5000, easing: 'linear' })
steps.showStep('caption', 1)
l.marker('pour', { label: 'Then many' })
steps.toValue('balls', 260, { duration: 11000, easing: 'ease-in' })
steps.showStep('caption', 2)
l.wait(2500)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
