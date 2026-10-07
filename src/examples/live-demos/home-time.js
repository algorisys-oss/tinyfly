import { deserializeTimeline } from '../../engine'
import { house, propTarget, propSurface, drawProp, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, house, propTarget, propSurface, drawProp, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure }

export const html = `<style>
  .hmt-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .hmt-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 400; height: auto; border-radius: 8px; background: #26304a; }
  .hmt-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="hmt-wrap">
  <canvas class="hmt-canvas" width="680" height="400"></canvas>
  <div class="hmt-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.hmt-canvas')
  const readout = root.querySelector('.hmt-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 400
  const GROUND = 320
  const INK = '#f5e0dc'
  const HEIGHT = 100
  const START = 40

  // A house is a prop; as a surface, its controls are things a figure changes.
  const home = tinyfly.propTarget({ x: 430, y: GROUND, prop: tinyfly.house(), values: { turn: 0.25 } })
  const homeSurface = tinyfly.propSurface(home)
  // The house stands on its middle; seen from a little above, its front wall comes forward of that.
  // The figure walks on the doorstep's line, in front of the house, not through its walls.
  const FLOOR = homeSurface.anchor('anchor:doorstep').y
  const on = (anchor) => ({ surface: 'home', anchor })

  const result = tinyfly.surfaceScript(
    'hero',
    { home: homeSurface },
    [
      { do: 'walk', to: homeSurface.anchor('anchor:door').x - 70, mood: 'sleepy', say: 'Long day.' },
      { do: 'grab', target: on('anchor:door'), mood: 'neutral', then: { surface: 'home', edit: 'switch', anchor: 'control:door', until: 'end' } },
      { do: 'point', target: on('part:window-1'), mood: 'happy', then: { surface: 'home', edit: 'switch', anchor: 'control:lights' } },
      { do: 'cheer', for: 900, say: 'Home!', mood: 'joyful' },
      { do: 'hold', for: 900 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, style: 'snappy' }
  )
  const timeline = tinyfly.deserializeTimeline({ id: 'home-time', tracks: result.tracks })

  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.4 }
  const hero = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: figureStyle })
  const clock = { time: 0 }
  const length = result.duration + 600
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
    ctx.fillStyle = '#26304a'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#1b2236'
    ctx.fillRect(0, GROUND, W, H - GROUND)

    tinyfly.drawProp(ctx, home, { time: t, state }, 'home')

    const values = state.values.get('hero') ?? new Map()
    const props = valuesOf(hero, values)
    ctx.save()
    ctx.translate(START + (values.get('x') ?? 0), FLOOR + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing }, t)
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const homeTime = {
  id: 'live-home-time',
  name: 'Home Time',
  description:
    'A stick figure comes home at dusk: it grabs the door, which swings open as the hand closes on it, and points at a window, and the windows light up. The house is a prop used as a surface (propSurface): its controls are named places (`control:door`, `control:lights`) the beats switch, and its parts and anchors (`part:window-1`, `anchor:door`) are places they aim at.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'props', 'house', 'video'],
  html,
  run,
}
