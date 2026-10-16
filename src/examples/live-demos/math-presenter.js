import { deserializeTimeline } from '../../engine'
import { surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure } from '../../characters'
import { linearMapFigure, mathSurface } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global (the browser bundle
// and tinyfly-math.iife.js); here from the source modules, so the code runs unchanged in both.
const tinyfly = { deserializeTimeline, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure, linearMapFigure, mathSurface }

export const html = `<style>
  .mpr-wrap { display:grid;gap:8px;width:100%;max-width:min(760px,calc(100vw - 24px));min-width:0; }
  .mpr-canvas { display:block;width:100%;height:auto;aspect-ratio:760/440;border-radius:12px;background:#0b0d12; }
  .mpr-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style>
<div class="mpr-wrap"><canvas class="mpr-canvas" width="760" height="440"></canvas><div class="mpr-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.mpr-canvas').getContext('2d')
  const readout = root.querySelector('.mpr-readout')
  const W = 760
  const H = 440
  const FLOOR = 420
  const START = 740
  const HEIGHT = 190
  const INK = '#f2f2f2'

  // The figure is a surface: its places have names a beat can aim at.
  const fig = tinyfly.mathSurface(tinyfly.linearMapFigure({ width: 400, height: 400 }), { x: 20, y: 20 })
  const on = (anchor) => ({ surface: 'fig', anchor })

  const result = tinyfly.surfaceScript('teacher', { fig }, [
    { do: 'walk', to: 560, mood: 'happy' },
    { do: 'point', target: on('tip:basis.j'), say: 'ĵ points straight up.' },
    { do: 'point', target: on('tip:basis.j'), say: 'Now slide it over…', mood: 'thinking', then: { surface: 'fig', edit: 'set', anchor: 'value:M', value: [1, 1, 0, 1] } },
    { do: 'point', target: on('item:square'), say: 'A shear: the area stays 1.', mood: 'happy' },
    { do: 'cheer', for: 900, mood: 'joyful' },
    { do: 'hold', for: 700 },
  ], { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' })
  // Back to the identity at the end, so the loop starts clean.
  fig.edit('set', 'value:M', { at: result.duration, value: [1, 0, 0, 1], duration: 600 })
  const timeline = tinyfly.deserializeTimeline({ id: 'math-presenter', config: { duration: result.duration + 900 }, tracks: [...result.figureTracks, ...fig.tracks('fig')] })

  const style = { height: HEIGHT, color: INK, lineWidth: 4, headFill: 'none', rubber: 0.4 }
  const teacher = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style })
  const clock = { time: 0 }
  live.to(clock, { time: timeline.duration, duration: timeline.duration / 1000, ease: 'none', repeat: -1 })

  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    const line = result.lines.find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = line ? `“${line.text}”` : `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#0b0d12'
    ctx.fillRect(0, 0, W, H)
    // The figure draws itself from its props, wherever the timeline has them.
    const props = { ...fig.target.props, ...Object.fromEntries(state.values.get('fig') ?? []) }
    ctx.save()
    ctx.translate(fig.target.x, fig.target.y)
    fig.target.draw(ctx, { props })
    ctx.restore()
    const values = state.values.get('teacher') ?? new Map()
    const pose = { ...teacher.props }
    for (const [property, value] of values) if (property in pose) pose[property] = value
    ctx.save()
    ctx.translate(START + (values.get('x') ?? 0), FLOOR + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(pose, t), { ...style, facing: pose.facing }, t)
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code
  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const mathPresenter = {
  id: 'live-math-presenter', name: 'Maths Presenter',
  description: 'A presenter walks up to a maths figure and teaches with it: points at ĵ, slides it into a shear as it speaks, then points at the square whose area stays 1. The figure is a surface (mathSurface from @algorisys/tinyfly/math) whose places have names (tip:basis.j, item:square, term:eq:2x), so the lesson is beats that aim at them and say what the figure does in answer, compiled by surfaceScript().',
  category: 'video', alsoIn: ['showcase'], tags: ['math', 'linear algebra', 'characters', 'presenter', 'surface', 'teaching'],
  addons: ['math'],
  html, run,
}
