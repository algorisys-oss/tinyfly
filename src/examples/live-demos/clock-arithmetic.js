import { clockFigure, drawDisplayList, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { clockFigure, drawDisplayList, layoutFigure }

export const html = `<style>
.clk-wrap { display:grid;gap:10px;width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0; }
.clk-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.clk-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.clk-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="clk-wrap">
<canvas class="clk-canvas" width="560" height="560"></canvas>
<div class="clk-controls"><label>Modulus <select class="clk-mod"><option>12</option><option>7</option><option>5</option><option>24</option></select></label>
<label>Add each step <select class="clk-add"><option>5</option><option>3</option><option>7</option><option>1</option></select></label></div>
<div class="clk-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.clk-canvas').getContext('2d')
  const mod = root.querySelector('.clk-mod')
  const add = root.querySelector('.clk-add')
  const readout = root.querySelector('.clk-readout')
  const count = { value: 0 }
  let figure, tween
  const build = () => {
    figure = tinyfly.clockFigure({ modulus: Number(mod.value), width: 560, height: 560 })
    tween?.kill()
    count.value = 0
    // Add the step again and again; the hand glides round, the total keeps growing.
    const steps = Number(mod.value)
    tween = live.to(count, { value: steps * Number(add.value), duration: steps * 0.9, ease: `steps(${steps})`, repeat: -1, repeatDelay: 1.5 })
  }
  const draw = () => {
    const n = Number(mod.value)
    readout.textContent = `${Math.round(count.value)} ≡ ${((Math.round(count.value) % n) + n) % n} (mod ${n}) · adding ${add.value} visits ${Number(add.value) % n === 0 ? 'only 0' : 'every hour when they share no factor'}`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { value: count.value }))
  }
  build()
  mod.addEventListener('change', build)
  add.addEventListener('change', build)
  live.ticker.add(draw)
  // #endregion code
  return () => {
    live.ticker.remove(draw)
    mod.removeEventListener('change', build)
    add.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const clockArithmetic = {
  id: 'live-clock-arithmetic', name: 'Clock Arithmetic',
  description: 'Modular arithmetic on a clock face: keep adding the same number and the hand visits the hours in a pattern. Adding 5 on a 12-hour clock visits every hour, because 5 and 12 share no factor; adding 3 visits only four. A clock item from @algorisys/tinyfly/math whose hand points at value mod n.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'discrete', 'modular arithmetic', 'number theory', 'teaching'],
  addons: ['math'],
  html, run,
}
