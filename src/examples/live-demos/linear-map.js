import { deserializeTimeline } from '../../engine'
import { lesson, linearMapFigure, mathExplorable, mathSteps } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global (the browser bundle
// and tinyfly-math.iife.js); here from the source modules, so the code runs unchanged in both.
const tinyfly = { deserializeTimeline, lesson, linearMapFigure, mathExplorable, mathSteps }

export const html = `<style>
.lm-wrap { display:grid;gap:10px;width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0; }
.lm-figure { border-radius:12px;overflow:hidden;background:#0f1117; }
.lm-figure svg { cursor:grab; }
.lm-buttons { display:flex;flex-wrap:wrap;gap:8px; }
.lm-buttons button { font:13px system-ui;padding:6px 12px;border-radius:8px;border:1px solid #3a4152;background:#1b2130;color:#e6e9ef;cursor:pointer; }
.lm-buttons button:hover { background:#252d40; }
.lm-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="lm-wrap">
<div class="lm-figure"></div>
<div class="lm-buttons">
<button data-m="1,1,0,1">Shear</button><button data-m="0,-1,1,0">Rotate 90°</button><button data-m="2,0,0,0.5">Stretch</button>
<button data-m="-1,0,0,1">Flip</button><button data-m="1,2,0.5,1">Squash to a line</button><button data-m="1,0,0,1">Identity</button>
</div>
<div class="lm-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const readout = root.querySelector('.lm-readout')
  const figure = tinyfly.linearMapFigure({ width: 560, height: 560 })

  // Drag the tips of î and ĵ: they are the matrix's columns.
  const explorable = tinyfly.mathExplorable(root.querySelector('.lm-figure'), figure, {
    drag: [{ matrix: 'M', column: 0 }, { matrix: 'M', column: 1 }],
    onChange: ({ M }) => {
      const [a, b, c, d] = M
      const det = a * d - b * c
      readout.textContent = `det = ${det.toFixed(2)} · ${Math.abs(det) < 0.01 ? 'the plane is squashed onto a line' : det < 0 ? 'orientation flipped' : 'areas scale by ' + det.toFixed(2)}`
    },
  })

  // Until the reader takes over, the same figure plays a short tour, written as lesson steps.
  const l = tinyfly.lesson({ id: 'tour' })
  const steps = tinyfly.mathSteps(l, 'fig', figure)
  for (const m of [[1, 1, 0, 1], [1, 0, 0, 1], [0, -1, 1, 0], [1, 0, 0, 1], [2, 0.5, 0.5, 1], [1, 0, 0, 1]]) {
    steps.applyMatrix(m, { duration: 1400 })
    l.wait(700)
  }
  const tour = tinyfly.deserializeTimeline(l.definition())
  const clock = { time: 0 }
  const playing = live.to(clock, { time: tour.duration, duration: tour.duration / 1000, ease: 'none', repeat: -1 })
  let touring = true
  const tick = () => {
    if (touring) explorable.set('M', tour.getStateAtTime(clock.time).values.get('fig').get('M'))
  }
  live.ticker.add(tick)
  const stopTour = () => {
    touring = false
    playing.kill()
  }
  root.querySelector('.lm-figure').addEventListener('pointerdown', stopTour)

  // The buttons glide from the current matrix to theirs.
  const glide = { t: 0 }
  const onButton = (event) => {
    const button = event.target.closest('button[data-m]')
    if (!button) return
    stopTour()
    const from = explorable.values.M
    const to = button.dataset.m.split(',').map(Number)
    glide.t = 0
    live.to(glide, {
      t: 1, duration: 1, ease: 'power2.inOut',
      onUpdate: () => explorable.set('M', from.map((v, i) => v + (to[i] - v) * glide.t)),
    })
  }
  root.querySelector('.lm-buttons').addEventListener('click', onButton)
  // #endregion code
  return () => {
    live.ticker.remove(tick)
    explorable.destroy()
    root.querySelector('.lm-figure').removeEventListener('pointerdown', stopTour)
    root.querySelector('.lm-buttons').removeEventListener('click', onButton)
  }
}

/** @type {import('./types').LiveDemo} */
export const linearMap = {
  id: 'live-linear-map', name: 'Linear Map',
  description: 'A 2×2 matrix is where î and ĵ land. Drag their tips and the whole grid follows; the yellow square becomes a parallelogram whose area is the determinant, and the matrix updates live in TeX. Buttons glide to a shear, a rotation, a stretch, a flip and a squash to a line. Built with linearMapFigure() and mathExplorable() from @algorisys/tinyfly/math; the idle tour is ordinary lesson steps (mathSteps().applyMatrix) played as a timeline.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'linear algebra', 'matrix', 'explorable', 'teaching'],
  addons: ['math'],
  html, run,
}
