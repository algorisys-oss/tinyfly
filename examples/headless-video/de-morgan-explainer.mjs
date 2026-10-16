/**
 * De Morgan's law in 16:9 (1920×1080): the outside of A ∪ B, shaded on the
 * left, is the same region as what is outside A and outside B, built up on
 * the right one complement at a time.
 *
 *   npx tinyfly video examples/headless-video/de-morgan-explainer.mjs
 *   npx tinyfly video examples/headless-video/de-morgan-explainer.mjs --stills stills/ --times 2000,6000,10000
 */
import { mathFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const W = 1920
const H = 1080
const sets = [{ id: 'A' }, { id: 'B' }]

const figure = mathFigure({
  width: W, height: H, x: [-9, 9],
  items: [
    { id: 'title', kind: 'label', tex: "\\text{De Morgan's law}", at: [W / 2, 70], screen: true, size: 28 },
    // Left: (A ∪ B)′. Right: A′, then B′, then their overlap A′ ∩ B′.
    { id: 'left', kind: 'venn', sets, highlight: "(A | B)'", at: [-4.6, -0.2], radius: 1.7 },
    { id: 'notA', kind: 'venn', sets, highlight: "A'", at: [4.6, -0.2], radius: 1.7, highlightColor: 'blue' },
    { id: 'notB', kind: 'venn', sets, highlight: "B'", at: [4.6, -0.2], radius: 1.7, highlightColor: 'red', universe: false },
    { id: 'both', kind: 'venn', sets, highlight: "A' & B'", at: [4.6, -0.2], radius: 1.7, universe: false },
    { id: 'leftLabel', kind: 'label', tex: "(A \\cup B)'", at: [-4.6, -3.3], size: 30 },
    { id: 'law', kind: 'equation', at: [W / 2, H - 90], screen: true, size: 34, steps: ["(A \\cup B)'", "(A \\cup B)' = A'", "(A \\cup B)' = A' \\cap B'"] },
  ],
})

const l = lesson({ id: 'de-morgan' })
const steps = mathSteps(l, 'fig', figure, { hidden: ['left', 'notA', 'notB', 'both', 'leftLabel'] })
steps.drawOn('left', { duration: 1200 })
steps.fadeIn('leftLabel')
l.wait(1200)
steps.drawOn('notA', { duration: 900 })
steps.showStep('law', 1)
l.wait(1200)
steps.drawOn('notB', { duration: 900 })
l.wait(1000)
// Where both complements overlap is all that is left: the same region as on the left.
l.together(() => {
  steps.fadeOut('notA', { duration: 700 })
  steps.fadeOut('notB', { duration: 700 })
  steps.drawOn('both', { duration: 700 })
})
steps.showStep('law', 2)
l.wait(2500)

export default {
  width: W,
  height: H,
  fps: 30,
  targets: { fig: mathTarget(figure) },
  timeline: l.definition(),
}
