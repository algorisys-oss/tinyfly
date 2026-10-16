/**
 * Gradient descent as a vertical short (1080×1920, 9:16): the same narrow
 * valley twice, a big step size zigzagging down on top, momentum gliding
 * along the floor below.
 *
 *   npx tinyfly video examples/headless-video/gradient-descent-short.mjs
 *   npx tinyfly video examples/headless-video/gradient-descent-short.mjs --stills stills/ --times 2000,6000,11000
 */
import { mathFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1080
const H = 1920
const valley = '(x^2 + 8 (y - 2.6)^2) / 4'
const lower = '(x^2 + 8 (y + 2.6)^2) / 4'

const figure = mathFigure({
  width: W, height: H, x: [-4.2, 4.2], y: [-7.4, 7.4],
  values: { steps: 0 },
  items: [
    { id: 'title', kind: 'label', tex: '\\text{Gradient descent}', at: [W / 2, 110], screen: true, size: 34 },
    { id: 'topField', kind: 'heatmap', expr: valley, region: [[-4.2, 4.2], [0.6, 4.6]], resolution: 40, opacity: 0.4 },
    { id: 'topLevels', kind: 'contours', expr: valley, region: [[-4.2, 4.2], [0.6, 4.6]], levels: 8 },
    { id: 'zigzag', kind: 'descent', expr: valley, start: [-3.8, 3.9], rate: 0.45, steps: 'steps' },
    { id: 'topLabel', kind: 'label', tex: '\\text{step size } 0.45 \\text{: zigzag}', at: [0, 5.3], size: 26 },
    { id: 'lowField', kind: 'heatmap', expr: lower, region: [[-4.2, 4.2], [-4.6, -0.6]], resolution: 40, opacity: 0.4 },
    { id: 'lowLevels', kind: 'contours', expr: lower, region: [[-4.2, 4.2], [-4.6, -0.6]], levels: 8 },
    { id: 'glide', kind: 'descent', expr: lower, start: [-3.8, -1.3], rate: 0.05, momentum: 0.85, steps: 'steps', color: 'yellow' },
    { id: 'lowLabel', kind: 'label', tex: '\\text{step } 0.05 \\text{ with momentum: glide}', at: [0, -5.3], size: 26 },
    { id: 'rule', kind: 'label', tex: '\\theta \\leftarrow \\theta - \\eta \\, \\nabla f(\\theta)', at: [W / 2, H - 150], screen: true, size: 34, color: 'yellow' },
  ],
})

const l = lesson({ id: 'gradient-descent-short' })
const steps = mathSteps(l, 'fig', figure)
l.wait(800)
steps.toValue('steps', 40, { duration: 11000, easing: 'linear' })
l.wait(2000)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
