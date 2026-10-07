import { deserializeTimeline } from '../../engine'
import { car, truck, bus, tractor, bike, motorbike, trainCar, airplane, propTarget, propScript, drawProp, drawPropEffects } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, car, truck, bus, tractor, bike, motorbike, trainCar, airplane, propTarget, propScript, drawProp, drawPropEffects }

export const html = `<style>
  .ptf-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ptf-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #fbf8ef; }
  .ptf-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .ptf-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .ptf-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="ptf-wrap">
  <canvas class="ptf-canvas" width="680" height="360"></canvas>
  <div class="ptf-row">
    <label>look <select class="ptf-look" aria-label="Look"><option value="clean" selected>clean</option><option value="pencil">pencil</option></select></label>
  </div>
  <div class="ptf-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ptf-canvas')
  const readout = root.querySelector('.ptf-readout')
  const lookSelect = root.querySelector('.ptf-look')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const RAIL = 222
  const ROAD = 300
  const NEAR = 338
  const INK = '#2f2f33'
  const OFF_LEFT = -170
  const OFF_RIGHT = 860

  // Every vehicle: what it is, where it starts and which way it faces, how big it is drawn, and its beats.
  const cast = [
    { id: 'train', make: tinyfly.trainCar, x: OFF_LEFT - 60, y: RAIL, scale: 13, turn: 1, beats: [{ do: 'drive', to: OFF_RIGHT + 80, speed: 0.32 }] },
    { id: 'plane', make: tinyfly.airplane, x: OFF_LEFT, y: ROAD, scale: 11, turn: 1, lift: 15, beats: [
      { do: 'hold', for: 2400 }, { do: 'fly', to: 260, height: 14, for: 2200 }, { do: 'loop', for: 2200 }, { do: 'fly', to: OFF_RIGHT + 60, height: 16, for: 2000 },
    ] },
    { id: 'bus', make: tinyfly.bus, x: OFF_LEFT, y: ROAD, scale: 19, turn: 1, beats: [{ do: 'hold', for: 300 }, { do: 'drive', to: OFF_RIGHT + 40, speed: 0.28 }] },
    { id: 'truck', make: tinyfly.truck, x: OFF_RIGHT, y: NEAR, scale: 21, turn: 3, beats: [{ do: 'hold', for: 1800 }, { do: 'drive', to: OFF_LEFT - 30, speed: 0.33 }] },
    { id: 'car', make: tinyfly.car, x: OFF_LEFT, y: ROAD, scale: 22, turn: 1, beats: [
      { do: 'hold', for: 3600 }, { do: 'drive', to: 330, speed: 0.4 }, { do: 'honk' }, { do: 'bump' }, { do: 'drive', to: OFF_RIGHT, speed: 0.45 },
    ] },
    { id: 'bike', make: tinyfly.bike, x: OFF_LEFT, y: ROAD, scale: 30, turn: 1, beats: [{ do: 'hold', for: 6200 }, { do: 'drive', to: OFF_RIGHT, speed: 0.2 }] },
    { id: 'motorbike', make: tinyfly.motorbike, x: OFF_LEFT, y: NEAR, scale: 28, turn: 1, beats: [
      { do: 'hold', for: 5400 }, { do: 'brake', to: 470, speed: 0.55 }, { do: 'honk' }, { do: 'drive', to: OFF_RIGHT, speed: 0.55 },
    ] },
    { id: 'tractor', make: tinyfly.tractor, x: OFF_LEFT, y: ROAD, scale: 22, turn: 1, beats: [{ do: 'hold', for: 7400 }, { do: 'drive', to: OFF_RIGHT, speed: 0.2 }] },
  ]

  let scene
  const clock = { time: 0 }
  let loop
  const build = () => {
    const vehicles = cast.map((v) => {
      const prop = v.make()
      const start = { turn: v.turn, ...(v.lift ? { lift: v.lift, blur: 1 } : {}) }
      const target = tinyfly.propTarget({ x: v.x, y: v.y, prop, scale: v.scale, values: start, look: lookSelect.value, ink: INK })
      const script = tinyfly.propScript(v.id, prop, v.beats, { from: v.x, ground: v.y, scale: v.scale, start })
      return { ...v, target, script }
    })
    const tracks = vehicles.flatMap((v) => v.script.tracks)
    const length = Math.max(...vehicles.map((v) => v.script.duration)) + 300
    scene = { vehicles, timeline: tinyfly.deserializeTimeline({ id: 'traffic', tracks }) }
    clock.time = 0
    loop?.kill()
    loop = live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })
  }
  build()
  lookSelect.addEventListener('change', build)

  const line = (y, dash) => {
    ctx.setLineDash(dash ?? [])
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const draw = () => {
    const t = clock.time
    const state = scene.timeline.getStateAtTime(t)
    readout.textContent = `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5
    line(RAIL + 1)
    line(ROAD + 1)
    line((ROAD + NEAR) / 2 + 3, [14, 12])
    line(NEAR + 1)
    const frame = { time: t, state }
    // Far to near: the train behind, the plane above, the far lane, then the near lane.
    for (const lane of [RAIL, 'sky', ROAD, NEAR]) {
      for (const v of scene.vehicles) {
        const inLane = lane === 'sky' ? v.id === 'plane' : v.id !== 'plane' && v.y === lane
        if (!inLane) continue
        tinyfly.drawProp(ctx, v.target, frame, v.id)
        tinyfly.drawPropEffects(ctx, v.script.effects, t, { color: '#6b6b70', size: v.scale * 2.4 })
      }
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    lookSelect.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const propTraffic = {
  id: 'live-prop-traffic',
  name: 'Traffic',
  description:
    'The vehicle presets — bus, truck, car, bike, motorbike, tractor, train carriage and a plane — each one vehicle() spec, all acted by the same propScript() beats: they rock back before they go, lunge, dip on the stop; the motorbike skids, the car honks and hits a bump, wheels of every size roll exactly the distance (the tractor’s big and small wheels at their own rates), and the plane loops the loop.',
  category: 'video',
  tags: ['canvas', 'prop', 'vehicle', 'bus', 'truck', 'bike', 'motorbike', 'tractor', 'train', 'airplane', 'acting', '3d', 'video'],
  html,
  run,
}
