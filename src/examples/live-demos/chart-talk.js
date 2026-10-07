import { deserializeTimeline } from '../../engine'
import { chart, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, chart, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure }

export const html = `<style>
  .cht-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cht-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 420; height: auto; border-radius: 8px; background: #11131a; }
  .cht-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="cht-wrap">
  <canvas class="cht-canvas" width="680" height="420"></canvas>
  <div class="cht-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cht-canvas')
  const readout = root.querySelector('.cht-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 420
  const INK = '#f5e0dc'
  const HEIGHT = 90
  const FLOOR = 400
  const START = 640

  // The chart is data; its bars are places a figure can point at and stand on.
  const sales = tinyfly.chart({
    x: 20,
    y: 20,
    width: 480,
    height: 340,
    kind: 'bar',
    theme: 'dark',
    title: 'Sales',
    max: 100,
    suffix: 'k',
    data: [
      { id: 'q1', label: 'Q1', value: 45 },
      { id: 'q2', label: 'Q2', value: 60 },
      { id: 'q3', label: 'Q3', value: 30 },
      { id: 'q4', label: 'Q4', value: 20 },
    ],
  })
  const bar = (id) => ({ surface: 'sales', anchor: `bar:${id}` })

  const result = tinyfly.surfaceScript(
    'hero',
    { sales },
    [
      { do: 'walk', to: 560, mood: 'neutral' },
      { do: 'point', target: bar('q3'), say: 'Q3 dipped.', mood: 'worried', then: { surface: 'sales', edit: 'highlight', anchor: 'bar:q3' } },
      { do: 'leap', to: bar('q4'), onto: bar('q4'), mood: 'happy', then: { surface: 'sales', edit: 'highlight', anchor: 'bar:q3', on: false, at: 'start' } },
      // The bar grows under its feet: the figure is carried up with it.
      { do: 'cheer', for: 1600, say: 'Then Q4 took off!', mood: 'joyful', then: [
        { surface: 'sales', edit: 'set', anchor: 'bar:q4', value: 85, at: 'start', until: 'end' },
        { surface: 'sales', edit: 'highlight', anchor: 'bar:q4', at: 'start' },
      ] },
      { do: 'hold', for: 1200 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  const timeline = tinyfly.deserializeTimeline({ id: 'chart-talk', tracks: result.tracks })

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
    ctx.fillStyle = '#11131a'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(sales.target.x, sales.target.y)
    sales.target.draw(ctx, { ...sales.target, props: valuesOf(sales.target, state.values.get('sales')) }, t)
    ctx.restore()

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
export const chartTalk = {
  id: 'live-chart-talk',
  name: 'Chart Talk',
  description:
    'A stick figure presents a bar chart: it points out the dip in Q3 (the bar is highlighted as the arm arrives), leaps onto the Q4 bar and is carried up as Q4 grows under its feet, the value label counting along. The chart is a surface: its bars are named places (`bar:q4`), and the scene is beats in surfaceScript().',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'chart', 'data', 'presentation', 'video'],
  html,
  run,
}
