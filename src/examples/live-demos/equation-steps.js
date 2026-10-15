import { deserializeTimeline } from '../../engine'
import { drawDisplayList, layoutFigure, lesson, mathFigure, mathSteps } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { deserializeTimeline, drawDisplayList, layoutFigure, lesson, mathFigure, mathSteps }

export const html = `<style>
.eqs-wrap { display:grid;gap:10px;width:100%;max-width:min(720px,calc(100vw - 24px));min-width:0; }
.eqs-canvas { display:block;width:100%;height:auto;aspect-ratio:720/420;border-radius:12px;background:#0f1117; }
.eqs-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="eqs-wrap">
<canvas class="eqs-canvas" width="720" height="420"></canvas>
<div class="eqs-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.eqs-canvas')
  const ctx = canvas.getContext('2d')
  const readout = root.querySelector('.eqs-readout')

  // Each equation is a list of TeX steps. Terms with the same text pair up by
  // order (x#1, =#1 …) and glide to their new places; the rest fade.
  const figure = tinyfly.mathFigure({
    width: 720, height: 420,
    items: [
      { id: 'solve', kind: 'equation', at: [360, 130], screen: true, size: 46, backdrop: false,
        steps: ['2x + 3 = 7', '2x = 7 - 3', '2x = 4', 'x = \\frac{4}{2}', 'x = 2'] },
      { id: 'square', kind: 'equation', at: [360, 300], screen: true, size: 40, color: 'yellow', backdrop: false,
        steps: ['(a + b)^2', '(a + b)(a + b)', 'a^2 + ab + ba + b^2', 'a^2 + 2ab + b^2'] },
    ],
  })

  const l = tinyfly.lesson({ id: 'algebra' })
  const steps = tinyfly.mathSteps(l, 'fig', figure)
  l.wait(800)
  for (let k = 1; k <= 4; k++) {
    l.together(() => {
      steps.showStep('solve', k)
      if (k <= 3) steps.showStep('square', k)
    })
    l.wait(1100)
  }
  const timeline = tinyfly.deserializeTimeline(l.definition())

  const clock = { time: 0 }
  live.to(clock, { time: timeline.duration, duration: timeline.duration / 1000, ease: 'none', repeat: -1, repeatDelay: 1 })
  const draw = () => {
    const props = Object.fromEntries(timeline.getStateAtTime(clock.time).values.get('fig'))
    readout.textContent = `step ${props['solve.step'].toFixed(2)} of 4 · ${(clock.time / 1000).toFixed(1)} s`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, props))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const equationSteps = {
  id: 'live-equation-steps', name: 'Equation Steps',
  description: 'Solving 2x + 3 = 7 and expanding (a + b)², one line at a time, the way a teacher rewrites the board: terms that stay glide to their new places, terms that go fade out, new ones fade in. The equations are plain TeX steps in an equation item of @algorisys/tinyfly/math, typeset by its built-in TeX subset (no KaTeX), and the steps are ordinary timeline keyframes on `solve.step`.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'algebra', 'equation', 'tex', 'teaching'],
  addons: ['math'],
  html, run,
}
