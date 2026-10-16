import { decisionBoundaryFigure, drawDisplayList, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { decisionBoundaryFigure, drawDisplayList, layoutFigure }

export const html = `<style>
.db-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.db-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.db-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="db-wrap"><canvas class="db-canvas" width="600" height="600"></canvas><div class="db-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.db-canvas').getContext('2d')
  const readout = root.querySelector('.db-readout')
  // Logistic regression starts from a wrong guess and turns its line into place.
  const figure = tinyfly.decisionBoundaryFigure({ width: 600, height: 600 })
  const training = { epochs: 0 }
  live.to(training, { epochs: 80, duration: 9, ease: 'power2.out', repeat: -1, repeatDelay: 2 })
  const draw = () => {
    readout.textContent = `epoch ${Math.floor(training.epochs)} · the shading is the model's probability of orange`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { epochs: training.epochs }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const decisionBoundary = {
  id: 'live-decision-boundary', name: 'Decision Boundary',
  description: 'A classifier learning: logistic regression starts from a wrong line between two clusters and, epoch by epoch of gradient descent, turns it into place while the accuracy rises and the loss falls. The background shades the model\'s probability. A classifier item from @algorisys/tinyfly/math, with seeded data and the training worked out exactly.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'ai', 'ml', 'classification', 'logistic regression', 'teaching'],
  addons: ['math'],
  html, run,
}
