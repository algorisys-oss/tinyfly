import { mathExplorable, riemannFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { mathExplorable, riemannFigure }

export const html = `<style>
.rs-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0;color:#cbd5e1; }
.rs-figure { border-radius:12px;overflow:hidden;background:#0f1117; }
.rs-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui; }
.rs-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="rs-wrap">
<div class="rs-figure"></div>
<div class="rs-controls"><label>Rule <select class="rs-rule">
<option value="left">left</option><option value="right">right</option><option value="midpoint">midpoint</option><option value="trapezoid">trapezoid</option>
</select></label></div>
<div class="rs-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const host = root.querySelector('.rs-figure')
  const rule = root.querySelector('.rs-rule')
  const readout = root.querySelector('.rs-readout')
  let explorable
  // Until the reader moves the slider, n doubles on its own.
  const auto = { n: 2 }
  let touched = false
  let tour

  const build = () => {
    const n = explorable ? explorable.values.n : 2
    explorable?.destroy()
    host.replaceChildren()
    const figure = tinyfly.riemannFigure({ expr: '2 + sin(x) + x / 4', from: 0, to: 6, n, rule: rule.value, x: [-0.5, 6.5], y: [-0.6, 4.6], width: 600, height: 600 })
    explorable = tinyfly.mathExplorable(host, figure, {
      sliders: [{ value: 'n', min: 1, max: 64, step: 1, label: 'rectangles' }],
      onChange: ({ n: count }) => {
        const pieces = Math.round(count)
        readout.textContent = `${pieces} ${rule.value} piece${pieces === 1 ? '' : 's'} · the sum closes in on the exact area as n grows`
      },
    })
    host.querySelector('input')?.addEventListener('input', () => {
      touched = true
      tour?.kill()
    })
  }

  build()
  tour = live.to(auto, {
    n: 64, duration: 6, ease: 'power2.in', repeat: -1, repeatDelay: 1,
    onUpdate: () => {
      if (!touched) explorable.set('n', Math.round(auto.n))
    },
  })
  rule.addEventListener('change', build)
  // #endregion code
  return () => {
    tour?.kill()
    explorable?.destroy()
    rule.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const riemannSums = {
  id: 'live-riemann-sums', name: 'Riemann Sums',
  description: 'The area under a curve as the limit of rectangles: n doubles on its own until you take the slider, and the readout compares the sum with the exact integral. Switch between left, right, midpoint and trapezoid rules to see which closes in fastest. riemannFigure() and mathExplorable() from @algorisys/tinyfly/math; the integral is Simpson\'s rule, the sum is the rectangles you see.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'calculus', 'integral', 'riemann', 'explorable', 'teaching'],
  addons: ['math'],
  html, run,
}
