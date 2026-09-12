/**
 * Engine evaluation benchmark.
 *
 * Measures the hot path — `getStateAtTime` — in isolation, with no DOM and no
 * rendering, so the numbers describe the engine itself rather than the browser.
 *
 * Run: node bench/engine-bench.mjs
 */
import { Timeline, createTrack } from '../lib/engine/tinyfly-engine.js'

const FRAMES = 1000

/** Median is used throughout: frame-time distributions are skewed by GC. */
function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b)
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
  return {
    median: at(0.5),
    p95: at(0.95),
    max: sorted[sorted.length - 1],
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
  }
}

/** Time `frames` evaluations, returning per-evaluation microseconds. */
function measure(timeline, frames = FRAMES) {
  const duration = timeline.duration || 1000

  // Warm up so JIT compilation is not in the measurement.
  for (let i = 0; i < 200; i++) timeline.getStateAtTime((i / 200) * duration)

  const samples = []
  for (let f = 0; f < frames; f++) {
    const t = (f / frames) * duration
    const start = process.hrtime.bigint()
    timeline.getStateAtTime(t)
    samples.push(Number(process.hrtime.bigint() - start) / 1000) // ns -> µs
  }
  return stats(samples)
}

const keyframeTracks = (n) =>
  Array.from({ length: n }, (_, i) =>
    createTrack({
      id: `t${i}`,
      target: `el${i}`,
      property: i % 2 ? 'opacity' : 'x',
      keyframes: [
        { time: 0, value: 0 },
        { time: 500, value: 50, easing: 'ease-out-cubic' },
        { time: 1000, value: 100, easing: 'ease-in-out' },
      ],
    })
  )

const springTracks = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    target: `el${i}`,
    property: 'scale',
    kind: 'spring',
    spring: { from: 0, to: 1, stiffness: 180, damping: 12 },
  }))

const staggeredTrack = (n) => [
  createTrack({
    id: 'stagger',
    target: 'unused',
    targets: Array.from({ length: n }, (_, i) => `el${i}`),
    stagger: { each: 20 },
    property: 'opacity',
    keyframes: [
      { time: 0, value: 0 },
      { time: 500, value: 1, easing: 'ease-out' },
    ],
  }),
]

const colourTracks = (n) =>
  Array.from({ length: n }, (_, i) =>
    createTrack({
      id: `c${i}`,
      target: `el${i}`,
      property: 'fill',
      keyframes: [
        { time: 0, value: '#ff0000' },
        { time: 1000, value: '#0000ff' },
      ],
    })
  )

const scenarios = [
  ['keyframe tracks', keyframeTracks],
  ['spring tracks', springTracks],
  ['runtime stagger (1 track, N targets)', staggeredTrack],
  ['colour tracks', colourTracks],
]

const COUNTS = [10, 100, 500, 1000, 2000]

console.log('\ntinyfly engine — getStateAtTime, microseconds per evaluation')
console.log('(median / p95, lower is better; 60fps budget is 16,667 µs per frame)\n')

const header = ['scenario'.padEnd(38), ...COUNTS.map((c) => String(c).padStart(16))].join('')
console.log(header)
console.log('-'.repeat(header.length))

for (const [name, build] of scenarios) {
  const cells = COUNTS.map((count) => {
    const timeline = new Timeline({ id: 'bench', tracks: build(count) })
    const s = measure(timeline)
    return `${s.median.toFixed(1)}/${s.p95.toFixed(1)}`.padStart(16)
  })
  console.log(name.padEnd(38) + cells.join(''))
}

// Frame budget: how many tracks fit in one 60fps frame, evaluation only.
console.log('\nTracks evaluable within a single 60fps frame (16.67 ms), evaluation only:')
for (const [name, build] of scenarios) {
  let count = 100
  let last = count
  while (count <= 200000) {
    const timeline = new Timeline({ id: 'b', tracks: build(count) })
    const s = measure(timeline, 120)
    if (s.median > 16667) break
    last = count
    count *= 2
  }
  console.log(`  ${name.padEnd(38)} ~${last.toLocaleString()}`)
}
console.log()
