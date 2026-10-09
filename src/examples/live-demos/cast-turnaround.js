import { character, drawCharacter, humanPose, castMember, CHARACTER_CAST, HUMAN_EXPRESSIONS } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { character, drawCharacter, humanPose, castMember, CHARACTER_CAST, HUMAN_EXPRESSIONS }

export const html = `<style>
  .ctn-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ctn-canvas { width: 100%; max-width: 460px; aspect-ratio: 760 / 320; height: auto; border-radius: 8px; background: #fbf6ec; }
  .ctn-row { display: flex; align-items: center; gap: 10px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .ctn-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="ctn-wrap">
  <canvas class="ctn-canvas" width="760" height="320"></canvas>
  <div class="ctn-row">
    <label>look
      <select class="ctn-look">
        <option value="clean">clean</option>
        <option value="pencil">pencil</option>
        <option value="silhouette">silhouette</option>
      </select>
    </label>
    <label><input type="checkbox" class="ctn-spin" checked /> turn</label>
  </div>
  <div class="ctn-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ctn-canvas')
  const lookPicker = root.querySelector('.ctn-look')
  const spin = root.querySelector('.ctn-spin')
  const readout = root.querySelector('.ctn-readout')
  const ctx = canvas.getContext('2d')
  const W = 760
  const H = 320
  const GROUND = 290
  const ADULT = 210

  // The cast: each member is plain options (build, hair, facial hair, glasses, outfit).
  const names = Object.keys(tinyfly.CHARACTER_CAST).filter((name) => tinyfly.CHARACTER_CAST[name].group === 'family')
  const makeCast = (look) => names.map((name, i) => tinyfly.character(tinyfly.castMember(name, ADULT, { look, seed: i + 1 })))
  let cast = makeCast('clean')
  lookPicker.addEventListener('change', () => (cast = makeCast(lookPicker.value)))

  // Everyone feels the same thing at once, for a moment at a time.
  const moods = ['happy', 'surprised', 'laughing', 'worried', 'embarrassed', 'determined', 'relieved']
  const VIEW_NAMES = ['front', 'front 3/4 right', 'right profile', 'back 3/4 right', 'back', 'back 3/4 left', 'left profile', 'front 3/4 left']

  const clock = { time: 0 }
  live.to(clock, { time: 16000, duration: 16, ease: 'none', repeat: -1 })

  const draw = () => {
    const t = clock.time
    // Turn all the way round, pausing at each of the eight views.
    const step = t / 2000
    const settle = Math.min(1, (step % 1) / 0.45)
    const turn = spin.checked ? (Math.floor(step) + settle * settle * (3 - 2 * settle)) * 0.5 : 0
    const mood = tinyfly.HUMAN_EXPRESSIONS[moods[Math.floor(t / 2300) % moods.length]]
    const talking = Math.max(0, Math.sin(t / 90)) * 0.5
    readout.textContent = `${VIEW_NAMES[Math.round(turn * 2) % 8]} · ${moods[Math.floor(t / 2300) % moods.length]}`
    if (!ctx) return
    ctx.fillStyle = '#fbf6ec'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#d8cbb8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(20, GROUND + 2)
    ctx.lineTo(W - 20, GROUND + 2)
    ctx.stroke()
    cast.forEach((who, i) => {
      ctx.save()
      ctx.translate(55 + i * 93, GROUND)
      const pose = tinyfly.humanPose({ ...mood, turn, mouth: i === Math.floor(t / 1200) % cast.length ? talking : mood.mouth })
      tinyfly.drawCharacter(ctx, who, pose, t)
      ctx.restore()
    })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const castTurnaround = {
  id: 'live-cast-turnaround',
  name: 'Cast Turnaround',
  description:
    'A recurring cast (castMember: boy, girl, young man and woman, man, woman, grandpa, grandma) turning through all eight views together. Hair, beards, glasses and ears are plain data on the head, so they turn with it: partings and ponytails stay on their own side, the back view shows the back of the hair, and the face marks (blush, tears, sweat) come with the expressions.',
  category: 'video',
  tags: ['canvas', 'character', 'appearance', 'hair', 'cast', 'turnaround', 'video'],
  html,
  run,
}
