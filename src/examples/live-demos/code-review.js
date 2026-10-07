import { deserializeTimeline } from '../../engine'
import { codePanel, persona, defineAction, resolveStickPose, drawStickFigure } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, codePanel, persona, defineAction, resolveStickPose, drawStickFigure }

export const html = `<style>
  .crv-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .crv-canvas { width: 100%; max-width: 440px; aspect-ratio: 680 / 360; height: auto; border-radius: 8px; background: #11111b; }
  .crv-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="crv-wrap">
  <canvas class="crv-canvas" width="680" height="360"></canvas>
  <div class="crv-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.crv-canvas')
  const readout = root.querySelector('.crv-readout')
  const ctx = canvas.getContext('2d')
  const W = 680
  const H = 360

  // Behaviours of our own: a facepalm written as timed pose steps, and a slow knowing nod.
  const facepalm = tinyfly.defineAction({
    summary: 'Drops its face into its hand, and stays there a moment.',
    steps: (from) => [
      { after: 220, pose: { rightShoulder: 150, rightElbow: 155, headTilt: from.headTilt - 10, bend: 10, leftEye: 0.2, rightEye: 0.2 }, easing: 'ease-out' },
      { after: 900, pose: { headTilt: from.headTilt - 16, bend: 14 } },
      { after: 1150, pose: { rightShoulder: 18, rightElbow: -6, headTilt: from.headTilt, bend: 0, leftEye: 1, rightEye: 1 }, easing: 'ease-in-out' },
    ],
  })
  const nod = tinyfly.defineAction({
    summary: 'A slow, knowing nod.',
    steps: (from) => [
      { after: 250, pose: { headTilt: from.headTilt - 14, leftEye: 0.6, rightEye: 0.6 }, easing: 'ease-in-out' },
      { after: 550, pose: { headTilt: from.headTilt + 2 }, easing: 'ease-in-out' },
      { after: 800, pose: { headTilt: from.headTilt - 10 }, easing: 'ease-in-out' },
      { after: 1050, pose: { headTilt: from.headTilt, leftEye: 1, rightEye: 1 }, easing: 'ease-in-out' },
    ],
  })

  // Two personas: each one's look, acting style, gait, usual face and stance, and its own actions.
  const senior = tinyfly.persona({
    name: 'Senior', summary: 'A smug senior developer',
    look: { color: '#fab387', lineWidth: 3.5, headFill: 'none', rubber: 0.4 },
    acting: 'snappy', gait: 'strut', mood: 'smug', stance: 'handsOnHips', height: 104,
    actions: { nod },
  })
  const junior = tinyfly.persona({
    name: 'Junior', summary: 'A nervous junior developer',
    look: { color: '#89b4fa', lineWidth: 3.5, headFill: 'none', rubber: 0.7 },
    acting: 'full', gait: 'sneak', mood: 'worried', height: 92,
    actions: { facepalm },
  })

  const source = ['function userName(id: string) {', '  const user = db.find(id)', '  return user.name', '}'].join('\n')
  const code = tinyfly.codePanel({ code: source, language: 'typescript', x: 30, y: 150, width: 620, fontSize: 17, lineHeight: 1.55 })
  const FLOOR = code.box.bottom
  const crash = code.token(3, 'user.name')
  const question = code.spot(3, 13, 1)

  // The senior struts in and points out the crash.
  const SENIOR_START = -60
  const seniorOpens = [
    { do: 'go', to: crash.left - 70 },
    { do: 'point', target: crash, say: 'What if user is undefined?', for: 1600 },
    { do: 'stand' },
  ]
  // Scripts are deterministic, so the opening alone says when the point lands.
  const [, pointBeat] = senior.script('senior', seniorOpens, { from: SENIOR_START, ground: FLOOR }).beats

  // The junior sneaks in, takes it badly, then writes the fix in by hand.
  const JUNIOR_START = 600
  const juniorFixes = [
    { do: 'go', to: crash.right + 80 },
    { do: 'facepalm', at: pointBeat.end - 300, say: 'Oh no.' },
    { do: 'write', target: question },
  ]
  const juniorPlaced = { from: JUNIOR_START, ground: FLOOR, facing: -1 }
  const write = junior.script('junior', juniorFixes, juniorPlaced).beats[2]

  // Then the senior nods it through, once the fix is in.
  const seniorScript = senior.script('senior', [
    ...seniorOpens,
    { do: 'nod', at: write.release + 300, say: 'Ship it.' },
    { do: 'hold', for: 900 },
  ], { from: SENIOR_START, ground: FLOOR })
  // …and the junior cheers when it does.
  const juniorScript = junior.script('junior', [...juniorFixes, { do: 'cheer', at: seniorScript.beats[3].end, for: 900, mood: 'joyful' }], juniorPlaced)

  code.highlight(3, { at: pointBeat.contact })
  code.insert(3, 13, '?', { at: write.contact, duration: write.release - write.contact })
  code.highlight(3, { at: write.release + 300, on: false })

  const timeline = tinyfly.deserializeTimeline({ id: 'code-review', tracks: [...seniorScript.tracks, ...juniorScript.tracks, ...code.tracks('code')] })
  const people = [
    { id: 'senior', who: senior, start: SENIOR_START, figure: senior.figure({ x: SENIOR_START, y: FLOOR }), script: seniorScript },
    { id: 'junior', who: junior, start: JUNIOR_START, figure: junior.figure({ x: JUNIOR_START, y: FLOOR, facing: -1 }), script: juniorScript },
  ]

  const clock = { time: 0 }
  const length = Math.max(seniorScript.duration, juniorScript.duration) + 600
  live.to(clock, { time: length, duration: length / 1000, ease: 'none', repeat: -1 })

  const valuesOf = (target, values) => {
    const props = { ...target.props }
    for (const [property, value] of values ?? []) if (property in props) props[property] = value
    return props
  }

  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    const said = people.flatMap((p) => p.script.lines.map((l) => ({ ...l, who: p.who.name }))).find((l) => t >= l.start && t <= l.end + 400)
    readout.textContent = said ? `${said.who}: “${said.text}”` : `${(t / 1000).toFixed(1)} s`
    if (!ctx) return
    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(code.target.x, code.target.y)
    code.target.draw(ctx, { ...code.target, props: valuesOf(code.target, state.values.get('code')) }, t)
    ctx.restore()

    for (const person of people) {
      const values = state.values.get(person.id) ?? new Map()
      const props = valuesOf(person.figure, values)
      ctx.save()
      ctx.translate(person.start + (values.get('x') ?? 0), FLOOR + (values.get('y') ?? 0))
      const style = { ...person.figure.figureStyle, facing: props.facing }
      tinyfly.drawStickFigure(ctx, tinyfly.resolveStickPose(props, t, undefined, person.who.cast.gaits), style, t)
      ctx.restore()
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const codeReview = {
  id: 'live-code-review',
  name: 'Code Review',
  description:
    'Two personas review TypeScript. persona() bundles each one’s look, acting style, gait, usual face and stance: the smug senior struts in with hands on hips and points out the crash; the nervous junior sneaks in, facepalms (an action of its own, written with defineAction() as timed pose steps) and writes `?` into `user.name` by hand. The senior gives its own slow nod: ship it.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'acting', 'persona', 'code', 'teaching', 'tutorial', 'typescript', 'video'],
  html,
  run,
}
