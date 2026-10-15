import { character, castMember, drawCharacter, drawCharacterHead, humanPose, outfitPreset, softCartoonCharacter, HUMAN_EXPRESSIONS } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { character, castMember, drawCharacter, drawCharacterHead, humanPose, outfitPreset, softCartoonCharacter, HUMAN_EXPRESSIONS }

export const html = `<style>
.il-wrap { display:grid;gap:10px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.il-canvas { display:block;width:100%;height:auto;aspect-ratio:960/560;background:#fbf3e6;border-radius:12px; }
.il-controls { display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.il-controls label { display:flex;align-items:center;gap:6px; }
.il-controls input[type=range] { width:90px; }
.il-readout { font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em;overflow-wrap:anywhere; }
</style><div class="il-wrap">
<canvas class="il-canvas" width="960" height="560"></canvas>
<div class="il-controls">
<label>Who <select class="il-who"><option value="neera">Neera</option><option value="dad">Dad</option><option value="anime">Anime young woman</option></select></label>
<label>Light <input class="il-light" type="range" min="0" max="360" value="217" /></label>
<label><input class="il-orbit" type="checkbox" /> Circle the light</label>
<label>Weight <input class="il-weight" type="range" min="0" max="1" step="0.05" value="0.6" /></label>
<label>Taper <input class="il-taper" type="range" min="0" max="1" step="0.05" value="0.7" /></label>
<label>Shadow <input class="il-shadow" type="range" min="0" max="1" step="0.05" value="1" /></label>
<label>Highlight <input class="il-highlight" type="range" min="0" max="1" step="0.05" value="0.6" /></label>
</div><div class="il-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.il-canvas')
  const ctx = canvas.getContext('2d')
  const who = root.querySelector('.il-who')
  const light = root.querySelector('.il-light')
  const orbit = root.querySelector('.il-orbit')
  const sliders = ['weight', 'taper', 'shadow', 'highlight'].map(name => [name, root.querySelector(`.il-${name}`)])
  const readout = root.querySelector('.il-readout')

  // Each character is plain options; only `look` and `illustrated` differ between the columns.
  const people = {
    neera: (extra) => tinyfly.softCartoonCharacter('youngWoman', {
      height: 330, lineWidth: 1.8, skin: '#c98d62', ink: '#3b241a',
      hair: { style: 'topBun', color: '#160e09', volume: 0.16, ties: [{ kind: 'bun', at: 'top', size: 0.38 }] },
      face: { shape: 'round', eyeScale: 1.08, iris: '#2e1a10', lashes: true, ageLines: 0.25 },
      outfit: tinyfly.outfitPreset('everyday', { top: 'blouse', shirt: '#d93f78', trousers: '#f1e4cf', sleeves: 'long' }),
      ...extra,
    }),
    dad: (extra) => tinyfly.softCartoonCharacter('youngMan', {
      height: 340, lineWidth: 1.8, hair: { style: 'spiky', color: '#1d1611' }, glasses: 'square', facialHair: 'stubble',
      outfit: tinyfly.outfitPreset('casual', { top: 'tshirt', shirt: '#56704f', trousers: '#2f3d5c' }),
      ...extra,
    }),
    anime: (extra) => tinyfly.character(tinyfly.castMember('animeYoungWoman', 330, extra)),
  }

  // `illustrated.light` points toward the light in screen space (y down).
  const lightAt = (degrees) => {
    const radians = (degrees * Math.PI) / 180
    return [Math.cos(radians), Math.sin(radians)]
  }
  const options = (degrees) => ({
    light: lightAt(degrees),
    ...Object.fromEntries(sliders.map(([name, input]) => [name, Number(input.value)])),
  })

  let clean, illustrated, builtFor = ''
  const build = (degrees) => {
    const key = `${who.value}|${degrees.toFixed(0)}|${sliders.map(([, input]) => input.value).join()}`
    if (key === builtFor) return
    if (!builtFor.startsWith(`${who.value}|`)) clean = people[who.value]({ look: 'clean' })
    illustrated = people[who.value]({ look: 'illustrated', illustrated: options(degrees) })
    builtFor = key
  }

  const clock = { time: 0 }
  const animation = live.to(clock, { time: 12000, duration: 12, ease: 'none', repeat: -1 })
  const moods = ['happy', 'smug', 'surprised', 'worried']

  const drawLight = (x, y, [lx, ly]) => {
    // The sun sits out along the light direction; the arrow shows where its light goes.
    const sx = x + lx * 26, sy = y + ly * 26
    ctx.strokeStyle = '#eadcc6'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = '#c58a2b'; ctx.fillStyle = '#f2b544'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(sx - lx * 11, sy - ly * 11); ctx.lineTo(x - lx * 8, y - ly * 8); ctx.stroke()
    ctx.fillStyle = '#806e73'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('light', x, y + 42)
  }

  const draw = () => {
    const t = clock.time
    const degrees = orbit.checked ? (Number(light.value) + t * 0.03) % 360 : Number(light.value)
    build(degrees)
    const mood = moods[Math.floor(t / 3000) % moods.length]
    const turn = 0.3 + 0.22 * Math.sin((t / 12000) * Math.PI * 2)
    const pose = tinyfly.humanPose({ turn, ...tinyfly.HUMAN_EXPRESSIONS[mood] })
    const head = tinyfly.humanPose({ turn: 0.18, ...tinyfly.HUMAN_EXPRESSIONS[mood], lookX: 0.3 })
    const settings = sliders.map(([name, input]) => `${name} ${Number(input.value).toFixed(2)}`).join(' · ')
    readout.textContent = `${(t / 1000).toFixed(1)} s · ${mood} · light ${degrees.toFixed(0)}° · ${settings}`
    if (!ctx) return
    ctx.fillStyle = '#fbf3e6'
    ctx.fillRect(0, 0, 960, 560)
    ctx.strokeStyle = '#eadcc6'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(480, 24); ctx.lineTo(480, 536); ctx.stroke()
    ;[[clean, 0, 'clean'], [illustrated, 480, 'illustrated']].forEach(([person, left, label]) => {
      ctx.fillStyle = '#3b241a'; ctx.font = '600 18px system-ui'; ctx.textAlign = 'left'
      ctx.fillText(label, left + 24, 40)
      ctx.save(); ctx.translate(left + 120, 520)
      tinyfly.drawCharacter(ctx, person, pose, t)
      ctx.restore()
      tinyfly.drawCharacterHead(ctx, person, head, { x: left + 340, y: 250, radius: 105, time: t })
    })
    drawLight(915, 50, lightAt(degrees))
  }

  const inputs = [who, light, orbit, ...sliders.map(([, input]) => input)]
  inputs.forEach(node => node.addEventListener('input', draw))
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => {
    animation.kill()
    live.ticker.remove(draw)
    inputs.forEach(node => node.removeEventListener('input', draw))
  }
}

/** @type {import('./types').LiveDemo} */
export const illustratedLook = {
  id: 'live-illustrated-look', name: 'Illustrated Look',
  description: 'The same character drawn clean and illustrated, side by side. The illustrated look inks with weight that follows the light (heavier on the shadow side, thinner where lit), tapers open strokes like a brush, and paints skin, clothes and hair with shadow, core-shadow and highlight tones mixed from each fill. Move the light or let it circle, and tune weight, taper, shadow and highlight: every control is an option of character({ look: \'illustrated\', illustrated }).',
  category: 'video', alsoIn: ['showcase'], tags: ['character', 'illustration', 'shading', 'look', 'light'],
  html, run,
}
