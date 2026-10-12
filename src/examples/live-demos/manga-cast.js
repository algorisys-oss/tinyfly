import { MANGA_CAST, castMember, character, drawCharacter, drawCharacterHead, humanPose, HUMAN_EXPRESSIONS, HAIR_STYLES } from '../../characters'
const tinyfly = { MANGA_CAST, castMember, character, drawCharacter, drawCharacterHead, humanPose, HUMAN_EXPRESSIONS, HAIR_STYLES }

export const html = `<style>
.mc-wrap { display:grid;gap:12px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.mc-canvas { display:block;width:100%;min-width:0;height:auto;aspect-ratio:960/450;background:#f5f2fc;border-radius:12px; }
.mc-controls { display:flex;flex-wrap:wrap;gap:14px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.mc-readout { font:12px system-ui;color:#bbc3db;min-height:1.4em; }
</style><div class="mc-wrap">
<canvas class="mc-canvas" width="960" height="450"></canvas>
<div class="mc-controls">
<label>Expression <select class="mc-mood">
<option value="happy">Happy</option><option value="neutral">Neutral</option><option value="surprised">Surprised</option>
<option value="determined" selected>Determined</option><option value="worried">Worried</option><option value="embarrassed">Embarrassed</option>
<option value="laughing">Laughing</option><option value="crying">Crying</option><option value="sleepy">Sleepy</option>
</select></label>
<label><input class="mc-cycle" type="checkbox" /> Cycle expressions</label>
<label><input class="mc-turn" type="checkbox" /> Turn around</label>
<label><input class="mc-portrait" type="checkbox" checked /> Face close-ups</label>
<label>Hair <select class="mc-hair"><option value="">Preset hair</option>${Object.keys(HAIR_STYLES).map((name) => `<option value="${name}">${name}</option>`).join('')}</select></label>
<label>Face <select class="mc-shape"><option value="">Preset jaw</option><option value="angular">Angular</option><option value="round">Round</option></select></label>
<label>Jaw width <input class="mc-jaw" type="range" min="0.55" max="0.95" step="0.01" value="0.74" /></label>
<label>Chin width <input class="mc-chin" type="range" min="0.03" max="0.35" step="0.01" value="0.14" /></label>
<label>Eye height <input class="mc-eye" type="range" min="0.45" max="1.2" step="0.01" value="0.65" /></label>
</div><div class="mc-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.mc-canvas')
  const ctx = canvas.getContext('2d')
  const moodPicker = root.querySelector('.mc-mood')
  const cycle = root.querySelector('.mc-cycle')
  const turn = root.querySelector('.mc-turn')
  const portrait = root.querySelector('.mc-portrait')
  const readout = root.querySelector('.mc-readout')
  const names = ['mangaYoungMan', 'mangaYoungWoman', 'mangaRival', 'mangaHeroine']
  const hairPicker = root.querySelector('.mc-hair')
  const shapePicker = root.querySelector('.mc-shape')
  const jaw = root.querySelector('.mc-jaw')
  const chin = root.querySelector('.mc-chin')
  const eye = root.querySelector('.mc-eye')
  const overrides = {}
  let cast
  const rebuild = () => {
    cast = names.map((name) => {
      const options = tinyfly.castMember(name, 240)
      if (hairPicker.value) options.hair = { style: hairPicker.value, color: tinyfly.MANGA_CAST[name].options.hair.color }
      options.face = { ...options.face, ...overrides, ...(shapePicker.value ? { shape: shapePicker.value } : {}) }
      return tinyfly.character(options)
    })
  }
  const onHair = () => rebuild()
  const onJaw = () => { overrides.jawWidth = Number(jaw.value); rebuild() }
  const onChin = () => { overrides.chinWidth = Number(chin.value); rebuild() }
  const onEye = () => { overrides.eyeAspect = Number(eye.value); rebuild() }
  const controls = [[hairPicker, 'change', onHair], [shapePicker, 'change', onHair], [jaw, 'input', onJaw], [chin, 'input', onChin], [eye, 'input', onEye]]
  controls.forEach(([node, event, handler]) => node.addEventListener(event, handler))
  rebuild()
  const moods = [...moodPicker.options].map((option) => option.value)
  const clock = { time: 0 }
  const animation = live.to(clock, { time: 18000, duration: 18, ease: 'none', repeat: -1 })
  const onMood = () => { cycle.checked = false }
  moodPicker.addEventListener('change', onMood)
  const draw = () => {
    const t = clock.time
    const moodName = cycle.checked ? moods[Math.floor(t / 2000) % moods.length] : moodPicker.value
    const mood = tinyfly.HUMAN_EXPRESSIONS[moodName]
    const heading = turn.checked ? t / 4500 : 0
    readout.textContent = `${moodName} · young adult manga cast · editable hair, jaw, chin and eyes · ${turn.checked ? 'full turnaround' : 'front view'} · ${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#f5f2fc'
    ctx.fillRect(0, 0, 960, 450)
    ctx.fillStyle = '#302c48'
    ctx.textAlign = 'center'
    ctx.font = '600 17px system-ui'
    ;['Spiky hair', 'Swept hair', 'Broad jaw', 'Tapered chin'].forEach((label, i) => ctx.fillText(label, 120 + i * 240, 29))
    cast.forEach((who, i) => {
      const x = 120 + (i % 4) * 240
      const y = 55
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(x - 107, y, 214, 340, 14)
      ctx.fill()
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x - 107, y, 214, 304, 14)
      ctx.clip()
      const blink = Math.max(0, 1 - Math.abs(((t + i * 180) % 3700) - 3500) / 100)
      const pose = tinyfly.humanPose({ ...mood, turn: heading, blink, 'head.tilt': Math.sin(t / 1400 + i) * 3 })
      if (portrait.checked) tinyfly.drawCharacterHead(ctx, who, pose, { x, y: y + 155, radius: 70, time: t })
      else {
        ctx.save()
        ctx.translate(x, y + 289)
        tinyfly.drawCharacter(ctx, who, pose, t)
        ctx.restore()
      }
      ctx.restore()
      ctx.fillStyle = '#605a75'
      ctx.font = '13px system-ui'
      ctx.fillText(tinyfly.MANGA_CAST[names[i]].label.replace('Manga ', ''), x, y + 325)
    })
  }
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => { animation.kill(); live.ticker.remove(draw); moodPicker.removeEventListener('change', onMood); controls.forEach(([node, event, handler]) => node.removeEventListener(event, handler)) }
}

/** @type {import('./types').LiveDemo} */
export const mangaCast = {
  id: 'live-manga-cast', name: 'Young Adult Manga Cast',
  description: 'Four original young adult manga archetypes with angular jaws, tapered chins, narrower expressive eyes and spiky or swept hair. Change hairstyles, jaw and chin widths, eye height and expressions, inspect the whole figure and turn through 360 degrees. Every choice uses the public character API.',
  category: 'video', alsoIn: ['showcase'], tags: ['anime', 'manga', 'character', 'cast', 'expressions', 'young adult', 'turnaround'],
  html, run,
}
