/**
 * Taylor series in 16:9 (1920×1080): sin x rebuilt from its derivatives at
 * 0, one term at a time, with the series written out beside it.
 *
 *   npx tinyfly video examples/headless-video/taylor-explainer.mjs
 *   npx tinyfly video examples/headless-video/taylor-explainer.mjs --stills stills/ --times 1500,6000,12000
 */
import { taylorFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1920
const H = 1080

const figure = taylorFigure({ expr: 'sin(x)', order: 0, x: [-9, 9], y: [-3.4, 3.4], width: W, height: H })
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{Building } \\sin x \\text{ from its derivatives at } 0', at: [W / 2, 70], screen: true, size: 26 },
  {
    id: 'series', kind: 'equation', at: [W / 2, H - 90], screen: true, size: 26,
    // Each step adds the next nonzero term; shared terms stay put.
    steps: [
      '\\sin x \\approx 0',
      '\\sin x \\approx x',
      '\\sin x \\approx x - \\frac{x^3}{3!}',
      '\\sin x \\approx x - \\frac{x^3}{3!} + \\frac{x^5}{5!}',
      '\\sin x \\approx x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\frac{x^7}{7!}',
      '\\sin x \\approx x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\frac{x^7}{7!} + \\frac{x^9}{9!}',
    ],
  },
)

const l = lesson({ id: 'taylor-explainer' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['f'] })
steps.drawOn('f', { duration: 1000 })
l.wait(500)
// sin has only odd terms: degrees 1, 3, 5, 7, 9.
for (const [k, degree] of [1, 3, 5, 7, 9].entries()) {
  l.together(() => {
    steps.toValue('order', degree, { duration: 1100 })
    steps.showStep('series', k + 1, { duration: 900 })
  })
  l.marker(`degree-${degree}`, { label: `Degree ${degree}` })
  l.wait(900)
}
l.wait(1500)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
