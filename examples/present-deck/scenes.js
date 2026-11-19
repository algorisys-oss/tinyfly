/* Scenes for the example deck: one factory per slide id.
 * A factory returns { marks, draw(ctx, frame) }. marks[0] is the scene time (ms)
 * where the entrance ends, marks[k] where click k ends; frame.time plays up to
 * the current mark and waits, frame.clock never stops.
 */
(function () {
  'use strict'
  const TF = window.tinyfly
  const GROUND = 900, HEIGHT = 300, INK = '#1b2a4a'

  /** A stick figure acting a beat script; draw() returns where its head is. */
  function actor(id, beats, from) {
    const style = { height: HEIGHT, color: INK, lineWidth: 6, headFill: '#fff', rubber: 0.4 }
    const target = TF.stickFigureTarget({ x: from, y: GROUND, style })
    const script = TF.scriptTracks(id, beats, { from, ground: GROUND, height: HEIGHT, style: 'snappy' })
    const timeline = TF.deserializeTimeline({ id, tracks: script.tracks })
    return {
      script,
      draw(ctx, time, override) {
        const values = timeline.getStateAtTime(time).values.get(id) || new Map()
        const props = { ...target.props }
        for (const [key, value] of values) if (key in props) props[key] = value
        const x = from + (values.get('x') || 0), y = GROUND + (values.get('y') || 0)
        ctx.save()
        ctx.translate(x, y)
        TF.drawStickFigure(ctx, override || TF.resolveStickPose(props, time), { ...style, facing: props.facing }, time)
        ctx.restore()
        return { x, y: y - HEIGHT * 1.05 }
      },
    }
  }

  /** Where a script ends: the time for the mark of the click that plays these beats. */
  const endOf = (id, beats, from) => TF.scriptTracks(id, beats, { from, ground: GROUND, height: HEIGHT, style: 'snappy' }).duration

  function floor(ctx, frame) {
    ctx.strokeStyle = '#c9d3e3'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(960, GROUND + 4)
    ctx.lineTo(frame.width - 80, GROUND + 4)
    ctx.stroke()
  }

  function say(ctx, text, at) {
    ctx.save()
    ctx.font = '600 36px "Segoe UI", Inter, Arial, sans-serif'
    const width = ctx.measureText(text).width + 56
    const x = Math.min(1920 - width - 24, at.x - width / 2), y = at.y - 110
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = INK
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(x, y, width, 76, 20)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + 28, y + 40)
    ctx.restore()
  }

  /** The line being spoken at `time`, if any. */
  const lineAt = (lines, time) => (lines || []).find((line) => time >= line.start && time <= line.end + 900)

  const SCENES = {}

  SCENES.hello = () => {
    const guide = actor('guide', [
      { do: 'walk', to: 1450, mood: 'happy' },
      { do: 'look', toward: 'viewer', mood: 'happy' },
      { do: 'wave', say: 'Hello!', mood: 'joyful', for: 1800 },
      { do: 'stand', mood: 'happy' },
    ], 2050)
    return {
      marks: [guide.script.duration + 200],
      draw(ctx, frame) {
        floor(ctx, frame)
        const head = guide.draw(ctx, frame.time)
        const line = lineAt(guide.script.lines, frame.time)
        if (line) say(ctx, line.text, head)
      },
    }
  }

  SCENES.points = () => {
    const beats = [
      { do: 'walk', to: 1380, mood: 'happy' },
      { do: 'point', toward: 800, mood: 'happy', for: 900 },
      { do: 'handsOnHips', mood: 'happy', for: 700 },
      { do: 'point', toward: 800, mood: 'smug', for: 900 },
      { do: 'cheer', mood: 'joyful', for: 1200 },
    ]
    // One mark per click: where the script ends after the entrance, then after each click's beats.
    const marks = [1, 2, 4, 5].map((count) => endOf('guide', beats.slice(0, count), 2050))
    const guide = actor('guide', beats, 2050)
    return {
      marks,
      draw(ctx, frame) {
        floor(ctx, frame)
        guide.draw(ctx, frame.time)
      },
    }
  }

  SCENES.poll = () => {
    const guide = actor('guide', [{ do: 'walk', to: 1400, mood: 'happy' }, { do: 'look', toward: 'viewer', mood: 'happy' }], 2050)
    const entrance = guide.script.duration
    return {
      marks: [entrance, entrance],
      draw(ctx, frame) {
        floor(ctx, frame)
        // While the countdown runs the figure dances on the clock that never stops.
        const dancing = frame.timer && frame.timer.state === 'running'
        const pose = dancing ? TF.danceFrame('bhangra', (frame.timer.elapsed / 60000) * 120).pose : undefined
        const head = guide.draw(ctx, frame.time, pose)
        if (frame.timer && frame.timer.state === 'done' && frame.timer.sinceEnd < 4000) say(ctx, 'Time’s up!', head)
      },
    }
  }

  window.SCENES = SCENES
})()
