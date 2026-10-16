import { attentionFigure, drawDisplayList, layoutFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { attentionFigure, drawDisplayList, layoutFigure }

export const html = `<style>
.at-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0; }
.at-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.at-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.at-readout { font:13px system-ui;color:#9bb4c7;min-height:2.8em;max-width:60ch; }
</style><div class="at-wrap">
<canvas class="at-canvas" width="600" height="600"></canvas>
<div class="at-controls"><label>Sentence <select class="at-text">
<option>The cat sat on the mat</option><option>She poured water into the glass</option><option>Time flies like an arrow</option>
</select></label></div>
<div class="at-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.at-canvas').getContext('2d')
  const picker = root.querySelector('.at-text')
  const readout = root.querySelector('.at-readout')
  let figure
  const reveal = { rows: 0 }
  const build = () => {
    // Each row is one word asking which words to look at; softmax makes the row sum to 1.
    figure = tinyfly.attentionFigure({ tokens: picker.value.split(' '), seed: picker.value, width: 600, height: 600 })
    reveal.rows = 0
    live.to(reveal, { rows: 1, duration: 2.4, ease: 'power1.inOut' })
  }
  const draw = () => {
    readout.textContent = `${Math.round(reveal.rows * 100)}% shown · illustrative scores (seeded, with a pull toward each word and the one before), softmaxed per row`
    if (ctx) tinyfly.drawDisplayList(ctx, tinyfly.layoutFigure(figure, { 'attn.draw': reveal.rows }))
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
export const attention = {
  id: 'live-attention', name: 'Attention Weights',
  description: 'How a transformer spreads its attention: each row is one word asking which words matter to it, and softmax turns its scores into weights that sum to 1. The scores here are illustrative (seeded, with a pull toward each word and the one before it), not from a trained model. A heatmap item from @algorisys/tinyfly/math with token labels and per-row softmax.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'ai', 'ml', 'attention', 'transformers', 'heatmap', 'teaching'],
  addons: ['math'],
  html, run,
}
