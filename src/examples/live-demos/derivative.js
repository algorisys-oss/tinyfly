import { deserializeTimeline } from '../../engine'
import { drawDisplayList, layoutFigure, lesson, mathSteps, secantFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { deserializeTimeline, drawDisplayList, layoutFigure, lesson, mathSteps, secantFigure }

export const html = `<style>
.dv-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.dv-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.dv-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.dv-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="dv-wrap">
<canvas class="dv-canvas" width="600" height="600"></canvas>
<div class="dv-controls"><label>f(x) = <select class="dv-f">
<option value="x^3 / 6 - x">x³/6 − x</option>
<option value="sin(x) + 1">sin x + 1</option>
<option value="exp(x / 2) - 1">e^(x/2) − 1</option>
</select></label></div>
<div class="dv-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.dv-canvas')
  const ctx = canvas.getContext('2d')
  const picker = root.querySelector('.dv-f')
  const readout = root.querySelector('.dv-readout')
  const clock = { time: 0 }
  let figure, timeline, animation

  const build = () => {
    // The secant through a and a + h: as h shrinks to 0 it becomes the tangent.
    figure = tinyfly.secantFigure({ expr: picker.value, at: -2, h: 2.5, x: [-4, 4], width: 600, height: 600 })
    const l = tinyfly.lesson({ id: 'derivative' })
    const steps = tinyfly.mathSteps(l, 'fig', figure, { hidden: ['secant'] })
    steps.drawOn('f', { duration: 900 })
    steps.drawOn('secant', { duration: 600 })
    l.wait(500)
    steps.toValue('h', 0, { duration: 2600 })
    l.wait(600)
    steps.toValue('a', 2.5, { duration: 3200 })
    steps.toValue('a', -2, { duration: 1400 })
    steps.toValue('h', 2.5, { duration: 800 })
    timeline = tinyfly.deserializeTimeline(l.definition())
    animation?.kill()
    clock.time = 0
    animation = live.to(clock, { time: timeline.duration, duration: timeline.duration / 1000, ease: 'none', repeat: -1 })
  }

  const draw = () => {
    const props = Object.fromEntries(timeline.getStateAtTime(clock.time).values.get('fig'))
    readout.textContent = `a = ${props.a.toFixed(2)} · h = ${props.h.toFixed(3)} · ${props.h > 0.001 ? 'secant: rise over run' : 'tangent: the derivative'}`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, props))
  }

  build()
  picker.addEventListener('change', build)
  live.ticker.add(draw)
  // #endregion code
  return () => {
    live.ticker.remove(draw)
    picker.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const derivative = {
  id: 'live-derivative', name: 'Derivative',
  description: 'The derivative as a limit you can watch: a secant through a and a + h, its slope Δy/Δx shown live, shrinks to the tangent as h goes to 0, then slides along the curve. Slopes come from exact symbolic derivatives in @algorisys/tinyfly/math (secantFigure), and the motion is lesson steps on the values a and h.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'calculus', 'derivative', 'tangent', 'teaching'],
  addons: ['math'],
  html, run,
}
