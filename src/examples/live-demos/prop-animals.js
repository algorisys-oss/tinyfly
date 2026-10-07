import { deserializeTimeline } from '../../engine'
import { dog, cat, cow, tree, propTarget, propScript, drawProp, drawPropEffects } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, dog, cat, cow, tree, propTarget, propScript, drawProp, drawPropEffects }

export const html = `<style>
  .pan-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pan-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .pan-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .pan-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .pan-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="pan-wrap">
  <canvas class="pan-canvas" width="680" height="360"></canvas>
  <div class="pan-row">
    <label>look <select class="pan-look" aria-label="Look"><option value="clean" selected>clean</option><option value="pencil">pencil</option></select></label>
    <label>style <select class="pan-style" aria-label="Style"><option value="solid" selected>solid</option><option value="stick">stick (line art)</option></select></label>
  </div>
  <div class="pan-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.pan-canvas')
  const readout = root.querySelector('.pan-readout')
  const lookSelect = root.querySelector('.pan-look')
  const styleSelect = root.querySelector('.pan-style')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const FAR = 236
  const GROUND = 322
  const INK = '#2f2f33'

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const look = lookSelect.value
    // Stick: line art to go with stick figures (even strokes for legs and tails, outlined shapes over paper).
    const at = { look, ink: INK, style: styleSelect.value, paper: '#fbf8ef' }
    const cast = {
      cow: { prop: tinyfly.cow(), x: 470, y: FAR, scale: 42, start: { turn: 3 } },
      tree: { prop: tinyfly.tree({ canopy: { seed: 9 } }), x: 120, y: FAR, scale: 34, start: {} },
      cat: { prop: tinyfly.cat(), x: 250, y: GROUND, scale: 150, start: { turn: 1 } },
      dog: { prop: tinyfly.dog(), x: -60, y: GROUND, scale: 120, start: { turn: 1 } },
    }
    const beats = {
      cow: [{ do: 'graze', for: 2400 }, { do: 'moo' }, { do: 'swish' }, { do: 'graze', for: 4000 }, { do: 'moo' }],
      tree: [{ do: 'sway', wind: 0.3, for: 12000 }],
      cat: [
        { do: 'pounce', to: 360 },
        { do: 'sit', for: 2200 },
        { do: 'arch', for: 900 },
        { do: 'meow' },
        { do: 'run', to: 610 },
        { do: 'turn', toward: 'left' },
        { do: 'arch', for: 1200 },
        { do: 'meow' },
      ],
      dog: [
        { do: 'trot', to: 160 },
        { do: 'sniff', for: 1000 },
        { do: 'wag', for: 900 },
        { do: 'bark' },
        { do: 'bark' },
        { do: 'run', to: 460 },
        { do: 'sit', for: 1600 },
        { do: 'wag', for: 1400 },
      ],
    }
    const props = {}
    for (const [id, c] of Object.entries(cast)) {
      const target = tinyfly.propTarget({ x: c.x, y: c.y, prop: c.prop, scale: c.scale, values: c.start, ...at })
      const script = tinyfly.propScript(id, c.prop, beats[id], { from: c.x, ground: c.y, scale: c.scale, start: c.start })
      props[id] = { target, script }
    }
    const tracks = Object.values(props).flatMap((p) => p.script.tracks)
    const length = Math.max(...Object.values(props).map((p) => p.script.duration)) + 400
    scene = { props, timeline: tinyfly.deserializeTimeline({ id: 'farmyard', tracks }) }
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
    for (const y of [FAR + 1, GROUND + 1]) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    const frame = { time: t, state }
    // Back to front: the tree and the cow in the field, then the yard.
    for (const id of ['tree', 'cow', 'cat', 'dog']) {
      tinyfly.drawProp(ctx, scene.props[id].target, frame, id)
      tinyfly.drawPropEffects(ctx, scene.props[id].script.effects, t, { color: '#6b6b70', size: 46 })
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
export const propAnimals = {
  id: 'live-prop-animals',
  name: 'Farmyard',
  description:
    'Four-legged animals from one quadruped() generator: a cow grazing and mooing in the field, a cat pouncing and sitting, then arching its back, meowing and bolting, and a dog trotting in to sniff, wag and bark, then running after it. Each species has its own proportions, gaits (stride keyed with the distance, so the paws keep pace), voice and actions. Switch the style to stick for line-art animals that go with stick figures.',
  category: 'video',
  tags: ['canvas', 'prop', 'animal', 'dog', 'cat', 'cow', 'gait', 'acting', '3d', 'video'],
  html,
  run,
}
