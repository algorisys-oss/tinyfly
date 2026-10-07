import { deserializeTimeline } from '../../engine'
import {
  car, propTarget, propScript, propAt, drawProp, drawPropEffects, propRide, spliceTracks,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure, seatHeight,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  deserializeTimeline, car, propTarget, propScript, propAt, drawProp, drawPropEffects, propRide, spliceTracks,
  stickFigureTarget, scriptTracks, resolveStickPose, drawStickFigure, seatHeight,
}

export const html = `<style>
  .pc-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pc-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .pc-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .pc-row select, .pc-row input { font: 12px system-ui, sans-serif; }
  .pc-row select { padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .pc-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="pc-wrap">
  <canvas class="pc-canvas" width="680" height="360"></canvas>
  <div class="pc-row">
    <label>look <select class="pc-look" aria-label="Look"><option value="clean">clean</option><option value="pencil" selected>pencil</option></select></label>
    <label>exaggeration <select class="pc-exaggeration" aria-label="Exaggeration"><option>0.5</option><option selected>1</option><option>2</option></select></label>
  </div>
  <div class="pc-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.pc-canvas')
  const readout = root.querySelector('.pc-readout')
  const lookSelect = root.querySelector('.pc-look')
  const exaggerationSelect = root.querySelector('.pc-exaggeration')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 300
  const INK = '#2f2f33'
  const HEIGHT = 96
  const CAR_AT = 250
  const HERO_AT = -40
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: '#fbf8ef', rubber: 0.5 }

  let scene
  const build = () => {
    const prop = tinyfly.car()
    const carTarget = tinyfly.propTarget({ x: CAR_AT, y: GROUND, prop, scale: 52, values: { turn: 1 }, look: lookSelect.value, ink: INK })
    const hero = tinyfly.stickFigureTarget({ x: HERO_AT, y: GROUND, style: figureStyle })
    const exaggeration = Number(exaggerationSelect.value)

    // Where the door and the seat are while the car is parked.
    const parked = tinyfly.propAt(carTarget, { time: 0 }, 'car')
    const door = parked.anchor('door')
    const seat = parked.anchor('seat')

    // The figure walks up to the door first: that says when the car opens it.
    const walkIn = tinyfly.scriptTracks('hero', [{ do: 'walk', to: door.x - 34, mood: 'happy' }], { from: HERO_AT, ground: GROUND, height: HEIGHT })
    const arrive = walkIn.duration

    // The car: door open, hold while the figure hops in, door shut, a honk, a turn to the camera and back, then off.
    const carScript = tinyfly.propScript('car', prop, [
      { do: 'hold', for: arrive },
      { do: 'door', open: true },
      { do: 'hold', for: 1100 },
      { do: 'door', open: false },
      { do: 'honk' },
      { do: 'turn', toward: 'viewer' },
      { do: 'hold', for: 1300 },
      { do: 'turn', toward: 'right' },
      { do: 'drive', to: 430 },
      { do: 'bump' },
      { do: 'brake', to: 540 },
      { do: 'hold', for: 1200 },
    ], { from: CAR_AT, ground: GROUND, scale: 52, exaggeration, start: { turn: 1 } })
    const [, doorOpen, , , , toViewer, wave] = carScript.beats

    // The figure hops onto the seat as the door opens, sits, and cheers at the camera.
    const seatFeet = seat.y + tinyfly.seatHeight(HEIGHT)
    const heroScript = tinyfly.scriptTracks('hero', [
      { do: 'walk', to: door.x - 34, mood: 'happy' },
      { do: 'leap', at: doorOpen.contact, to: seat.x, onto: seatFeet },
      { do: 'sit', for: 600 },
      { do: 'cheer', at: toViewer.end, pose: { sit: 1 }, mood: 'joyful', for: wave.end - toViewer.end },
      { do: 'sit', mood: 'happy', for: 400 },
    ], { from: HERO_AT, ground: GROUND, height: HEIGHT, style: 'snappy' })
    // As it jumps through the open door it is inside the car: from then on it shows only through the doorway and the glass.
    const hop = heroScript.beats[1]
    const boarded = hop.start + (hop.contact - hop.start) * 0.85
    const end = carScript.duration

    // From the seat on (once it lands), the car carries it: its feet stay where the seat puts them, and it turns with the car.
    const ride = tinyfly.propRide({
      prop: carTarget, propId: 'car', propTracks: carScript.tracks, anchor: 'seat',
      figure: { x: HERO_AT, y: GROUND }, figureId: 'hero', start: hop.contact, end, offset: { y: tinyfly.seatHeight(HEIGHT) },
    })
    const heroTracks = tinyfly.spliceTracks(heroScript.tracks, ride, { from: hop.contact, to: end })
    const timeline = tinyfly.deserializeTimeline({ id: 'road-trip', tracks: [...carScript.tracks, ...heroTracks] })
    scene = { carTarget, hero, carScript, timeline, boarded, length: end + 400 }
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: scene.length, duration: scene.length / 1000, ease: 'none', repeat: -1 })
  }
  const clock = { time: 0 }
  let loop
  build()
  for (const input of [lookSelect, exaggerationSelect]) input.addEventListener('change', build)

  const drawHero = (c, state, t) => {
    const values = state.values.get('hero') ?? new Map()
    const props = { ...scene.hero.props }
    for (const [property, value] of values) if (property in props) props[property] = value
    c.save()
    c.translate(HERO_AT + (values.get('x') ?? 0), GROUND + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(c, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing, ...(lookSelect.value === 'pencil' ? { sketch: { roughness: 1.4, seed: 3 } } : {}) }, t)
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
    tinyfly.drawPropEffects(ctx, scene.carScript.effects, t, { color: '#6b6b70', size: 70 })
    const riding = t >= scene.boarded
    tinyfly.drawProp(ctx, scene.carTarget, { time: t, state }, 'car', riding ? { rider: (c) => drawHero(c, state, t) } : {})
    if (!riding) drawHero(ctx, state, t)
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    for (const input of [lookSelect, exaggerationSelect]) input.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propCar = {
  id: 'live-prop-car',
  name: 'Road Trip',
  description:
    'A prop with behaviours: car() is a 3D rig of simple parts drawn with the characters’ pens (clean or pencil), so it turns to face the camera and back. propScript() beats — door, honk, turn, drive, bump, brake — are acted through the same pass as the figures: it rocks back before it goes, lunges stretched, dips its nose on the stop and settles, skids with its wheels locked, and its antenna trails on a spring. The wheels turn by exactly the distance driven. The figure hops into the seat and propRide() carries it, turning with the car. Try the exaggeration dial.',
  category: 'video',
  tags: ['canvas', 'prop', 'vehicle', 'car', 'stick figure', 'acting', 'squash and stretch', 'anticipation', 'follow-through', '3d', 'pencil', 'video'],
  html,
  run,
}
