import { drawDisplayList, layoutFigure, recursionTreeFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { drawDisplayList, layoutFigure, recursionTreeFigure }

export const html = `<style>
.rt-wrap { display:grid;gap:10px;width:100%;max-width:min(720px,calc(100vw - 24px));min-width:0; }
.rt-canvas { display:block;width:100%;height:auto;aspect-ratio:720/480;border-radius:12px;background:#0f1117; }
.rt-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="rt-wrap"><canvas class="rt-canvas" width="720" height="480"></canvas><div class="rt-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.rt-canvas').getContext('2d')
  const readout = root.querySelector('.rt-readout')
  // F(5) = F(4) + F(3): every call makes two more until F(1) or F(0), in call order.
  const figure = tinyfly.recursionTreeFigure({ n: 5, width: 720, height: 480 })
  const calls = { step: 0 }
  live.to(calls, { step: 15, duration: 10, ease: 'none', repeat: -1, repeatDelay: 2 })
  const draw = () => {
    readout.textContent = `${Math.floor(calls.step)} of 15 calls · F(3) is worked out twice, F(2) three times: the waste memoisation removes`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { step: calls.step }))
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const recursionTree = {
  id: 'live-recursion-tree', name: 'Recursion Tree',
  description: 'The calls a naive recursive Fibonacci makes, in the order it makes them: F(5) calls F(4) and F(3), which call their own, down to F(1) and F(0). The tree shows the repeated work at a glance. recursionTreeFigure() from @algorisys/tinyfly/math lays the calls out as a tree and steps a depth-first search through them.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'discrete', 'recursion', 'trees', 'teaching'],
  addons: ['math'],
  html, run,
}
