import { DANCE_STYLES, FLIPS, danceFrame, danceTaps, danceTravel, flipPose, flipTravel, blendPose, drawStickFigure, stickFigureJoints } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { DANCE_STYLES, FLIPS, danceFrame, danceTaps, danceTravel, flipPose, flipTravel, blendPose, drawStickFigure, stickFigureJoints }

export const html = `<style>
  .dfl-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .dfl-canvas { width: 100%; max-width: 408px; aspect-ratio: 2 / 1; height: auto; border-radius: 8px; background: #1b1035; }
  .dfl-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px;
    font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .dfl-row select, .dfl-row button { font: 12px system-ui, sans-serif; padding: 2px 6px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .dfl-row button { cursor: pointer; }
  .dfl-row input[type=range] { width: 80px; }
  .dfl-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="dfl-wrap">
  <canvas class="dfl-canvas" width="680" height="340"></canvas>
  <div class="dfl-row">
    <select class="dfl-style" aria-label="Dance style"></select>
    <select class="dfl-move" aria-label="Move"></select>
    <label>tempo <input class="dfl-tempo" type="range" min="60" max="160" step="1" /></label>
  </div>
  <div class="dfl-row">
    <select class="dfl-flip" aria-label="Flip"></select>
    <button class="dfl-go" type="button">Flip!</button>
    <label><input type="checkbox" class="dfl-sound" /> tap sounds</label>
  </div>
  <div class="dfl-readout">disco</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.dfl-canvas')
  const styleSelect = root.querySelector('.dfl-style')
  const moveSelect = root.querySelector('.dfl-move')
  const tempo = root.querySelector('.dfl-tempo')
  const flipSelect = root.querySelector('.dfl-flip')
  const go = root.querySelector('.dfl-go')
  const sound = root.querySelector('.dfl-sound')
  const readout = root.querySelector('.dfl-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 340
  const FLOOR = 300
  const HEIGHT = 170

  const option = (select, value, text) => {
    const el = document.createElement('option')
    el.value = value
    el.textContent = text
    select.append(el)
  }
  for (const [name, style] of Object.entries(tinyfly.DANCE_STYLES)) option(styleSelect, name, style.label)
  for (const [name, flip] of Object.entries(tinyfly.FLIPS)) option(flipSelect, name, flip.label)

  const style = () => tinyfly.DANCE_STYLES[styleSelect.value]
  const showMoves = () => {
    moveSelect.replaceChildren()
    option(moveSelect, '', 'whole routine')
    for (const [name, move] of Object.entries(style().moves)) option(moveSelect, name, move.label)
    tempo.value = String(style().bpm)
  }
  showMoves()
  styleSelect.addEventListener('change', showMoves)

  // One clock (ms). Beats are counted from it at the chosen tempo, so the
  // tempo can change mid-dance without the dancer jumping.
  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })
  let last = 0
  let beat = 0
  let flip = null // { name, start }
  let shift = 0 // how far a flip carried the dancer; it walks back to centre
  let glide = 0 // how far the dance's glides (a moonwalk) carried it; off one side, it comes in at the other

  // Tap sounds: a short click of filtered noise per strike (toes brighter, heels lower).
  let audio = null
  sound.addEventListener('change', () => {
    const Context = window.AudioContext ?? window.webkitAudioContext
    if (sound.checked && !audio && Context) audio = new Context()
  })
  const click = (heel) => {
    if (!audio || !sound.checked) return
    const length = Math.floor(audio.sampleRate * 0.04)
    const buffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 6)
    const source = audio.createBufferSource()
    const filter = audio.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = heel ? 1400 : 3200
    source.buffer = buffer
    source.connect(filter).connect(audio.destination)
    source.start()
  }
  let flashes = [] // { side, until }

  go.addEventListener('click', () => {
    flip = { name: flipSelect.value, start: clock.time }
  })

  /** 0 → 1 → 0 over a flip: blend out of the dance, and back in at the end. */
  const flipWeight = (progress) => {
    const ease = (t) => t * t * (3 - 2 * t)
    return Math.min(ease(Math.min(1, progress / 0.12)), ease(Math.min(1, (1 - progress) / 0.12)))
  }

  const draw = () => {
    const dt = Math.max(0, clock.time - last)
    last = clock.time
    const bpm = Number(tempo.value)
    const previousBeat = beat
    beat += (dt * bpm) / 60000
    const options = { move: moveSelect.value || undefined }

    // Feet that struck the floor since the last frame: flash them (and click, with sound on).
    for (const { tap } of tinyfly.danceTaps(style(), previousBeat, beat, options)) {
      flashes.push({ side: tap.startsWith('left') ? 'left' : 'right', until: clock.time + 140 })
      click(tap.endsWith('Heel'))
    }
    flashes = flashes.filter((flash) => flash.until > clock.time)

    // The dance: a pose and hand shapes for this beat (a move on a loop, or the routine).
    const frame = tinyfly.danceFrame(style(), beat, options)
    let figure = frame.pose
    // Glides travel: add the ground covered since the last frame (so changing move never jumps).
    glide += (tinyfly.danceTravel(style(), beat, options) - tinyfly.danceTravel(style(), previousBeat, options)) * HEIGHT
    const edge = W / 2 + 60
    glide = ((((glide + edge) % (2 * edge)) + 2 * edge) % (2 * edge)) - edge
    let x = W / 2 + glide + shift

    if (flip) {
      const move = tinyfly.FLIPS[flip.name]
      const progress = (clock.time - flip.start) / move.duration
      if (progress >= 1) {
        shift += tinyfly.flipTravel(move, 1, HEIGHT)
        flip = null
      } else {
        figure = tinyfly.blendPose(figure, tinyfly.flipPose(move, progress), flipWeight(progress))
        x += tinyfly.flipTravel(move, progress, HEIGHT)
      }
    }
    if (!flip) shift *= Math.pow(0.5, dt / 400) // shuffle back to the middle
    readout.textContent = `${style().label} · ${moveSelect.selectedOptions[0]?.textContent} · ${bpm} bpm · count ${(Math.floor(beat) % 8) + 1}`
    if (!ctx) return

    // Stage: a dark room, a floor, a spotlight that follows the dancer.
    ctx.fillStyle = '#1b1035'
    ctx.fillRect(0, 0, W, H)
    const light = ctx.createRadialGradient(x, FLOOR, 10, x, FLOOR - 60, 260)
    light.addColorStop(0, 'rgba(255, 231, 160, 0.55)')
    light.addColorStop(1, 'rgba(255, 231, 160, 0)')
    ctx.fillStyle = light
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#2c1b52'
    ctx.fillRect(0, FLOOR, W, H - FLOOR)

    // The count, 1 to 8: the current beat lights up.
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(W / 2 - 105 + i * 30, 24, 7, 0, Math.PI * 2)
      ctx.fillStyle = i === Math.floor(beat) % 8 ? '#ffd166' : '#3d2a6b'
      ctx.fill()
    }

    // A shadow that shrinks as the dancer leaves the floor.
    const lift = 1 - Math.min(0.7, figure.rise * 2.5)
    ctx.beginPath()
    ctx.ellipse(x, FLOOR + 4, 46 * lift, 7 * lift, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fill()

    const look = {
      height: HEIGHT,
      color: '#f8fafc',
      headFill: '#f2c49b',
      lineWidth: 6,
      shoulderWidth: 0.05,
      hands: { left: frame.hands.left, right: frame.hands.right, skin: '#f2c49b', size: 0.1 },
    }
    ctx.save()
    ctx.translate(x, FLOOR + 2)
    // A spark at each foot that just tapped, from the same joints the figure is drawn with.
    const joints = tinyfly.stickFigureJoints(figure, look)
    for (const flash of flashes) {
      const toe = joints.toes[flash.side]
      ctx.beginPath()
      ctx.arc(toe.x, toe.y, 12, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 209, 102, 0.75)'
      ctx.fill()
    }
    tinyfly.drawStickFigure(ctx, figure, look, clock.time)
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const danceFloor = {
  id: 'live-dance-floor',
  name: 'Dance Floor (Characters)',
  description:
    'The stick figure dances disco, hip hop, breaking toprock, jazz, K-pop, Bollywood, Bhangra, Bharatanatyam (with mudras), the Charleston, tap (with tap sounds) and popping (side glide, moonwalk), and does front, back and scissor flips, cartwheels, handsprings, split leaps and full splits. Every move is plain data keyed in beats, so any tempo plays it; wrists, ankles and turned-out feet carry the style.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'dance', 'tap', 'moonwalk', 'flips', 'beats', 'audio', 'video'],
  html,
  run,
}
