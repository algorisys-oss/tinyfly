/**
 * "Area is a limit of rectangles" as a vertical short (1080×1920, 9:16):
 * rectangles thin out from 2 to 128 while the sum closes in on the integral,
 * then the area fills in on its own.
 *
 *   npx tinyfly video examples/headless-video/riemann-short.mjs
 *   npx tinyfly video examples/headless-video/riemann-short.mjs --stills stills/ --times 2000,6500,11000
 */
import { riemannFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1080
const H = 1920
const EXPR = '2 + sin(x) + x / 4'

const figure = riemannFigure({ expr: EXPR, from: 0, to: 6, n: 2, x: [-0.6, 6.6], y: [-3.2, 7.2], width: W, height: H })
figure.values.b = 0
figure.items.splice(1, 0, { id: 'area', kind: 'area', expr: EXPR, from: 0, to: 'b', color: 'yellow', fillOpacity: 0.45 })
figure.items.find((item) => item.id === 'readout').at = [W / 2, 330]
figure.items.find((item) => item.id === 'readout').align = 'center'
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{Area is a limit of rectangles}', at: [W / 2, 170], screen: true, size: 32 },
  {
    id: 'caption', kind: 'equation', at: [W / 2, H - 300], screen: true, size: 30,
    steps: [
      '\\text{Two rectangles: a rough guess}',
      '\\text{More, thinner rectangles: closer}',
      '\\int_0^6 f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i)\\,\\Delta x',
    ],
  },
)

const l = lesson({ id: 'riemann-short' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['f', 'sum', 'area'] })
l.marker('start', { label: 'Two rectangles' })
steps.drawOn('f', { duration: 1000 })
steps.drawOn('sum', { duration: 600 })
l.wait(900)
steps.showStep('caption', 1)
for (const n of [4, 8, 16, 32, 64, 128]) {
  steps.toValue('n', n, { duration: 700 })
  l.wait(350)
}
l.marker('limit', { label: 'The limit is the integral' })
steps.fadeOut('sum', { duration: 600 })
l.set('fig', { 'area.draw': 1 })
steps.toValue('b', 6, { duration: 1800 })
steps.showStep('caption', 2)
l.wait(1800)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
