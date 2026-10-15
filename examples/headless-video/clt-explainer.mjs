/**
 * The central limit theorem in 16:9 (1920×1080): averages of k draws from a
 * lopsided (exponential) distribution pile up into a normal curve, narrower
 * by 1/√k, as k goes 1, 2, 5, 10, 30.
 *
 *   npx tinyfly video examples/headless-video/clt-explainer.mjs
 *   npx tinyfly video examples/headless-video/clt-explainer.mjs --stills stills/ --times 2500,8000,15000
 */
import { cltFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1920
const H = 1080

const figure = cltFigure({ k: 1, samples: 0, width: W, height: H, x: [-0.3, 3.3], y: [-0.25, 3.2] })
figure.items.find((item) => item.id === 'readout').at = [W * 0.05, 150]
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{The central limit theorem}', at: [W / 2, 55], screen: true, size: 28 },
  { id: 'law', kind: 'label', tex: '\\bar{X}_k \\approx N\\left(\\mu, \\frac{\\sigma}{\\sqrt{k}}\\right)', at: [W * 0.78, H * 0.3], screen: true, size: 34, color: 'yellow' },
)

const l = lesson({ id: 'clt-explainer' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['law'] })
steps.toValue('samples', 4000, { duration: 2500, easing: 'ease-in' })
l.marker('one', { label: 'One draw: lopsided' })
l.wait(800)
for (const k of [2, 5, 10, 30]) {
  steps.toValue('k', k, { duration: 1400 })
  l.wait(900)
}
l.marker('normal', { label: 'Thirty draws averaged: normal' })
steps.fadeIn('law')
l.wait(2500)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
