import { drawDisplayList, layoutFigure, monteCarloPiFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, layoutFigure, monteCarloPiFigure }

export const html = `<style>
.mcpi-wrap { display:grid;gap:10px;width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0; }
.mcpi-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.mcpi-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="mcpi-wrap"><canvas class="mcpi-canvas" width="560" height="560"></canvas><div class="mcpi-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.mcpi-canvas').getContext('2d')
  const readout = root.querySelector('.mcpi-readout')
  const figure = tinyfly.monteCarloPiFigure({ width: 560, height: 560 })
  const throws = { count: 0 }
  live.to(throws, { count: 6000, duration: 12, ease: 'power2.in', repeat: -1, repeatDelay: 2 })
  const draw = () => {
    // The figure's own readout shows the share inside; 4 times it estimates π.
    readout.textContent = `${Math.floor(throws.count)} points thrown at the square`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { count: throws.count }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const monteCarloPi = {
  id: 'live-monte-carlo-pi', name: 'Monte Carlo π',
  description: 'Throw random points at a square and count how many land inside the circle: the share closes in on π/4. The points are seeded, so the estimate unfolds the same way every time. A scatter item from @algorisys/tinyfly/math with an inside test, x² + y² ≤ 1, and a live TeX readout of the count.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'probability', 'monte carlo', 'pi', 'teaching'],
  addons: ['math'],
  html, run,
}
