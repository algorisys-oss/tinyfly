import { ANIME_CAST, castMember, character, drawCharacter, drawCharacterHead, humanPose, HUMAN_EXPRESSIONS } from '../../characters'
const tinyfly = { ANIME_CAST, castMember, character, drawCharacter, drawCharacterHead, humanPose, HUMAN_EXPRESSIONS }

export const html = `<style>
.ac-wrap { display:grid;gap:12px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.ac-canvas { display:block;width:100%;min-width:0;height:auto;aspect-ratio:960/610;background:#f5f2fc;border-radius:12px; }
.ac-controls { display:flex;flex-wrap:wrap;gap:14px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.ac-readout { font:12px system-ui;color:#bbc3db;min-height:1.4em; }
</style><div class="ac-wrap">
<canvas class="ac-canvas" width="960" height="610"></canvas>
<div class="ac-controls">
<label>Expression <select class="ac-mood">
<option value="happy">Happy</option><option value="neutral">Neutral</option><option value="surprised">Surprised</option>
<option value="determined">Determined</option><option value="worried">Worried</option><option value="embarrassed">Embarrassed</option>
<option value="laughing">Laughing</option><option value="crying">Crying</option><option value="sleepy">Sleepy</option>
</select></label>
<label><input class="ac-cycle" type="checkbox" checked /> Cycle expressions</label>
<label><input class="ac-turn" type="checkbox" /> Turn around</label>
<label><input class="ac-portrait" type="checkbox" /> Face close-ups</label>
</div><div class="ac-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ac-canvas')
  const ctx = canvas.getContext('2d')
  const moodPicker = root.querySelector('.ac-mood')
  const cycle = root.querySelector('.ac-cycle')
  const turn = root.querySelector('.ac-turn')
  const portrait = root.querySelector('.ac-portrait')
  const readout = root.querySelector('.ac-readout')
  const names = ['animeBoy', 'animeYoungMan', 'animeMan', 'animeOlderMan', 'animeGirl', 'animeYoungWoman', 'animeWoman', 'animeOlderWoman']
  const cast = names.map((name) => tinyfly.character(tinyfly.castMember(name, 205)))
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
    readout.textContent = `${moodName} · children, young adults, adults and older adults · ${turn.checked ? 'full turnaround' : 'front view'} · ${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#f5f2fc'
    ctx.fillRect(0, 0, 960, 610)
    ctx.fillStyle = '#302c48'
    ctx.textAlign = 'center'
    ctx.font = '600 17px system-ui'
    ;['Children', 'Young adults', 'Adults', 'Older adults'].forEach((label, i) => ctx.fillText(label, 120 + i * 240, 29))
    cast.forEach((who, i) => {
      const x = 120 + (i % 4) * 240
      const y = 55 + Math.floor(i / 4) * 270
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(x - 107, y, 214, 255, 14)
      ctx.fill()
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x - 107, y, 214, 224, 14)
      ctx.clip()
      const blink = Math.max(0, 1 - Math.abs(((t + i * 180) % 3700) - 3500) / 100)
      const pose = tinyfly.humanPose({ ...mood, turn: heading, blink, 'head.tilt': Math.sin(t / 1400 + i) * 3 })
      if (portrait.checked) tinyfly.drawCharacterHead(ctx, who, pose, { x, y: y + 110, radius: 65, time: t })
      else {
        ctx.save()
        ctx.translate(x, y + 219)
        tinyfly.drawCharacter(ctx, who, pose, t)
        ctx.restore()
      }
      ctx.restore()
      ctx.fillStyle = '#605a75'
      ctx.font = '13px system-ui'
      ctx.fillText(tinyfly.ANIME_CAST[names[i]].label.replace('Anime ', ''), x, y + 241)
    })
  }
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => { animation.kill(); live.ticker.remove(draw); moodPicker.removeEventListener('change', onMood) }
}

/** @type {import('./types').LiveDemo} */
export const animeCast = {
  id: 'live-anime-cast', name: 'Colour Anime Cast',
  description: 'Eight colour anime characters: boys and girls, young men and women, adults and older adults. Coloured irises, highlights, expressive lids, brows and optional lashes use the shared face fields. Switch expressions, inspect close-ups and turn every character through 360 degrees.',
  category: 'video', alsoIn: ['showcase'], tags: ['anime', 'manga', 'character', 'cast', 'expressions', 'ages', 'turnaround'],
  html, run,
}
