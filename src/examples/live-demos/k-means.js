import { drawDisplayList, kmeansFigure, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, kmeansFigure, layoutFigure }

export const html = `<style>
.km-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.km-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.km-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="km-wrap"><canvas class="km-canvas" width="600" height="600"></canvas><div class="km-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.km-canvas').getContext('2d')
  const readout = root.querySelector('.km-readout')
  const figure = tinyfly.kmeansFigure({ width: 600, height: 600 })
  // Each iteration: colour every point by its nearest centroid, then move each centroid to the middle of its points.
  const run = { iteration: 0 }
  live.to(run, { iteration: 6, duration: 9, ease: 'none', repeat: -1, repeatDelay: 2 })
  const draw = () => {
    readout.textContent = `iteration ${Math.floor(run.iteration)} · assign to the nearest centroid, then move each centroid to the mean`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { iteration: run.iteration }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const kMeans = {
  id: 'live-k-means', name: 'K-Means',
  description: 'Clustering by k-means: three centroids start in the middle of the data, every point takes the colour of its nearest one, and each centroid moves to the mean of its points, again and again until nothing changes. The dashed trails show how far they travelled. A kmeans item from @algorisys/tinyfly/math with seeded points.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'ai', 'ml', 'clustering', 'k-means', 'teaching'],
  addons: ['math'],
  html, run,
}
