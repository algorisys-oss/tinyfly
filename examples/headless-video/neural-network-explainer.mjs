/**
 * A forward pass in 16:9 (1920×1080): activations flow through a small
 * network layer by layer, with the rule each node follows written out.
 *
 *   npx tinyfly video examples/headless-video/neural-network-explainer.mjs
 *   npx tinyfly video examples/headless-video/neural-network-explainer.mjs --stills stills/ --times 1500,4500,8000
 */
import { neuralNetworkFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1920
const H = 1080

const figure = neuralNetworkFigure({ layers: [3, 6, 5, 2], width: W, height: H })
figure.x = [-9, 9]
figure.y = [-5, 5]
const net = figure.items.find((item) => item.id === 'net')
net.at = [-3.4, -0.3]
net.size = [8, 7.5]
figure.items.find((item) => item.id === 'readout').at = [W * 0.72, H * 0.78]
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{A forward pass}', at: [W / 2, 60], screen: true, size: 28 },
  {
    id: 'rule', kind: 'equation', at: [W * 0.8, H * 0.42], screen: true, size: 30,
    steps: [
      'a = \\sigma(W x + b)',
      'a_j = \\sigma\\left(\\sum_i w_{ji} x_i + b_j\\right)',
      '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
    ],
  },
)

const l = lesson({ id: 'neural-network-explainer' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['rule'] })
l.set('fig', { flow: 0 })
l.wait(800)
steps.fadeIn('rule')
for (let layer = 1; layer <= 3; layer++) {
  steps.toValue('flow', layer, { duration: 1500, easing: 'ease-in-out' })
  if (layer < 3) steps.showStep('rule', layer)
  l.wait(500)
}
l.wait(2000)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
