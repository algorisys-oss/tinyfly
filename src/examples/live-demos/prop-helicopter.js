import { deserializeTimeline } from '../../engine'
import {
  helicopter, propTarget, propScript, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  deserializeTimeline, helicopter, propTarget, propScript, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure,
}

export const html = `<style>
  .phl-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .phl-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .phl-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .phl-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .phl-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="phl-wrap">
  <canvas class="phl-canvas" width="680" height="360"></canvas>
  <div class="phl-row">
    <label>look <select class="phl-look" aria-label="Look"><option value="clean">clean</option><option value="pencil" selected>pencil</option></select></label>
  </div>
  <div class="phl-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.phl-canvas')
  const readout = root.querySelector('.phl-readout')
  const lookSelect = root.querySelector('.phl-look')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 320
  const INK = '#2f2f33'
  const SCALE = 34
  const HEIGHT = 60
  const HELI_AT = 520
  const HERO_AT = 120
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3, headFill: '#fbf8ef', rubber: 0.5 }

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const prop = tinyfly.helicopter()
    const heli = tinyfly.propTarget({ x: HELI_AT, y: GROUND, prop, scale: SCALE, values: { turn: 3 }, look: lookSelect.value, ink: INK })

    // Up, a low pass over the figure, a hover facing the camera, back, and down.
    const heliScript = tinyfly.propScript('heli', prop, [
      { do: 'hold', for: 600 },
      { do: 'takeOff', height: 3.2 },
      { do: 'fly', to: 140, height: 1.9, for: 1800 },
      { do: 'turn', toward: 'viewer' },
      { do: 'hover', for: 1600 },
      { do: 'fly', to: HELI_AT, height: 3, for: 1800 },
      { do: 'land' },
      { do: 'hold', for: 600 },
    ], { from: HELI_AT, ground: GROUND, scale: SCALE, start: { turn: 3 } })
    const [, takeOff, pass] = heliScript.beats

    // The figure watches it lift, ducks as it roars over, and shakes a fist after it.
    const hero = tinyfly.stickFigureTarget({ x: HERO_AT, y: GROUND, style: figureStyle })
    const heroScript = tinyfly.scriptTracks('hero', [
      { do: 'walk', to: 200, mood: 'happy' },
      { do: 'look', toward: HELI_AT, mood: 'surprised', at: takeOff.contact },
      { do: 'duck', at: pass.contact + 500, for: 1100 },
      { do: 'stand', mood: 'angry' },
      { do: 'face', toward: HELI_AT, mood: 'furious' },
      { do: 'shrug', mood: 'confused', for: 1200 },
      { do: 'cheer', at: heliScript.beats[6].contact, mood: 'joyful', for: 1200 },
    ], { from: HERO_AT, ground: GROUND, height: HEIGHT, style: 'snappy' })

    scene = { heli, hero, heliScript, timeline: tinyfly.deserializeTimeline({ id: 'helicopter', tracks: [...heliScript.tracks, ...heroScript.tracks] }) }
    const length = Math.max(heliScript.duration, heroScript.duration) + 400
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  lookSelect.addEventListener('change', build)

  const draw = () => {
    const t = clock.time
    const state = scene.timeline.getStateAtTime(t)
    readout.textContent = `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND + 1)
    ctx.lineTo(W, GROUND + 1)
    ctx.stroke()
    const values = state.values.get('hero') ?? new Map()
    const props = { ...scene.hero.props }
    for (const [property, value] of values) if (property in props) props[property] = value
    ctx.save()
    ctx.translate(HERO_AT + (values.get('x') ?? 0), GROUND + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing, ...(lookSelect.value === 'pencil' ? { sketch: { roughness: 1.3, seed: 5 } } : {}) }, t)
    ctx.restore()
    tinyfly.drawProp(ctx, scene.heli, { time: t, state }, 'heli')
    tinyfly.drawPropEffects(ctx, scene.heliScript.effects, t, { color: '#6b6b70', size: 70 })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    lookSelect.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propHelicopter = {
  id: 'live-prop-helicopter',
  name: 'Helicopter',
  description:
    'A flying prop: helicopter() spools its rotor up (the skids squash as it bites), lifts off, flies nose-down and banked into the move, flares to stop, hovers with a bob while it turns to face the camera, and lands with a squash and dust as the rotor spools down; the blades blur into a disc at speed. The figure ducks as it roars over.',
  category: 'video',
  tags: ['canvas', 'prop', 'helicopter', 'aircraft', 'stick figure', 'squash and stretch', 'arcs', '3d', 'pencil', 'video'],
  html,
  run,
}
