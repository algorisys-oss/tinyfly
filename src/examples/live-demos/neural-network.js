import { mathExplorable, neuralNetworkFigure } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { mathExplorable, neuralNetworkFigure }

export const html = `<style>
.nn-wrap { display:grid;gap:10px;width:100%;max-width:min(600px,calc(100vw - 24px));min-width:0;color:#cbd5e1; }
.nn-figure { border-radius:12px;overflow:hidden;background:#0f1117; }
.nn-readout { font:13px system-ui;color:#9bb4c7;min-height:1.4em; }
</style><div class="nn-wrap"><div class="nn-figure"></div><div class="nn-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const readout = root.querySelector('.nn-readout')
  // Seeded weights: blue edges add, red ones subtract, thicker ones count more.
  const figure = tinyfly.neuralNetworkFigure({ layers: [3, 5, 4, 2], width: 600, height: 600 })
  const explorable = tinyfly.mathExplorable(root.querySelector('.nn-figure'), figure, {
    sliders: [0, 1, 2].map((i) => ({ value: `in${i}`, min: 0, max: 1, step: 0.01, label: `x${i + 1}` })),
  })
  // A forward pass every few seconds: the inputs light up, then each layer in turn.
  const pass = { flow: 0 }
  live.to(pass, {
    flow: 3, duration: 3, ease: 'none', repeat: -1, repeatDelay: 1.2,
    onUpdate: () => {
      explorable.set('flow', pass.flow)
      readout.textContent = pass.flow < 3 ? `forward pass: layer ${Math.floor(pass.flow) + 1} of 4` : 'outputs ready: move the inputs to change them'
    },
  })
  // #endregion code
  return () => explorable.destroy()
}

/** @type {import('./types').LiveDemo} */
export const neuralNetwork = {
  id: 'live-neural-network', name: 'Neural Network',
  description: 'A forward pass through a small network: each node takes a weighted sum of the layer before and squashes it with a sigmoid, and the activation flows layer by layer. Blue weights add, red ones subtract, and thicker edges count more. Move the three inputs to see the outputs change. A network item from @algorisys/tinyfly/math with seeded weights, so the same network appears everywhere.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'ai', 'ml', 'neural network', 'explorable', 'teaching'],
  addons: ['math'],
  html, run,
}
