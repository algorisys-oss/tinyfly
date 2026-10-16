/**
 * Breadth-first search as a vertical short (1080×1920, 9:16): nodes are
 * finished level by level while the queue below shows what waits next.
 *
 *   npx tinyfly video examples/headless-video/graph-search-short.mjs
 *   npx tinyfly video examples/headless-video/graph-search-short.mjs --stills stills/ --times 2000,6000,11000
 */
import { graphSearchFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1080
const H = 1920

const figure = graphSearchFigure({ search: 'bfs', width: W, height: H })
// A taller frame: the graph in the middle, the queue under it, words above.
figure.x = [-3.8, 3.8]
figure.y = [-7.5, 6]
const graph = figure.items.find((item) => item.id === 'g')
graph.frontier = [W * 0.12, H * 0.78]
graph.radius = 20
figure.items.find((item) => item.id === 'readout').at = [W / 2, 330]
figure.items.find((item) => item.id === 'readout').align = 'center'
figure.items.push(
  { id: 'title', kind: 'label', tex: '\\text{Breadth-first search}', at: [W / 2, 170], screen: true, size: 34 },
  {
    id: 'caption', kind: 'equation', at: [W / 2, H - 200], screen: true, size: 22,
    steps: [
      '\\text{Start at A; put its neighbours in the queue}',
      '\\text{Take the oldest from the queue; add its new neighbours}',
      '\\text{Every node is reached by a fewest-edges path}',
    ],
  },
)

const l = lesson({ id: 'graph-search-short' })
const steps = mathSteps(l, 'fig', figure)
l.wait(600)
steps.toValue('step', 1, { duration: 1200, easing: 'linear' })
l.wait(800)
steps.showStep('caption', 1)
steps.toValue('step', 8, { duration: 8400, easing: 'linear' })
steps.showStep('caption', 2)
l.wait(2200)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
