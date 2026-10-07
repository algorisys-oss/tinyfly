import { deserializeTimeline } from '../../engine'
import {
  tree, house, propTarget, propScript, propAt, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  deserializeTimeline, tree, house, propTarget, propScript, propAt, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure,
}

export const html = `<style>
  .pwd-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pwd-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .pwd-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .pwd-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .pwd-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="pwd-wrap">
  <canvas class="pwd-canvas" width="680" height="360"></canvas>
  <div class="pwd-row">
    <label>look <select class="pwd-look" aria-label="Look"><option value="clean">clean</option><option value="pencil" selected>pencil</option></select></label>
    <label>wind <select class="pwd-wind" aria-label="Wind"><option value="0.4">breeze</option><option value="0.8" selected>gusty</option><option value="1">gale</option></select></label>
  </div>
  <div class="pwd-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.pwd-canvas')
  const readout = root.querySelector('.pwd-readout')
  const lookSelect = root.querySelector('.pwd-look')
  const windSelect = root.querySelector('.pwd-wind')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 310
  const INK = '#2f2f33'
  const SCALE = 40
  const HEIGHT = 66
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3, headFill: '#fbf8ef', rubber: 0.5 }

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const look = lookSelect.value
    const wind = Number(windSelect.value)
    const at = { look, ink: INK, scale: SCALE }
    const props = {
      treeLeft: { target: tinyfly.propTarget({ x: 110, y: GROUND - 6, prop: tinyfly.tree({ canopy: { seed: 3 } }), values: { size: 0 }, ...at }) },
      treeRight: { target: tinyfly.propTarget({ x: 570, y: GROUND - 4, prop: tinyfly.tree({ height: 2.0, canopy: { radius: 0.95, seed: 11, shape: 'tall' }, colors: { leaves: '#6fbf5e' } }), values: { size: 0 }, ...at }) },
      house: { target: tinyfly.propTarget({ x: 340, y: GROUND, prop: tinyfly.house(), values: { size: 0, turn: 0.25 }, ...at }) },
    }
    const placed = (id) => ({ from: props[id].target.x + props[id].target.width / 2, ground: GROUND, scale: SCALE })

    // Everything pops in, one after another; then the chimney smokes, the wind gets up, the house shakes.
    props.treeLeft.script = tinyfly.propScript('treeLeft', props.treeLeft.target.prop, [
      { do: 'pop', at: 0 },
      { do: 'sway', at: 3200, wind, for: 3600 },
      { do: 'hold', for: 800 },
    ], { ...placed('treeLeft'), start: { size: 0 } })
    props.treeRight.script = tinyfly.propScript('treeRight', props.treeRight.target.prop, [
      { do: 'pop', at: 250 },
      { do: 'sway', at: 3350, wind, for: 3450 },
      { do: 'hold', for: 800 },
    ], { ...placed('treeRight'), start: { size: 0 } })
    props.house.script = tinyfly.propScript('house', props.house.target.prop, [
      { do: 'pop', at: 500, for: 600 },
      { do: 'smoke', for: 6400, wind },
      { do: 'door', open: true },
      { do: 'hold', for: 1700 },
      { do: 'shake' },
      { do: 'lights', on: true },
      { do: 'door', open: false },
      { do: 'hold', for: 900 },
    ], { ...placed('house'), start: { size: 0, turn: 0.25 } })
    const [popped, , doorOpen] = props.house.script.beats
    const timeline = tinyfly.deserializeTimeline({ id: 'windy-day', tracks: Object.values(props).flatMap((p) => p.script.tracks) })

    // The figure waits behind the door, steps out when it opens, and shivers in the gust.
    // Its doorstep is read once the house has popped in to full size.
    const doorstep = tinyfly.propAt(props.house.target, { time: popped.end + 400, state: timeline.getStateAtTime(popped.end + 400) }, 'house').anchor('doorstep')
    const hero = tinyfly.stickFigureTarget({ x: doorstep.x, y: doorstep.y, style: figureStyle })
    const heroScript = tinyfly.scriptTracks('hero', [
      { do: 'hold', for: doorOpen.contact },
      { do: 'walk', to: doorstep.x + 120, mood: 'happy' },
      { do: 'look', toward: 570, mood: 'surprised' },
      { do: 'tremble', mood: 'scared' },
      { do: 'face', toward: 'viewer', mood: 'worried' },
      { do: 'shrug' },
    ], { from: doorstep.x, ground: doorstep.y, height: HEIGHT, style: 'snappy' })
    const outside = doorOpen.contact + 500

    const tracks = [...heroScript.tracks, ...Object.values(props).flatMap((p) => p.script.tracks)]
    const length = Math.max(heroScript.duration, ...Object.values(props).map((p) => p.script.duration)) + 600
    scene = { props, hero, timeline: tinyfly.deserializeTimeline({ id: 'windy-day', tracks }), outside, doorstep, appears: popped.end }
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  for (const input of [lookSelect, windSelect]) input.addEventListener('change', build)

  const drawHero = (c, state, t) => {
    const values = state.values.get('hero') ?? new Map()
    const props = { ...scene.hero.props }
    for (const [property, value] of values) if (property in props) props[property] = value
    c.save()
    c.translate(scene.doorstep.x + (values.get('x') ?? 0), scene.doorstep.y + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(c, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing, ...(lookSelect.value === 'pencil' ? { sketch: { roughness: 1.3, seed: 5 } } : {}) }, t)
    c.restore()
  }

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
    const frame = { time: t, state }
    tinyfly.drawProp(ctx, scene.props.treeLeft.target, frame, 'treeLeft')
    tinyfly.drawProp(ctx, scene.props.treeRight.target, frame, 'treeRight')
    // Until it is out, the figure stands in the doorway: drawn between the house and its door.
    const inDoorway = t < scene.outside
    const inside = t >= scene.appears
    tinyfly.drawProp(ctx, scene.props.house.target, frame, 'house', inDoorway && inside ? { rider: (c) => drawHero(c, state, t) } : {})
    if (!inDoorway) drawHero(ctx, state, t)
    for (const p of Object.values(scene.props)) tinyfly.drawPropEffects(ctx, p.script.effects, t, { color: '#6b6b70', size: 46 })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    for (const input of [lookSelect, windSelect]) input.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propScene = {
  id: 'live-prop-scene',
  name: 'Windy Day',
  description:
    'Environment props: tree() and house() pop into being (squash and stretch with overshoot), the chimney smokes, and the wind gets up — the trees sway in gusts with their canopies trailing their trunks (overlapping action) and shed leaves, the house shakes. Its door opens on a figure standing in the doorway (drawn between the house and its door) who steps out into the gust. Turn the wind up, switch to pencil.',
  category: 'video',
  tags: ['canvas', 'prop', 'tree', 'house', 'environment', 'stick figure', 'squash and stretch', 'overlapping action', '3d', 'pencil', 'video'],
  html,
  run,
}
