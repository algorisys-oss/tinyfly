import { drawDisplayList, graphSearchFigure, layoutFigure, shortestPathFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, graphSearchFigure, layoutFigure, shortestPathFigure }

export const html = `<style>
.gs-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.gs-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.gs-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.gs-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="gs-wrap">
<canvas class="gs-canvas" width="600" height="600"></canvas>
<div class="gs-controls"><label>Search <select class="gs-kind">
<option value="bfs">breadth first (a queue)</option><option value="dfs">depth first (a stack)</option><option value="dijkstra">shortest paths (Dijkstra)</option>
</select></label></div>
<div class="gs-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.gs-canvas').getContext('2d')
  const kind = root.querySelector('.gs-kind')
  const readout = root.querySelector('.gs-readout')
  const clock = { step: 0 }
  let figure, tween
  const build = () => {
    figure = kind.value === 'dijkstra'
      ? tinyfly.shortestPathFigure({ target: 'G', width: 600, height: 600 })
      : tinyfly.graphSearchFigure({ search: kind.value, width: 600, height: 600 })
    tween?.kill()
    clock.step = 0
    // One node per second; the fraction draws the edge the search is crossing.
    tween = live.to(clock, { step: 8, duration: 8, ease: 'none', repeat: -1, repeatDelay: 2 })
  }
  const draw = () => {
    readout.textContent = `${Math.floor(clock.step)} of 8 nodes · ${kind.options[kind.selectedIndex].textContent}`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { step: clock.step }))
  }
  build()
  kind.addEventListener('change', build)
  live.ticker.add(draw)
  // #endregion code
  return () => {
    live.ticker.remove(draw)
    kind.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const graphSearch = {
  id: 'live-graph-search', name: 'Graph Search',
  description: 'The same graph searched three ways: breadth first with a queue (level by level), depth first with a stack (as deep as it can go), and Dijkstra\'s shortest paths (nearest first, distances settling). Yellow nodes are done, blue ones wait in the queue, stack or open set, and yellow edges are how each node was reached. A graph item from @algorisys/tinyfly/math, stepped by one value.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'discrete', 'graphs', 'bfs', 'dfs', 'dijkstra', 'teaching'],
  addons: ['math'],
  html, run,
}
