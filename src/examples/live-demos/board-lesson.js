import { deserializeTimeline } from '../../engine'
import { whiteboard, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, whiteboard, surfaceScript, stickFigureTarget, resolveStickPose, drawStickFigure }

export const html = `<style>
  .bls-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .bls-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 420; height: auto; border-radius: 8px; background: #1b1d24; }
  .bls-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="bls-wrap">
  <canvas class="bls-canvas" width="680" height="420"></canvas>
  <div class="bls-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.bls-canvas')
  const readout = root.querySelector('.bls-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 420
  const INK = '#f5e0dc'
  const HEIGHT = 190
  const FLOOR = 400
  const START = 640

  // Everything on the board is data: texts to write, marks to draw.
  const board = tinyfly.whiteboard({
    x: 20,
    y: 20,
    width: 470,
    height: 300,
    theme: 'chalkboard',
    fontSize: 30,
    items: [
      { id: 'eq', text: '2x + 4 = 12', at: [40, 30] },
      { id: 'move', text: '2x = 12 - 4', at: [40, 100], hidden: true },
      { id: 'sum', text: '2x = 8', at: [40, 170], hidden: true },
      { id: 'answer', text: 'x = 4', at: [40, 240], color: 'yellow', hidden: true },
      { id: 'ring', mark: 'circle', around: 'term:eq:+ 4', hidden: true },
      { id: 'across', mark: 'arrow', from: 'mark:ring', to: 'term:move:- 4', color: 'orange', hidden: true },
      { id: 'done', mark: 'box', around: 'text:answer', color: 'yellow', hidden: true },
    ],
  })
  const on = (anchor) => ({ surface: 'board', anchor })

  // The lesson, as beats: each says what the board does in answer, at a moment of the beat.
  const result = tinyfly.surfaceScript(
    'teacher',
    { board },
    [
      { do: 'walk', to: 430, mood: 'happy' },
      { do: 'point', target: on('term:eq:+ 4'), say: 'Take the 4 across.', then: { surface: 'board', edit: 'draw', anchor: 'mark:ring', until: 'end' } },
      { do: 'write', target: on('text:move'), mood: 'thinking', then: { surface: 'board', edit: 'write', anchor: 'text:move', until: 'release' } },
      { do: 'point', target: on('term:move:- 4'), say: 'It changes sign.', then: { surface: 'board', edit: 'draw', anchor: 'mark:across' } },
      { do: 'write', target: on('text:sum'), mood: 'thinking', then: { surface: 'board', edit: 'write', anchor: 'text:sum', until: 'release' } },
      { do: 'write', target: on('text:answer'), mood: 'thinking', then: { surface: 'board', edit: 'write', anchor: 'text:answer', until: 'release' } },
      { do: 'point', target: on('text:answer'), then: { surface: 'board', edit: 'draw', anchor: 'mark:done', until: 'end' } },
      { do: 'cheer', for: 900, say: 'x is 4!', mood: 'joyful' },
      { do: 'hold', for: 900 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  // Wipe the board at the end so the loop starts clean.
  board.edit('erase', ['text:move', 'text:sum', 'text:answer', 'mark:ring', 'mark:across', 'mark:done'], { at: result.duration, duration: 500 })
  const timeline = tinyfly.deserializeTimeline({ id: 'board-lesson', tracks: [...result.figureTracks, ...board.tracks('board')] })

  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 4, headFill: 'none', rubber: 0.4 }
  const teacher = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: figureStyle })
  const clock = { time: 0 }
  const length = result.duration + 700
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
    ctx.fillStyle = '#1b1d24'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(board.target.x, board.target.y)
    board.target.draw(ctx, { ...board.target, props: valuesOf(board.target, state.values.get('board')) }, t)
    ctx.restore()

    const values = state.values.get('teacher') ?? new Map()
    const props = valuesOf(teacher, values)
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
export const boardLesson = {
  id: 'live-board-lesson',
  name: 'Board Lesson',
  description:
    'A stick figure solves 2x + 4 = 12 on a chalkboard. The board is a surface: its texts and marks are declared as data, and the lesson is beats that name places on it (`term:eq:+ 4`, `text:answer`) and say what the board does in answer (draw the ring, write the next line as the pen moves, box the answer). surfaceScript() compiles it to plain tracks.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'whiteboard', 'teaching', 'tutorial', 'math', 'video'],
  html,
  run,
}
