import { deserializeTimeline } from '../../engine'
import { codePanel, scriptTracks, handPath, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, codePanel, scriptTracks, handPath, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff }

export const html = `<style>
  .cr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cr-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #11111b; }
  .cr-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="cr-wrap">
  <canvas class="cr-canvas" width="680" height="360"></canvas>
  <div class="cr-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cr-canvas')
  const readout = root.querySelector('.cr-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const INK = '#f5e0dc'
  const HEIGHT = 100

  const source = [
    'function total(items) {',
    "  // console.log('here', items)",
    '  var sum = 0',
    '  for (var i = 0; i < items.length; i++) {',
    '    sum += items[i].price',
    '  }',
    '  return sum',
    '}',
  ].join('\n')
  const code = tinyfly.codePanel({ code: source, language: 'javascript', x: 30, y: 70, width: 620, fontSize: 17, lineHeight: 1.55 })
  const FLOOR = code.box.bottom
  const START = 720
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.5 }
  const hero = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: figureStyle })

  // Words that come loose: one to grab and throw, one to kick.
  const thrown = code.piece(3, 'var')
  const kicked = code.piece(4, 'var')

  const script = tinyfly.scriptTracks(
    'hero',
    [
      { do: 'walk', to: 600, mood: 'happy' },
      { do: 'leap', to: thrown.home.right + 60, onto: code.line(5).top, mood: 'happy' },
      { do: 'point', target: thrown.home, say: 'var? Still?', mood: 'skeptical', for: 1100 },
      { do: 'grab', target: thrown.home, mood: 'angry' },
      { do: 'throw', to: W, mood: 'furious' },
      { do: 'kick', target: kicked.home, mood: 'angry' },
      { do: 'walk', to: code.line(2).right + 40, mood: 'disgusted' },
      { do: 'look', toward: code.line(2).x, mood: 'disgusted' },
      { do: 'swipe', target: code.line(2), mood: 'furious' },
      { do: 'cheer', for: 900, say: 'Clean.', mood: 'joyful' },
      { do: 'hold', for: 600 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  const [, , point, grab, toss, kick, , , swipe] = script.beats

  // The code reacts on the contact frames.
  code.highlight(3, { at: point.contact })
  code.follow(thrown, tinyfly.handPath('hero', script.tracks, { x: START, y: FLOOR, style: figureStyle, start: grab.contact, end: toss.release }))
  code.fling(thrown, { at: toss.release })
  code.highlight(3, { at: toss.release, on: false })
  code.write(thrown, 'let', { at: toss.release + 500 })
  code.fling(kicked, { at: kick.contact, velocity: { x: 0.7, y: -0.8 } })
  code.write(kicked, 'let', { at: kick.contact + 500 })
  code.remove(2, { at: swipe.contact, duration: swipe.end - swipe.contact, close: 250, style: 'fly', from: 'right' })
  // The comment's gap closes under its feet: ride() carries it up with the line it stands on.
  const heroTracks = code.ride(script.tracks, 'hero', { ground: FLOOR })
  const timeline = tinyfly.deserializeTimeline({ id: 'code-refactor', tracks: [...heroTracks, ...code.tracks('code')] })

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
export const codeRefactor = {
  id: 'live-code-refactor',
  name: 'Code Refactor',
  description:
    'A stick figure refactors JavaScript by hand: it grabs `var` off a line and throws it away (the word follows its hand via handPath(), then flies on from the hand’s speed), kicks the other `var` out of the for loop, and `let` is typed into both gaps. Then it knocks the leftover console.log comment clean off the panel (remove with the `fly` style: the line slides away blurring) and rides the line it stands on up as the gap closes (ride()).',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'code', 'teaching', 'tutorial', 'video'],
  html,
  run,
}
