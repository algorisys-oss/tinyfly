import { deserializeTimeline } from '../../engine'
import {
  horse, cart, tree, propTarget, propScript, propTow, propRide, spliceTracks, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure, seatHeight,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  deserializeTimeline, horse, cart, tree, propTarget, propScript, propTow, propRide, spliceTracks, drawProp, drawPropEffects,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure, seatHeight,
}

export const html = `<style>
  .phr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .phr-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .phr-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .phr-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .phr-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="phr-wrap">
  <canvas class="phr-canvas" width="680" height="360"></canvas>
  <div class="phr-row">
    <label>look <select class="phr-look" aria-label="Look"><option value="clean">clean</option><option value="pencil" selected>pencil</option></select></label>
  </div>
  <div class="phr-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.phr-canvas')
  const readout = root.querySelector('.phr-readout')
  const lookSelect = root.querySelector('.phr-look')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 318
  const INK = '#2f2f33'
  const SCALE = 46
  const HEIGHT = 78
  const HORSE_AT = 130
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3, headFill: '#fbf8ef', rubber: 0.5 }

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const look = lookSelect.value
    const horseProp = tinyfly.horse()
    const cartProp = tinyfly.cart()
    const horseTarget = tinyfly.propTarget({ x: HORSE_AT, y: GROUND, prop: horseProp, scale: SCALE, values: { turn: 1 }, look, ink: INK })
    const cartTarget = tinyfly.propTarget({ x: HORSE_AT - 160, y: GROUND, prop: cartProp, scale: SCALE, values: { turn: 1 }, look, ink: INK })
    const treeTarget = tinyfly.propTarget({ x: 560, y: GROUND - 34, prop: tinyfly.tree({ canopy: { seed: 4 } }), scale: 30, look, ink: INK })

    // The horse: walks in, grazes, is spooked — neighs and rears — trots on, then gallops off.
    const horseScript = tinyfly.propScript('horse', horseProp, [
      { do: 'walk', to: 300 },
      { do: 'graze', for: 1400 },
      { do: 'neigh' },
      { do: 'rear', for: 800 },
      { do: 'swish' },
      { do: 'trot', to: 470 },
      { do: 'gallop', to: W + 260 },
      { do: 'hold', for: 500 },
    ], { from: HORSE_AT, ground: GROUND, scale: SCALE, start: { turn: 1 } })
    const [, , neigh, rear] = horseScript.beats
    const end = horseScript.duration

    // The cart is towed: its shaft tips stay on the horse's hitch, its wheels roll exactly the distance.
    const cartTracks = tinyfly.propTow({
      leader: horseTarget, leaderId: 'horse', leaderTracks: horseScript.tracks, hitch: 'hitch',
      towed: cartTarget, towedId: 'cart', anchor: 'shafts', start: 0, end,
    })

    // The driver rides the cart's seat, and does a double take when the horse rears.
    const hero = tinyfly.stickFigureTarget({ x: 0, y: GROUND, style: figureStyle })
    const heroScript = tinyfly.scriptTracks('hero', [
      { do: 'sit', mood: 'happy', for: 500 },
      { do: 'doubleTake', at: neigh.start, pose: { sit: 1 } },
      { do: 'surprised', at: rear.start + 300, pose: { sit: 1 }, mood: 'scared', for: 1500 },
      { do: 'cheer', pose: { sit: 1 }, mood: 'joyful', for: 1800 },
    ], { height: HEIGHT, style: 'snappy' })
    const ride = tinyfly.propRide({
      prop: cartTarget, propId: 'cart', propTracks: cartTracks, anchor: 'seat',
      figure: { x: 0, y: GROUND }, figureId: 'hero', start: 0, end, offset: { y: tinyfly.seatHeight(HEIGHT) },
    })
    const heroTracks = tinyfly.spliceTracks(heroScript.tracks, ride, { from: 0, to: end })

    scene = {
      horseTarget, cartTarget, treeTarget, hero, horseScript,
      timeline: tinyfly.deserializeTimeline({ id: 'horse-cart', tracks: [...horseScript.tracks, ...cartTracks, ...heroTracks] }),
    }
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: end + 300, duration: (end + 300) / 1000, ease: 'none', repeat: -1 })
  }
  build()
  lookSelect.addEventListener('change', build)

  const drawHero = (c, state, t) => {
    const values = state.values.get('hero') ?? new Map()
    const props = { ...scene.hero.props }
    for (const [property, value] of values) if (property in props) props[property] = value
    c.save()
    c.translate(values.get('x') ?? 0, GROUND + (values.get('y') ?? 0))
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
    tinyfly.drawProp(ctx, scene.treeTarget, frame, 'tree')
    // The cart (with its driver) behind, the horse in front.
    tinyfly.drawProp(ctx, scene.cartTarget, frame, 'cart', { rider: (c) => drawHero(c, state, t) })
    tinyfly.drawProp(ctx, scene.horseTarget, frame, 'horse')
    tinyfly.drawPropEffects(ctx, scene.horseScript.effects, t, { color: '#6b6b70', size: 60 })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    lookSelect.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propHorse = {
  id: 'live-prop-horse',
  name: 'Horse & Cart',
  description:
    'A four-legged prop: horse() walks, trots and gallops with each gait’s own footfall pattern, its stride keyed in step with the distance so the hooves keep pace with the ground; it grazes, neighs and rears on its hind legs, and its tail trails on a spring. propTow() hitches a cart: its shafts stay on the horse, it turns with it, and its spoked wheels roll exactly. The driver rides the cart seat and gets a fright.',
  category: 'video',
  tags: ['canvas', 'prop', 'animal', 'horse', 'cart', 'gait', 'stick figure', 'acting', '3d', 'pencil', 'video'],
  html,
  run,
}
