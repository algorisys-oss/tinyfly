import { determinantFigure, lesson, mathSteps, mountMath } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global; here from the source modules.
const tinyfly = { determinantFigure, lesson, mathSteps, mountMath }

export const html = `<style>
.ml-wrap { width:100%;max-width:min(560px,calc(100vw - 24px));min-width:0;box-sizing:border-box;padding:16px;border-radius:14px;background:#fbfaf7;font:14px system-ui;color:#1f2430; }
.ml-wrap figure { margin:0;display:grid;gap:8px; }
.ml-wrap svg { border-radius:10px; }
.ml-wrap figcaption { color:#5b6270;font-size:13px; }
</style><div class="ml-wrap"><figure class="ml-figure" data-options='{"stepMode": true}'>
<figcaption>Step through it: each step pauses, and the last asks a question.</figcaption>
</figure></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const element = root.querySelector('.ml-figure')
  const figure = tinyfly.determinantFigure({ width: 520, height: 520, theme: 'light' })

  // The lesson: plain timeline JSON with markers, captions and a question.
  const l = tinyfly.lesson({ id: 'determinant' })
  const steps = tinyfly.mathSteps(l, 'fig', figure, { hidden: ['square'] })
  l.marker('start', { label: 'î and ĵ span the unit square' })
  steps.drawOn('square')
  l.marker('square', { label: 'Its area is 1', pause: true })
  steps.applyMatrix([2, 0, 0, 1])
  l.marker('stretch', { label: 'Stretch î by 2: the area doubles', pause: true })
  steps.applyMatrix([2, 1, 0, 1])
  l.marker('shear', { label: 'A shear slides ĵ along: the area stays 2', pause: true })
  steps.applyMatrix([2, 1, 2, 1])
  l.marker('flat', { label: 'Now ĵ lies on î’s line', pause: true, question: 'What is the area now, and why?' })

  // The same markup an article would paste: the figure and the timeline as JSON.
  const json = (attribute, value) => {
    const script = document.createElement('script')
    script.type = 'application/json'
    script.setAttribute(attribute, '')
    script.textContent = JSON.stringify(value)
    element.prepend(script)
  }
  json('data-tinyfly-timeline', l.definition())
  json('data-tinyfly-figure', figure)
  let mounted
  tinyfly.mountMath(element).then((entry) => (mounted = entry))
  // #endregion code
  return () => mounted?.player?.destroy()
}

/** @type {import('./types').LiveDemo} */
export const matrixLesson = {
  id: 'live-matrix-lesson', name: 'Matrix Lesson',
  description: 'A stepped lesson on the determinant, as it would sit in an article: next and back, a caption for every step, and a question at the end. The figure and the timeline are two JSON scripts in a <figure data-tinyfly-math>, mounted by mountMath() with the ordinary embed player and controls; mathSteps() wrote the timeline (drawOn, applyMatrix, markers). The figure is redrawn as SVG from the timeline values at every step.',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'linear algebra', 'determinant', 'lesson', 'embed', 'teaching'],
  addons: ['math'],
  html, run,
}
