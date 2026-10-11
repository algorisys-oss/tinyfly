import { deserializeTimeline } from '../../engine'
import { car, propTarget, propSurface, drawProp, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, car, propTarget, propSurface, drawProp, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff }

export const html = `<style>
  .kt-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .kt-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #e9e4d6; }
  .kt-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="kt-wrap">
  <canvas class="kt-canvas" width="680" height="360"></canvas>
  <div class="kt-readout">walks up</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.kt-canvas')
  const readout = root.querySelector('.kt-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const GROUND = 320
  const INK = '#2f2f33'
  const START = 60
  const HEIGHT = 110

  // The car is a prop used as a surface: its parts are places, and a part can come loose.
  const banger = tinyfly.propTarget({ x: 430, y: GROUND, prop: tinyfly.car(), scale: 70, values: { turn: 1 } })
  const carSurface = tinyfly.propSurface(banger)
  const on = (anchor) => ({ surface: 'car', anchor })
  // The near-side wheel nearest the figure: facing screen-right, the car's right side is seen; the one furthest left on screen.
  const wheel = ['wheel-0-right', 'wheel-1-right'].sort((a, b) => carSurface.anchor(`part:${a}`).x - carSurface.anchor(`part:${b}`).x)[0]

  const result = tinyfly.surfaceScript(
    'hero',
    { car: carSurface },
    [
      { do: 'walk', to: carSurface.anchor(`part:${wheel}`).x - 60, mood: 'skeptical', say: 'Sound as a bell, they said.' },
      // The kick knocks the wheel off as the foot lands: the part comes loose and flies.
      { do: 'kick', target: on(`part:${wheel}`), mood: 'angry', then: { surface: 'car', edit: 'fling', anchor: `part:${wheel}`, at: 'contact', velocity: { x: -0.45, y: -0.55 }, duration: 1300 } },
      { do: 'shrug', for: 900, mood: 'surprised', say: 'Hm.' },
      // Up onto the roof; the car lifts under it, and the figure is carried (the roof is a floor).
      { do: 'leap', to: carSurface.anchor('anchor:roof').x, onto: on('anchor:roof'), mood: 'smug' },
      { do: 'cheer', for: 1400, mood: 'joyful', say: 'Still goes up!', then: { surface: 'car', edit: 'set', anchor: 'control:lift', value: 0.5, at: 'start', duration: 900 } },
      { do: 'hold', for: 600, then: { surface: 'car', edit: 'set', anchor: 'control:lift', value: 0, at: 'start', duration: 500 } },
      { do: 'hold', for: 700 },
    ],
    { from: START, ground: GROUND, height: HEIGHT, style: 'snappy' }
  )
  const timeline = tinyfly.deserializeTimeline({ id: 'kick-the-tyre', tracks: result.tracks })

  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.4 }
  const hero = tinyfly.stickFigureTarget({ x: START, y: GROUND, style: figureStyle })
  const clock = { time: 0 }
  const length = result.duration + 500
  live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })

  const valuesOf = (target, values) => {
    const props = { ...target.props }
    for (const [property, value] of values ?? []) if (property in props) props[property] = value
    return props
  }
  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    const line = result.lines.find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = line ? `“${line.text}”` : `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#e9e4d6'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#b9b09c'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND + 1)
    ctx.lineTo(W, GROUND + 1)
    ctx.stroke()

    // The car with its loose wheel wherever it has flown to, then the figure.
    tinyfly.drawProp(ctx, banger, { time: t, state }, 'car')
    const values = state.values.get('hero') ?? new Map()
    const props = valuesOf(hero, values)
    ctx.save()
    ctx.translate(START + (values.get('x') ?? 0), GROUND + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing }, t)
    ctx.restore()
    for (const effect of result.effects) {
      tinyfly.drawDustPuff(ctx, { x: effect.x, y: effect.y }, (t - effect.time) / effect.length, { size: 70, color: INK, seed: effect.time })
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const kickTheTyre = {
  id: 'live-kick-the-tyre',
  name: 'Kick the Tyre',
  description:
    'A stick figure kicks a car’s wheel and it comes off: the wheel is a part of a prop surface made loose (piece("part:wheel-…")), flung from the beat’s contact on a spinning arc. Then it leaps onto the roof, which is a floor: as the car lifts and settles under it, the figure rides along. The car is data (propTarget), the story is beats (surfaceScript).',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'prop', 'surface', 'pieces', 'ride', 'acting', 'video'],
  html,
  run,
}
