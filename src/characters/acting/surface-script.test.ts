import { describe, expect, it } from 'vitest'
import { codePanel } from '../code-panel'
import { handPath } from './hand-path'
import { scriptTracks } from './script'
import { checkSurfaceBeats, surfaceScript, type SurfaceBeat } from './surface-script'

const SOURCE = ['def greet(user):', '    # TODO: tidy this up', '    if not user is None:', '        print("Hello,", user)', '    return user'].join('\n')
const make = () => codePanel({ code: SOURCE, language: 'python', x: 30, y: 110, width: 620, fontSize: 17, lineHeight: 1.55 })
const HEIGHT = 100
const START = 720

describe('surfaceScript', () => {
  it('gives the same tracks as the Code Tidy demo wired by hand', () => {
    // By hand, as in src/examples/live-demos/code-tidy.js.
    const hand = make()
    const floor = hand.box.bottom
    const not = hand.piece(3, 'not ')
    const beforeNone = hand.lines[2].indexOf('None')
    const landing = hand.landing(not, 3, beforeNone)
    const options = { from: START, ground: floor, height: HEIGHT, facing: -1 as const, style: 'snappy' as const }
    const script = scriptTracks(
      'hero',
      [
        { do: 'run', to: 100, mood: 'happy' },
        { do: 'leap', to: not.home.left - 40, onto: hand.line(5).top, mood: 'happy' },
        { do: 'point', target: not.home, say: 'not user is None? Backwards.', mood: 'skeptical', for: 1200 },
        { do: 'push', target: not.home, to: landing.x, mood: 'angry' },
        { do: 'walk', to: hand.line(2).right + 40, mood: 'disgusted' },
        { do: 'look', toward: hand.line(2).x, mood: 'disgusted' },
        { do: 'swipe', target: hand.line(2), mood: 'furious' },
        { do: 'cheer', for: 900, say: 'Pythonic.', mood: 'joyful' },
      ],
      options
    )
    const [, , point, push, , , swipe] = script.beats
    hand.highlight(3, { at: point.contact! })
    hand.drop(not, 3, beforeNone, { at: push.contact!, duration: push.release! - push.contact! })
    hand.highlight(3, { at: push.release!, on: false })
    hand.remove(2, { at: swipe.contact!, duration: 600, style: 'blur' })
    const byHand = [...hand.ride(script.tracks, 'hero', { ground: floor }), ...hand.tracks('code')]

    // As data.
    const code = make()
    const word = { surface: 'code', anchor: 'token:3:not ' }
    const beats: SurfaceBeat[] = [
      { do: 'run', to: 100, mood: 'happy' },
      { do: 'leap', to: code.anchor('token:3:not ').left - 40, onto: { surface: 'code', anchor: 'line:5' }, mood: 'happy' },
      { do: 'point', target: word, say: 'not user is None? Backwards.', mood: 'skeptical', for: 1200, then: { surface: 'code', edit: 'highlight', anchor: 'line:3' } },
      {
        do: 'push',
        target: word,
        to: landing.x,
        mood: 'angry',
        then: [
          { surface: 'code', edit: 'drop', anchor: 'token:3:not ', into: `spot:3:${beforeNone}`, until: 'release' },
          { surface: 'code', edit: 'highlight', anchor: 'line:3', at: 'release', on: false },
        ],
      },
      { do: 'walk', to: code.anchor('line:2').right + 40, mood: 'disgusted' },
      { do: 'look', toward: code.anchor('line:2').x, mood: 'disgusted' },
      { do: 'swipe', target: { surface: 'code', anchor: 'line:2' }, mood: 'furious', then: { surface: 'code', edit: 'remove', anchor: 'line:2', duration: 600, style: 'blur' } },
      { do: 'cheer', for: 900, say: 'Pythonic.', mood: 'joyful' },
    ]
    // It is plain data.
    expect(JSON.parse(JSON.stringify(beats))).toEqual(beats)
    const result = surfaceScript('hero', { code }, beats, options)
    expect(result.tracks).toEqual(byHand)
    expect(result.duration).toBe(script.duration)
  })

  it('carries a grabbed word in the hand until the throw lets go, then flings it', () => {
    const code = make()
    const options = { from: 400, ground: code.box.bottom, height: HEIGHT }
    const result = surfaceScript(
      'hero',
      { code },
      [
        { do: 'grab', target: { surface: 'code', anchor: 'token:5:user' }, then: { surface: 'code', edit: 'carry', anchor: 'token:5:user', until: { beat: 1, at: 'release' } } },
        { do: 'throw', to: 700, then: { surface: 'code', edit: 'fling', anchor: 'token:5:user', at: 'release' } },
      ],
      options
    )
    const [grab, toss] = result.beats
    const path = handPath('hero', result.figureTracks, { x: 400, y: options.ground, style: { height: HEIGHT }, start: grab.contact!, end: toss.release! })
    const piece = code.piece('token:5:user')
    const x = result.tracks.find((track) => track.property === `piece.${piece.id}.x`)!
    // In the hand at the grab, then on its own after the release.
    expect(x.keyframes[0]).toEqual({ time: grab.contact, value: path[0].x - piece.home.x })
    expect(x.keyframes[x.keyframes.length - 1].time).toBeGreaterThan(toss.release! + 500)
    expect(result.tracks.some((track) => track.property === `piece.${piece.id}.opacity`)).toBe(true)
  })

  it('names the beat, the cue and the moment when one is wrong', () => {
    const code = make()
    expect(() => surfaceScript('hero', { code }, [{ do: 'grab', target: { surface: 'code', anchor: 'token:5:user' }, then: { surface: 'code', edit: 'fling', anchor: 'token:5:user', at: 'release' } }])).toThrow(
      /beat 0 \(grab\), fling on code: beat 0 \(grab\) has no release \(it has start, contact, end\)/
    )
  })
})

