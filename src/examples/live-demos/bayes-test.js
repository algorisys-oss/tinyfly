import { bayesFigure, mathExplorable } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { bayesFigure, mathExplorable }

export const html = `<style>
.by-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0;color:#cbd5e1; }
.by-figure { border-radius:12px;overflow:hidden;background:#0f1117; }
.by-readout { font:13px system-ui;color:#9bb4c7;min-height:2.8em;max-width:60ch; }
</style><div class="by-wrap"><div class="by-figure"></div><div class="by-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const readout = root.querySelector('.by-readout')
  const figure = tinyfly.bayesFigure({ prior: 0.01, sensitivity: 0.9, falsePositive: 0.05, width: 600, height: 600 })
  const explorable = tinyfly.mathExplorable(root.querySelector('.by-figure'), figure, {
    sliders: [
      { value: 'prior', min: 0.001, max: 0.5, step: 0.001, label: 'how common' },
      { value: 'sensitivity', min: 0.5, max: 1, step: 0.01, label: 'catches the sick' },
      { value: 'falsePositive', min: 0, max: 0.3, step: 0.005, label: 'false alarms' },
    ],
    onChange: ({ prior, sensitivity, falsePositive }) => {
      const yes = prior * sensitivity
      const posterior = yes / (yes + (1 - prior) * falsePositive || 1)
      readout.textContent = `A positive test means a ${(posterior * 100).toFixed(1)}% chance of having it: the yellow area over all the coloured area. Rare conditions make false alarms outnumber true ones.`
    },
  })
  // Until the reader takes a slider, the condition grows more common.
  const sweep = { prior: 0.01 }
  const tween = live.to(sweep, { prior: 0.3, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: () => explorable.set('prior', Number(sweep.prior.toFixed(3))) })
  root.querySelectorAll('input').forEach((input) => input.addEventListener('input', () => tween.kill(), { once: true }))
  // #endregion code
  return () => {
    tween.kill()
    explorable.destroy()
  }
}

/** @type {import('./types').LiveDemo} */
export const bayesTest = {
  id: 'live-bayes-test', name: 'Bayes: a Positive Test',
  description: 'A test that catches 90% of cases with 5% false alarms sounds reliable, yet for a rare condition most positives are false. The square shows why: the yellow sliver (sick and positive) is small next to the red band (healthy and positive). Move how common the condition is, and the test\'s two error rates. A bayes item from @algorisys/tinyfly/math with mathExplorable sliders.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'probability', 'bayes', 'explorable', 'teaching'],
  addons: ['math'],
  html, run,
}
