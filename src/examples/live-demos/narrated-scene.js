import { planNarration, narrationSceneAt, deserializeTimeline } from '../../engine'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the engine, so the code below runs unchanged in both.
const tinyfly = { planNarration, narrationSceneAt, deserializeTimeline }

export const html = `<style>
  .ns-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ns-canvas { width: 256px; height: 144px; border-radius: 8px; background: #bfe6ff; }
  .ns-caption { font: 600 13px system-ui, sans-serif; color: #e5e7eb; min-height: 1.3em; }
</style>
<div class="ns-wrap">
  <canvas class="ns-canvas" width="512" height="288"></canvas>
  <div class="ns-caption" aria-live="polite"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ns-canvas')
  const caption = root.querySelector('.ns-caption')
  const ctx = canvas.getContext('2d')

  // The voice sets the timing: clip lengths in, cue times out.
  const plan = tinyfly.planNarration([
    { id: 'enter', lines: [{ text: 'Meet the figure.', duration: 1300 }] },
    { id: 'wave', lines: [{ text: 'It waves hello.', duration: 1400 }] },
    { id: 'leave', lines: [{ text: 'Then it walks off.', duration: 1400 }] },
  ])
  const [enter, wave, leave] = plan.cues

  // Poses are plain keyframe data, timed from the cues.
  const timeline = tinyfly.deserializeTimeline({
    id: 'figure',
    config: { duration: plan.duration },
    tracks: [
      { id: 'x', target: 'figure', property: 'x', keyframes: [
        { time: 0, value: -60 }, { time: enter.end, value: 256, easing: 'ease-out' },
        { time: leave.start, value: 256 }, { time: plan.duration, value: 580, easing: 'ease-in' } ] },
      { id: 'arm', target: 'figure', property: 'arm', keyframes: [
        { time: wave.start, value: 0 }, { time: wave.start + 250, value: 1, easing: 'ease-out' },
        { time: wave.end, value: 1 }, { time: wave.end + 250, value: 0 } ] },
    ],
  })

  const sky = { enter: '#bfe6ff', wave: '#fde7d3', leave: '#e6f4ea' }
  const clock = { time: 0 }

  // Cairo-style: every frame is drawn from scratch from the time alone.
  const draw = () => {
    const time = clock.time
    const figure = timeline.getStateAtTime(time).values.get('figure')
    const x = figure?.get('x') ?? 0
    const arm = figure?.get('arm') ?? 0
    const cue = plan.cues.find((c) => time >= c.start && time < c.end)
    caption.textContent = cue ? cue.text : ''
    if (!ctx) return

    ctx.fillStyle = sky[tinyfly.narrationSceneAt(plan, time).id]
    ctx.fillRect(0, 0, 512, 230)
    ctx.fillStyle = '#c8b28a'
    ctx.fillRect(0, 230, 512, 58)

    const walking = time < enter.end || time > leave.start
    const swing = walking ? Math.sin(time / 90) * 14 : 0
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    const line = (x1, y1, x2, y2) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    line(x, 180, x - 10 - swing, 230) // legs
    line(x, 180, x + 10 + swing, 230)
    line(x, 180, x, 120) // body
    line(x, 132, x - 20, 165) // left arm
    const angle = Math.PI / 2 - arm * 2.4 + arm * Math.sin(time / 80) * 0.25
    line(x, 132, x + Math.cos(angle) * 42, 132 + Math.sin(angle) * 42) // right arm waves
    ctx.fillStyle = '#f2c49b'
    ctx.beginPath()
    ctx.arc(x, 98, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // A plain object carries the time; the ticker draws each frame after it moves.
  live.to(clock, { time: plan.duration, duration: plan.duration / 1000, ease: 'none', repeat: -1 })
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const narratedScene = {
  id: 'live-narrated-scene',
  name: 'Narrated Scene (Video from Code)',
  description:
    'A Cairo-style scene: planNarration() times the lines, keyframes pose the figure, and every frame is drawn from the time. The same scene renders to MP4 with `tinyfly video`.',
  category: 'video',
  tags: ['canvas', 'narration', 'captions', 'video', 'cairo', 'stick figure'],
  html,
  run,
}
