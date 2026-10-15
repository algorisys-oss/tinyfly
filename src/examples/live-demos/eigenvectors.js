import { deserializeTimeline } from '../../engine'
import { drawDisplayList, eigenFigure, layoutFigure, lesson, mat2, mathSteps } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { deserializeTimeline, drawDisplayList, eigenFigure, layoutFigure, lesson, mat2, mathSteps }

export const html = `<style>
.ev-wrap { display:grid;gap:10px;width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0; }
.ev-canvas { display:block;width:100%;height:auto;aspect-ratio:1;border-radius:12px;background:#0f1117; }
.ev-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.ev-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:2.8em; }
</style><div class="ev-wrap">
<canvas class="ev-canvas" width="560" height="560"></canvas>
<div class="ev-controls"><label>Matrix <select class="ev-matrix">
<option value="3,1,0,2">[3 1; 0 2]: two eigenlines</option>
<option value="2,1,1,2">[2 1; 1 2]: symmetric, perpendicular lines</option>
<option value="1,1,0,1">[1 1; 0 1]: a shear, one line</option>
<option value="0,-1,1,0">[0 −1; 1 0]: a rotation, none</option>
</select></label></div>
<div class="ev-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ev-canvas')
  const ctx = canvas.getContext('2d')
  const picker = root.querySelector('.ev-matrix')
  const readout = root.querySelector('.ev-readout')
  const clock = { time: 0 }
  let figure, timeline, animation

  const build = () => {
    const A = picker.value.split(',').map(Number)
    // The eigenlines (yellow) are drawn from A, so they show before the plane moves.
    figure = tinyfly.eigenFigure({ width: 560, height: 560, x: [-4, 4], matrix: A })
    const l = tinyfly.lesson({ id: 'eigen' })
    const steps = tinyfly.mathSteps(l, 'fig', figure, { hidden: ['eigen'] })
    steps.drawOn('eigen', { duration: 800 })
    l.wait(400)
    steps.applyMatrix(A, { duration: 1800 })
    l.wait(1400)
    steps.applyMatrix([1, 0, 0, 1], { duration: 1200 })
    l.wait(600)
    timeline = tinyfly.deserializeTimeline(l.definition())
    const pairs = tinyfly.mat2.eigen(A)
    readout.textContent = pairs.length
      ? `Eigenvalues ${pairs.map((p) => p.value.toFixed(2)).join(' and ')}: vectors on the yellow lines only stretch by them; every other vector is knocked off its line.`
      : 'No real eigenvalues: a rotation turns every direction, so no line stays put.'
    animation?.kill()
    clock.time = 0
    animation = live.to(clock, { time: timeline.duration, duration: timeline.duration / 1000, ease: 'none', repeat: -1 })
  }

  const draw = () => {
    const values = timeline.getStateAtTime(clock.time).values.get('fig')
    const props = Object.fromEntries(values)
    canvas.dataset.time = String(Math.round(clock.time))
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
export const eigenvectors = {
  id: 'live-eigenvectors', name: 'Eigenvectors',
  description: 'The yellow lines are a matrix\'s eigenvectors: as the plane transforms, they stay on their own span and only stretch, while î, ĵ and the rest of the grid are knocked off theirs. Pick a matrix with two eigenlines, a symmetric one, a shear with one, or a rotation with none. The figure is eigenFigure() from @algorisys/tinyfly/math, drawn on a canvas from the same timeline values a video would use.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'linear algebra', 'eigenvectors', 'teaching'],
  addons: ['math'],
  html, run,
}
