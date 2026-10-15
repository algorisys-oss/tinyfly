import { drawDisplayList, galtonFigure, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, galtonFigure, layoutFigure }

export const html = `<style>
.gb-wrap { display:grid;gap:10px;width:100%;max-width:min(440px,calc(100vw - 24px));min-width:0; }
.gb-canvas { display:block;width:100%;height:auto;aspect-ratio:440/720;border-radius:12px;background:#0f1117; }
.gb-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="gb-wrap">
<canvas class="gb-canvas" width="440" height="720"></canvas>
<div class="gb-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.gb-canvas').getContext('2d')
  const readout = root.querySelector('.gb-readout')
  // Every ball bounces left or right at each row by its own seeded coin flips,
  // so the board fills the same way every time, into a binomial bell.
  const figure = tinyfly.galtonFigure({ rows: 10, width: 440, height: 720 })
  const drop = { balls: 0 }
  // Slow at first, so single balls can be followed, then faster.
  live.to(drop, { balls: 220, duration: 22, ease: 'power2.in', repeat: -1, repeatDelay: 2 })
  const draw = () => {
    readout.textContent = `${Math.floor(drop.balls)} balls · each bin's share approaches C(10, k) / 2¹⁰`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { balls: drop.balls }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const galtonBoard = {
  id: 'live-galton-board', name: 'Galton Board',
  description: 'Balls bounce left or right at every peg and pile up into a bell curve: the binomial distribution, and a first look at the central limit theorem. Every bounce is a seeded coin flip, so the board fills the same way every time it plays. A galton item from @algorisys/tinyfly/math, animated by one value: how many balls have dropped.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'probability', 'statistics', 'binomial', 'galton', 'teaching'],
  addons: ['math'],
  html, run,
}
