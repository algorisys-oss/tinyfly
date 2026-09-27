import { planNarration, narrationSceneAt, deserializeTimeline } from '../../engine'
import { poseTracks, pose, walkPose, blendPose, strideLength, talkingMouth, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { planNarration, narrationSceneAt, deserializeTimeline, poseTracks, pose, walkPose, blendPose, strideLength, talkingMouth, drawStickFigure }

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

  // Position and poses are plain keyframe data, timed from the cues.
  const timeline = tinyfly.deserializeTimeline({
    id: 'figure',
    config: { duration: plan.duration },
    tracks: [
      { id: 'x', target: 'figure', property: 'x', keyframes: [
        { time: 0, value: -60 }, { time: enter.end, value: 256, easing: 'ease-out' },
        { time: leave.start, value: 256 }, { time: plan.duration, value: 580, easing: 'ease-in' } ] },
      // Named poses from tinyfly/characters become one track per joint.
      ...tinyfly.poseTracks('figure', [
        { time: wave.start, pose: 'rest' },
        { time: wave.start + 300, pose: 'wave', easing: 'ease-out' },
        { time: wave.end, pose: 'wave' },
        { time: wave.end + 300, pose: 'rest', easing: 'ease-in-out' },
      ]),
    ],
  })

  const sky = { enter: '#bfe6ff', wave: '#fde7d3', leave: '#e6f4ea' }
  const clock = { time: 0 }

  // Cairo-style: every frame is drawn from scratch from the time alone.
  const draw = () => {
    const time = clock.time
    const values = timeline.getStateAtTime(time).values.get('figure')
    const cue = plan.cues.find((c) => time >= c.start && time < c.end)
    caption.textContent = cue ? cue.text : ''
    if (!ctx) return

    ctx.fillStyle = sky[tinyfly.narrationSceneAt(plan, time).id]
    ctx.fillRect(0, 0, 512, 230)
    ctx.fillStyle = '#c8b28a'
    ctx.fillRect(0, 230, 512, 58)

    // The tracks hold the joints; walking and talking are layered on top.
    // The walk phase comes from the distance covered, so the feet stay planted.
    const x = values?.get('x') ?? 0
    let figure = tinyfly.pose(Object.fromEntries(values ?? []))
    // Fade the walk in and out over a quarter second either side of standing still.
    const fade = (ms) => Math.min(1, Math.max(0, ms / 250))
    const walking = time < enter.end ? fade(enter.end - time) : fade(time - leave.start)
    figure = tinyfly.blendPose(figure, tinyfly.walkPose(x / tinyfly.strideLength(150), figure), walking)
    if (cue) figure = { ...figure, mouth: tinyfly.talkingMouth(time) }

    ctx.save()
    ctx.translate(x, 232)
    tinyfly.drawStickFigure(ctx, figure, { height: 150, color: '#1e3a8a', headFill: '#f2c49b' })
    ctx.restore()
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
    'A Cairo-style scene: planNarration() times the lines, poseTracks() from tinyfly/characters turns named poses into keyframes, and every frame is drawn from the time. The same scene renders to MP4 with `tinyfly video`.',
  category: 'video',
  tags: ['canvas', 'narration', 'captions', 'video', 'cairo', 'stick figure'],
  html,
  run,
}
