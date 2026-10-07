import { deserializeTimeline } from '../../engine'
import { codePanel, scriptTracks, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, codePanel, scriptTracks, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff }

export const html = `<style>
  .ctd-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ctd-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #11111b; }
  .ctd-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="ctd-wrap">
  <canvas class="ctd-canvas" width="680" height="360"></canvas>
  <div class="ctd-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ctd-canvas')
  const readout = root.querySelector('.ctd-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const INK = '#f5e0dc'
  const HEIGHT = 100

  const source = [
    'def greet(user):',
    '    # TODO: tidy this up',
    '    if not user is None:',
    '        print("Hello,", user)',
    '    return user',
  ].join('\n')
  const code = tinyfly.codePanel({ code: source, language: 'python', x: 30, y: 110, width: 620, fontSize: 17, lineHeight: 1.55 })
  const FLOOR = code.box.bottom
  const START = 720
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.5 }
  const hero = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: figureStyle })

  // `not user is None` reads backwards: push `not ` along its line to just before `None`.
  const not = code.piece(3, 'not ')
  const beforeNone = code.lines[2].indexOf('None')
  const landing = code.landing(not, 3, beforeNone)

  const script = tinyfly.scriptTracks(
    'hero',
    [
      { do: 'run', to: 100, mood: 'happy' },
      { do: 'leap', to: not.home.left - 40, onto: code.line(5).top, mood: 'happy' },
      { do: 'point', target: not.home, say: 'not user is None? Backwards.', mood: 'skeptical', for: 1200 },
      { do: 'push', target: not.home, to: landing.x, mood: 'angry' },
      { do: 'walk', to: code.line(2).right + 40, mood: 'disgusted' },
      { do: 'look', toward: code.line(2).x, mood: 'disgusted' },
      { do: 'swipe', target: code.line(2), mood: 'furious' },
      { do: 'cheer', for: 900, say: 'Pythonic.', mood: 'joyful' },
      { do: 'hold', for: 700 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  const [, , point, push, , , swipe] = script.beats

  // The word slides as the hands push it, the text it passes closing up behind it;
  // the TODO goes out of focus, and the figure rides its line up as the gap closes.
  code.highlight(3, { at: point.contact })
  code.drop(not, 3, beforeNone, { at: push.contact, duration: push.release - push.contact })
  code.highlight(3, { at: push.release, on: false })
  code.remove(2, { at: swipe.contact, duration: 600, style: 'blur' })
  const heroTracks = code.ride(script.tracks, 'hero', { ground: FLOOR })
  const timeline = tinyfly.deserializeTimeline({ id: 'code-tidy', tracks: [...heroTracks, ...code.tracks('code')] })

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
export const codeTidy = {
  id: 'live-code-tidy',
  name: 'Code Tidy',
  description:
    'A stick figure tidies Python. It pushes `not` along `if not user is None:` with both hands until it reads `if user is not None:` (drop() into its own line: the word slides and the text it passes closes up behind it), then swipes the TODO comment out of focus (remove with the `blur` style). As the gap closes, ride() carries the figure up with the line it is standing on.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'code', 'teaching', 'tutorial', 'python', 'video'],
  html,
  run,
}
