import { deserializeTimeline } from '../../engine'
import { codePanel, scriptTracks, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, codePanel, scriptTracks, stickFigureTarget, resolveStickPose, drawStickFigure, drawDustPuff }

export const html = `<style>
  .cd-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cd-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #11111b; }
  .cd-row { font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .cd-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .cd-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="cd-wrap">
  <canvas class="cd-canvas" width="680" height="360"></canvas>
  <label class="cd-row">delete by <select class="cd-style" aria-label="How the line goes">
    <option value="wipe">wipe</option><option value="fly" selected>fly (knocked off)</option><option value="blur">blur (out of focus)</option>
  </select></label>
  <div class="cd-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cd-canvas')
  const readout = root.querySelector('.cd-readout')
  const styleSelect = root.querySelector('.cd-style')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360
  const INK = '#f5e0dc'
  const HEIGHT = 100

  // The code is a scene object: its lines and words are places to stand, point and swipe.
  const source = [
    'func total(items []Item) int {',
    '    sum := 0',
    '    for _, it := range items {',
    '        sum += it.Price',
    '    }',
    '    return sum',
    '    fmt.Println("unreachable")',
    '}',
  ].join('\n')
  // Where things are: the script aims at this panel's anchors (the panel drawn is rebuilt per delete style, below).
  const layout = tinyfly.codePanel({ code: source, language: 'go', x: 30, y: 70, width: 620, fontSize: 17, lineHeight: 1.55 })
  const FLOOR = layout.box.bottom
  const START = 720
  const hero = tinyfly.stickFigureTarget({ x: START, y: FLOOR, style: { height: HEIGHT } })
  const figureStyle = { height: HEIGHT, color: INK, lineWidth: 3.5, headFill: 'none', rubber: 0.5 }

  // The story as beats aimed at the code's anchors.
  const dead = layout.line(7)
  const home = layout.token(6, 'return')
  const script = tinyfly.scriptTracks(
    'hero',
    [
      { do: 'walk', to: 560, mood: 'happy' },
      { do: 'look', toward: dead.x, mood: 'confused' },
      { do: 'doubleTake' },
      { do: 'walk', to: dead.right + 60, mood: 'skeptical' },
      { do: 'point', target: dead, say: 'Unreachable!', mood: 'angry', for: 1300 },
      { do: 'swipe', target: dead, mood: 'furious' },
      { do: 'leap', to: home.x, onto: layout.line(6).top, mood: 'happy' },
      { do: 'cheer', for: 900 },
      { do: 'say', say: 'Ship it.', mood: 'smug' },
      { do: 'lie', for: 1800 },
    ],
    { from: START, ground: FLOOR, height: HEIGHT, facing: -1, style: 'snappy' }
  )
  // The code reacts on the beats' contact frames: tinted when pointed at, and gone as the hand crosses it,
  // wiped away, knocked off the panel or out of focus (the picker). Edits are kept on a panel, so each style gets a fresh one.
  const point = script.beats[4]
  const swipe = script.beats[5]
  let scene
  const build = () => {
    const panel = tinyfly.codePanel({ code: source, language: 'go', x: 30, y: 70, width: 620, fontSize: 17, lineHeight: 1.55 })
    panel.highlight(7, { at: point.contact })
    const style = styleSelect.value
    // A wipe keeps pace with the hand; knocked off or blurred, the line takes a little longer to go.
    const duration = style === 'wipe' ? swipe.release - swipe.contact : 600
    panel.remove(7, { at: swipe.contact, duration, from: 'right', style })
    scene = { code: panel, timeline: tinyfly.deserializeTimeline({ id: 'code-acting', tracks: [...script.tracks, ...panel.tracks('code')] }) }
  }
  build()
  styleSelect.addEventListener('change', build)

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
    const { code, timeline } = scene
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

  return () => {
    live.ticker.remove(draw)
    styleSelect.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const codeActing = {
  id: 'live-code-acting',
  name: 'Code Acting',
  description:
    'A stick figure acting on a code listing, Animator vs Animation style: codePanel() lays the code out with fixed character widths so every line and word is a place in the scene, and scriptTracks() beats aim at those places. The figure points at the unreachable line, swipes it away (on the frames the hand crosses it, the line is wiped, knocked off the panel or blurred out of focus: pick one; then the line below closes the gap), leaps onto `return sum` and lies down on it.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'code', 'teaching', 'tutorial', 'video'],
  html,
  run,
}
