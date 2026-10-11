import { deserializeTimeline } from '../../engine'
import { chart } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, chart }

export const html = `<style>
  .ck-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ck-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 340; height: auto; border-radius: 8px; background: #11131a; }
  .ck-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="ck-wrap">
  <canvas class="ck-canvas" width="680" height="340"></canvas>
  <div class="ck-readout">donut, grouped bars</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ck-canvas')
  const readout = root.querySelector('.ck-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 340

  // A donut: slices share the circle by value. One starts hidden and opens; one is pulled out; one comes loose.
  const traffic = tinyfly.chart({
    x: 16, y: 16, width: 300, height: 308, kind: 'donut', theme: 'dark', title: 'Traffic', suffix: '%',
    data: [
      { id: 'search', label: 'Search', value: 42 },
      { id: 'social', label: 'Social', value: 23 },
      { id: 'direct', label: 'Direct', value: 20 },
      { id: 'email', label: 'Email', value: 15, hidden: true },
    ],
  })
  traffic.edit('show', 'slice:email', { at: 600, duration: 700 })
  traffic.edit('highlight', 'slice:social', { at: 1800 })
  traffic.edit('pull', 'slice:social', { at: 1800, duration: 500 })
  traffic.edit('set', 'slice:search', { at: 3000, duration: 800, value: 30 })
  traffic.edit('pull', 'slice:social', { at: 4200, on: false })
  traffic.edit('highlight', 'slice:social', { at: 4200, on: false })
  // The direct slice comes loose and is flung off the chart.
  const loose = traffic.piece('slice:direct')
  traffic.fling(loose, { at: 5000, velocity: { x: 0.45, y: -0.5 }, duration: 1100 })

  // Grouped bars: two series side by side in each band, a legend and axis titles.
  const sales = tinyfly.chart({
    x: 332, y: 16, width: 332, height: 308, kind: 'bar', theme: 'dark', title: 'Plan vs actual', max: 100, suffix: 'k',
    series: [{ id: 'plan', label: 'Plan' }, { id: 'actual', label: 'Actual' }],
    axis: { x: 'Quarter', y: 'Sales' },
    data: [
      { id: 'q1', label: 'Q1', values: { plan: 40, actual: 46 } },
      { id: 'q2', label: 'Q2', values: { plan: 50, actual: 38 } },
      { id: 'q3', label: 'Q3', values: { plan: 60, actual: 60 }, hidden: true },
    ],
  })
  sales.edit('show', ['bar:q3:plan', 'bar:q3:actual'], { at: 1200, duration: 600 })
  sales.edit('highlight', 'bar:q2:actual', { at: 2400 })
  sales.edit('set', 'bar:q3:actual', { at: 3400, duration: 900, value: 84 })
  sales.edit('highlight', 'bar:q3:actual', { at: 3400 })
  sales.edit('highlight', ['bar:q2:actual', 'bar:q3:actual'], { at: 5200, on: false })

  const timeline = tinyfly.deserializeTimeline({ id: 'chart-kinds', tracks: [...traffic.tracks('traffic'), ...sales.tracks('sales')] })
  const clock = { time: 0 }
  const length = 7000
  live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })

  const valuesOf = (target, values) => {
    const props = { ...target.props }
    for (const [property, value] of values ?? []) if (property in props) props[property] = value
    return props
  }
  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    readout.textContent = `${(t / 1000).toFixed(1)} s · donut (show, pull, set, a slice flung) · grouped bars (show, set, highlight)`
    if (!ctx) return
    ctx.fillStyle = '#11131a'
    ctx.fillRect(0, 0, W, H)
    for (const [surface, id] of [[traffic, 'traffic'], [sales, 'sales']]) {
      ctx.save()
      ctx.translate(surface.target.x, surface.target.y)
      surface.target.draw(ctx, { ...surface.target, props: valuesOf(surface.target, state.values.get(id)) }, t)
      ctx.restore()
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const chartKinds = {
  id: 'live-chart-kinds',
  name: 'Pies & Series',
  description:
    'A donut whose slices share the circle by value: a hidden slice opens, one is highlighted and pulled out, one is set to a new value and the others re-share, and one comes loose as a piece and is flung off. Beside it, grouped bars for two series with a legend and axis titles, shown, set and highlighted. Both are chart() surfaces: every change is a named edit recorded as tracks, and every slice and bar is a place a figure can point at.',
  category: 'data',
  tags: ['canvas', 'chart', 'pie', 'donut', 'bar', 'series', 'legend', 'data', 'surface'],
  html,
  run,
}
