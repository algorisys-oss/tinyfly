import { deserializeTimeline, cameraTracks, heldTime } from '../../engine'
import { applyCamera, cameraFromValues } from '../../adapters/canvas'
import { character, castMember, characterScript, characterPoseOf, drawCharacter, hairFollowTracks, drawDustPuff, sketchPen, gagDuration, CHARACTER_CAST } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, cameraTracks, heldTime, applyCamera, cameraFromValues, character, castMember, characterScript, characterPoseOf, drawCharacter, hairFollowTracks, drawDustPuff, sketchPen, gagDuration, CHARACTER_CAST }

export const html = `<style>
  .cha-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cha-canvas { width: 100%; max-width: 420px; aspect-ratio: 2 / 1; height: auto; border-radius: 8px; background: #fbf8ef; }
  .cha-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .cha-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .cha-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="cha-wrap">
  <canvas class="cha-canvas" width="680" height="340"></canvas>
  <div class="cha-row">
    <label>who <select class="cha-who" aria-label="Cast member"></select></label>
    <label>acting <select class="cha-style" aria-label="Acting style">
      <option value="none">none</option><option value="limited">limited</option>
      <option value="full">full</option><option value="snappy" selected>snappy</option>
    </select></label>
    <label>walk <select class="cha-gait" aria-label="Gait">
      <option value="walk" selected>walk</option><option value="bouncy">bouncy</option>
      <option value="strut">strut</option><option value="sneak">sneak</option><option value="tired">tired</option>
    </select></label>
  </div>
  <div class="cha-row">
    <label><input type="checkbox" class="cha-twos" /> on twos</label>
    <label><input type="checkbox" class="cha-camera" checked /> camera</label>
  </div>
  <div class="cha-readout">walks in</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cha-canvas')
  const whoSelect = root.querySelector('.cha-who')
  const styleSelect = root.querySelector('.cha-style')
  const gaitSelect = root.querySelector('.cha-gait')
  const twosBox = root.querySelector('.cha-twos')
  const cameraBox = root.querySelector('.cha-camera')
  const readout = root.querySelector('.cha-readout')
  const ctx = canvas.getContext('2d')

  const W = 680
  const H = 340
  const GROUND = 300
  const INK = '#2f2f33'
  const START = 90
  const BOX = { x: 520, w: 70, h: 52 }
  const HEIGHT = 170
  whoSelect.innerHTML = Object.keys(tinyfly.CHARACTER_CAST).map((name) => `<option value="${name}">${name}</option>`).join('')
  whoSelect.value = 'youngWoman'

  // One clock (ms) drives the scene and loops; a new story restarts it.
  const clock = { time: 0 }
  let loop

  // The same beats as the stick figure's Cartoon Acting, on a v2 character from the cast.
  let scene
  const build = () => {
    const who = tinyfly.character(tinyfly.castMember(whoSelect.value, HEIGHT))
    const script = tinyfly.characterScript(
      'hero',
      who,
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
      { from: START, style: styleSelect.value }
    )
    // Hanging hair (a ponytail, long waves) swings after the turns and streams back on the zip.
    const hair = tinyfly.hairFollowTracks('hero', script.tracks, who)
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
    const timeline = tinyfly.deserializeTimeline({ id: 'character-acting', tracks: [...script.tracks, ...hair, ...camera] })
    scene = { who, timeline, script }
    const length = script.duration + 300
    loop?.kill()
    clock.time = 0
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  for (const input of [whoSelect, styleSelect, gaitSelect]) input.addEventListener('change', build)

  const draw = () => {
    const t = clock.time
    // On twos: the character holds each drawing for two frames of 24 fps.
    const at = twosBox.checked ? tinyfly.heldTime(t, 12) : t
    const state = scene.timeline.getStateAtTime(at)
    const values = state.values.get('hero') ?? new Map()
    const line = scene.script.lines.find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = line ? `“${line.text}”` : `${(t / 1000).toFixed(1)} s · ${whoSelect.value} · ${styleSelect.value}`
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

    // The character: every track value is a prop; its walk, gait and hair fold into the pose.
    const props = Object.fromEntries(values)
    ctx.save()
    ctx.translate(START + (props.x ?? 0), GROUND + (props.y ?? 0))
    tinyfly.drawCharacter(ctx, scene.who, tinyfly.characterPoseOf(props), at)
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
    for (const input of [whoSelect, styleSelect, gaitSelect]) input.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const characterActing = {
  id: 'live-character-acting',
  name: 'Character Acting',
  description:
    'The Cartoon Acting story (walk in, look, a take, say a line, tremble, zip off) on a v2 character from the cast: characterScript() compiles the same beats for the human body, with its own acting pass, lip-sync, a walk phase keyed to this character’s stride, and hairFollowTracks() so a ponytail swings after each turn and streams back on the zip. Pick who acts it, the acting style and the walk.',
  category: 'video',
  tags: ['canvas', 'character', 'cast', 'acting', 'beats', 'gait', 'lip-sync', 'hair', 'camera', 'video'],
  html,
  run,
}
