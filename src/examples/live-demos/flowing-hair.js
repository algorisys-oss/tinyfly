import { deserializeTimeline } from '../../engine'
import { character, characterPoseTracks, characterPoseOf, drawCharacterHead, hairFollowTracks, humanPose } from '../../characters'
const tinyfly = { deserializeTimeline, character, characterPoseTracks, characterPoseOf, drawCharacterHead, hairFollowTracks, humanPose }

export const html = `<style>
.fh-wrap { display:grid;gap:10px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.fh-canvas { display:block;width:100%;height:auto;aspect-ratio:960/600;background:#fbf6ee;border-radius:12px; }
.fh-controls { display:flex;flex-wrap:wrap;gap:14px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.fh-readout { font:12px system-ui;color:#bbc3db;min-height:1.4em; }
</style><div class="fh-wrap">
<canvas class="fh-canvas" width="960" height="600"></canvas>
<div class="fh-controls">
<label>Face type <select class="fh-face"><option value="simpleRound">Simple round</option><option value="expressiveRound" selected>Expressive round</option><option value="softAngular">Soft angular</option><option value="broadJaw">Broad jaw</option><option value="olderExpressive">Older expressive</option></select></label>
<label>Hairstyle <select class="fh-style"><option value="softSweep">Soft sweep</option><option value="flowingBob">Flowing bob</option><option value="cascadingWaves" selected>Cascading waves</option></select></label>
<label>Look <select class="fh-look"><option value="clean">Clean</option><option value="pencil">Pencil</option><option value="silhouette">Silhouette</option><option value="illustrated">Illustrated</option></select></label>
<label>Colour <input class="fh-color" type="color" value="#985b32" /></label>
<label><input class="fh-motion" type="checkbox" checked /> Hair follow-through</label>
<label><input class="fh-turn" type="checkbox" /> Full turn</label>
</div><div class="fh-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.fh-canvas')
  const ctx = canvas.getContext('2d')
  const face = root.querySelector('.fh-face')
  const style = root.querySelector('.fh-style')
  const look = root.querySelector('.fh-look')
  const color = root.querySelector('.fh-color')
  const motion = root.querySelector('.fh-motion')
  const turn = root.querySelector('.fh-turn')
  const readout = root.querySelector('.fh-readout')
  const names = ['softSweep', 'flowingBob', 'cascadingWaves']
  const labels = ['Soft sweep', 'Flowing bob', 'Cascading waves']
  const faces = {
    simpleRound: { style: 'simple', shape: 'round' },
    expressiveRound: { style: 'anime', shape: 'round', iris: '#567f73' },
    softAngular: { style: 'anime', shape: 'angular', jawWidth: 0.8, chinWidth: 0.28, jawRoundness: 1, eyeScale: 0.95, eyeAspect: 0.9, iris: '#567f73' },
    broadJaw: { style: 'anime', shape: 'angular', jawWidth: 0.95, chinWidth: 0.35, eyeScale: 0.7, eyeAspect: 0.6, lashes: false, nose: true, iris: '#567f73' },
    olderExpressive: { style: 'anime', shape: 'round', eyeScale: 0.8, eyeAspect: 0.65, ageLines: 1, lashes: false, nose: true, iris: '#567f73' },
  }
  const clock = { time: 0 }
  const animation = live.to(clock, { time: 6400, duration: 6.4, ease: 'none', repeat: -1 })
  let cast, timelines
  const rebuild = () => {
    cast = names.map(name => tinyfly.character({
      height: 300, lineWidth: 2.2, look: look.value, ink: '#342b32', skin: '#f2cfb1', ears: true,
      face: faces[face.value], hair: { style: name, color: color.value },
    }))
    timelines = cast.map((who, i) => {
      const id = names[i]
      // Holds leave time to see the ends settle; the same keys drive both
      // the pose and the baked hair lag through the public animation API.
      const tracks = tinyfly.characterPoseTracks(id, turn.checked ? [
        { time: 0, pose: { turn: 0 } }, { time: 4400, pose: { turn: 4 } }, { time: 6400, pose: { turn: 4 } },
      ] : [
        { time: 0, pose: { 'head.turn': 0 } }, { time: 900, pose: { 'head.turn': 0 } },
        { time: 1150, pose: { 'head.turn': 65 } }, { time: 2700, pose: { 'head.turn': 65 } },
        { time: 2950, pose: { 'head.turn': -45 } }, { time: 4500, pose: { 'head.turn': -45 } },
        { time: 4800, pose: { 'head.turn': 0 } }, { time: 6400, pose: { 'head.turn': 0 } },
      ])
      if (motion.checked) tracks.push(...tinyfly.hairFollowTracks(id, tracks, who))
      return tinyfly.deserializeTimeline({ id, tracks })
    })
  }
  rebuild()
  const draw = () => {
    const t = clock.time
    const chosen = names.indexOf(style.value)
    const faceLabel = face.options[face.selectedIndex].textContent
    const combination = `${faceLabel} · ${labels[chosen]}`
    readout.textContent = `${combination} · ${(t / 1000).toFixed(1)} s · ${turn.checked ? 'turn, then settle' : 'quick head turns, then settle'} · ${motion.checked ? 'hair follows' : 'hair held still'}`
    if (!ctx) return
    ctx.fillStyle = '#fbf6ee'
    ctx.fillRect(0, 0, 960, 600)
    ctx.textAlign = 'center'
    cast.forEach((who, i) => {
      const x = 160 + i * 320
      ctx.fillStyle = i === chosen ? '#eef5ee' : '#ffffff'
      ctx.beginPath(); ctx.roundRect(x - 148, 16, 296, 330, 16); ctx.fill()
      if (i === chosen) {
        ctx.strokeStyle = '#567f73'; ctx.lineWidth = 3; ctx.stroke()
      }
      ctx.fillStyle = '#493c42'; ctx.font = '600 19px system-ui'
      ctx.fillText(labels[i], x, 46)
      ctx.font = '12px system-ui'
      ctx.fillText(`${i === chosen ? 'Selected · ' : ''}${faceLabel}`, x, 68)
      const values = timelines[i].getStateAtTime(t).values.get(names[i]) ?? new Map()
      const pose = tinyfly.characterPoseOf({ ...Object.fromEntries(values), smile: 0.5 })
      tinyfly.drawCharacterHead(ctx, who, pose, { x, y: 145, radius: 54, time: t })
    })
    ctx.fillStyle = '#493c42'; ctx.font = '600 16px system-ui'
    ctx.fillText(`${combination} · resting shape from eight angles`, 480, 380)
    ;[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].forEach((view, i) => {
      const x = 60 + i * 120
      tinyfly.drawCharacterHead(ctx, cast[chosen], tinyfly.humanPose({ turn: view, smile: 0.5 }), { x, y: 446, radius: 32, time: t })
      ctx.fillStyle = '#806e73'; ctx.font = '12px system-ui'
      ctx.fillText(['Front', '¾ right', 'Profile', '¾ back', 'Back', '¾ back', 'Profile', '¾ left'][i], x, 577)
    })
  }
  const controls = [[face, 'change'], [style, 'change'], [look, 'change'], [color, 'input'], [motion, 'change'], [turn, 'change']]
  const update = () => { rebuild(); draw() }
  controls.forEach(([node, event]) => node.addEventListener(event, update))
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => {
    animation.kill()
    live.ticker.remove(draw)
    controls.forEach(([node, event]) => node.removeEventListener(event, update))
  }
}

/** @type {import('./types').LiveDemo} */
export const flowingHair = {
  id: 'live-flowing-hair', name: 'Flowing Cartoon Hair',
  description: 'Choose a face type, then a hairstyle: simple or expressive round faces, soft angular features, a broad jaw or an older expressive face with a soft sweep, flowing bob or cascading waves. The selected combination is highlighted in the animated comparison and shown at rest from eight angles. Watch the scalp-fitted locks follow quick head turns and settle; change colour, drawing look and follow-through using the public character and timeline APIs.',
  category: 'video', alsoIn: ['showcase'], tags: ['hair', 'character', 'cartoon', 'follow-through', 'turnaround'],
  html, run,
}
