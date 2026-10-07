import { deserializeTimeline } from '../../engine'
import { codePanel, scriptTracks, handPath, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, codePanel, scriptTracks, handPath, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff }

export const html = `<style>
  .cf-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cf-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #11111b; }
  .cf-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="cf-wrap">
  <canvas class="cf-canvas" width="680" height="360"></canvas>
  <div class="cf-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cf-canvas')
  const readout = root.querySelector('.cf-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const INK = '#f5e0dc'
  const HEIGHT = 100

  const source = [
    'fn main() {',
    '    let count = 0;',
    '    for i in 0..3 {',
    '        count += i',
    '    };',
    '    println!("{count}");',
    '}',
  ].join('\n')
  const code = tinyfly.codePanel({ code: source, language: 'rust', x: 30, y: 70, width: 620, fontSize: 17, lineHeight: 1.55 })
  const FLOOR = code.box.bottom
  const START = 720
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.5 }
  const hero = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: figureStyle })

  // The stray semicolon after the loop's brace belongs at the end of `count += i`,
  // and `count` needs `mut` (typed in before column 8 of line 2).
  const semicolon = code.piece(5, ';')
  const endOfSum = code.spot(4, code.lines[3].length)
  const mutSpot = code.spot(2, 8, 4)

  const script = tinyfly.scriptTracks(
    'hero',
    [
      { do: 'walk', to: 600, mood: 'happy' },
      { do: 'leap', to: semicolon.home.right + 50, onto: code.line(6).top, mood: 'happy' },
      { do: 'point', target: semicolon.home, say: 'That semicolon is lost.', mood: 'skeptical', for: 900 },
      { do: 'grab', target: semicolon.home, mood: 'happy' },
      { do: 'walk', to: endOfSum.right + 45, mood: 'happy' },
      { do: 'put', target: endOfSum },
      { do: 'look', toward: mutSpot.x, mood: 'thinking' },
      { do: 'say', say: 'And count has to change…', mood: 'thinking' },
      { do: 'write', target: mutSpot },
      { do: 'cheer', for: 900, say: 'It compiles!', mood: 'joyful' },
      { do: 'hold', for: 700 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  const [, , point, grab, , put, , , write] = script.beats

  // The code reacts on the contact frames: the semicolon rides in the hand and drops into place,
  // and `mut ` is typed in as the pen moves.
  code.highlight(5, { at: point.contact })
  code.follow(semicolon, tinyfly.handPath('hero', script.tracks, { x: START, y: FLOOR, style: figureStyle, start: grab.contact, end: put.contact }))
  code.drop(semicolon, 4, code.lines[3].length, { at: put.contact })
  code.highlight(5, { at: put.contact, on: false })
  code.insert(2, 8, 'mut ', { at: write.contact, duration: write.release - write.contact })
  const timeline = tinyfly.deserializeTimeline({ id: 'code-fix', tracks: [...script.tracks, ...code.tracks('code')] })

  const clock = { time: 0 }
  const length = script.duration + 600
  live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })

  const valuesOf = (target, values) => {
    const props = { ...target.props }
    for (const [property, value] of values ?? []) if (property in props) props[property] = value
    return props
  }

  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    const line = script.lines.find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = line ? `“${line.text}”` : `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(code.target.x, code.target.y)
    code.target.draw(ctx, { ...code.target, props: valuesOf(code.target, state.values.get('code')) }, t)
    ctx.restore()

    const values = state.values.get('hero') ?? new Map()
    const props = valuesOf(hero, values)
    ctx.save()
    ctx.translate(START + (values.get('x') ?? 0), FLOOR + (values.get('y') ?? 0))
    tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, t), { ...figureStyle, facing: props.facing }, t)
    ctx.restore()
    for (const effect of script.effects) {
      tinyfly.drawDustPuff(ctx, { x: effect.x, y: effect.y }, (t - effect.time) / effect.length, { size: 60, color: INK, seed: effect.time })
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const codeFix = {
  id: 'live-code-fix',
  name: 'Code Fix',
  description:
    'A stick figure fixes Rust that will not compile. It grabs the stray semicolon after the loop, carries it overhead, and puts it at the end of `count += i` (drop(): the semicolon lands in room the line opens, and its old place closes). Then it writes `mut` into `let count` by hand: the pen moves along the spot as insert() types the text in, the rest of the line making room.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'code', 'teaching', 'tutorial', 'rust', 'video'],
  html,
  run,
}
