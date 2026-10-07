import { deserializeTimeline } from '../../engine'
import { songbird, crow, chicken, tree, house, propTarget, propScript, propAt, drawProp, drawPropEffects } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, songbird, crow, chicken, tree, house, propTarget, propScript, propAt, drawProp, drawPropEffects }

export const html = `<style>
  .pbd-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pbd-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .pbd-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .pbd-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .pbd-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="pbd-wrap">
  <canvas class="pbd-canvas" width="680" height="360"></canvas>
  <div class="pbd-row">
    <label>style <select class="pbd-style" aria-label="Style"><option value="solid" selected>solid</option><option value="stick">stick (line art)</option></select></label>
    <label>look <select class="pbd-look" aria-label="Look"><option value="clean" selected>clean</option><option value="pencil">pencil</option></select></label>
  </div>
  <div class="pbd-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.pbd-canvas')
  const readout = root.querySelector('.pbd-readout')
  const lookSelect = root.querySelector('.pbd-look')
  const styleSelect = root.querySelector('.pbd-style')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 322
  const INK = '#2f2f33'

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const at = { look: lookSelect.value, ink: INK, style: styleSelect.value, paper: '#fbf8ef' }
    const setting = {
      tree: { prop: tinyfly.tree({ canopy: { seed: 4 } }), x: 120, scale: 62, start: {} },
      house: { prop: tinyfly.house(), x: 540, scale: 40, start: { turn: 0.35 } },
    }
    for (const [id, s] of Object.entries(setting)) setting[id].target = tinyfly.propTarget({ x: s.x, y: GROUND, prop: s.prop, scale: s.scale, values: s.start, ...at })
    // Where the birds perch: the tree's branch and the house's ridge, read from their anchors.
    const still = { time: 0, state: undefined }
    const branch = tinyfly.propAt(setting.tree.target, still, 'tree').anchor('branch')
    const ridge = tinyfly.propAt(setting.house.target, still, 'house').anchor('ridge')

    const birdScale = { robin: 330, crow: 140, hen: 170 }
    // A bird's `lift` is in metres: a perch's height above the ground, in the bird's own scale.
    const perch = (point, id) => (GROUND - point.y) / birdScale[id]
    const cast = {
      robin: { prop: tinyfly.songbird(), x: branch.x, start: { turn: 1, lift: perch(branch, 'robin') } },
      crow: { prop: tinyfly.crow(), x: 720, start: { turn: 3 } },
      hen: { prop: tinyfly.chicken(), x: 230, start: { turn: 1 } },
    }
    const beats = {
      robin: [
        { do: 'tweet' },
        { do: 'hold', for: 500 },
        { do: 'fly', to: 380, height: 0.25 },
        { do: 'land' },
        { do: 'hop', to: 410 },
        { do: 'peck', for: 900 },
        { do: 'tweet' },
        { do: 'hop', to: 440 },
        { do: 'peck', for: 600 },
        { do: 'fly', to: branch.x, height: perch(branch, 'robin') },
        { do: 'land', height: perch(branch, 'robin') },
        { do: 'tweet' },
      ],
      crow: [
        { do: 'walk', to: 520 },
        { do: 'caw' },
        { do: 'peck', for: 600 },
        { do: 'flap', for: 700 },
        { do: 'fly', to: ridge.x, height: perch(ridge, 'crow') + 0.3 },
        { do: 'land', height: perch(ridge, 'crow') },
        { do: 'caw' },
        { do: 'hold', for: 1200 },
        { do: 'caw' },
      ],
      hen: [
        { do: 'peck', for: 1200 },
        { do: 'walk', to: 300 },
        { do: 'cluck' },
        { do: 'peck', for: 900 },
        { do: 'flutter' },
        { do: 'cluck' },
        { do: 'walk', to: 190 },
        { do: 'peck', for: 1500 },
      ],
    }
    const props = {}
    for (const [id, s] of Object.entries(setting)) props[id] = { target: s.target, script: { tracks: [], effects: [], duration: 0 } }
    for (const [id, c] of Object.entries(cast)) {
      const scale = birdScale[id]
      const target = tinyfly.propTarget({ x: c.x, y: GROUND, prop: c.prop, scale, values: c.start, ...at })
      const script = tinyfly.propScript(id, c.prop, beats[id], { from: c.x, ground: GROUND, scale, start: c.start })
      props[id] = { target, script }
    }
    const tracks = Object.values(props).flatMap((p) => p.script.tracks)
    const length = Math.max(...Object.values(props).map((p) => p.script.duration)) + 600
    scene = { props, timeline: tinyfly.deserializeTimeline({ id: 'birds', tracks }) }
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  for (const input of [lookSelect, styleSelect]) input.addEventListener('change', build)

  const draw = () => {
    const t = clock.time
    const state = scene.timeline.getStateAtTime(t)
    readout.textContent = `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, GROUND + 1)
    ctx.lineTo(W, GROUND + 1)
    ctx.stroke()
    const frame = { time: t, state }
    // The tree and the house first, then the birds in front of them.
    for (const id of ['house', 'tree', 'hen', 'crow', 'robin']) {
      tinyfly.drawProp(ctx, scene.props[id].target, frame, id)
      tinyfly.drawPropEffects(ctx, scene.props[id].script.effects, t, { color: '#6b6b70', size: 30 })
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    for (const input of [lookSelect, styleSelect]) input.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propBirds = {
  id: 'live-prop-birds',
  name: 'Birds',
  description:
    'Birds from one bird() generator: a robin tweets on a branch, flies down, hops and pecks, then flies back up to its perch; a crow walks in, caws, flaps and flies up onto the roof; a hen pecks, clucks and flutters. Wings fold along the body and beat in rhythm from a wingbeat phase; perches are read from the tree’s and the house’s anchors. Switch the style to stick for line art.',
  category: 'video',
  tags: ['canvas', 'prop', 'animal', 'bird', 'fly', 'acting', '3d', 'video'],
  html,
  run,
}
