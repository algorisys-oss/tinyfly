/**
 * A bar chart that grows, built only from timeline targets: no drawing code,
 * so the whole animation is JSON the editor or an LLM could produce.
 *
 *   npx tinyfly video examples/headless-video/bar-chart.mjs
 */
const W = 1280
const H = 720
const BASE = 600 // y of the baseline
const DATA = [
  { label: 'Mon', value: 120, color: '#4a9eff' },
  { label: 'Tue', value: 260, color: '#22c55e' },
  { label: 'Wed', value: 190, color: '#f59e0b' },
  { label: 'Thu', value: 340, color: '#ec4899' },
  { label: 'Fri', value: 300, color: '#8b5cf6' },
]
const BAR = 140
const GAP = 60
const LEFT = (W - DATA.length * BAR - (DATA.length - 1) * GAP) / 2

const targets = {
  title: { type: 'text', x: W / 2, y: 70, text: 'Visitors this week', fontSize: 56, fontWeight: 700, textAlign: 'center', fillStyle: '#0f172a' },
  axis: { type: 'line', x: LEFT - 20, y: BASE, x2: W - LEFT + 20, y2: BASE, strokeStyle: '#334155', lineWidth: 4 },
}
const tracks = [
  { id: 'title-fade', target: 'title', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1 }] },
  { id: 'axis-draw', target: 'axis', property: 'x2', keyframes: [{ time: 0, value: LEFT - 20 }, { time: 600, value: W - LEFT + 20, easing: 'ease-out' }] },
]

DATA.forEach((bar, i) => {
  const x = LEFT + i * (BAR + GAP)
  const start = 600 + i * 250
  // A bar grows upwards: its height and its top edge animate together.
  targets[`bar-${i}`] = { type: 'rect', x, y: BASE, width: BAR, height: 0, borderRadius: 10, fillStyle: bar.color }
  targets[`label-${i}`] = { type: 'text', x: x + BAR / 2, y: BASE + 20, text: bar.label, fontSize: 32, textAlign: 'center', fillStyle: '#334155' }
  targets[`value-${i}`] = { type: 'text', x: x + BAR / 2, y: BASE - bar.value - 48, text: String(bar.value), fontSize: 34, fontWeight: 700, textAlign: 'center', fillStyle: bar.color, opacity: 0 }
  const grow = { easing: 'ease-out-cubic' }
  tracks.push(
    { id: `bar-${i}-h`, target: `bar-${i}`, property: 'height', keyframes: [{ time: start, value: 0 }, { time: start + 800, value: bar.value, ...grow }] },
    { id: `bar-${i}-y`, target: `bar-${i}`, property: 'y', keyframes: [{ time: start, value: 0 }, { time: start + 800, value: -bar.value, ...grow }] },
    { id: `value-${i}-o`, target: `value-${i}`, property: 'opacity', keyframes: [{ time: start + 600, value: 0 }, { time: start + 900, value: 1 }] },
  )
})

export default {
  width: W,
  height: H,
  fps: 30,
  background: '#f8fafc',
  targets,
  timeline: {
    id: 'bar-chart',
    config: {
      duration: 4500,
      markers: [
        { id: 'axis', time: 0, label: 'The axis draws in' },
        { id: 'bars', time: 600, label: 'Bars grow one by one' },
        { id: 'done', time: 2600, label: 'Thursday wins' },
      ],
    },
    tracks,
  },
}
