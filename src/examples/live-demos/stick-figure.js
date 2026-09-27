import { POSES, blendPose, walkPose, talkingMouth, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { POSES, blendPose, walkPose, talkingMouth, drawStickFigure }

export const html = `<style>
  .sf-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .sf-canvas { width: 164px; height: 116px; border-radius: 8px; background: #fdf0d5; }
  .sf-row { display: flex; align-items: center; gap: 10px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .sf-pose { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .sf-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="sf-wrap">
  <canvas class="sf-canvas" width="480" height="340"></canvas>
  <div class="sf-row">
    <select class="sf-pose" aria-label="Pose"><option>rest</option></select>
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
  const select = root.querySelector('.sf-pose')
  const walk = root.querySelector('.sf-walk')
  const talk = root.querySelector('.sf-talk')
  const readout = root.querySelector('.sf-readout')
  const ctx = canvas.getContext('2d')

  // A pose is just numbers, so going from one to another is a blend from 0 to 1.
  const names = Object.keys(tinyfly.POSES)
  const state = { from: tinyfly.POSES.rest, to: tinyfly.POSES.rest, name: 'rest', mix: 1, time: 0 }
  let current = tinyfly.POSES.rest
  let picked = false
  let blend = null

  const show = (name) => {
    state.from = current // start from wherever the figure is now
    state.to = tinyfly.POSES[name]
    state.name = name
    state.mix = 0
    blend?.kill()
    blend = live.to(state, { mix: 1, duration: 0.45, ease: 'power2.out' })
    select.value = name
  }

  select.replaceChildren()
  for (const name of names) {
    const option = document.createElement('option')
    option.textContent = name
    select.append(option)
  }
  select.addEventListener('change', () => {
    picked = true // stop the parade once someone chooses
    show(select.value)
  })

  // One clock (ms) drives everything: the parade, the walk cycle and the chatter.
  live.to(state, { time: 60000, duration: 60, ease: 'none', repeat: -1 })
  let step = 0

  const draw = () => {
    // Until a pose is picked, step through them all.
    const due = Math.floor(state.time / 1400) % names.length
    if (!picked && due !== step) show(names[(step = due)])
    current = tinyfly.blendPose(state.from, state.to, state.mix)
    let figure = current
    if (walk.checked) figure = tinyfly.walkPose(state.time / 700, figure)
    if (talk.checked) figure = { ...figure, mouth: tinyfly.talkingMouth(state.time) }
    readout.textContent = `${state.name} · ${Math.round(state.mix * 100)}%`
    if (!ctx) return

    ctx.fillStyle = '#fdf0d5'
    ctx.fillRect(0, 0, 480, 340)
    ctx.fillStyle = '#d9b27c'
    ctx.fillRect(0, 300, 480, 40)
    ctx.save()
    ctx.translate(240, 302)
    tinyfly.drawStickFigure(ctx, figure, { height: 250, color: '#1e3a8a', headFill: '#f2c49b' })
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
    'The poseable figure from tinyfly/characters: a pose is a handful of numbers, so any two blend. Pick a pose, or let it walk and talk. In a timeline, poseTracks() turns the same poses into keyframes.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'poses', 'blend', 'video'],
  html,
  run,
}
