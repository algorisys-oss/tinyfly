import { deserializeTimeline, cameraTracks, heldTime } from '../../engine'
import { applyCamera, cameraFromValues } from '../../adapters/canvas'
import {
  scriptTracks,
  stickFigureTarget,
  resolveStickPose,
  drawStickFigure,
  drawStickSmear,
  drawDustPuff,
  sketchPen,
  gagDuration,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  deserializeTimeline,
  cameraTracks,
  heldTime,
  applyCamera,
  cameraFromValues,
  scriptTracks,
  stickFigureTarget,
  resolveStickPose,
  drawStickFigure,
  drawStickSmear,
  drawDustPuff,
  sketchPen,
  gagDuration,
}

export const html = `<style>
  .ca-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ca-canvas { width: 100%; max-width: 420px; aspect-ratio: 2 / 1; height: auto; border-radius: 8px; background: #fbf8ef; }
  .ca-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .ca-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .ca-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="ca-wrap">
  <canvas class="ca-canvas" width="680" height="340"></canvas>
  <div class="ca-row">
    <label>acting <select class="ca-style" aria-label="Acting style">
      <option value="none">none</option><option value="limited">limited</option>
      <option value="full">full</option><option value="snappy" selected>snappy</option>
    </select></label>
    <label>walk <select class="ca-gait" aria-label="Gait">
      <option value="walk">walk</option><option value="bouncy" selected>bouncy</option>
      <option value="doubleBounce">double bounce</option><option value="strut">strut</option>
      <option value="tired">tired</option>
    </select></label>
  </div>
  <div class="ca-row">
    <label><input type="checkbox" class="ca-twos" checked /> on twos</label>
    <label><input type="checkbox" class="ca-smear" checked /> speed lines</label>
    <label><input type="checkbox" class="ca-camera" checked /> camera</label>
  </div>
  <div class="ca-readout">walks in</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ca-canvas')
  const styleSelect = root.querySelector('.ca-style')
  const gaitSelect = root.querySelector('.ca-gait')
  const twosBox = root.querySelector('.ca-twos')
  const smearBox = root.querySelector('.ca-smear')
  const cameraBox = root.querySelector('.ca-camera')
  const readout = root.querySelector('.ca-readout')
  const ctx = canvas.getContext('2d')

  const W = 680
  const H = 340
  const GROUND = 290
  const INK = '#2f2f33'
  const START = 90
  const BOX = { x: 520, w: 70, h: 52 }
  const HEIGHT = 140
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 4, headFill: 'none', rubber: 0.6, sketch: { roughness: 1.8, seed: 4 } }
  const hero = tinyfly.stickFigureTarget({ x: START, y: GROUND, style: figureStyle })

  // One clock (ms) drives the scene and loops; a new story restarts it.
  const clock = { time: 0 }
  let loop

  // The story as beats; the acting style and the gait come from the pickers.
  let scene
  const build = () => {
    const script = tinyfly.scriptTracks(
      'hero',
      [
        { do: gaitSelect.value, to: 330, mood: 'happy' },
        { do: 'look', toward: BOX.x, mood: 'confused' },
        { do: 'take' },
        { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
        { do: 'tremble' },
        { do: 'face', toward: 0, mood: 'scared' },
        { do: 'zip', to: -200, say: 'Nope!' },
        { do: 'hold', for: 1000 },
      ],
      { from: START, height: HEIGHT, style: styleSelect.value }
    )
    const [, look, take, say] = script.beats
    const camera = tinyfly.cameraTracks(
      [
        { at: look.start, duration: 500, frame: { focus: { x: 400, y: 230 }, scale: 1.2 } },
        { at: take.start + 300, duration: 0, frame: { focus: { x: 340, y: 175 }, scale: 1.4 } },
        { at: take.start + 900, duration: 420, shake: { strength: 8 } },
        { at: take.start + tinyfly.gagDuration('take') + 150, duration: 600, frame: { focus: { x: 380, y: 230 }, scale: 1.2 } },
        { at: say.end + 400, duration: 700, frame: {} },
      ],
      { stage: { width: W, height: H } }
    )
    const timeline = tinyfly.deserializeTimeline({ id: 'cartoon-acting', tracks: [...script.tracks, ...camera] })
    scene = { timeline, script }
    const length = script.duration + 300
    loop?.kill()
    clock.time = 0
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  for (const input of [styleSelect, gaitSelect]) input.addEventListener('change', build)

  const draw = () => {
    const t = clock.time
    // On twos: the figure holds each drawing for two frames of 24 fps.
    const at = (time) => (twosBox.checked ? tinyfly.heldTime(time, 12) : time)
    const stateAt = (time) => scene.timeline.getStateAtTime(at(time))
    const state = stateAt(t)
    const values = state.values.get('hero') ?? new Map()
    const line = scene.script.lines.find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = line ? `“${line.text}”` : `${(t / 1000).toFixed(1)} s · ${styleSelect.value}`
    if (!ctx) return

    ctx.save()
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    if (cameraBox.checked) tinyfly.applyCamera(ctx, tinyfly.cameraFromValues(state.values.get('Camera')), { width: W, height: H })
    const pen = tinyfly.sketchPen(ctx, { roughness: 2, seed: 2 }, t)
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(-W, -H, W * 3, H * 3)
    ctx.strokeStyle = INK
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 4
    const ground = []
    for (let x = -300; x <= W + 300; x += 40) ground.push({ x, y: GROUND + Math.sin(x * 0.05) * 2 })
    pen.line(ground)
    // The box, ticking.
    const tick = Math.floor(t / 500) % 2 === 0
    ctx.lineWidth = 3
    pen.line([{ x: BOX.x, y: GROUND }, { x: BOX.x, y: GROUND - BOX.h }, { x: BOX.x + BOX.w, y: GROUND - BOX.h }, { x: BOX.x + BOX.w, y: GROUND }])
    ctx.fillStyle = INK
    ctx.font = '16px sans-serif'
    ctx.fillText(tick ? 'tick' : 'tock', BOX.x + 18, GROUND - BOX.h - 10)

    if (smearBox.checked) tinyfly.drawStickSmear(ctx, hero, { time: t, state, stateAt }, 'hero', { color: INK, lineWidth: 2.5 })

    // The figure: its props from the tracks, its walk and gait folded in.
    const props = { ...hero.props }
    for (const [property, value] of values) if (property in props) props[property] = value
    ctx.save()
    ctx.translate(START + (values.get('x') ?? 0), GROUND)
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, at(t)), { ...figureStyle, facing: props.facing }, at(t))
    ctx.restore()
    // Dust where the take lands and where the zip leaves: the script says when and where.
    for (const effect of scene.script.effects) {
      tinyfly.drawDustPuff(ctx, { x: effect.x, y: GROUND }, (t - effect.time) / effect.length, { size: 90, color: INK, seed: effect.time })
    }
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    for (const input of [styleSelect, gaitSelect]) input.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const cartoonActing = {
  id: 'live-cartoon-acting',
  name: 'Cartoon Acting',
  description:
    'A story written as beats (walk in, look, a take, say a line, tremble, then zip off) compiled by scriptTracks() into acted tracks: wind-ups, overshoot, overlapping limbs, eyes that lead, blinks, gaits, lip-sync, the cartoon zip (legs wheel in place, then gone, dust hanging), and camera shots (a push-in, a crash zoom, a shake on landing). Switch the acting style to compare it with plain pose-to-pose, try other walks, and toggle drawing on twos, speed lines and the camera.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'anticipation', 'overshoot', 'gait', 'lip-sync', 'camera', 'sketch', 'video'],
  html,
  run,
}