describe('checkSurfaceBeats', () => {
  const code = make()
  const messages = (beats: unknown) => checkSurfaceBeats(beats, { code }).map((p) => `${p.beat}: ${p.message}`)

  it('finds surfaces, places, edits and moments that are not there', () => {
    const out = messages([
      { do: 'point', target: { surface: 'cod', anchor: 'line:2' } },
      { do: 'swipe', target: { surface: 'code', anchor: 'lin:2' } },
      { do: 'grab', target: { surface: 'code', anchor: 'line:2' }, then: { surface: 'code', edit: 'flig', anchor: 'token:5:user' } },
      { do: 'grab', target: { surface: 'code', anchor: 'line:2' }, then: { surface: 'code', edit: 'fling', anchor: 'token:5:usr', at: 'relase' } },
      { do: 'grab', target: { surface: 'code', anchor: 'line:2' }, then: { surface: 'code', edit: 'carry', anchor: 'token:5:user' } },
      { do: 'throw', then: { surface: 'code', edit: 'fling', anchor: 'token:5:user', at: 300 } },
      { do: 'throw', then: { surface: 'code', edit: 'remove', anchor: 'line:2', until: { beat: 2 }, duration: 100 } },
    ])
    expect(out).toContain('0: `target`: Unknown surface "cod": did you mean "code"? Known: code')
    expect(out.some((m) => m.startsWith('1: `target`: codePanel: Unknown anchor "lin": did you mean "line"?'))).toBe(true)
    expect(out.some((m) => m.startsWith('2: `then`: Unknown edit "flig": did you mean "fling"?'))).toBe(true)
    expect(out.some((m) => m.startsWith('3: `then` (fling on code): codePanel: line 5 has no "usr"'))).toBe(true)
    expect(out.some((m) => m.startsWith('3: `then` (fling on code) `at`: Unknown moment "relase": did you mean "release"?'))).toBe(true)
    expect(out.some((m) => m.startsWith('4: `then` (carry on code): `carry` needs `until`'))).toBe(true)
    expect(out.some((m) => m.startsWith('5: `then` (fling on code) `at`: a cue starts at a moment of its beat'))).toBe(true)
    expect(out.some((m) => m.startsWith('6: `then` (remove on code) `until`: `beat` is the index of this beat or a later one'))).toBe(true)
    expect(out).toContain('6: `then` (remove on code): give `until` or `duration`, not both.')
  })

  it('still checks the beats themselves', () => {
    expect(messages([{ do: 'grabb', target: { surface: 'code', anchor: 'line:2' } }]).some((m) => m.includes('did you mean "grab"'))).toBe(true)
    expect(messages([{ do: 'point', target: { surface: 'code', anchor: 'line:2' } }])).toEqual([])
  })
})
