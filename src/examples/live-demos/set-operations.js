import { drawDisplayList, layoutFigure, vennFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, layoutFigure, vennFigure }

export const html = `<style>
.so-wrap { display:grid;gap:10px;width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0; }
.so-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.so-buttons { display:flex;flex-wrap:wrap;gap:8px; }
.so-buttons button { font:14px system-ui;padding:6px 12px;border-radius:8px;border:1px solid #3a4152;background:#1b2130;color:#e6e9ef;cursor:pointer; }
.so-buttons button[aria-pressed="true"] { border-color:#ffd75e;color:#ffd75e; }
</style><div class="so-wrap">
<canvas class="so-canvas" width="560" height="560"></canvas>
<div class="so-buttons">
<button data-e="A | B" data-t="A \\cup B">A ∪ B</button><button data-e="A & B" data-t="A \\cap B">A ∩ B</button>
<button data-e="A - B" data-t="A \\setminus B">A ∖ B</button><button data-e="A ^ B" data-t="A \\triangle B">A △ B</button>
<button data-e="A'" data-t="A'">A′</button><button data-e="(A | B)'" data-t="(A \\cup B)' = A' \\cap B'">De Morgan</button>
</div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.so-canvas').getContext('2d')
  const buttons = [...root.querySelectorAll('button[data-e]')]
  let figure
  const fade = { draw: 1 }
  const choose = (button) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
    figure = tinyfly.vennFigure({ highlight: button.dataset.e, label: button.dataset.t, width: 560, height: 560 })
    fade.draw = 0
    live.to(fade, { draw: 1, duration: 0.6, ease: 'power1.out' })
  }
  // Each region in turn (2.4 s each, the first change after 1.2 s) until the reader picks one.
  const clock = { time: 0 }
  const per = 2.4
  const cycle = live.to(clock, { time: per * buttons.length, duration: per * buttons.length, ease: 'none', repeat: -1 })
  let shown = 0
  let touring = true
  const onClick = (event) => {
    const button = event.target.closest('button[data-e]')
    if (!button) return
    touring = false
    cycle.kill()
    choose(button)
  }
  root.querySelector('.so-buttons').addEventListener('click', onClick)
  choose(buttons[0])
  const draw = () => {
    const due = Math.floor((clock.time + per / 2) / per) % buttons.length
    if (touring && due !== shown) choose(buttons[(shown = due)])
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { 'venn.draw': fade.draw }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => {
    cycle.kill()
    live.ticker.remove(draw)
    root.querySelector('.so-buttons').removeEventListener('click', onClick)
  }
}

/** @type {import('./types').LiveDemo} */
export const setOperations = {
  id: 'live-set-operations', name: 'Set Operations',
  description: 'Union, intersection, difference, symmetric difference and complement, shaded on a Venn diagram, and De Morgan\'s law: the outside of A ∪ B is exactly what is outside both. Each region is a set expression ("(A | B)\'") given to a venn item of @algorisys/tinyfly/math, which shades the matching cells by clipping, in canvas and in SVG alike.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'discrete', 'sets', 'venn', 'logic', 'teaching'],
  addons: ['math'],
  html, run,
}
