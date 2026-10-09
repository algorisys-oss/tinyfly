import { character, drawCharacter, humanPose, HAIR_STYLES, HAIR_COLORS, FACIAL_HAIR_STYLES, GLASSES_STYLES, HAT_STYLES, HUMAN_EXPRESSIONS } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { character, drawCharacter, humanPose, HAIR_STYLES, HAIR_COLORS, FACIAL_HAIR_STYLES, GLASSES_STYLES, HAT_STYLES, HUMAN_EXPRESSIONS }

export const html = `<style>
  .hhs-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .hhs-canvas { width: 100%; max-width: 440px; aspect-ratio: 640 / 330; height: auto; border-radius: 8px; background: #fbf6ec; }
  .hhs-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 10px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .hhs-row select { max-width: 120px; }
  .hhs-readout { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; text-align: center; max-width: 440px; }
</style>
<div class="hhs-wrap">
  <canvas class="hhs-canvas" width="640" height="330"></canvas>
  <div class="hhs-row">
    <label>hair <select class="hhs-hair"></select></label>
    <label>colour <select class="hhs-color"></select></label>
    <label>facial hair <select class="hhs-beard"></select></label>
  </div>
  <div class="hhs-row">
    <label>glasses <select class="hhs-glasses"></select></label>
    <label>hat <select class="hhs-hat"></select></label>
    <label>face <select class="hhs-face"></select></label>
    <label><input type="checkbox" class="hhs-spin" checked /> turn</label>
  </div>
  <div class="hhs-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.hhs-canvas')
  const readout = root.querySelector('.hhs-readout')
  const spin = root.querySelector('.hhs-spin')
  const ctx = canvas.getContext('2d')
  const W = 640
  const H = 330

  // Fill a picker from a list of names; '' means none.
  const fill = (selector, names, chosen, none = true) => {
    const select = root.querySelector(selector)
    select.innerHTML = (none ? ['<option value="">none</option>'] : []).concat(names.map((name) => `<option value="${name}">${name}</option>`)).join('')
    select.value = chosen
    return select
  }
  const hair = fill('.hhs-hair', Object.keys(tinyfly.HAIR_STYLES), 'highPonytail')
  const color = fill('.hhs-color', Object.keys(tinyfly.HAIR_COLORS), 'auburn', false)
  const beard = fill('.hhs-beard', Object.keys(tinyfly.FACIAL_HAIR_STYLES), '')
  const glasses = fill('.hhs-glasses', Object.keys(tinyfly.GLASSES_STYLES), 'round')
  const hat = fill('.hhs-hat', Object.keys(tinyfly.HAT_STYLES), '')
  const face = fill('.hhs-face', Object.keys(tinyfly.HUMAN_EXPRESSIONS), 'happy', false)

  // Everything about the head is plain data: the options are the whole description.
  const optionsNow = () => {
    const options = { ears: true, outfit: { shirt: '#4f8fd6', trousers: '#2f4d6b' } }
    if (hair.value) options.hair = { style: hair.value, color: tinyfly.HAIR_COLORS[color.value] }
    if (beard.value) options.facialHair = beard.value
    if (glasses.value) options.glasses = glasses.value
    if (hat.value) options.hat = hat.value
    return options
  }
  let options = optionsNow()
  let big = tinyfly.character({ ...options, height: 560 })
  let small = tinyfly.character({ ...options, height: 150 })
  for (const select of [hair, color, beard, glasses, hat]) {
    select.addEventListener('change', () => {
      options = optionsNow()
      big = tinyfly.character({ ...options, height: 560 })
      small = tinyfly.character({ ...options, height: 150 })
    })
  }

  const VIEWS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
  const clock = { time: 0 }
  live.to(clock, { time: 8000, duration: 8, ease: 'none', repeat: -1 })

  const draw = () => {
    const t = clock.time
    const turn = spin.checked ? (t / 8000) * 4 : 0.5
    const pose = tinyfly.humanPose({ ...tinyfly.HUMAN_EXPRESSIONS[face.value], turn, mouth: Math.max(tinyfly.HUMAN_EXPRESSIONS[face.value].mouth, Math.max(0, Math.sin(t / 110)) * 0.35 * (Math.floor(t / 1500) % 2)) })
    readout.textContent = `character(${JSON.stringify({ ...options, outfit: undefined, ears: undefined })}) · turn ${turn.toFixed(2)}`
    if (!ctx) return
    ctx.fillStyle = '#fbf6ec'
    ctx.fillRect(0, 0, W, H)
    // A big head and shoulders, turning.
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, 300, H)
    ctx.clip()
    ctx.translate(150, 610)
    tinyfly.drawCharacter(ctx, big, pose, t)
    ctx.restore()
    // The same look in all eight views, standing still.
    VIEWS.forEach((view, i) => {
      ctx.save()
      ctx.translate(345 + (i % 4) * 78, 160 + Math.floor(i / 4) * 160)
      tinyfly.drawCharacter(ctx, small, tinyfly.humanPose({ ...tinyfly.HUMAN_EXPRESSIONS[face.value], turn: view }), t)
      ctx.restore()
    })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const hairAndHats = {
  id: 'live-hair-and-hats',
  name: 'Hair, Beards & Hats',
  description:
    'Pick a hairstyle (34 presets, from buzz cut to twin braids), a colour, facial hair (20), glasses, a hat and a face: the character is redrawn from plain options, turning, and in all eight views at once. Hair is a region on the head, so a ponytail stays tied in one place, a beard follows the jaw and leaves the mouth readable, and a hat sits over the hair.',
  category: 'video',
  tags: ['canvas', 'character', 'appearance', 'hair', 'beard', 'hat', 'glasses', 'expression'],
  html,
  run,
}
