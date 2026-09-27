import { POSES, EXPRESSIONS, withExpression, blendPose, walkPose, talkingMouth, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { POSES, EXPRESSIONS, withExpression, blendPose, walkPose, talkingMouth, drawStickFigure }

export const html = `<style>
  .sf-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .sf-canvas { width: 232px; height: 116px; border-radius: 8px; background: #fdf0d5; }
  .sf-row { display: flex; align-items: center; gap: 8px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .sf-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .sf-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="sf-wrap">
  <canvas class="sf-canvas" width="680" height="340"></canvas>
  <div class="sf-row">
    <select class="sf-pose" aria-label="Pose"><option>rest</option></select>
    <select class="sf-face" aria-label="Expression"><option value="">pose's face</option></select>
    <label><input type="checkbox" class="sf-walk" /> walk</label>
    <label><input type="checkbox" class="sf-talk" /> talk</label>
  </div>
  <div class="sf-readout">rest</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.sf-canvas')
  const poseSelect = root.querySelector('.sf-pose')
  const faceSelect = root.querySelector('.sf-face')
  const walk = root.querySelector('.sf-walk')
  const talk = root.querySelector('.sf-talk')
  const readout = root.querySelector('.sf-readout')
  const ctx = canvas.getContext('2d')

  const fill = (select, names) => {
    for (const name of names) {
      const option = document.createElement('option')
      option.textContent = name
      select.append(option)
    }
  }
  const poses = Object.keys(tinyfly.POSES)
  poseSelect.replaceChildren()
  fill(poseSelect, poses)
  fill(faceSelect, Object.keys(tinyfly.EXPRESSIONS))

  // A pose (face included) is just numbers, so going from one to another is a blend from 0 to 1.
  const state = { from: tinyfly.POSES.rest, to: tinyfly.POSES.rest, mix: 1, time: 0 }
  let current = tinyfly.POSES.rest
  let picked = false
  let blend = null

  const show = () => {
    const body = tinyfly.POSES[poseSelect.value]
    state.from = current // start from wherever the figure is now
    state.to = faceSelect.value ? tinyfly.withExpression(body, faceSelect.value) : body
    state.mix = 0
    blend?.kill()
    blend = live.to(state, { mix: 1, duration: 0.45, ease: 'power2.out' })
  }
  for (const select of [poseSelect, faceSelect]) {
    select.addEventListener('change', () => {
      picked = true // stop the parade once someone chooses
      show()
    })
  }

  // One clock (ms) drives everything: the parade, the walk cycle and the chatter.
  live.to(state, { time: 60000, duration: 60, ease: 'none', repeat: -1 })
  let step = 0

  const drawFigure = (figure) =>
    tinyfly.drawStickFigure(ctx, figure, { height: 250, color: '#1e3a8a', headFill: '#f2c49b' })

  const draw = () => {
    // Until something is picked, step through the poses, each with its own face.
    const due = Math.floor(state.time / 1400) % poses.length
    if (!picked && due !== step) {
      poseSelect.value = poses[(step = due)]
      show()
    }
    current = tinyfly.blendPose(state.from, state.to, state.mix)
    let figure = current
    if (walk.checked) figure = tinyfly.walkPose(state.time / 700, figure)
    if (talk.checked) figure = { ...figure, mouth: tinyfly.talkingMouth(state.time) }
    readout.textContent = `${poseSelect.value} · ${faceSelect.value || 'own face'} · ${Math.round(state.mix * 100)}%`
    if (!ctx) return

    ctx.fillStyle = '#fdf0d5'
    ctx.fillRect(0, 0, 680, 340)
    ctx.fillStyle = '#d9b27c'
    ctx.fillRect(0, 300, 680, 40)
    ctx.save()
    ctx.translate(200, 302)
    drawFigure(figure)
    ctx.restore()

    // A close-up of the face: the same drawing, scaled up around the head.
    ctx.save()
    ctx.beginPath()
    ctx.arc(520, 150, 130, 0, Math.PI * 2)
    ctx.fillStyle = '#fff7e8'
    ctx.fill()
    ctx.clip()
    ctx.translate(520, 150)
    ctx.scale(3.2, 3.2)
    ctx.translate(0, 220) // the head's centre sits 220 px above the feet at this height
    drawFigure(figure)
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const stickFigure = {
  id: 'live-stick-figure',
  name: 'Stick Figure (Characters)',
  description:
    'The poseable figure from tinyfly/characters, with a close-up of its face. Poses and expressions (brows, eyes, mouth) are plain numbers, so any two blend. Pick them, or let it walk and talk. In a timeline, poseTracks() turns the same poses and expressions into keyframes.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'poses', 'expressions', 'blend', 'video'],
  html,
  run,
}
