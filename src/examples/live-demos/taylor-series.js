import { deserializeTimeline } from '../../engine'
import { drawDisplayList, layoutFigure, lesson, mathSteps, taylorFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { deserializeTimeline, drawDisplayList, layoutFigure, lesson, mathSteps, taylorFigure }

export const html = `<style>
.ts-wrap { display:grid;gap:10px;width:100%;max-width:min(720px,calc(100vw - 24px));min-width:0; }
.ts-canvas { display:block;width:100%;height:auto;aspect-ratio:720/480;border-radius:12px;background:#0f1117; }
.ts-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.ts-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="ts-wrap">
<canvas class="ts-canvas" width="720" height="480"></canvas>
<div class="ts-controls"><label>f(x) = <select class="ts-f">
<option value="sin(x)|0|-7,7|-3,3">sin x about 0</option>
<option value="cos(x)|0|-7,7|-3,3">cos x about 0</option>
<option value="exp(x)|0|-5,3|-2,8">eˣ about 0</option>
<option value="ln(1 + x)|0|-1.5,4|-3,2.5">ln(1 + x) about 0</option>
</select></label></div>
<div class="ts-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ts-canvas')
  const ctx = canvas.getContext('2d')
  const picker = root.querySelector('.ts-f')
  const readout = root.querySelector('.ts-readout')
  const clock = { time: 0 }
  let figure, timeline, animation

  const build = () => {
    const [expr, at, xs, ys] = picker.value.split('|')
    figure = tinyfly.taylorFigure({ expr, at: Number(at), order: 0, x: xs.split(',').map(Number), y: ys.split(',').map(Number), width: 720, height: 480 })
    // Each term grows in: the order moves smoothly from one whole number to the next.
    const l = tinyfly.lesson({ id: 'taylor' })
    const steps = tinyfly.mathSteps(l, 'fig', figure)
    l.wait(600)
    for (let order = 1; order <= 12; order++) {
      steps.toValue('order', order, { duration: 700 })
      l.wait(350)
    }
    l.wait(1200)
    timeline = tinyfly.deserializeTimeline(l.definition())
    animation?.kill()
    clock.time = 0
    animation = live.to(clock, { time: timeline.duration, duration: timeline.duration / 1000, ease: 'none', repeat: -1 })
  }

  const draw = () => {
    const props = Object.fromEntries(timeline.getStateAtTime(clock.time).values.get('fig'))
    readout.textContent = `degree ${Math.floor(props.order)} · ${(clock.time / 1000).toFixed(1)} s · each term is f⁽ᵏ⁾(0) xᵏ / k!, from exact derivatives`
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
export const taylorSeries = {
  id: 'live-taylor-series', name: 'Taylor Series',
  description: 'A function rebuilt from its derivatives at one point: each Taylor term grows in smoothly and the polynomial hugs the curve over a wider stretch. ln(1 + x) shows the radius of convergence: past x = 1 the polynomials swing away however many terms you add. taylorFigure() from @algorisys/tinyfly/math computes every coefficient from exact symbolic derivatives.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'calculus', 'taylor', 'series', 'teaching'],
  addons: ['math'],
  html, run,
}
