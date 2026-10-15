import { cltFigure, mathExplorable } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { cltFigure, mathExplorable }

export const html = `<style>
.cl-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0;color:#cbd5e1; }
.cl-figure { border-radius:12px;overflow:hidden;background:#0f1117; }
.cl-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="cl-wrap"><div class="cl-figure"></div><div class="cl-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const readout = root.querySelector('.cl-readout')
  // Average k draws from a skewed (exponential) distribution, many times over.
  const figure = tinyfly.cltFigure({ k: 1, samples: 0, width: 600, height: 600 })
  const explorable = tinyfly.mathExplorable(root.querySelector('.cl-figure'), figure, {
    sliders: [{ value: 'k', min: 1, max: 40, step: 1, label: 'draws averaged (k)' }],
    onChange: ({ k }) => (readout.textContent = `k = ${k}: the averages pile up closer to a normal curve, narrower by 1/√k`),
  })
  // The samples pour in, then k steps up while they stay.
  const pour = { samples: 0, k: 1 }
  const tl = live.timeline({ repeat: -1, repeatDelay: 1.5 })
  tl.to(pour, { samples: 3000, duration: 3, ease: 'power1.in', onUpdate: () => explorable.set('samples', Math.round(pour.samples)) })
  tl.to(pour, { k: 30, duration: 6, ease: 'none', onUpdate: () => explorable.set('k', Math.round(pour.k)) })
  tl.to(pour, { k: 1, samples: 0, duration: 0.01 })
  root.querySelector('input')?.addEventListener('input', () => tl.kill(), { once: true })
  // #endregion code
  return () => {
    tl.kill()
    explorable.destroy()
  }
}

/** @type {import('./types').LiveDemo} */
export const centralLimit = {
  id: 'live-central-limit', name: 'Central Limit Theorem',
  description: 'Draw from a lopsided distribution, average k of the draws, and do it thousands of times: as k grows the averages pile into a normal curve that narrows by 1/√k. Samples pour in, then k climbs; take the slider to explore. cltFigure() and mathExplorable() from @algorisys/tinyfly/math, with seeded samples so the same histogram appears every time.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'statistics', 'central limit theorem', 'histogram', 'explorable', 'teaching'],
  addons: ['math'],
  html, run,
}
