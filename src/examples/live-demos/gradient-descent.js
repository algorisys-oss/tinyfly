import { drawDisplayList, gradientDescentFigure, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, gradientDescentFigure, layoutFigure }

export const html = `<style>
.gd-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.gd-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.gd-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.gd-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="gd-wrap">
<canvas class="gd-canvas" width="600" height="600"></canvas>
<div class="gd-controls"><label>Step size <select class="gd-rate">
<option value="0.05|0">0.05: slow and steady</option><option value="0.2|0" selected>0.2: about right</option>
<option value="0.45|0">0.45: zigzags across the valley</option><option value="0.52|0">0.52: overshoots and diverges</option>
<option value="0.05|0.85">0.05 with momentum 0.85</option>
</select></label></div>
<div class="gd-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.gd-canvas').getContext('2d')
  const picker = root.querySelector('.gd-rate')
  const readout = root.querySelector('.gd-readout')
  // A long, narrow valley: f(x, y) = (x² + 8y²) / 4, steep across and shallow along.
  const figure = tinyfly.gradientDescentFigure({ width: 600, height: 600 })
  const walk = { steps: 0 }
  let tween
  const start = () => {
    tween?.kill()
    walk.steps = 0
    tween = live.to(walk, { steps: 40, duration: 8, ease: 'none', repeat: -1, repeatDelay: 1.5 })
  }
  const draw = () => {
    const [rate, momentum] = picker.value.split('|').map(Number)
    readout.textContent = `step ${Math.floor(walk.steps)} · each step moves against the gradient by ${rate}× its length${momentum ? `, keeping ${momentum} of the last step` : ''}`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { steps: walk.steps, rate, momentum }))
  }
  start()
  picker.addEventListener('change', start)
  live.ticker.add(draw)
  // #endregion code
  return () => {
    live.ticker.remove(draw)
    picker.removeEventListener('change', start)
  }
}

/** @type {import('./types').LiveDemo} */
export const gradientDescent = {
  id: 'live-gradient-descent', name: 'Gradient Descent',
  description: 'Walking downhill on a loss surface: each step moves against the gradient. Too small a step crawls, a good one settles, a large one zigzags across the narrow valley, and too large diverges; momentum carries it along the valley floor. Contours and colours show the surface. A descent item from @algorisys/tinyfly/math whose gradient is worked out symbolically from the expression.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'ai', 'ml', 'optimisation', 'gradient descent', 'teaching'],
  addons: ['math'],
  html, run,
}
